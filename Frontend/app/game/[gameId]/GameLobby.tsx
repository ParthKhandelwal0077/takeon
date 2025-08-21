'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUserStore } from '@/stores'

interface Topic {
  id: string
  name: string
  description: string
  pdf_url: string
}

interface Game {
  id: string
  host_id: string
  topic_id: string | null
  game_mode: string
  num_questions: number
  time_per_question: number
  status: string
  created_at: string
  topics?: Topic
}

interface Player {
  id: string
  username: string
  is_host: boolean
}

export default function GameLobby() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Use the user store instead of local state
  const { currentUser, isUserHost } = useUserStore()
  
  // WebSocket connection ref
  const wsRef = useRef<WebSocket | null>(null)
  // Track if WebSocket has been set up to prevent multiple connections
  const wsSetupRef = useRef<boolean>(false)

  // Construct the shareable game URL
  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${gameId}` : ''

  // Effect for initial data fetching - runs once when component mounts
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch(`/api/game/${gameId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch game data')
        }

        if (data.success) {
          setGame(data.game)
          setPlayers(data.players)
          
          // Update host status in store based on API response
          const isHost = data.currentUserId === data.game.host_id
          const storeState = useUserStore.getState()
          if (storeState.currentUser && storeState.currentUser.isHost !== isHost) {
            console.log('Updating host status in store:', isHost)
            storeState.setUserAsHost(isHost)
          }
        }
      } catch (err) {
        console.error('Error fetching game data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load game')
        // Fall back to mock data for development
        const storeState = useUserStore.getState()
        const mockGame: Game = {
          id: gameId,
          host_id: storeState.currentUser?.id || 'current-user-id',
          topic_id: 'mock-topic-id',
          game_mode: 'quiz',
          num_questions: 10,
          time_per_question: 20,
          status: 'waiting',
          created_at: new Date().toISOString(),
          topics: {
            id: 'mock-topic-id',
            name: 'Sample Topic',
            description: 'This is a sample topic for testing purposes',
            pdf_url: '#'
          }
        }

        const mockPlayers: Player[] = [
          {
            id: storeState.currentUser?.id || 'current-user-id',
            username: storeState.currentUser?.username || 'You',
            is_host: true
          }
        ]

        setGame(mockGame)
        setPlayers(mockPlayers)
        // Ensure user is marked as host in the store for mock data
        useUserStore.getState().setUserAsHost(true)
      } finally {
        setLoading(false)
      }
    }

    fetchGameData()
  }, [gameId])

  // Effect for WebSocket setup - runs when user data is available and gameId is set
  useEffect(() => {
    if (!currentUser || !gameId || wsSetupRef.current) return
    
    // Set up WebSocket connection for real-time updates (only for non-hosts)
    const setupWebSocket = () => {
      // Only setup WebSocket if we have user data and user is NOT the host
      // Hosts already have a WebSocket connection from game creation
      const isHost = currentUser.isHost // Use current user's host status directly
      
      if (isHost) {
        console.log('Skipping WebSocket setup for host - already connected from game creation')
        wsSetupRef.current = true // Mark as setup even though we're skipping
        return
      }
      
      // Check if we already have an active connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, skipping setup')
        wsSetupRef.current = true
        return
      }
      
      console.log('Setting up WebSocket connection for participant')
      wsSetupRef.current = true // Mark as setup before creating connection
      
      try {
        const ws = new WebSocket('ws://localhost:8080')
        wsRef.current = ws
        
        ws.onopen = () => {
          console.log('Participant WebSocket connected to game lobby')
          // Join the game room for real-time updates (only for non-hosts)
          ws.send(JSON.stringify({
            type: 'join_game',
            gameId: gameId,
            playerId: currentUser.id,
            username: currentUser.username,
            isHost: false // Always false for non-hosts in this branch
          }))
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Participant WebSocket message received:', data)
            
            // Handle player join messages
            if (data.type === 'player_joined') {
              // Don't show alert for the current user joining
              if (data.playerId !== currentUser?.id) {
                const roleText = data.isHost ? ' (Host)' : ''
                console.log('🎮', data.username || 'A new player', roleText, 'has joined the game!')
                alert(`🎮 ${data.username || 'A new player'}${roleText} has joined the game!`)
              }
              
              // Update players list if provided
              if (data.players) {
                setPlayers(data.players)
              } else if (data.player) {
                // Add individual player to the list
                setPlayers(prevPlayers => {
                  const existingPlayer = prevPlayers.find(p => p.id === data.player.id)
                  if (!existingPlayer) {
                    return [...prevPlayers, data.player]
                  }
                  return prevPlayers
                })
              }
            }
            
            // Handle other message types
            if (data.type === 'game_started') {
              router.push(`/game/${gameId}/play`)
            }
            
            if (data.type === 'player_left') {
              // Don't show alert for the current user leaving
              if (data.playerId !== currentUser?.id) {
                const roleText = data.isHost ? ' (Host)' : ''
                alert(`👋 ${data.username || 'A player'}${roleText} has left the game`)
              }
              if (data.players) {
                setPlayers(data.players)
              }
            }
            
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError)
          }
        }
        
        ws.onerror = (error) => {
          console.error('Participant WebSocket error:', error)
        }
        
        ws.onclose = () => {
          console.log('Participant WebSocket connection closed')
          wsSetupRef.current = false // Reset setup flag for reconnection
          // Attempt to reconnect after a delay (only for non-hosts)
          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED && !currentUser.isHost && !wsSetupRef.current) {
              setupWebSocket()
            }
          }, 3000)
        }
        
      } catch (wsError) {
        console.error('Failed to establish participant WebSocket connection:', wsError)
      }
    }
    
    setupWebSocket()
    
    // Cleanup function
    return () => {
      if (wsRef.current && !currentUser.isHost) {
        // Only close WebSocket for non-hosts
        // Hosts maintain their connection for the entire game lifecycle
        wsRef.current.close()
        wsRef.current = null
        wsSetupRef.current = false
      }
    }
  }, [currentUser, gameId, router]) // Include all dependencies used in the effect

  const copyGameLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const startGame = () => {
    // For hosts: they need to send start_game message via their existing WebSocket connection
    // For non-hosts: this button should be disabled, but we handle it gracefully
    if (isUserHost()) {
      // Hosts need to send the start game message via their existing WebSocket connection
      // Since we don't have direct access to the host's WebSocket from game creation here,
      // we can either:
      // 1. Create a temporary connection just for this message, or
      // 2. Use a direct API call to start the game
      
      // Option 1: Use API call for starting the game (more reliable)
      fetch(`/api/game/${gameId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId: currentUser?.id
        })
      }).then(response => {
        if (response.ok) {
          console.log('Game start request sent successfully')
        } else {
          console.error('Failed to start game')
        }
      }).catch(error => {
        console.error('Error starting game:', error)
      })
      
      // Option 2: Send via WebSocket if we had access to host connection
      // We'll keep this commented as an alternative approach
      /*
      if (hostWebSocketRef.current && hostWebSocketRef.current.readyState === WebSocket.OPEN) {
        hostWebSocketRef.current.send(JSON.stringify({
        type: 'start_game',
        gameId: gameId,
        hostId: currentUser.id
      }))
      }
      */
    } else {
      // Non-hosts shouldn't be able to start the game
      console.log('Only the host can start the game')
      return
    }
    
    // Navigate to game play
    router.push(`/game/${gameId}/play`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game lobby...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/private')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Game Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Lobby</h1>
              <p className="text-gray-600">Game ID: {gameId}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                game?.status === 'waiting' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {game?.status === 'waiting' ? 'Waiting for Players' : game?.status}
              </span>
            </div>
          </div>

          {/* Topic Information */}
          {game?.topics && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{game.topics.name}</h3>
              <p className="text-blue-800 mb-3">{game.topics.description}</p>
              {game.topics.pdf_url && (
                <a
                  href={game.topics.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Study Material
                </a>
              )}
            </div>
          )}

          {/* Game Details */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-1">Questions</h3>
              <p className="text-2xl font-bold text-blue-600">{game?.num_questions}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-1">Time per Question</h3>
              <p className="text-2xl font-bold text-blue-600">{game?.time_per_question}s</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-1">Game Mode</h3>
              <p className="text-2xl font-bold text-blue-600 capitalize">{game?.game_mode}</p>
            </div>
          </div>

          {/* Share Game Link */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Invite Friends</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <button
                onClick={copyGameLink}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Share this link with friends so they can join your game
            </p>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Players ({players.length})
          </h2>
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{player.username}</span>
                  {player.is_host && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Host
                    </span>
                  )}
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            ))}
          </div>
          
          {players.length === 1 && (
            <p className="text-gray-500 text-center mt-4 italic">
              Waiting for other players to join...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/private')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Leave Game
          </button>
          <button
            onClick={startGame}
            disabled={!isUserHost() || players.length < 1} // Only host can start the game
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUserHost() ? 'Start Game' : 'Waiting for Host to Start'}
          </button>
        </div>
      </div>
    </div>
  )
}
