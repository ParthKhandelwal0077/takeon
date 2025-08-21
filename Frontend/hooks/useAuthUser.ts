'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/stores/userStore'

export function useAuthUser() {
  const { setCurrentUser, setLoading, setError, currentUser, isLoading } = useUserStore()

  useEffect(() => {
    const fetchUser = async () => {
      if (currentUser?.isAuthenticated) {
        return // Already have user data
      }

      setLoading(true)
      
      try {
        const response = await fetch('/api/user')
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated, redirect to login
            window.location.href = '/authentication'
            return
          }
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        setCurrentUser(data.user)
      } catch (error) {
        console.error('Error fetching user:', error)
        setError(error instanceof Error ? error.message : 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [setCurrentUser, setLoading, setError, currentUser])

  return { currentUser, isLoading }
} 