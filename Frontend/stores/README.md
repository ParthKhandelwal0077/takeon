# Game State Management with Zustand

This directory contains all the Zustand stores for managing global state in the trivia game application.

## Store Architecture

The state is divided into 6 main stores:

1. **ConnectionState** - WebSocket connections (host/participant)
2. **UserState** - Current user and authentication
3. **GameState** - Game metadata and lifecycle
4. **PlayersState** - All players in the game
5. **GameplayState** - Active gameplay (questions, answers, timer)
6. **ScoringState** - Scoring, rankings, and statistics

## Quick Start

```typescript
import { 
  useConnectionStore, 
  useUserStore, 
  useGameStore,
  useCurrentUser,
  useGameActions 
} from '@/stores'

// In your component
const currentUser = useCurrentUser()
const { createGame, establishHostConnection } = useGameActions()
```

## Store Details

### 1. ConnectionState (`useConnectionStore`)

Manages WebSocket connections for real-time communication.

```typescript
const { 
  establishHostConnection,
  establishParticipantConnection,
  closeConnection,
  sendMessage,
  connectionStatus 
} = useConnectionStore()

// For hosts (game creation)
await establishHostConnection(gameId, userId)

// For participants (joining game)
await establishParticipantConnection(gameId, userId, username)

// Send messages
sendMessage({ type: 'start_game', gameId }, true) // true = host connection
```

### 2. UserState (`useUserStore`)

Manages current user information and authentication.

```typescript
const { 
  currentUser,
  setCurrentUser,
  updateUser,
  isUserHost,
  logout 
} = useUserStore()

// Set user after authentication
setCurrentUser({
  id: 'user-123',
  username: 'John',
  isHost: true,
  isAuthenticated: true
})

// Check if user is host
const isHost = isUserHost()
```

### 3. GameState (`useGameStore`)

Manages game metadata, topics, and game lifecycle.

```typescript
const { 
  game,
  createGame,
  fetchGame,
  updateGameStatus,
  gameUrl,
  copyGameUrl 
} = useGameStore()

// Create a new game
const gameData = {
  topic: 'History',
  description: 'World War 2',
  numQuestions: '10',
  timePerQuestion: '30',
  gameMode: 'private' as GameMode,
  pdfFile: selectedFile
}

const result = await createGame(gameData)

// Update game status
updateGameStatus('in_progress')
```

### 4. PlayersState (`usePlayersStore`)

Manages all players in the game.

```typescript
const { 
  players,
  addPlayer,
  removePlayer,
  getPlayerCount,
  getHost,
  sortPlayersByRole 
} = usePlayersStore()

// Add a new player
addPlayer({
  id: 'player-123',
  username: 'Alice',
  is_host: false
})

// Get player statistics
const playerCount = getPlayerCount()
const host = getHost()
const sortedPlayers = sortPlayersByRole() // Host first
```

### 5. GameplayState (`useGameplayStore`)

Manages active gameplay flow, questions, and answers.

```typescript
const { 
  currentQuestion,
  startGame,
  nextQuestion,
  submitAnswer,
  timeRemaining,
  gamePhase,
  getProgress 
} = useGameplayStore()

// Start the game
startGame()

// Submit player answer
submitAnswer('player-id', 'answer-choice')

// Get game progress
const { current, total, percentage } = getProgress()
```

### 6. ScoringState (`useScoringStore`)

Manages scoring, rankings, and game statistics.

```typescript
const { 
  playerScores,
  leaderboard,
  updatePlayerScore,
  getLeaderboard,
  calculateGameStats 
} = useScoringStore()

// Update a player's score
updatePlayerScore('player-id', playerAnswers)

// Get top 3 players
const topPlayers = getTopPlayers(3)

// Get final leaderboard
const finalLeaderboard = getLeaderboard()
```

## Helper Hooks

### Selector Hooks (for performance)

```typescript
import { 
  useCurrentUser,
  useIsHost,
  useGameStatus,
  usePlayerCount,
  useConnectionStatus,
  useGameProgress,
  useLeaderboard 
} from '@/stores'

// These hooks automatically subscribe to specific state slices
const user = useCurrentUser()           // Only re-renders when user changes
const isHost = useIsHost()              // Only re-renders when host status changes
const gameStatus = useGameStatus()      // Only re-renders when game status changes
```

### Action Hooks

```typescript
import { useGameActions } from '@/stores'

const {
  // Connection actions
  establishHostConnection,
  establishParticipantConnection,
  closeConnection,
  sendMessage,
  
  // User actions
  setCurrentUser,
  logout,
  
  // Game actions
  createGame,
  fetchGame,
  updateGameStatus,
  
  // Player actions
  addPlayer,
  removePlayer,
  updatePlayer,
  
  // Gameplay actions
  startGame,
  nextQuestion,
  submitAnswer,
  
  // Scoring actions
  updatePlayerScore,
  updateRankings,
} = useGameActions()
```

## Store Reset Functions

```typescript
import { 
  resetAllStores,
  resetConnection,
  resetGame,
  useResetAllStores 
} from '@/stores'

// Direct reset (can be called anywhere)
resetAllStores()          // Reset everything
resetConnection()         // Reset only connection
resetGame()              // Reset only game data

// Hook version (for React components)
const { resetAll } = useResetAllStores()
```

## Usage Patterns

### 1. Game Creation Flow (Host)

```typescript
// GameCreation.tsx
const { createGame } = useGameStore()
const { establishHostConnection } = useConnectionStore()
const { setCurrentUser } = useUserStore()

const handleCreateGame = async (gameData) => {
  try {
    // Create game
    const result = await createGame(gameData)
    
    // Set user as host
    setCurrentUser({
      id: result.hostId,
      username: 'Host',
      isHost: true,
      isAuthenticated: true
    })
    
    // Establish WebSocket connection
    await establishHostConnection(result.gameId, result.hostId)
    
    // Navigate to lobby
    router.push(`/game/${result.gameId}`)
  } catch (error) {
    console.error('Failed to create game:', error)
  }
}
```

### 2. Game Joining Flow (Participant)

```typescript
// GameLobby.tsx
const { fetchGame } = useGameStore()
const { establishParticipantConnection } = useConnectionStore()
const { setCurrentUser } = useUserStore()
const { addPlayer } = usePlayersStore()

useEffect(() => {
  const joinGame = async () => {
    // Fetch game details
    await fetchGame(gameId)
    
    // Set user as participant
    const user = {
      id: 'participant-id',
      username: 'Player',
      isHost: false,
      isAuthenticated: true
    }
    setCurrentUser(user)
    
    // Add to players list
    addPlayer({
      id: user.id,
      username: user.username,
      is_host: false
    })
    
    // Establish WebSocket connection
    await establishParticipantConnection(gameId, user.id, user.username)
  }
  
  joinGame()
}, [gameId])
```

### 3. WebSocket Message Handling

```typescript
// Setup message listeners
const { onMessage } = useConnectionStore()
const { addPlayer, removePlayer } = usePlayersStore()
const { updateGameStatus } = useGameStore()

useEffect(() => {
  const handleMessage = (message) => {
    switch (message.type) {
      case 'player_joined':
        if (message.player) {
          addPlayer(message.player)
        }
        break
        
      case 'player_left':
        if (message.playerId) {
          removePlayer(message.playerId)
        }
        break
        
      case 'game_started':
        updateGameStatus('in_progress')
        router.push(`/game/${gameId}/play`)
        break
    }
  }
  
  onMessage(handleMessage)
}, [])
```

## Best Practices

1. **Use selector hooks** for performance - only subscribe to what you need
2. **Use action hooks** for cleaner component code
3. **Reset stores** when leaving games to prevent memory leaks
4. **Handle errors** in async store actions
5. **Use TypeScript** - all stores are fully typed
6. **Batch updates** when possible to avoid unnecessary re-renders

## TypeScript Support

All stores are fully typed with TypeScript:

```typescript
import type { 
  ConnectionState,
  UserState,
  GameState,
  CurrentUser,
  Player,
  Game 
} from '@/stores'

// Use types for props, state, etc.
interface Props {
  user: CurrentUser
  players: Player[]
  game: Game
}
```

## Debugging

```typescript
// Get all store states at once (useful for debugging)
import { useAllStores } from '@/stores'

const allStores = useAllStores()
console.log('All store states:', allStores)
```

This architecture provides a scalable, type-safe, and performant state management solution for the trivia game application. 