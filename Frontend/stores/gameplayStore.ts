import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Question, PlayerAnswer, GameStats } from '@/types/game'

export interface GameplayState {
  // Current question state (streamed from server)
  currentQuestion: Question | null
  currentQuestionIndex: number
  totalQuestions: number
  
  // Server-controlled timer state
  timeRemaining: number
  timerActive: boolean
  
  // Player answers and results
  playerAnswers: Record<string, PlayerAnswer[]> // Evaluated answers from server
  currentAnswer: string // Current player's answer input (before submission)
  hasSubmittedAnswer: boolean // Whether current player has submitted for current question
  
  // Game flow state
  gamePhase: 'waiting' | 'question' | 'results' | 'final_results'
  isLoading: boolean
  error: string | null
  
  // Server event handlers
  handleQuestionReceived: (question: Question, questionIndex: number, totalQuestions: number) => void
  handleTimerUpdate: (timeRemaining: number, timerActive: boolean) => void
  handleAnswerResult: (result: PlayerAnswer) => void
  handleGameResults: (results: { playerAnswers: Record<string, PlayerAnswer[]>, gameStats: GameStats }) => void
  handleGamePhaseChange: (phase: GameplayState['gamePhase']) => void
  
  // Client actions
  updateCurrentAnswer: (answer: string) => void
  submitAnswer: (playerId: string) => void
  
  // Answer queries
  getPlayerAnswer: (playerId: string, questionId: string) => PlayerAnswer | undefined
  getPlayerAnswersForQuestion: (questionId: string) => Record<string, PlayerAnswer>
  getPlayerScore: (playerId: string) => number
  
  // Game state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  resetGame: () => void
  
  // Utility methods
  isQuestionActive: () => boolean
  getProgress: () => { current: number, total: number, percentage: number }
  
  // WebSocket callbacks (set by connection manager)
  onSubmitAnswer?: (playerId: string, questionId: string, answer: string) => void
  onRequestNextQuestion?: () => void
}

export const useGameplayStore = create<GameplayState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    
    timeRemaining: 0,
    timerActive: false,
    
    playerAnswers: {},
    currentAnswer: '',
    hasSubmittedAnswer: false,
    
    gamePhase: 'waiting',
    isLoading: false,
    error: null,

    // Server event handlers
    handleQuestionReceived: (question: Question, questionIndex: number, totalQuestions: number) => {
      set({ 
        currentQuestion: question,
        currentQuestionIndex: questionIndex,
        totalQuestions,
        currentAnswer: '',
        hasSubmittedAnswer: false,
        gamePhase: 'question',
        error: null
      })
    },

    handleTimerUpdate: (timeRemaining: number, timerActive: boolean) => {
      set({ 
        timeRemaining: Math.max(0, timeRemaining),
        timerActive 
      })
    },

    handleAnswerResult: (result: PlayerAnswer) => {
      const { playerAnswers } = get()
      const playerId = result.participant_id
      
      // Update player answers with server evaluation
      const updatedPlayerAnswers = { ...playerAnswers }
      if (!updatedPlayerAnswers[playerId]) {
        updatedPlayerAnswers[playerId] = []
      }
      
      // Remove any existing answer for this question and add the new one
      updatedPlayerAnswers[playerId] = updatedPlayerAnswers[playerId].filter(
        a => a.question_id !== result.question_id
      )
      updatedPlayerAnswers[playerId].push(result)
      
      set({ 
        playerAnswers: updatedPlayerAnswers,
        error: null 
      })
    },

    handleGameResults: (results: { playerAnswers: Record<string, PlayerAnswer[]>, gameStats: GameStats }) => {
      set({
        playerAnswers: results.playerAnswers,
        gamePhase: 'final_results',
        timerActive: false,
        error: null
      })
    },

    handleGamePhaseChange: (phase: GameplayState['gamePhase']) => {
      set({ gamePhase: phase })
      
      // Reset answer state when moving between questions
      if (phase === 'question') {
        set({ 
          currentAnswer: '',
          hasSubmittedAnswer: false 
        })
      }
    },

    // Client actions
    updateCurrentAnswer: (answer: string) => {
      const { hasSubmittedAnswer } = get()
      
      // Don't allow answer changes after submission
      if (!hasSubmittedAnswer) {
        set({ currentAnswer: answer })
      }
    },

    submitAnswer: (playerId: string) => {
      const { currentQuestion, currentAnswer, onSubmitAnswer, hasSubmittedAnswer } = get()
      
      if (hasSubmittedAnswer) {
        set({ error: 'Answer already submitted for this question' })
        return
      }
      
      if (!currentQuestion) {
        set({ error: 'No active question to submit answer for' })
        return
      }
      
      if (!currentAnswer.trim()) {
        set({ error: 'Please provide an answer before submitting' })
        return
      }
      
      // Mark as submitted to prevent double submission
      set({
        hasSubmittedAnswer: true,
        error: null
      })
      
      // Send to server via WebSocket callback
      if (onSubmitAnswer) {
        onSubmitAnswer(playerId, currentQuestion.id, currentAnswer.trim())
      } else {
        set({ 
          error: 'No server connection available',
          hasSubmittedAnswer: false // Reset if failed to send
        })
      }
    },

    // Answer queries
    getPlayerAnswer: (playerId: string, questionId: string) => {
      const { playerAnswers } = get()
      const answers = playerAnswers[playerId] || []
      return answers.find(answer => answer.question_id === questionId)
    },

    getPlayerAnswersForQuestion: (questionId: string) => {
      const { playerAnswers } = get()
      const result: Record<string, PlayerAnswer> = {}
      
      Object.entries(playerAnswers).forEach(([playerId, answers]) => {
        const answer = answers.find(a => a.question_id === questionId)
        if (answer) {
          result[playerId] = answer
        }
      })
      
      return result
    },

    getPlayerScore: (playerId: string) => {
      const { playerAnswers } = get()
      const answers = playerAnswers[playerId] || []
      return answers.reduce((total, answer) => total + (answer.is_correct ? 1 : 0), 0)
    },

    // Game state management
    setLoading: (loading: boolean) => {
      set({ isLoading: loading })
    },

    setError: (error: string | null) => {
      set({ error, isLoading: false })
    },

    clearError: () => {
      set({ error: null })
    },

    resetGame: () => {
      set({
        currentQuestion: null,
        currentQuestionIndex: 0,
        totalQuestions: 0,
        timeRemaining: 0,
        timerActive: false,
        playerAnswers: {},
        currentAnswer: '',
        hasSubmittedAnswer: false,
        gamePhase: 'waiting',
        isLoading: false,
        error: null
      })
    },

    // Utility methods
    isQuestionActive: () => {
      const { gamePhase, timerActive } = get()
      return gamePhase === 'question' && timerActive
    },

    getProgress: () => {
      const { currentQuestionIndex, totalQuestions } = get()
      const current = currentQuestionIndex + 1
      const percentage = totalQuestions > 0 ? (current / totalQuestions) * 100 : 0
      
      return {
        current: Math.max(0, current),
        total: totalQuestions,
        percentage: Math.round(percentage)
      }
    }
  }))
) 