import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

function useGameLogic(gameState, setGameState, setGame, gameId, timeLeft, setTimeLeft, user, showTempMessage) {
  const navigate = useNavigate()
  
  // Parse time control string to get initial time in seconds
  const parseTimeControl = useCallback((timeControlString) => {
    if (!timeControlString) {
      return { baseTime: 300, increment: 0 }
    }
    
    if (timeControlString.toLowerCase() === 'daily') {
      return { baseTime: null, increment: 0 }
    }
    
    try {
      const parts = timeControlString.split('+')
      const baseTime = parseInt(parts[0]) * 60
      const increment = parts.length > 1 ? parseInt(parts[1]) : 0
      
      return { baseTime, increment }
    } catch (error) {
      console.warn('Could not parse time control:', timeControlString, 'using default 5+0', error)
      return { baseTime: 300, increment: 0 }
    }
  }, [])

  const makeMove = useCallback(async (sourceSquare, targetSquare) => {
    // Early validation
    if (!gameState.isMyTurn) {
      return false
    }

    if (gameState.status !== 'active') {
      return false
    }

    try {
      // Import Chess here to avoid circular dependencies
      const { Chess } = await import('chess.js')
      
      // Try the move locally first
      const tempGame = new Chess(gameState.fen)
      
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move === null) {
        return false
      }

      // Send move to backend first
      const moveUCI = sourceSquare + targetSquare + (move.promotion ? move.promotion : '')
      
      await apiService.makeMove(gameId, moveUCI)

      // Add time increment for the player who just moved (after successful move)
      const { increment } = parseTimeControl(gameState.time_control)
      if (increment > 0 && timeLeft[gameState.currentPlayer] !== null) {
        setTimeLeft(prev => ({
          ...prev,
          [gameState.currentPlayer]: prev[gameState.currentPlayer] + increment
        }))
      }
      
      return true
      
    } catch (error) {
      console.error('Failed to make move:', error)
      
      // Handle authentication errors
      if (error.message && (error.message.includes('401') || error.message.includes('unauthorized'))) {
        navigate(`/auth?return=${encodeURIComponent(window.location.pathname)}`)
        return false
      }
      
      // For invalid move errors, show a temporary message
      if (error.message && error.message.toLowerCase().includes('invalid move')) {
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
  }, [gameState.isMyTurn, gameState.status, gameState.fen, gameState.time_control, gameState.currentPlayer, gameId, parseTimeControl, timeLeft, setTimeLeft, setGameState, showTempMessage, navigate])

  const joinGame = useCallback(async () => {
    // Check if user is authenticated
    if (!user) {
      navigate(`/auth?return=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    
    try {
      await apiService.joinGame(gameId)
    } catch (error) {
      console.error('Failed to join game:', error)
      
      // Handle authentication errors
      if (error.message && (error.message.includes('401') || error.message.includes('unauthorized'))) {
        navigate(`/auth?return=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      
      // Handle case where user is already in the game
      if (error.message && error.message.includes('already in this game')) {
        if (showTempMessage) {
          showTempMessage('You are already in this game', 'info', 2000)
        }
        // Don't set error state, just ignore this since they're already in the game
        return
      }
      
      setGameState(prev => ({
        ...prev,
        error: error.message || 'Failed to join game'
      }))
    }
  }, [gameId, setGameState, user, navigate, showTempMessage])

  const getStatusMessage = useCallback(() => {
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
    // User can join if:
    // 1. Game is waiting for players
    // 2. No black player yet
    // 3. User is not the white player
    // 4. User is not already the black player
    const canJoin = gameState.status === 'waiting' && 
           !gameState.player_black && 
           gameState.player_white !== user?.username &&
           gameState.player_black !== user?.username
    
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
