import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CurrentUser } from '@/types/game'

export interface UserState {
  // User state
  currentUser: CurrentUser | null
  isLoading: boolean
  error: string | null
  
  // User actions
  setCurrentUser: (user: CurrentUser | null) => void
  updateUser: (updates: Partial<CurrentUser>) => void
  setUserAsHost: (isHost: boolean) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setUsername: (username: string) => void
  logout: () => void
  
  // Loading and error management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Utility methods
  isUserHost: () => boolean
  isUserAuthenticated: () => boolean
  getUserId: () => string | null
  getUsername: () => string | null
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isLoading: false,
      error: null,

      // User actions
      setCurrentUser: (user: CurrentUser | null) => {
        set({ currentUser: user, error: null })
      },

      updateUser: (updates: Partial<CurrentUser>) => {
        const { currentUser } = get()
        if (currentUser) {
          set({
            currentUser: { ...currentUser, ...updates },
            error: null
          })
        }
      },

      setUserAsHost: (isHost: boolean) => {
        const { currentUser } = get()
        if (currentUser) {
          set({
            currentUser: { ...currentUser, isHost },
            error: null
          })
        }
      },

      setAuthenticated: (isAuthenticated: boolean) => {
        const { currentUser } = get()
        if (currentUser) {
          set({
            currentUser: { ...currentUser, isAuthenticated },
            error: null
          })
        }
      },

      setUsername: (username: string) => {
        const { currentUser } = get()
        if (currentUser) {
          set({
            currentUser: { ...currentUser, username },
            error: null
          })
        }
      },

      logout: () => {
        set({
          currentUser: null,
          error: null,
          isLoading: false
        })
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
      isUserHost: () => {
        const { currentUser } = get()
        return currentUser?.isHost ?? false
      },

      isUserAuthenticated: () => {
        const { currentUser } = get()
        return currentUser?.isAuthenticated ?? false
      },

      getUserId: () => {
        const { currentUser } = get()
        return currentUser?.id ?? null
      },

      getUsername: () => {
        const { currentUser } = get()
        return currentUser?.username ?? null
      }
    }),
    {
      name: 'user-storage', // Persist user data in localStorage
      partialize: (state) => ({
        currentUser: state.currentUser,
        // Don't persist loading and error states
      }),
    }
  )
) 