import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiService } from '../services/api'

function LandingPage({ user }) {
  const navigate = useNavigate()
  const [gameHistory, setGameHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // Load game history when user is available
  useEffect(() => {
    if (user) {
      loadGameHistory()
    }
  }, [user])

  const loadGameHistory = async () => {
    try {
      setLoading(true)
      const history = await apiService.getUserGames()
      setGameHistory(history)
    } catch (error) {
      console.error('Failed to load game history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPlaying = () => {
    if (user) {
      navigate('/setup')
    } else {
      navigate('/auth')
    }
  }

  const handleLogout = () => {
    apiService.logout()
    localStorage.removeItem('chess_user')
    window.location.reload()
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%',
        textAlign: 'center',
        background: '#16213e',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            ♟️ Chess Master
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#a0a0a0', 
            lineHeight: '1.5',
            marginBottom: '2rem'
          }}>
            Challenge players from around the world in this classic game of strategy and skill
          </p>
        </div>

        {/* User Status */}
        {user ? (
          <div style={{
            background: 'rgba(129, 182, 76, 0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#81b64c', margin: 0, fontSize: '1.2rem' }}>
                Welcome back, {user.username}!
              </h3>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#a0a0a0',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
            </div>
            
            {/* Game History Section */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>Recent Games</h4>
              {loading ? (
                <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Loading game history...</p>
              ) : gameHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {gameHistory.slice(0, 3).map((game) => {
                    const isWhite = game.player_white === user.username
                    const opponent = isWhite ? game.player_black : game.player_white
                    const myColor = isWhite ? 'white' : 'black'
                    
                    // Determine result from perspective of current user
                    let resultText = 'Draw'
                    let resultColor = '#f39c12'
                    
                    if (game.result === '1-0') {
                      if (isWhite) {
                        resultText = 'Win'
                        resultColor = '#81b64c'
                      } else {
                        resultText = 'Loss'
                        resultColor = '#e74c3c'
                      }
                    } else if (game.result === '0-1') {
                      if (!isWhite) {
                        resultText = 'Win'
                        resultColor = '#81b64c'
                      } else {
                        resultText = 'Loss'
                        resultColor = '#e74c3c'
                      }
                    }
                    
                    return (
                      <div key={game.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.8rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/game/${game.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ color: '#fff' }}>vs {opponent || 'Waiting...'}</span>
                            <span style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>
                              Playing as {myColor} • {game.time_control}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ color: resultColor, fontWeight: 'bold' }}>
                              {resultText}
                            </span>
                            <span style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>
                              {game.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {gameHistory.length > 3 && (
                    <p style={{ color: '#a0a0a0', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      And {gameHistory.length - 3} more games...
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
                  No games played yet. Start your first game below!
                </p>
              )}
            </div>
          </div>
        ) : null}
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button 
            onClick={handleStartPlaying}
            className="create-game-btn"
            style={{ 
              textDecoration: 'none',
              fontSize: '1.2rem',
              padding: '16px 48px',
              minWidth: '200px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {user ? 'Play Chess' : 'Start Playing'}
          </button>
          
          {!user && (
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#a0a0a0', 
              marginTop: '1rem',
              lineHeight: '1.6'
            }}>
              Join thousands of players worldwide • Free to play • No download required
            </p>
          )}
        </div>
        
        {/* Features Section (only show when not logged in) */}
        {!user && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(129, 182, 76, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#b3b3b3',
            lineHeight: '1.5'
          }}>
            ✨ Why choose Chess Master?
            <ul style={{ 
              textAlign: 'left', 
              marginTop: '1rem', 
              paddingLeft: '1.5rem',
              listStyle: 'none'
            }}>
              <li>♟️ Multiple time controls: Bullet, Blitz, Rapid, Classical</li>
              <li>🎯 Real-time multiplayer gameplay</li>
              <li>📱 Responsive design - play on any device</li>
              <li>🏆 Modern, chess.com-inspired interface</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default LandingPage
