import React from 'react'

function MoveHistory({ moveHistory }) {
  console.log('MoveHistory render:', { historyLength: moveHistory.length })

  if (moveHistory.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#a0a0a0', 
        fontSize: '0.9rem',
        padding: '2rem 1rem'
      }}>
        No moves yet
      </div>
    )
  }

  // Group moves into pairs (white move, black move)
  const movePairs = []
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1
    const whiteMove = moveHistory[i]
    const blackMove = moveHistory[i + 1]
    movePairs.push({ moveNumber, whiteMove, blackMove })
  }

  return (
    <div style={{ 
      maxHeight: '300px', 
      overflow: 'auto',
      fontSize: '0.9rem'
    }}>
      <div className="move-list">
        {movePairs.map(({ moveNumber, whiteMove, blackMove }) => (
          <React.Fragment key={moveNumber}>
            <div className="move-number">{moveNumber}.</div>
            <div className="move-notation">{whiteMove.san}</div>
            <div className="move-notation">{blackMove ? blackMove.san : ''}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default MoveHistory
