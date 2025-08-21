import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Game, Topic, GameStatus } from '@/types/game'

export interface GameState {
  // Current game state
  game: Game | null
  gameUrl: string
  isLoading: boolean
  error: string | null
  
  // Game state management
  setGame: (game: Game) => void
  updateGameStatus: (status: GameStatus) => void
  endGame: () => void
  clearGame: () => void
  
  // Game URL management
  generateGameUrl: (gameId: string) => void
  copyGameUrl: () => Promise<boolean>
  
  // Loading and error management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Utility methods
  isHost: (userId: string) => boolean
  getGameId: () => string | null
  getGameStatus: () => GameStatus | null
  isGameActive: () => boolean
  canStartGame: () => boolean
  getTimePerQuestion: () => number
  getNumQuestions: () => number
  getTopic: () => Topic | null
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    game: null,
    gameUrl: '',
    isLoading: false,
    error: null,

    // Game state management
    setGame: (game: Game) => {
      set({ 
        game,
        error: null
      })
      // Generate game URL when game is set
      get().generateGameUrl(game.id)
    },
    
//'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'
    updateGameStatus: (status: GameStatus) => {
      const { game } = get()
      if (game) {
        const updatedGame = { ...game, status }
        if (status === 'in_progress' && !game.started_at) {
          updatedGame.started_at = new Date().toISOString()
        }
        if (status === 'completed' && !game.ended_at) {
          updatedGame.ended_at = new Date().toISOString()
        }
        set({ game: updatedGame })
      }
    },

    endGame: () => {
      const { game } = get()
      if (game) {
        set({ 
          game: { 
            ...game, 
            status: 'completed',
            ended_at: new Date().toISOString()
          }
        })
      }
    },

    clearGame: () => {
      set({ 
        game: null, 
        gameUrl: '', 
        error: null 
      })
    },

    // Game URL management
    generateGameUrl: (gameId: string) => {
      if (typeof window !== 'undefined') {
        const url = `${window.location.origin}/game/${gameId}`
        set({ gameUrl: url })
      }
    },

    copyGameUrl: async (): Promise<boolean> => {
      const { gameUrl } = get()
      if (!gameUrl) return false
      
      try {
        await navigator.clipboard.writeText(gameUrl)
        return true
      } catch (err) {
        console.error('Failed to copy game URL:', err)
        return false
      }
    },

    // Loading and error management
    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error, isLoading: false })
    },

    clearError: () => {
      set({ error: null })
    },

    // Utility methods
    isHost: (userId: string) => {
      const { game } = get()
      return game?.host_id === userId
    },

    getGameId: () => {
      const { game } = get()
      return game?.id ?? null
    },

    getGameStatus: () => {
      const { game } = get()
      return game?.status ?? null
    },

    isGameActive: () => {
      const { game } = get()
      return game?.status === 'in_progress'
    },

    canStartGame: () => {
      const { game } = get()
      return game?.status === 'waiting'
    },

    getTimePerQuestion: () => {
      const { game } = get()
      return game?.time_per_question ?? 20
    },

    getNumQuestions: () => {
      const { game } = get()
      return game?.num_questions ?? 10
    },

    getTopic: () => {
      const { game } = get()
      return game?.topics ?? null
    }
  }))
) 