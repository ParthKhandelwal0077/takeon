import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { PlayerScore, GameStats } from '@/types/game'

export interface ScoringState {
  // Server-provided scoring state
  playerScores: Record<string, PlayerScore>
  gameStats: GameStats | null
  leaderboard: PlayerScore[]
  isLoading: boolean
  error: string | null
  
  // Server event handlers - receive calculated scores/stats from server
  handleScoreUpdate: (playerId: string, score: PlayerScore) => void
  handleBulkScoreUpdate: (scores: Record<string, PlayerScore>) => void
  handleGameStatsUpdate: (stats: GameStats) => void
  handleLeaderboardUpdate: (leaderboard: PlayerScore[]) => void
  
  // Player score queries (read-only)
  getPlayerScore: (playerId: string) => PlayerScore | null
  getPlayerRank: (playerId: string) => number
  getLeaderboard: () => PlayerScore[]
  getTopPlayers: (limit: number) => PlayerScore[]
  
  // Comparison methods (using server-provided data)
  comparePlayerScores: (playerAId: string, playerBId: string) => {
    winner: string | 'tie'
    scoreDiff: number
    accuracyDiff: number
    timeDiff: number
  } | null
  
  // Reset and management
  clearScores: () => void
  resetPlayerScore: (playerId: string) => void
  
  // Loading and error management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Export methods
  exportScores: () => string // JSON string
  exportLeaderboard: () => PlayerScore[]
}

export const useScoringStore = create<ScoringState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    playerScores: {},
    gameStats: null,
    leaderboard: [],
    isLoading: false,
    error: null,

    // Server event handlers - receive calculated scores/stats from server
    handleScoreUpdate: (playerId: string, score: PlayerScore) => {
      const { playerScores } = get()
      
      set({
        playerScores: {
          ...playerScores,
          [playerId]: score
        },
        error: null
      })
    },

    handleBulkScoreUpdate: (scores: Record<string, PlayerScore>) => {
      set({ 
        playerScores: scores,
        error: null 
      })
    },

    handleGameStatsUpdate: (stats: GameStats) => {
      set({ 
        gameStats: stats,
        error: null 
      })
    },

    handleLeaderboardUpdate: (leaderboard: PlayerScore[]) => {
      set({ 
        leaderboard: [...leaderboard],
        error: null 
      })
    },

    // Player score queries (read-only)
    getPlayerScore: (playerId: string) => {
      const { playerScores } = get()
      return playerScores[playerId] || null
    },

    getPlayerRank: (playerId: string) => {
      const { playerScores } = get()
      return playerScores[playerId]?.ranking || 0
    },

    getLeaderboard: () => {
      const { leaderboard } = get()
      return [...leaderboard]
    },

    getTopPlayers: (limit: number) => {
      const { leaderboard } = get()
      return leaderboard.slice(0, limit)
    },

    // Comparison methods (using server-provided data)
    comparePlayerScores: (playerAId: string, playerBId: string) => {
      const { getPlayerScore } = get()
      const scoreA = getPlayerScore(playerAId)
      const scoreB = getPlayerScore(playerBId)
      
      if (!scoreA || !scoreB) return null
      
      const scoreDiff = scoreA.totalScore - scoreB.totalScore
      const accuracyDiff = scoreA.correctAnswers - scoreB.correctAnswers
      const timeDiff = scoreA.averageTime - scoreB.averageTime
      
      let winner: string | 'tie' = 'tie'
      if (scoreDiff > 0) winner = playerAId
      else if (scoreDiff < 0) winner = playerBId
      
      return {
        winner,
        scoreDiff,
        accuracyDiff,
        timeDiff
      }
    },

    // Reset and management
    clearScores: () => {
      set({ 
        playerScores: {},
        gameStats: null,
        leaderboard: [],
        error: null 
      })
    },

    resetPlayerScore: (playerId: string) => {
      const { playerScores } = get()
      const updatedScores = { ...playerScores }
      delete updatedScores[playerId]
      
      set({ playerScores: updatedScores })
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

    // Export methods
    exportScores: () => {
      const { playerScores, gameStats } = get()
      return JSON.stringify({ playerScores, gameStats }, null, 2)
    },

    exportLeaderboard: () => {
      const { getLeaderboard } = get()
      return getLeaderboard()
    }
  }))
) 