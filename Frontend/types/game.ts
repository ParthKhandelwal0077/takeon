// Base types
export type GameMode = 'private' | 'public' | 'daily_challenge'
export type GameStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

// User related types
export interface CurrentUser {
  id: string
  username: string
  isHost: boolean
  isAuthenticated: boolean
}

export interface Player {
  id: string
  username: string
  is_host: boolean
  joinedAt?: string
  isOnline?: boolean
}

// Game related types
export interface Topic {
  id: string
  name: string
  description: string
  pdf_url?: string
}

export interface Game {
  id: string
  host_id: string
  topic_id: string
  game_mode: GameMode
  num_questions: number
  time_per_question: number
  status: GameStatus
  created_at: string
  started_at?: string
  ended_at?: string
  topics?: Topic
}

export interface GameCreationData {
  topic: string
  description: string
  numQuestions: string
  timePerQuestion: string
  gameMode: GameMode
  pdfFile?: File
}

// Question related types (client-side - no correct answers)
export interface Question {
  id: string
  game_id: string
  topic_id: string
  question_text: string
  options: string[]
  type: string
  time_limit?: number // Optional time limit for this specific question
}

// Server-side question interface (includes answers - never sent to client)
export interface ServerQuestion extends Question {
  correct_option: string
  expected_keywords: string[]
  explanation: string
}

export interface PlayerAnswer {
  id: string
  question_id: string
  participant_id: string
  answer: string
  matched_keywords: string[]
  is_correct: boolean
  time_taken: number
  evaluation_method: string
}

// Scoring related types
export interface PlayerScore {
  playerId: string
  username: string
  totalScore: number
  correctAnswers: number
  averageTime: number
  streak: number
  ranking: number
}

export interface GameStats {
  totalParticipants: number
  averageScore: number
  mostDifficultQuestion: string
  fastestAnswer: { playerId: string, time: number }
  completionRate: number
}

// WebSocket message types
export interface WebSocketMessage {
  type: string
  gameId?: string
  playerId?: string
  userId?: string
  username?: string
  isHost?: boolean
  data?: Record<string, unknown>
  timestamp?: string
}

// Notification types
export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: number
  autoClose?: boolean
  duration?: number
}

// Modal states
export interface ModalStates {
  reportModal: { isOpen: boolean, questionId?: string }
  settingsModal: { isOpen: boolean }
  leaveGameModal: { isOpen: boolean }
  helpModal: { isOpen: boolean }
}

// Loading and error states
export type LoadingStates = Record<string, boolean>
export type ErrorStates = Record<string, string>

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  warning?: string
}

export interface GameApiResponse extends ApiResponse {
  gameId?: string
  game?: Game
  players?: Player[]
  currentUserId?: string
  hostId?: string
  userId?: string
} 