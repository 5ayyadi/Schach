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
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Network error' }))
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

  // Utility methods
  logout() {
    this.setToken(null)
  }

  isAuthenticated() {
    return !!this.token
  }
}

export const apiService = new ApiService()
