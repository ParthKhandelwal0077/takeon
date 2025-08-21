// Import and re-export all store hooks
import { useConnectionStore, type ConnectionState } from './connectionStore'
import { useUserStore, type UserState } from './userStore'
import { useGameStore, type GameState } from './gameStore'
import { usePlayersStore, type PlayersState } from './playersStore'
import { useGameplayStore, type GameplayState } from './gameplayStore'
import { useScoringStore, type ScoringState } from './scoringStore'

// Export all store hooks
export { useConnectionStore, useUserStore, useGameStore, usePlayersStore, useGameplayStore, useScoringStore }

// Export all store types/interfaces
export type { ConnectionState, UserState, GameState, PlayersState, GameplayState, ScoringState }

// Export common types that are used across stores
export * from '../types/game'

// Combined store types for advanced usage
export interface GameStoreState {
  connection: ConnectionState
  user: UserState
  game: GameState
  players: PlayersState
  gameplay: GameplayState
  scoring: ScoringState
}

// Helper hook to get all stores at once (for debugging or advanced usage)
export const useAllStores = () => ({
  connection: useConnectionStore(),
  user: useUserStore(),
  game: useGameStore(),
  players: usePlayersStore(),
  gameplay: useGameplayStore(),
  scoring: useScoringStore(),
})

// Selector helper functions for common operations
export const useCurrentUser = () => useUserStore(state => state.currentUser)
export const useIsHost = () => useUserStore(state => state.isUserHost())
export const useGameStatus = () => useGameStore(state => state.getGameStatus())
export const usePlayerCount = () => usePlayersStore(state => state.getPlayerCount())
export const useConnectionStatus = () => useConnectionStore(state => state.connectionStatus)
export const useGameProgress = () => useGameplayStore(state => state.getProgress())
export const useLeaderboard = () => useScoringStore(state => state.getLeaderboard())

// Action helpers for common operations
export const useGameActions = () => ({
  // Connection actions
  establishHostConnection: useConnectionStore(state => state.establishHostConnection),
  establishParticipantConnection: useConnectionStore(state => state.establishParticipantConnection),
  closeConnection: useConnectionStore(state => state.closeConnection),
  sendMessage: useConnectionStore(state => state.sendMessage),
  
  // User actions
  setCurrentUser: useUserStore(state => state.setCurrentUser),
  logout: useUserStore(state => state.logout),
  
  // Game actions
  createGame: useGameStore(state => state.createGame),
  fetchGame: useGameStore(state => state.fetchGame),
  updateGameStatus: useGameStore(state => state.updateGameStatus),
  
  // Player actions
  addPlayer: usePlayersStore(state => state.addPlayer),
  removePlayer: usePlayersStore(state => state.removePlayer),
  updatePlayer: usePlayersStore(state => state.updatePlayer),
  
  // Gameplay actions
  startGame: useGameplayStore(state => state.startGame),
  nextQuestion: useGameplayStore(state => state.nextQuestion),
  submitAnswerToServer: useGameplayStore(state => state.submitAnswerToServer),
  
  // Scoring actions
  updatePlayerScore: useScoringStore(state => state.updatePlayerScore),
  updateRankings: useScoringStore(state => state.updateRankings),
})

// Store reset helper - useful for cleanup when leaving games
export const resetConnection = () => {
  useConnectionStore.getState().closeConnection()
  useConnectionStore.setState({ 
    connectionStatus: 'disconnected',
    reconnectAttempts: 0 
  })
}

export const resetGame = () => {
  useGameStore.getState().clearGame()
}

export const resetPlayers = () => {
  usePlayersStore.getState().clearPlayers()
}

export const resetGameplay = () => {
  useGameplayStore.getState().resetGame()
}

export const resetScoring = () => {
  useScoringStore.getState().clearScores()
}

export const resetAllStores = () => {
  resetConnection()
  resetGame()
  resetPlayers()
  resetGameplay()
  resetScoring()
}

// Hook version for React components
export const useResetAllStores = () => ({
  resetConnection,
  resetGame,
  resetPlayers,
  resetGameplay,
  resetScoring,
  resetAll: resetAllStores
}) 