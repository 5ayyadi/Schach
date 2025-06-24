const API_BASE_URL = 'http://localhost:8000/api'

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    // Always get the latest token from localStorage
    const currentToken = this.token || localStorage.getItem('auth_token')
    
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
    }
    
    return headers
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = this.getHeaders()
    
    // Debug logging
    console.log('API Request:', { url, headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [TOKEN]' : 'None' } })
    
    const config = {
      headers,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Network error' }))
        console.error('API Error Response:', { status: response.status, error })
        throw new Error(error.detail || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async register(username, password) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async login(username, password) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.access_token) {
      this.setToken(response.access_token)
    }
    
    return response
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me')
  }

  async verifyToken() {
    return this.makeRequest('/auth/verify', { method: 'POST' })
  }

  // Game endpoints
  async createGame(timeControl) {
    return this.makeRequest('/games/', {
      method: 'POST',
      body: JSON.stringify({ time_control: timeControl }),
    })
  }

  async joinGame(gameId) {
    return this.makeRequest(`/games/${gameId}/join`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async getGame(gameId) {
    return this.makeRequest(`/games/${gameId}`)
  }

  async makeMove(gameId, move) {
    return this.makeRequest(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify({ move }),
    })
  }

  async getUserGames() {
    return this.makeRequest('/games/user')
  }

  async leaveGame(gameId) {
    return this.makeRequest(`/games/${gameId}/leave`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async offerDraw(gameId) {
    return this.makeRequest(`/games/${gameId}/offer-draw`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async acceptDraw(gameId) {
    return this.makeRequest(`/games/${gameId}/accept-draw`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async declineDraw(gameId) {
    return this.makeRequest(`/games/${gameId}/decline-draw`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  // Utility methods
  logout() {
    this.setToken(null)
  }

  isAuthenticated() {
    return !!this.token
  }
}

export const apiService = new ApiService()
