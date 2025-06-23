import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'

const TIME_CONTROLS = [
  { id: 'bullet', name: 'Bullet', description: '1 + 0', minutes: 1 },
  { id: 'blitz', name: 'Blitz', description: '3 + 2', minutes: 3 },
  { id: 'rapid', name: 'Rapid', description: '10 + 0', minutes: 10 },
  { id: 'daily', name: 'Daily', description: '24 hours', minutes: 1440 }
]

const COLORS = [
  { id: 'white', name: 'White', symbol: '♔' },
  { id: 'black', name: 'Black', symbol: '♚' },
  { id: 'random', name: 'Random', symbol: '🎲' }
]

function GameSetupPage({ user }) {
  const [selectedTimeControl, setSelectedTimeControl] = useState('blitz')
  const [customTime, setCustomTime] = useState(5)
  const [selectedColor, setSelectedColor] = useState('random')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to auth if no user
  if (!user) {
    navigate(`/auth?return=${encodeURIComponent(location.pathname)}`)
    return null
  }

  const handleCreateGame = async () => {
    setLoading(true)
    setError('')
    
    try {
      const timeControlValue = selectedTimeControl === 'custom' 
        ? `${customTime}+0`
        : TIME_CONTROLS.find(tc => tc.id === selectedTimeControl)?.description || '5+0'
      
      const game = await apiService.createGame(timeControlValue)
      
      // Navigate to the created game
      navigate(`/game/${game.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const getTimeControlMinutes = () => {
    if (selectedTimeControl === 'custom') {
      return customTime
    }
    return TIME_CONTROLS.find(tc => tc.id === selectedTimeControl)?.minutes || 5
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="title">Setup New Game</h1>
        <p className="subtitle">Welcome back, {user.username}!</p>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Time Control</h3>
          <div className="game-options">
            {TIME_CONTROLS.map(timeControl => (
              <div
                key={timeControl.id}
                className={`option-card ${selectedTimeControl === timeControl.id ? 'selected' : ''}`}
                onClick={() => setSelectedTimeControl(timeControl.id)}
              >
                <h4>{timeControl.name}</h4>
                <p>{timeControl.description}</p>
              </div>
            ))}
            <div
              className={`option-card ${selectedTimeControl === 'custom' ? 'selected' : ''}`}
              onClick={() => setSelectedTimeControl('custom')}
            >
              <h4>Custom</h4>
              <p>Set your own time</p>
            </div>
          </div>
          
          {selectedTimeControl === 'custom' && (
            <div className="form-group" style={{ maxWidth: '200px', margin: '1rem auto' }}>
              <label className="form-label">Minutes per player</label>
              <input
                type="number"
                min="1"
                max="180"
                value={customTime}
                onChange={(e) => setCustomTime(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
          )}
        </div>
        
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Choose Color</h3>
          <div className="game-options">
            {COLORS.map(color => (
              <div
                key={color.id}
                className={`option-card ${selectedColor === color.id ? 'selected' : ''}`}
                onClick={() => setSelectedColor(color.id)}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {color.symbol}
                </div>
                <h4>{color.name}</h4>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            className="btn"
            onClick={handleCreateGame}
            disabled={loading}
          >
            {loading ? 'Creating Game...' : 'Create Game'}
          </button>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>Game Summary</h4>
          <p><strong>Time Control:</strong> {getTimeControlMinutes()} minutes per player</p>
          <p><strong>Your Color:</strong> {COLORS.find(c => c.id === selectedColor)?.name}</p>
        </div>
      </div>
    </div>
  )
}

export default GameSetupPage
