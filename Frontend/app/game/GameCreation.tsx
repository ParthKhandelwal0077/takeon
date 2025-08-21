'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

export default function GameCreation() {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [numQuestions, setNumQuestions] = useState('10')
  const [timePerQuestion, setTimePerQuestion] = useState('20')
  const [gameMode, setGameMode] = useState('private')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const { currentUser, setUserAsHost } = useUserStore()
  // WebSocket connection ref for the host
  const wsRef = useRef<WebSocket | null>(null)

  // Cleanup WebSocket connection on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const setupHostWebSocket = (gameId: string) => {
    const userId = currentUser?.id
    if (!userId) {
      console.error('No user ID available for WebSocket setup')
      return
    }

    try {
      const ws = new WebSocket('ws://localhost:8080')
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('Host WebSocket connected for game creation')
        // Send create_game message to establish host connection
        ws.send(JSON.stringify({
          type: 'create_game',
          gameId: gameId,
          userId: userId
        }))
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Host WebSocket message received:', data)
          
          // Handle any specific messages for the host during game creation
          if (data.type === 'game_created') {
            console.log('Game successfully created and host connected')
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError)
        }
      }
      
      ws.onerror = (error) => {
        console.error('Host WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('Host WebSocket connection closed')
      }
      
    } catch (wsError) {
      console.error('Failed to establish host WebSocket connection:', wsError)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create FormData to handle file upload
      const formData = new FormData()
      formData.append('topic', topic)
      formData.append('description', description)
      formData.append('numQuestions', numQuestions)
      formData.append('timePerQuestion', timePerQuestion)
      formData.append('gameMode', gameMode)
      
      if (file) {
        formData.append('pdfFile', file)
      }

      const response = await fetch('/api/create-game', {
        method: 'POST',
        body: formData, // Use FormData instead of JSON for file uploads
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create game')
      }

      if (data.success && data.gameId) {
        // Show warning if PDF upload failed but game was created
        if (data.warning) {
          console.warn('Game created with warning:', data.warning)
          // You could show a toast notification here if you have one
        }
        
        // Set user as host in the store
        setUserAsHost(true)
        
        // Set up WebSocket connection for the host
        setupHostWebSocket(data.gameId)
        
        // Navigate directly to the game lobby
        // The lobby will handle WebSocket connections and user details
        router.push(`/game/${data.gameId}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Error creating game:', err)
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading if no user data yet
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
        Create a New Game
        <span className="block text-lg font-normal text-gray-600 mt-2">
          Welcome, {currentUser.username}!
        </span>
      </h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label htmlFor="topic" className="block text-lg font-semibold text-gray-800 mb-2">
            Topic Name
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., 'Renaissance History'"
            required
            disabled={isLoading}
          />
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="block text-lg font-semibold text-gray-800 mb-2">
            Topic Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Describe what this topic covers..."
            required
            disabled={isLoading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="notes" className="block text-lg font-semibold text-gray-800 mb-2">
            Study Material (PDF) <span className="text-sm font-normal text-gray-500">- Optional</span>
          </label>
          <input
            id="notes"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            disabled={isLoading}
          />
           {file && <p className="text-sm text-gray-500 mt-2">Selected: {file.name}</p>}
          <p className="text-xs text-gray-400 mt-1">
            Upload a PDF with study materials for this topic. Players can access it during the game.
          </p>
        </div>

        {/* Game Mode */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Game Mode
          </label>
          <div className="space-y-3">
            {[
              { value: 'private', label: 'Private', description: 'Only players with the link can join' },
              { value: 'public', label: 'Public', description: 'Anyone can discover and join this game' },
              { value: 'daily_challenge', label: 'Daily Challenge', description: 'Special challenge game mode' }
            ].map((mode) => (
              <label key={mode.value} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="gameMode"
                  value={mode.value}
                  checked={gameMode === mode.value}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                  disabled={isLoading}
                />
                <div>
                  <span className="block font-medium text-gray-900">{mode.label}</span>
                  <span className="text-sm text-gray-500">{mode.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Number of Questions
          </label>
          <div className="flex space-x-4">
            {['10', '15', '20'].map((num) => (
              <label key={num} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="numQuestions"
                  value={num}
                  checked={numQuestions === num}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-gray-700">{num}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Per Question */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Time Per Question
          </label>
          <div className="flex space-x-4">
            {['20', '25', '30'].map((time) => (
              <label key={time} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="timePerQuestion"
                  value={time}
                  checked={timePerQuestion === time}
                  onChange={(e) => setTimePerQuestion(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-gray-700">{time}s</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Game...' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  )
}
