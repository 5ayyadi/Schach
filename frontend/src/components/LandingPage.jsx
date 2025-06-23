import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="page">
      <div className="container">
        <h1 className="title">♟️ Chess Master</h1>
        <p className="subtitle">
          Challenge players from around the world in this classic game of strategy
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to="/auth" className="btn">
            Play Chess
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
