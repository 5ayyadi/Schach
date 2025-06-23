import { Chessboard } from 'react-chessboard'

function ChessBoard({ 
  gameState, 
  moveHighlights, 
  onDrop, 
  onSquareClick 
}) {
  console.log('ChessBoard render:', { 
    fen: gameState.fen, 
    myColor: gameState.myColor, 
    isMyTurn: gameState.isMyTurn, 
    gameStatus: gameState.status 
  })

  if (gameState.status === 'waiting') {
    console.log('ChessBoard: Game is waiting, not rendering board')
    return null
  }

  return (
    <div className="chessboard-container">
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Chessboard
          position={gameState.fen}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          customSquareStyles={moveHighlights}
          arePiecesDraggable={gameState.isMyTurn && gameState.status === 'active'}
          boardOrientation={gameState.myColor === 'black' ? 'black' : 'white'}
          boardWidth={Math.min(600, window.innerWidth - 40)}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
          customDarkSquareStyle={{ backgroundColor: '#b58863' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>
        {gameState.isMyTurn ? 
          `Your turn (${gameState.myColor}) - Click a piece to see legal moves` : 
          `Waiting for ${gameState.currentPlayer === 'white' ? gameState.player_white : gameState.player_black}`
        }
      </div>
    </div>
  )
}

export default ChessBoard
