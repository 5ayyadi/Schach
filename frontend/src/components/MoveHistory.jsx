function MoveHistory({ moveHistory }) {
  console.log('MoveHistory render:', { historyLength: moveHistory.length })

  if (moveHistory.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Move History</h3>
      <div style={{ 
        maxHeight: '200px', 
        overflow: 'auto',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {moveHistory.map((move, index) => (
          <span key={index} style={{ marginRight: '1rem', color: '#6c757d' }}>
            {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move.san}
          </span>
        ))}
      </div>
    </div>
  )
}

export default MoveHistory
