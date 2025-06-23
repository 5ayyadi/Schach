import { useCallback } from 'react'
import { apiService } from '../services/api'

function useGameLogic(gameState, setGameState, setGame, setMoveHistory, gameId, timeLeft, setTimeLeft, user, showTempMessage) {
  
  // Parse time control string to get initial time in seconds
  const parseTimeControl = useCallback((timeControlString) => {
    console.log('Parsing time control:', timeControlString)
    
    if (!timeControlString) {
      console.log('No time control, using default 5+0')
      return { baseTime: 300, increment: 0 }
    }
    
    if (timeControlString.toLowerCase() === 'daily') {
      console.log('Daily game detected')
      return { baseTime: null, increment: 0 }
    }
    
    try {
      const parts = timeControlString.split('+')
      const baseTime = parseInt(parts[0]) * 60
      const increment = parts.length > 1 ? parseInt(parts[1]) : 0
      
      console.log('Parsed time control:', { baseTime, increment })
      return { baseTime, increment }
    } catch (error) {
      console.warn('Could not parse time control:', timeControlString, 'using default 5+0', error)
      return { baseTime: 300, increment: 0 }
    }
  }, [])

  const makeMove = useCallback(async (sourceSquare, targetSquare) => {
    console.log('makeMove called:', { sourceSquare, targetSquare, isMyTurn: gameState.isMyTurn, gameStatus: gameState.status })
    
    // Early validation
    if (!gameState.isMyTurn) {
      console.log('makeMove: Not your turn, aborting')
      return false
    }

    if (gameState.status !== 'active') {
      console.log('makeMove: Game not active, aborting')
      return false
    }

    try {
      // Import Chess here to avoid circular dependencies
      const { Chess } = await import('chess.js')
      
      // Try the move locally first
      const tempGame = new Chess(gameState.fen)
      console.log('Attempting move on FEN:', gameState.fen)
      
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move === null) {
        console.log('Invalid move attempted:', { from: sourceSquare, to: targetSquare })
        return false
      }

      console.log('Move is valid locally:', move)

      // Add time increment for the player who just moved (only for timed games)
      const { increment } = parseTimeControl(gameState.time_control)
      if (increment > 0 && timeLeft[gameState.currentPlayer] !== null) {
        console.log('Adding time increment:', { player: gameState.currentPlayer, increment })
        setTimeLeft(prev => ({
          ...prev,
          [gameState.currentPlayer]: prev[gameState.currentPlayer] + increment
        }))
      }

      // Send move to backend
      const moveUCI = sourceSquare + targetSquare + (move.promotion ? move.promotion : '')
      console.log('Sending move to backend:', moveUCI)
      
      await apiService.makeMove(gameId, moveUCI)
      
      console.log('Move successfully sent to backend')
      return true
      
    } catch (error) {
      console.error('Failed to make move:', error)
      
      // For invalid move errors, show a temporary message
      if (error.message && error.message.toLowerCase().includes('invalid move')) {
        console.log('Invalid move detected, showing temporary message')
        if (showTempMessage) {
          showTempMessage(`Invalid move: ${sourceSquare} to ${targetSquare}`, 'error', 2000)
        }
        return false
      }
      
      // For other errors (network issues, etc.), set error state
      setGameState(prev => ({
        ...prev,
        error: error.message || 'Failed to make move'
      }))
      return false
    }
  }, [gameState.isMyTurn, gameState.status, gameState.fen, gameState.time_control, gameState.currentPlayer, gameId, parseTimeControl, timeLeft, setTimeLeft, setGameState, showTempMessage])

  const joinGame = useCallback(async () => {
    console.log('Attempting to join game:', gameId)
    try {
      await apiService.joinGame(gameId)
      console.log('Successfully joined game')
    } catch (error) {
      console.error('Failed to join game:', error)
      setGameState(prev => ({
        ...prev,
        error: error.message || 'Failed to join game'
      }))
    }
  }, [gameId, setGameState])

  const getStatusMessage = useCallback(() => {
    console.log('Getting status message for state:', { 
      loading: gameState.loading, 
      error: gameState.error, 
      status: gameState.status 
    })
    
    if (gameState.loading) return 'Loading...'
    if (gameState.error) return `Error: ${gameState.error}`
    
    if (gameState.status === 'waiting') {
      if (!gameState.player_black) {
        return 'Waiting for opponent to join...'
      }
      return 'Game is starting...'
    }
    
    if (gameState.status === 'finished') {
      if (gameState.result === 'draw') {
        return 'Game ended in a draw!'
      }
      // Check if game ended due to timeout (only for timed games)
      if (timeLeft.white === 0) {
        return `${gameState.player_black} wins by timeout!`
      }
      if (timeLeft.black === 0) {
        return `${gameState.player_white} wins by timeout!`
      }
      const winner = gameState.result === '1-0' ? gameState.player_white : gameState.player_black
      return `${winner} wins!`
    }
    
    if (gameState.status === 'active') {
      if (gameState.isMyTurn) {
        return "It's your turn!"
      } else {
        const opponent = gameState.currentPlayer === 'white' ? gameState.player_white : gameState.player_black
        return `${opponent}'s turn`
      }
    }
    
    return 'Unknown status'
  }, [gameState, timeLeft])

  const canJoinGame = useCallback(() => {
    const canJoin = gameState.status === 'waiting' && 
           !gameState.player_black && 
           gameState.player_white !== user?.username
    
    console.log('canJoinGame check:', { 
      status: gameState.status, 
      playerBlack: gameState.player_black, 
      playerWhite: gameState.player_white,
      currentUser: user?.username,
      canJoin 
    })
    
    return canJoin
  }, [gameState, user])

  return {
    makeMove,
    joinGame,
    getStatusMessage,
    canJoinGame,
    parseTimeControl
  }
}

export default useGameLogic
