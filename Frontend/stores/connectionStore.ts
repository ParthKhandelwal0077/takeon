import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { ConnectionStatus, WebSocketMessage } from '@/types/game'

export interface ConnectionState {
  // WebSocket connections
  hostWebSocket: WebSocket | null
  participantWebSocket: WebSocket | null
  connectionStatus: ConnectionStatus //'disconnected' | 'connecting' | 'connected' | 'error'
  reconnectAttempts: number
  maxReconnectAttempts: number
  
  // Connection management methods (store existing connections)
  setHostConnection: (ws: WebSocket) => void
  setParticipantConnection: (ws: WebSocket) => void
  clearConnection: (isHost?: boolean) => void
  sendMessage: (message: WebSocketMessage, isHost?: boolean) => void
  
  // Connection state management
  setConnectionStatus: (status: ConnectionStatus) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  
  // Event handlers
  onMessage: (callback: (message: WebSocketMessage) => void) => void
  removeMessageCallback: (callback: (message: WebSocketMessage) => void) => void
  onWebSocketMessage: (message: WebSocketMessage) => void
  messageCallbacks: Array<(message: WebSocketMessage) => void>
  
  // Utility methods
  isHostConnected: () => boolean
  isParticipantConnected: () => boolean
  getActiveConnection: () => WebSocket | null
  hasActiveConnection: () => boolean
}

export const useConnectionStore = create<ConnectionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    hostWebSocket: null,
    participantWebSocket: null,
    connectionStatus: 'disconnected',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    messageCallbacks: [],

    // Connection management methods
    setHostConnection: (ws: WebSocket) => {
      console.log('Storing host WebSocket connection in global state')
      
      // Clear any existing host connection
      const { hostWebSocket } = get()
      if (hostWebSocket) {
        hostWebSocket.close(1000, 'Replacing with new connection')
      }
      
      // Store the new connection
      set({ 
        hostWebSocket: ws,
        connectionStatus: ws.readyState === WebSocket.OPEN ? 'connected' : 'connecting'
      })
      
      // Set up message forwarding to registered callbacks
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('Host WebSocket message received (via store):', message)
          get().onWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message in store:', error)
        }
      }
      
      // Handle connection status changes
      ws.onopen = () => {
        console.log('Host WebSocket opened (tracked by store)')
        set({ connectionStatus: 'connected' })
        get().resetReconnectAttempts()
      }
      
      ws.onerror = () => {
        console.log('Host WebSocket error (tracked by store)')
        set({ connectionStatus: 'error' })
      }
      
      ws.onclose = (event) => {
        console.log('Host WebSocket closed (tracked by store):', event.code, event.reason)
        set({ 
          hostWebSocket: null,
          connectionStatus: 'disconnected' 
        })
      }
    },

    setParticipantConnection: (ws: WebSocket) => {
      console.log('Storing participant WebSocket connection in global state')
      
      // Clear any existing participant connection
      const { participantWebSocket } = get()
      if (participantWebSocket) {
        participantWebSocket.close(1000, 'Replacing with new connection')
      }
      
      // Store the new connection
      set({ 
        participantWebSocket: ws,
        connectionStatus: ws.readyState === WebSocket.OPEN ? 'connected' : 'connecting'
      })
      
      // Set up message forwarding to registered callbacks
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('Participant WebSocket message received (via store):', message)
          get().onWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message in store:', error)
        }
      }
      
      // Handle connection status changes
      ws.onopen = () => {
        console.log('Participant WebSocket opened (tracked by store)')
        set({ connectionStatus: 'connected' })
        get().resetReconnectAttempts()
      }
      
      ws.onerror = () => {
        console.log('Participant WebSocket error (tracked by store)')
        set({ connectionStatus: 'error' })
      }
      
      ws.onclose = (event) => {
        console.log('Participant WebSocket closed (tracked by store):', event.code, event.reason)
        set({ 
          participantWebSocket: null,
          connectionStatus: 'disconnected' 
        })
      }
    },

    clearConnection: (isHost?: boolean) => {
      const { hostWebSocket, participantWebSocket } = get()
      
      if (isHost === true && hostWebSocket) {
        hostWebSocket.close(1000, 'Intentional closure')
        set({ hostWebSocket: null })
      } else if (isHost === false && participantWebSocket) {
        participantWebSocket.close(1000, 'Intentional closure')
        set({ participantWebSocket: null })
      } else if (isHost === undefined) {
        // Close both connections
        if (hostWebSocket) {
          hostWebSocket.close(1000, 'Intentional closure')
        }
        if (participantWebSocket) {
          participantWebSocket.close(1000, 'Intentional closure')
        }
        set({ hostWebSocket: null, participantWebSocket: null })
      }
      
      // Update status if no connections remain
      const { hostWebSocket: newHostWs, participantWebSocket: newParticipantWs } = get()
      if (!newHostWs && !newParticipantWs) {
        set({ connectionStatus: 'disconnected' })
      }
    },

    sendMessage: (message: WebSocketMessage, isHost?: boolean) => {
      const { hostWebSocket, participantWebSocket } = get()
      
      const targetWs = isHost ? hostWebSocket : participantWebSocket
      const activeWs = targetWs || hostWebSocket || participantWebSocket
      
      if (activeWs && activeWs.readyState === WebSocket.OPEN) {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString()
        }
        
        console.log('Sending message via stored WebSocket:', messageWithTimestamp)
        activeWs.send(JSON.stringify(messageWithTimestamp))
        return true
      } else {
        console.error('No active WebSocket connection to send message:', message)
        return false
      }
    },

    // Connection state management
    setConnectionStatus: (status: ConnectionStatus) => {
      set({ connectionStatus: status })
    },

    incrementReconnectAttempts: () => {
      set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }))
    },

    resetReconnectAttempts: () => {
      set({ reconnectAttempts: 0 })
    },

    // Event handlers
    onMessage: (callback: (message: WebSocketMessage) => void) => {
      set((state) => ({
        messageCallbacks: [...state.messageCallbacks, callback]
      }))
    },

    removeMessageCallback: (callback: (message: WebSocketMessage) => void) => {
      set((state) => ({
        messageCallbacks: state.messageCallbacks.filter(cb => cb !== callback)
      }))
    },

    onWebSocketMessage: (message: WebSocketMessage) => {
      const { messageCallbacks } = get()
      messageCallbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in message callback:', error)
        }
      })
    },

    // Utility methods
    isHostConnected: () => {
      const { hostWebSocket } = get()
      return hostWebSocket?.readyState === WebSocket.OPEN
    },

    isParticipantConnected: () => {
      const { participantWebSocket } = get()
      return participantWebSocket?.readyState === WebSocket.OPEN
    },

    getActiveConnection: () => {
      const { hostWebSocket, participantWebSocket } = get()
      
      if (hostWebSocket?.readyState === WebSocket.OPEN) {
        return hostWebSocket
      }
      if (participantWebSocket?.readyState === WebSocket.OPEN) {
        return participantWebSocket
      }
      return null
    },

    hasActiveConnection: () => {
      return get().getActiveConnection() !== null
    }
  }))
) 