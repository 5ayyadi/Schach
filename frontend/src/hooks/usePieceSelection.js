import { useState, useCallback } from 'react'

function usePieceSelection(game, gameState, makeMove) {
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [moveHighlights, setMoveHighlights] = useState({})

  const clearMoveHighlights = useCallback(() => {
    setSelectedSquare(null)
    setLegalMoves([])
    setMoveHighlights({})
  }, [])

  const onSquareClick = useCallback((square) => {
    if (!gameState.isMyTurn || gameState.status !== 'active') {
      return
    }

    // If no piece is selected, try to select the clicked square
    if (!selectedSquare) {
      const piece = game.get(square)
      
      // Only select if there's a piece and it belongs to the current player
      if (piece && ((gameState.myColor === 'white' && piece.color === 'w') || 
                    (gameState.myColor === 'black' && piece.color === 'b'))) {
        
        const moves = game.moves({ square, verbose: true })
        
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
          makeMove(selectedSquare, square).then(success => {
            if (success) {
              clearMoveHighlights()
            }
          })
        } else {
          // Try to select a new piece
          const piece = game.get(square)
          
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
            } else {
              clearMoveHighlights()
            }
          } else {
            clearMoveHighlights()
          }
        }
      }
    }
  }, [gameState.isMyTurn, gameState.status, gameState.myColor, selectedSquare, game, legalMoves, clearMoveHighlights, makeMove])

  const onDrop = useCallback(async (sourceSquare, targetSquare) => {
    // Check if it's the user's turn
    if (!gameState.isMyTurn) {
      return false
    }

    // Check if game is active
    if (gameState.status !== 'active') {
      return false
    }

    // Check if the piece being moved belongs to the current player
    const piece = game.get(sourceSquare)
    if (!piece) {
      return false
    }

    const isMyPiece = (gameState.myColor === 'white' && piece.color === 'w') || 
                      (gameState.myColor === 'black' && piece.color === 'b')
    
    if (!isMyPiece) {
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
