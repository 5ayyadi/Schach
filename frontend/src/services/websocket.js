class WebSocketService {
  constructor() {
    this.connections = new Map()
    this.subscribers = new Map()
  }

  connect(gameId, username = null) {
    // If already connected, return existing connection
    if (this.connections.has(gameId)) {
      const ws = this.connections.get(gameId)
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        return ws
      } else {
        // Clean up dead connection
        this.connections.delete(gameId)
        this.subscribers.delete(gameId)
      }
    }

    // Build WebSocket URL with username for connection tracking
    let wsUrl = `ws://localhost:8000/ws/${gameId}`
    if (username) {
      wsUrl += `?username=${encodeURIComponent(username)}`
    }

    const ws = new WebSocket(wsUrl)
    this.connections.set(gameId, ws)
    
    if (!this.subscribers.has(gameId)) {
      this.subscribers.set(gameId, new Set())
    }

    ws.onopen = () => {
      console.log(`WebSocket connected to game ${gameId}`)
      this.notifySubscribers(gameId, { type: 'connected' })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`WebSocket message for game ${gameId}:`, data)
        this.notifySubscribers(gameId, data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log(`WebSocket disconnected from game ${gameId}`, event.code, event.reason)
      this.connections.delete(gameId)
      if (event.code !== 1000) { // Not a normal closure
        this.notifySubscribers(gameId, { type: 'disconnected', code: event.code })
      }
    }

    ws.onerror = (error) => {
      console.error(`WebSocket error for game ${gameId}:`, error)
      this.notifySubscribers(gameId, { type: 'error', error })
    }

    return ws
  }

  disconnect(gameId) {
    const ws = this.connections.get(gameId)
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client disconnecting')
      }
      this.connections.delete(gameId)
      this.subscribers.delete(gameId)
      console.log(`WebSocket disconnected from game ${gameId}`)
    }
  }

  send(gameId, message) {
    const ws = this.connections.get(gameId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  subscribe(gameId, callback) {
    if (!this.subscribers.has(gameId)) {
      this.subscribers.set(gameId, new Set())
    }
    this.subscribers.get(gameId).add(callback)

    // Return unsubscribe function
    return () => {
      const gameSubscribers = this.subscribers.get(gameId)
      if (gameSubscribers) {
        gameSubscribers.delete(callback)
      }
    }
  }

  notifySubscribers(gameId, data) {
    const gameSubscribers = this.subscribers.get(gameId)
    if (gameSubscribers) {
      gameSubscribers.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket subscriber:', error)
        }
      })
    }
  }

  // Clean up all connections
  disconnectAll() {
    this.connections.forEach((ws, gameId) => {
      this.disconnect(gameId)
    })
  }
}

export const webSocketService = new WebSocketService()
