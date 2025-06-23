function GameInfo({ gameId, gameState, getStatusMessage }) {
  console.log('GameInfo render:', { gameId, gameStatus: gameState.status, myColor: gameState.myColor })

  return (
    <div className="game-info">
      <div className="game-info-item">
        <span className="game-info-label">Game ID</span>
        <span className="game-info-value">{gameId}</span>
      </div>
      <div className="game-info-item">
        <span className="game-info-label">Time Control</span>
        <span className="game-info-value">{gameState.time_control || 'N/A'}</span>
      </div>
      <div className="game-info-item">
        <span className="game-info-label">Status</span>
        <span className="game-info-value">{getStatusMessage()}</span>
      </div>
      {gameState.myColor && (
        <div className="game-info-item">
          <span className="game-info-label">You are</span>
          <span className="game-info-value">{gameState.myColor}</span>
        </div>
      )}
    </div>
  )
}

export default GameInfo
