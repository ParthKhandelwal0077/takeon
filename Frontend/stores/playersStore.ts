import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Player } from '@/types/game'

export interface PlayersState {
  // Players state
  players: Player[]
  // id,username,is_host,joinedAt,isOnline
  maxPlayers: number
  isLoading: boolean
  error: string | null
  
  // Player management
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  updatePlayerOnlineStatus: (playerId: string, isOnline: boolean) => void
  clearPlayers: () => void
  
  // Player queries
  getPlayerById: (playerId: string) => Player | undefined
  getPlayerByUsername: (username: string) => Player | undefined
  getHost: () => Player | undefined
  getParticipants: () => Player[]
  getOnlinePlayers: () => Player[]
  getOfflinePlayers: () => Player[]
  
  // Player statistics
  getPlayerCount: () => number
  getOnlineCount: () => number
  isPlayerInGame: (playerId: string) => boolean
  canAddMorePlayers: () => boolean
  
  // Loading and error management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Utility methods
  sortPlayersByJoinTime: () => Player[]
  sortPlayersByRole: () => Player[] // Host first, then participants
}

export const usePlayersStore = create<PlayersState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    players: [],
    maxPlayers: 50, // Default max players
    isLoading: false,
    error: null,

    // Player management
    setPlayers: (players: Player[]) => {
      set({ 
        players: players.map(player => ({
          ...player,
          isOnline: player.isOnline ?? true,
          joinedAt: player.joinedAt ?? new Date().toISOString()
        })),
        error: null 
      })
    },

    addPlayer: (player: Player) => {
      const { players, isPlayerInGame, canAddMorePlayers } = get()
      
      // Check if player already exists
      if (isPlayerInGame(player.id)) {
        console.warn(`Player ${player.id} is already in the game`)
        return
      }
      
      // Check if we can add more players
      if (!canAddMorePlayers()) {
        set({ error: 'Game is full' })
        return
      }
      
      const newPlayer: Player = {
        ...player,
        isOnline: true,
        joinedAt: new Date().toISOString()
      }
      
      set({ 
        players: [...players, newPlayer],
        error: null 
      })
    },

    removePlayer: (playerId: string) => {
      const { players } = get()
      set({ 
        players: players.filter(player => player.id !== playerId),
        error: null 
      })
    },

    updatePlayer: (playerId: string, updates: Partial<Player>) => {
      const { players } = get()
      set({
        players: players.map(player =>
          player.id === playerId ? { ...player, ...updates } : player
        ),
        error: null
      })
    },

    updatePlayerOnlineStatus: (playerId: string, isOnline: boolean) => {
      const { updatePlayer } = get()
      updatePlayer(playerId, { isOnline })
    },

    clearPlayers: () => {
      set({ players: [], error: null })
    },

    // Player queries
    getPlayerById: (playerId: string) => {
      const { players } = get()
      return players.find(player => player.id === playerId)
    },

    getPlayerByUsername: (username: string) => {
      const { players } = get()
      return players.find(player => player.username === username)
    },

    getHost: () => {
      const { players } = get()
      return players.find(player => player.is_host)
    },

    getParticipants: () => {
      const { players } = get()
      return players.filter(player => !player.is_host)
    },

    getOnlinePlayers: () => {
      const { players } = get()
      return players.filter(player => player.isOnline)
    },

    getOfflinePlayers: () => {
      const { players } = get()
      return players.filter(player => !player.isOnline)
    },

    // Player statistics
    getPlayerCount: () => {
      const { players } = get()
      return players.length
    },

    getOnlineCount: () => {
      const { getOnlinePlayers } = get()
      return getOnlinePlayers().length
    },

    isPlayerInGame: (playerId: string) => {
      const { getPlayerById } = get()
      return getPlayerById(playerId) !== undefined
    },

    canAddMorePlayers: () => {
      const { players, maxPlayers } = get()
      return players.length < maxPlayers
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
    sortPlayersByJoinTime: () => {
      const { players } = get()
      return [...players].sort((a, b) => {
        const timeA = new Date(a.joinedAt || 0).getTime()
        const timeB = new Date(b.joinedAt || 0).getTime()
        return timeA - timeB
      })
    },

    sortPlayersByRole: () => {
      const { players } = get()
      return [...players].sort((a, b) => {
        // Host first, then participants by join time
        if (a.is_host && !b.is_host) return -1
        if (!a.is_host && b.is_host) return 1
        
        // If both are participants or both are hosts, sort by join time
        const timeA = new Date(a.joinedAt || 0).getTime()
        const timeB = new Date(b.joinedAt || 0).getTime()
        return timeA - timeB
      })
    }
  }))
) 