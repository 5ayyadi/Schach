import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'

function AuthPage({ setUser }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  // Get the return path from URL params or location state
  const returnPath = searchParams.get('return') || location.state?.from || '/setup'
  const isGameRedirect = returnPath.startsWith('/game/')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      let response
      if (isLogin) {
        response = await apiService.login(formData.username, formData.password)
      } else {
        await apiService.register(formData.username, formData.password)
        response = await apiService.login(formData.username, formData.password)
      }
      
      // Create user object from login response
      const user = {
        username: response.username || formData.username,
        token: response.access_token,
        authenticated: true
      }
      
      // Save user to localStorage for persistence (API service already saved token)
      localStorage.setItem('chess_user', JSON.stringify(user))
      
      setUser(user)
      
      // Navigate to the intended destination
      navigate(returnPath, { replace: true })
    } catch (err) {
      console.error('Authentication failed:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isGameRedirect && (
          <div style={{ 
            marginBottom: '1.5rem', 
            color: '#81b64c', 
            background: 'rgba(129, 182, 76, 0.1)', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid rgba(129, 182, 76, 0.3)',
            fontSize: '0.9rem',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            🎯 Please log in to join the game
          </div>
        )}
        
        <h1 className="auth-title">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Welcome back! Ready to play?' 
            : 'Join thousands of chess players worldwide'
          }
        </p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#e74c3c',
              color: 'white',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              ❌ {error}
            </div>
          )}
          
          <div className="auth-input-group">
            <label className="auth-label">Email or Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="auth-input"
              required
              placeholder="Enter your username"
            />
          </div>
          
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="auth-input"
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading || !formData.username || !formData.password}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <div className="auth-toggle-section">
          <span className="auth-toggle-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button 
            type="button"
            className="auth-toggle-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
        
        {!isLogin && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(129, 182, 76, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#b3b3b3',
            lineHeight: '1.5'
          }}>
            ✨ Join our community and enjoy:
            <ul style={{ 
              textAlign: 'left', 
              marginTop: '0.5rem', 
              paddingLeft: '1.5rem',
              listStyle: 'none'
            }}>
              <li>♟️ Unlimited games</li>
              <li>📊 Track your progress</li>
              <li>🏆 Compete with players worldwide</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage
