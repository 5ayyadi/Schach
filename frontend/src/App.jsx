import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import GameSetupPage from './components/GameSetupPage'
import GamePage from './components/GamePage'
import { apiService } from './services/api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  // Try to restore user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('chess_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        if (userData.token) {
          // Make sure API service has the token
          apiService.setToken(userData.token)
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to restore user session:', error)
        localStorage.removeItem('chess_user')
        localStorage.removeItem('auth_token')
      }
    }
  }, [])

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
          <Route path="/setup" element={<GameSetupPage user={user} />} />
          <Route path="/game/:gameId" element={<GamePage user={user} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
