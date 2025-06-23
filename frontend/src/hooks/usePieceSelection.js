import { useState, useCallback } from 'react'

function usePieceSelection(game, gameState, makeMove) {
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [moveHighlights, setMoveHighlights] = useState({})

  console.log('usePieceSelection state:', { selectedSquare, legalMovesCount: legalMoves.length })

  const clearMoveHighlights = useCallback(() => {
    console.log('Clearing move highlights')
    setSelectedSquare(null)
    setLegalMoves([])
    setMoveHighlights({})
  }, [])

  const onSquareClick = useCallback((square) => {    console.log('Square clicked:', square, {
      isMyTurn: gameState.isMyTurn,
      gameStatus: gameState.status,
      myColor: gameState.myColor,
      selectedSquare,
      currentPlayer: gameState.currentPlayer
    })
    
    if (!gameState.isMyTurn || gameState.status !== 'active') {
      console.log('Not allowing square click - not my turn or game not active', {
        isMyTurn: gameState.isMyTurn,
        gameStatus: gameState.status,
        myColor: gameState.myColor,
        currentPlayer: gameState.currentPlayer
      })
      return
    }

    // If no piece is selected, try to select the clicked square
    if (!selectedSquare) {
      const piece = game.get(square)
      console.log('No piece selected, checking square:', square, 'piece:', piece)
      
      // Only select if there's a piece and it belongs to the current player
      if (piece && ((gameState.myColor === 'white' && piece.color === 'w') || 
                    (gameState.myColor === 'black' && piece.color === 'b'))) {
        
        const moves = game.moves({ square, verbose: true })
        console.log('Found moves for piece:', moves.length)
        
        if (moves.length > 0) {
          setSelectedSquare(square)
          setLegalMoves(moves)
          
          // Create highlights for legal moves
          const highlights = { [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }
          moves.forEach(move => {
            highlights[move.to] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' }
          })
          setMoveHighlights(highlights)
          console.log('Piece selected and highlighted:', square)
        }
      } else {
        console.log('Cannot select piece:', { piece, myColor: gameState.myColor })
      }
    } else {
      // A piece is already selected
      if (square === selectedSquare) {
        // Clicked the same square - deselect
        console.log('Deselecting piece:', square)
        clearMoveHighlights()
      } else {
        // Check if the clicked square is a legal move
        const legalMove = legalMoves.find(move => move.to === square)
        
        if (legalMove) {
          console.log('Making move from selection:', selectedSquare, '->', square)
          makeMove(selectedSquare, square).then(success => {
            if (success) {
              clearMoveHighlights()
            }
          })
        } else {
          // Try to select a new piece
          const piece = game.get(square)
          console.log('Trying to select new piece:', square, piece)
          
          if (piece && ((gameState.myColor === 'white' && piece.color === 'w') || 
                        (gameState.myColor === 'black' && piece.color === 'b'))) {
            
            const moves = game.moves({ square, verbose: true })
            
            if (moves.length > 0) {
              setSelectedSquare(square)
              setLegalMoves(moves)
              
              const highlights = { [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }
              moves.forEach(move => {
                highlights[move.to] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' }
              })
              setMoveHighlights(highlights)
              console.log('New piece selected:', square)
            } else {
              console.log('No moves available for piece, clearing highlights')
              clearMoveHighlights()
            }
          } else {
            console.log('Invalid piece selection, clearing highlights')
            clearMoveHighlights()
          }
        }
      }
    }
  }, [gameState.isMyTurn, gameState.status, gameState.myColor, gameState.currentPlayer, selectedSquare, game, legalMoves, clearMoveHighlights, makeMove])

  const onDrop = useCallback(async (sourceSquare, targetSquare) => {
    console.log('Piece dropped:', sourceSquare, '->', targetSquare, {
      isMyTurn: gameState.isMyTurn,
      gameStatus: gameState.status
    })
    
    // Check if it's the user's turn
    if (!gameState.isMyTurn) {
      console.log('Drop rejected: Not your turn')
      return false
    }

    // Check if game is active
    if (gameState.status !== 'active') {
      console.log('Drop rejected: Game is not active')
      return false
    }

    // Check if the piece being moved belongs to the current player
    const piece = game.get(sourceSquare)
    if (!piece) {
      console.log('Drop rejected: No piece at source square')
      return false
    }

    const isMyPiece = (gameState.myColor === 'white' && piece.color === 'w') || 
                      (gameState.myColor === 'black' && piece.color === 'b')
    
    if (!isMyPiece) {
      console.log('Drop rejected: Not your piece', {
        myColor: gameState.myColor,
        pieceColor: piece.color,
        piece: piece
      })
      return false
    }

    const success = await makeMove(sourceSquare, targetSquare)
    if (success) {
      clearMoveHighlights()
    }
    return success
  }, [gameState.isMyTurn, gameState.status, gameState.myColor, game, makeMove, clearMoveHighlights])

  return {
    selectedSquare,
    legalMoves,
    moveHighlights,
    onSquareClick,
    onDrop,
    clearMoveHighlights
  }
}

export default usePieceSelection
