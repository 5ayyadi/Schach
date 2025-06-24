import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'

const TIME_CONTROLS = [
  { id: '1+0', name: '1 | 0', label: 'Bullet', minutes: 1, increment: 0 },
  { id: '2+1', name: '2 | 1', label: 'Bullet', minutes: 2, increment: 1 },
  { id: '3+0', name: '3 | 0', label: 'Blitz', minutes: 3, increment: 0 },
  { id: '3+2', name: '3 | 2', label: 'Blitz', minutes: 3, increment: 2 },
  { id: '5+0', name: '5 | 0', label: 'Blitz', minutes: 5, increment: 0 },
  { id: '5+3', name: '5 | 3', label: 'Blitz', minutes: 5, increment: 3 },
  { id: '10+0', name: '10 | 0', label: 'Rapid', minutes: 10, increment: 0 },
  { id: '10+5', name: '10 | 5', label: 'Rapid', minutes: 10, increment: 5 },
  { id: '15+10', name: '15 | 10', label: 'Rapid', minutes: 15, increment: 10 },
  { id: '30+0', name: '30 | 0', label: 'Classical', minutes: 30, increment: 0 },
  { id: '30+20', name: '30 | 20', label: 'Classical', minutes: 30, increment: 20 },
  { id: 'custom', name: 'Custom', label: 'Custom', minutes: 0, increment: 0 }
]

const COLORS = [
  { id: 'white', name: 'White', symbol: '♔', bg: '#f0d9b5' },
  { id: 'black', name: 'Black', symbol: '♛', bg: '#b58863' },
  { id: 'random', name: 'Random', symbol: '🎲', bg: 'linear-gradient(45deg, #f0d9b5 50%, #b58863 50%)' }
]

function GameSetupPage({ user }) {
  const [selectedTimeControl, setSelectedTimeControl] = useState('3+2')
  const [customTime, setCustomTime] = useState({ minutes: 5, increment: 0 })
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
      let timeControlValue
      if (selectedTimeControl === 'custom') {
        timeControlValue = `${customTime.minutes}+${customTime.increment}`
      } else {
        timeControlValue = selectedTimeControl
      }
      
      const game = await apiService.createGame(timeControlValue)
      
      // Navigate to the created game
      navigate(`/game/${game.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1 className="setup-title">Play Chess</h1>
          <p className="setup-subtitle">Choose your time control</p>
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {/* Time Control Selection - Chess.com style grid */}
        <div className="time-controls-section">
          <div className="time-controls-grid">
            {TIME_CONTROLS.slice(0, -1).map(timeControl => (
              <div
                key={timeControl.id}
                className={`time-control-tile ${selectedTimeControl === timeControl.id ? 'selected' : ''}`}
                onClick={() => setSelectedTimeControl(timeControl.id)}
              >
                <div className="time-control-time">{timeControl.name}</div>
                <div className="time-control-type">{timeControl.label}</div>
              </div>
            ))}
            <div
              className={`time-control-tile custom-tile ${selectedTimeControl === 'custom' ? 'selected' : ''}`}
              onClick={() => setSelectedTimeControl('custom')}
            >
              <div className="time-control-time">Custom</div>
              <div className="time-control-type">Your choice</div>
            </div>
          </div>
          
          {selectedTimeControl === 'custom' && (
            <div className="custom-time-panel">
              <h4>Custom Time Control</h4>
              <div className="custom-inputs">
                <div className="custom-input-group">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customTime.minutes}
                    onChange={(e) => setCustomTime({ ...customTime, minutes: parseInt(e.target.value) || 1 })}
                    className="custom-input"
                  />
                </div>
                <div className="custom-input-group">
                  <label>Increment (sec)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={customTime.increment}
                    onChange={(e) => setCustomTime({ ...customTime, increment: parseInt(e.target.value) || 0 })}
                    className="custom-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Color Selection */}
        <div className="color-selection-section">
          <h3 className="section-title">Choose your side</h3>
          <div className="color-options-grid">
            {COLORS.map(color => (
              <div
                key={color.id}
                className={`color-option-tile ${selectedColor === color.id ? 'selected' : ''}`}
                onClick={() => setSelectedColor(color.id)}
                style={{ background: color.bg }}
              >
                <div className="color-symbol">{color.symbol}</div>
                <div className="color-name">{color.name}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Create Game Button */}
        <div className="create-game-section">
          <button 
            className="create-game-btn"
            onClick={handleCreateGame}
            disabled={loading}
          >
            {loading ? 'Creating Game...' : 'Create Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameSetupPage
