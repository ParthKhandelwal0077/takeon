import WebSocket from 'ws';
import {
  handleCreateGame,
  handleJoinGame,
  handleStartGame,
  handleSubmitAnswer,
} from './gameManager';

interface IncomingMessage {
  type: string;
  payload: any;
}

export async function handleMessage(ws: WebSocket, message: IncomingMessage): Promise<void> {
  const { type, payload } = message;

  try {
    switch (type) {
      case 'create_game':
        return await handleCreateGame(ws, payload);
      case 'join_game':
        // Handle both old format (direct properties) and new format (payload wrapper)
        const joinPayload = payload || {
          gameId: (message as any).gameId,
          userId: (message as any).playerId || (message as any).userId,
          playerName: (message as any).username || (message as any).playerName,
          isHost: (message as any).isHost
        };
        return await handleJoinGame(ws, joinPayload);
      case 'start_game':
        return handleStartGame(ws, payload);
      case 'submit_answer':
        return handleSubmitAnswer(ws, payload);
      default:
        ws.send(JSON.stringify({ type: 'error', payload: 'Unknown message type' }));
    }
  } catch (error) {
    console.error('Error handling message:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      payload: 'An unexpected error occurred while processing your request' 
    }));
  }
}
