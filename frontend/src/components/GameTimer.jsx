import { useEffect, useRef, useCallback } from 'react'

function GameTimer({ 
  timeLeft, 
  setTimeLeft, 
  gameState, 
  isClockRunning, 
  setIsClockRunning, 
  setGameState 
}) {
  const clockIntervalRef = useRef(null)  // GameTimer render (timer logs removed for cleaner debugging)

  const formatTime = useCallback((seconds) => {
    if (seconds === null) return 'Daily'
    if (seconds === undefined) return '--:--'
    
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Clock management - memoize current player to avoid excessive updates
  const currentPlayerRef = useRef(gameState.currentPlayer)
  currentPlayerRef.current = gameState.currentPlayer

  useEffect(() => {
    // Timer effect (logs minimized per tt.rules.md)
    if (isClockRunning && gameState.status === 'active' && timeLeft.white !== null && timeLeft.black !== null) {
      clockIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = { ...prev }
          const currentPlayerColor = currentPlayerRef.current
          
          // Clock tick (timer logs removed for cleaner debugging)
          
          if (newTime[currentPlayerColor] > 0) {
            newTime[currentPlayerColor] -= 1
          }
          
          // Check for time out
          if (newTime[currentPlayerColor] === 0) {
            console.log('TIME OUT!', { player: currentPlayerColor })
            const winner = currentPlayerColor === 'white' ? 'black' : 'white'
            setGameState(prevState => ({
              ...prevState,
              status: 'finished',
              result: winner === 'white' ? '1-0' : '0-1'
            }))
            setIsClockRunning(false)
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current)
        clockIntervalRef.current = null
      }
    }

    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current)
        clockIntervalRef.current = null
      }
    }
  }, [isClockRunning, gameState.status, setTimeLeft, setGameState, setIsClockRunning, timeLeft.black, timeLeft.white])

  // Start clock when game becomes active (only for timed games)
  useEffect(() => {
    const isTimedGame = timeLeft.white !== null && timeLeft.black !== null
    
    if (gameState.status === 'active' && !isClockRunning && isTimedGame) {
      setIsClockRunning(true)
    } else if (gameState.status !== 'active' && isClockRunning) {
      setIsClockRunning(false)
    }
  }, [gameState.status, isClockRunning, timeLeft.white, timeLeft.black, setIsClockRunning])

  const PlayerTimer = ({ color, playerName, time, isCurrentPlayer }) => {
    const isActive = gameState.status === 'active' && time !== null
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginBottom: color === 'black' ? '1rem' : '0',
        marginTop: color === 'white' ? '1rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <strong>
            {color === 'white' ? '⚪' : '⚫'} {playerName || `Waiting for ${color} player...`}
          </strong>
          {gameState.status === 'active' && (
            <div style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: isCurrentPlayer ? (color === 'white' ? '#3498db' : '#2c3e50') : '#ecf0f1',
              color: isCurrentPlayer ? 'white' : 'black',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {isCurrentPlayer ? `${color === 'white' ? 'White' : 'Black'} to move` : ''}
            </div>
          )}
        </div>
        {isActive && (
          <div style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: isCurrentPlayer ? '#e74c3c' : '#34495e',
            color: 'white',
            borderRadius: '8px',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            minWidth: '80px',
            textAlign: 'center',
            border: isCurrentPlayer ? '2px solid #c0392b' : '2px solid #2c3e50'
          }}>
            {formatTime(time)}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <PlayerTimer 
        color="black"
        playerName={gameState.player_black}
        time={timeLeft.black}
        isCurrentPlayer={gameState.currentPlayer === 'black'}
      />
      
      <PlayerTimer 
        color="white"
        playerName={gameState.player_white}
        time={timeLeft.white}
        isCurrentPlayer={gameState.currentPlayer === 'white'}
      />
    </>
  )
}

export default GameTimer
