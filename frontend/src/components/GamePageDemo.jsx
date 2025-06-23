import React from 'react';

// Demo component to test the time control parsing logic
const GamePageDemo = () => {
  // Copy the parseTimeControl function from GamePage
  const parseTimeControl = (timeControlString) => {
    if (!timeControlString) return { baseTime: 300, increment: 0 }
    
    if (timeControlString.toLowerCase() === 'daily') {
      return { baseTime: null, increment: 0 }
    }
    
    try {
      const parts = timeControlString.split('+')
      const baseTime = parseInt(parts[0]) * 60 
      const increment = parts.length > 1 ? parseInt(parts[1]) : 0
      
      return { baseTime, increment }
    } catch {
      console.warn('Could not parse time control:', timeControlString, 'using default 5+0')
      return { baseTime: 300, increment: 0 }
    }
  }

  const formatTime = (seconds) => {
    if (seconds === null) return 'Daily'
    if (seconds === undefined) return '--:--'
    
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const testCases = [
    '5+3',    // 5 minutes + 3 seconds increment
    '10+0',   // 10 minutes blitz
    '1+0',    // 1 minute bullet
    '30+20',  // 30 minutes rapid + 20 seconds increment
    'daily',  // Daily game
    '15+10',  // 15 minutes + 10 seconds increment
    '', // Default
  ]

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Chess Game Time Control Parsing Demo</h2>
      <p>This demonstrates how different time control formats are parsed:</p>
      
      <table style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>Time Control</th>
            <th style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>Base Time (seconds)</th>
            <th style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>Increment (seconds)</th>
            <th style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>Display Format</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((timeControl, index) => {
            const parsed = parseTimeControl(timeControl)
            return (
              <tr key={index}>
                <td style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>
                  {timeControl || 'default'}
                </td>
                <td style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>
                  {parsed.baseTime === null ? 'null' : parsed.baseTime}
                </td>
                <td style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>
                  {parsed.increment}
                </td>
                <td style={{ border: '1px solid #dee2e6', padding: '0.5rem' }}>
                  {formatTime(parsed.baseTime)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Features Implemented:</h3>
        <ul>
          <li>✅ <strong>Interactive Piece Movement:</strong> Click pieces to show legal moves with highlights</li>
          <li>✅ <strong>Drag & Drop:</strong> Both click-to-move and drag-and-drop work</li>
          <li>✅ <strong>Time Control Parsing:</strong> Supports various formats (5+3, 10+0, daily, etc.)</li>
          <li>✅ <strong>Countdown Timers:</strong> Real-time countdown for each player</li>
          <li>✅ <strong>Time Increments:</strong> Adds increment after each move</li>
          <li>✅ <strong>Timeout Detection:</strong> Game ends when time runs out</li>
          <li>✅ <strong>Daily Games:</strong> No timer for correspondence games</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>How to Use:</h3>
        <ol>
          <li><strong>Click Movement:</strong> Click a piece to highlight legal moves, then click destination</li>
          <li><strong>Drag & Drop:</strong> Drag pieces to valid squares</li>
          <li><strong>Time Control:</strong> Timer counts down during your turn</li>
          <li><strong>Increments:</strong> Time is added after each move (if configured)</li>
        </ol>
      </div>
    </div>
  )
}

export default GamePageDemo
