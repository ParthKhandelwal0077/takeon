import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { setClientMeta, getClientsInGame } from './client';
import { broadcastToGame } from './utils';
import getMockQuestions from './mockQuestions';
import { insertGameParticipant } from './database';

interface Question {
  id: number;
  text: string;
  answer: string;
}

interface Game {
  gameId: string;
  players: string[];
  started: boolean;
  currentQuestionIndex: number;
  answers: Record<number, Record<string, string>>;
  questions: Question[];
  gameState: 'waiting' | 'playing' | 'finished';
  hostId: string;
}

const games = new Map<string, Game>();

export async function handleCreateGame(
  ws: WebSocket,
  payload: { gameId: string; userId: string; playerName?: string }
): Promise<void> {
  // Validate payload exists and has required properties
  if (!payload || !payload.gameId || !payload.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Missing required fields: gameId and userId are required' }
    }));
    return;
  }

  const { gameId, userId, playerName } = payload;
  // Check if game already exists to prevent conflicts
  if (games.has(gameId)) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Game with this ID already exists' }
    }));
    return;
  }

  // Create new game with the creator as host
  games.set(gameId, {
    gameId,
    players: [userId], // Host is automatically added as first player
    started: false,
    currentQuestionIndex: 0,
    answers: {},
    questions: getMockQuestions(),
    gameState: 'waiting',
    hostId: userId, // Only set host here during creation
  });

  setClientMeta(ws, { userId, gameId });

  // Insert participant into database
  const dbResult = await insertGameParticipant(gameId, userId);
  
  if (!dbResult.success) {
    // If database insertion fails, clean up and return error
    games.delete(gameId);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { 
        message: 'Failed to save participant to database',
        details: dbResult.error?.message 
      }
    }));
    return;
  }

  // Notify that game was created successfully
  ws.send(JSON.stringify({
    type: 'game_created',
    payload: { gameId, hostId: userId }
  }));

  // Broadcast to all players that creator has joined
  const displayName = playerName || `Player ${userId.slice(0, 8)}`;
  broadcastToGame(gameId, {
    type: 'player_joined',
    payload: { 
      message: `${displayName} has joined`,
      userId, 
      players: [userId],
      playerName: displayName
    },
  });
}

export async function handleJoinGame(
  ws: WebSocket,
  payload: { gameId: string; userId: string; playerName?: string; isHost?: boolean }
): Promise<void> {
  console.log('🎮 handleJoinGame called with payload:', payload);
  
  // Validate payload exists and has required properties
  if (!payload || !payload.gameId || !payload.userId) {
    console.log('❌ Invalid payload for join_game:', payload);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Missing required fields: gameId and userId are required' }
    }));
    return;
  }

  const { gameId, userId, playerName, isHost } = payload;
  console.log(`🔄 User ${userId} attempting to join game ${gameId}, isHost: ${isHost}`);
  // Check if game exists
  if (!games.has(gameId)) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Game not found' }
    }));
    return;
  }

  const game = games.get(gameId)!;

  // Check if game has already started
  if (game.started) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Game has already started' }
    }));
    return;
  }

  // Check if user is already in the game
  if (game.players.includes(userId)) {
    console.log(`⚠️  User ${userId} is already in game ${gameId}. Current players:`, game.players);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'User already in game' }
    }));
    return;
  }

  // Insert participant into database first
  console.log(`💾 Inserting participant ${userId} into database for game ${gameId}`);
  const dbResult = await insertGameParticipant(gameId, userId);
  
  if (!dbResult.success) {
    console.log(`❌ Database insertion failed for user ${userId}:`, dbResult.error?.message);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { 
        message: 'Failed to save participant to database',
        details: dbResult.error?.message 
      }
    }));
    return;
  }

  console.log(`✅ Database insertion successful for user ${userId}`);

  // Add player to game (but don't change host)
  game.players.push(userId);
  setClientMeta(ws, { userId, gameId });

  console.log(`🎉 User ${userId} successfully joined game ${gameId}. Total players: ${game.players.length}`);

  // Broadcast to all players in the game with player name
  const displayName = playerName || `Player ${userId.slice(0, 8)}`;
  broadcastToGame(gameId, {
    type: 'player_joined',
    payload: { 
      message: `${displayName} has joined`,
      userId, 
      players: game.players,
      playerName: displayName
    },
  });

  console.log(`📢 Broadcasted player_joined event for ${displayName} to game ${gameId}`);
}

export function handleStartGame(
  ws: WebSocket,
  payload: { gameId: string; userId: string }
): void {
  // Validate payload exists and has required properties
  if (!payload || !payload.gameId || !payload.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Missing required fields: gameId and userId are required' }
    }));
    return;
  }

  const { gameId, userId } = payload;
  const game = games.get(gameId);
  
  if (!game) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Game not found' }
    }));
    return;
  }

  // Only allow host to start the game
  if (game.hostId !== userId) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Only the host can start the game' }
    }));
    return;
  }

  if (game.started) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Game has already started' }
    }));
    return;
  }

  // Check if there are enough players
  if (game.players.length < 1) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Need at least 1 player to start the game' }
    }));
    return;
  }

  game.started = true;
  game.gameState = 'playing';
  sendNextQuestion(gameId);
}

export function handleSubmitAnswer(
  ws: WebSocket,
  payload: { gameId: string; userId: string; answer: string }
): void {
  // Validate payload exists and has required properties
  if (!payload || !payload.gameId || !payload.userId || !payload.answer) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Missing required fields: gameId, userId, and answer are required' }
    }));
    return;
  }

  const { gameId, userId, answer } = payload;
  const game = games.get(gameId);
  if (!game) return;

  const qIndex = game.currentQuestionIndex;

  if (!game.answers[qIndex]) {
    game.answers[qIndex] = {};
  }

  game.answers[qIndex][userId] = answer;

  const allAnswered = game.players.every(
    (playerId) => game.answers[qIndex]?.[playerId]
  );

  if (allAnswered) {
    setTimeout(() => sendNextQuestion(gameId), 1000);
  }
}

function sendNextQuestion(gameId: string): void {
  const game = games.get(gameId);
  if (!game) return;

  const question = game.questions[game.currentQuestionIndex];
  if (!question) {
    game.gameState = 'finished';
    broadcastToGame(gameId, {
      type: 'game_finished',
      payload: { answers: game.answers },
    });
    
    // Clean up finished game after some time to prevent memory leaks
    setTimeout(() => {
      games.delete(gameId);
    }, 60000); // Remove game after 1 minute
    return;
  }

  broadcastToGame(gameId, {
    type: 'new_question',
    payload: {
      index: game.currentQuestionIndex,
      question,
    },
  });

  game.currentQuestionIndex += 1;
}

// Helper function to get game information
export function getGameInfo(gameId: string): Game | null {
  return games.get(gameId) || null;
}

// Helper function to check if user is host of a game
export function isUserHost(gameId: string, userId: string): boolean {
  const game = games.get(gameId);
  return game ? game.hostId === userId : false;
}

// Helper function to get all active games count (for monitoring)
export function getActiveGamesCount(): number {
  return games.size;
}

// Helper function to manually clean up a game (if needed)
export function cleanupGame(gameId: string): boolean {
  return games.delete(gameId);
}