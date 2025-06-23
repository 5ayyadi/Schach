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
    <div className="page">
      <div className="container">
        {isGameRedirect && (
          <div className="info" style={{ marginBottom: '1rem', color: '#2c3e50', background: '#eaf6ff', padding: '0.75rem', borderRadius: '6px' }}>
            Please log in to join the game.
          </div>
        )}
        <h1 className="title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">
          {isLogin 
            ? 'Sign in to continue playing chess' 
            : 'Join our community of chess players'
          }
        </p>
        
        <form className="form" onSubmit={handleSubmit}>
          {error && (
            <div className="error">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn"
            disabled={loading || !formData.username || !formData.password}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
