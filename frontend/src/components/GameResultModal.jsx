import { useNavigate } from 'react-router-dom'

function GameResultModal({ 
  isOpen, 
  onClose, 
  result, 
  reason, 
  myColor, 
  playerWhite, 
  playerBlack
}) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const getResultInfo = () => {
    if (!result || result === 'ongoing') {
      return {
        title: 'Game in Progress',
        message: 'The game is still being played.',
        resultClass: 'ongoing',
        icon: '🎮'
      }
    }

    // Determine winner from result string: '1-0' = white wins, '0-1' = black wins, '1/2-1/2' = draw
    let actualWinner = null;
    if (result === '1-0') {
      actualWinner = 'white';
    } else if (result === '0-1') {
      actualWinner = 'black';
    }

    const isDraw = result === '1/2-1/2' || result === 'draw' || result === 'stalemate';
    const isWin = actualWinner === myColor;
    
    if (isDraw) {
      return {
        title: 'Draw',
        message: `Game ended in a draw${reason ? ` by ${reason}` : ''}`,
        resultClass: 'draw',
        icon: '🤝'
      }
    }

    if (isWin) {
      return {
        title: 'You Won!',
        message: `Congratulations! You defeated ${actualWinner === 'white' ? playerBlack : playerWhite}${reason ? ` by ${reason}` : ''}`,
        resultClass: 'win',
        icon: '🎉'
      }
    } else {
      return {
        title: 'You Lost',
        message: `${actualWinner === 'white' ? playerWhite : playerBlack} won${reason ? ` by ${reason}` : ''}`,
        resultClass: 'lose',
        icon: '😔'
      }
    }
  }

  const resultInfo = getResultInfo()

  const handleNewGame = () => {
    navigate('/setup')
    onClose()
  }

  const handleHome = () => {
    navigate('/')
    onClose()
  }

  const handleViewGame = () => {
    // For now, just close the modal to view the final position
    onClose()
  }

  return (
    <div className="chess-modal-overlay" onClick={onClose}>
      <div className="chess-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chess-modal-header">
          <div className={`chess-modal-result ${resultInfo.resultClass}`}>
            <div className="chess-modal-icon">{resultInfo.icon}</div>
            <h2 className="chess-modal-title">{resultInfo.title}</h2>
          </div>
          <button className="chess-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="chess-modal-content">
          <p className="chess-modal-message">{resultInfo.message}</p>
          
          <div className="chess-modal-game-info">
            <div className="chess-modal-players">
              <div className="chess-modal-player">
                <span className="chess-modal-piece">♔</span>
                <span className="chess-modal-player-name">{playerWhite}</span>
                {(result === '1-0') && <span className="chess-modal-winner-badge">Winner</span>}
              </div>
              <div className="chess-modal-vs">vs</div>
              <div className="chess-modal-player">
                <span className="chess-modal-piece">♛</span>
                <span className="chess-modal-player-name">{playerBlack}</span>
                {(result === '0-1') && <span className="chess-modal-winner-badge">Winner</span>}
              </div>
            </div>
            
            <div className="chess-modal-result-summary">
              <strong>
                {result === 'draw' ? 'Draw' : 
                 result === '1-0' ? `${playerWhite} wins` :
                 result === '0-1' ? `${playerBlack} wins` :
                 'Game finished'}
              </strong>
            </div>
          </div>
        </div>
        
        <div className="chess-modal-actions">
          <button 
            className="chess-modal-btn chess-modal-btn-secondary"
            onClick={handleViewGame}
          >
            View Game
          </button>
          <button 
            className="chess-modal-btn chess-modal-btn-primary"
            onClick={handleNewGame}
          >
            New Game
          </button>
          <button 
            className="chess-modal-btn chess-modal-btn-secondary"
            onClick={handleHome}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameResultModal
