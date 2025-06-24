import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';
import GameInfo from './GameInfo';
import ChessBoard from './ChessBoard';
import GameResultModal from './GameResultModal';
import useGameLogic from '../hooks/useGameLogic';
import usePieceSelection from '../hooks/usePieceSelection';

function GamePage({ user }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState(new Chess());
  const [authChecked, setAuthChecked] = useState(false);
  const [gameState, setGameState] = useState({
    id: gameId,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    status: 'waiting',
    player_white: '',
    player_black: '',
    time_control: '',
    result: null,
    currentPlayer: 'white',
    isMyTurn: false,
    myColor: null,
    error: null,
    loading: true
  });
  const unsubscribeRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState({ white: null, black: null });
  const [tempMessage, setTempMessage] = useState(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [drawOffer, setDrawOffer] = useState(null); // {from: 'username', timestamp: Date}

  // Memoize username to prevent unnecessary re-renders
  const username = useMemo(() => user?.username, [user?.username]);

  // Function to show temporary messages
  const showTempMessage = useCallback((message, type = 'info', duration = 3000) => {
    setTempMessage({ message, type });
    setTimeout(() => setTempMessage(null), duration);
  }, []);

  // Clear temp message when game state changes significantly
  useEffect(() => {
    if (gameState.status === 'finished') {
      setTempMessage(null);
    }
  }, [gameState.status]);

  // Custom hooks
  // Real-time turn calculation (fix for isMyTurn issue)
  const actualIsMyTurn = gameState.myColor === gameState.currentPlayer && gameState.status === 'active';
  const effectiveGameState = { ...gameState, isMyTurn: actualIsMyTurn };

  const { makeMove, joinGame, getStatusMessage, canJoinGame, parseTimeControl } = useGameLogic(
    effectiveGameState, setGameState, setGame, gameId, timeLeft, setTimeLeft, user, showTempMessage
  );

  const { moveHighlights, onSquareClick, onDrop, clearMoveHighlights } = usePieceSelection(
    game, effectiveGameState, makeMove
  );

  // Initialize time controls when game state updates
  useEffect(() => {
    if (gameState.time_control && timeLeft.white === null && timeLeft.black === null) {
      const { baseTime } = parseTimeControl(gameState.time_control);
      
      if (baseTime !== null) {
        setTimeLeft({
          white: baseTime,
          black: baseTime
        });
      }
    }
  }, [gameState.time_control, timeLeft, parseTimeControl]);

  // Countdown timer for the current player
  useEffect(() => {
    let interval = null;
    
    // Only run timer if game is active and we have time controls set
    if (gameState.status === 'active' && 
        timeLeft.white !== null && 
        timeLeft.black !== null && 
        gameState.currentPlayer) {
      
      interval = setInterval(() => {
        const currentPlayerColor = gameState.currentPlayer;
        
        setTimeLeft(prev => {
          const newTime = prev[currentPlayerColor] - 1;
          
          // Check for time out
          if (newTime <= 0) {
            // TODO: Handle time out - end game
            return {
              ...prev,
              [currentPlayerColor]: 0
            };
          }
          
          return {
            ...prev,
            [currentPlayerColor]: newTime
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameState.status, gameState.currentPlayer, timeLeft.white, timeLeft.black]);

  // Handle leaving game (resignation)
  const handleLeaveGame = useCallback(async () => {
    if (!user || !gameId) return;
    setShowLeaveConfirmation(true);
  }, [user, gameId]);

  // Confirm leaving game
  const confirmLeaveGame = useCallback(async () => {
    if (!user || !gameId) return;
    
    try {
      await apiService.leaveGame(gameId);
      // Update game state immediately to show the modal
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        result: prev.myColor === 'white' ? '0-1' : '1-0' // Opponent wins when current player resigns
      }));
      showTempMessage('You have resigned from the game', 'info');
      setShowLeaveConfirmation(false);
    } catch (error) {
      console.error('Failed to leave game:', error);
      showTempMessage('Failed to leave game', 'error');
      setShowLeaveConfirmation(false);
    }
  }, [user, gameId, showTempMessage]);

  // Handle offering draw
  const handleOfferDraw = useCallback(async () => {
    if (!user || !gameId) return;
    
    try {
      await apiService.offerDraw(gameId);
      showTempMessage('Draw offer sent to opponent', 'info');
    } catch (error) {
      console.error('Failed to offer draw:', error);
      showTempMessage('Failed to offer draw', 'error');
    }
  }, [user, gameId, showTempMessage]);

  // Accept draw offer
  const acceptDraw = useCallback(async () => {
    try {
      await apiService.acceptDraw(gameId);
      setDrawOffer(null);
      // Update game state immediately to show the modal
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        result: '1/2-1/2'
      }));
      showTempMessage('Draw accepted - Game ended in a draw', 'info');
    } catch (error) {
      console.error('Failed to accept draw:', error);
      showTempMessage('Failed to accept draw', 'error');
    }
  }, [gameId, showTempMessage]);

  // Decline draw offer
  const declineDraw = useCallback(async () => {
    try {
      await apiService.declineDraw(gameId);
      setDrawOffer(null);
      showTempMessage('Draw offer declined', 'info');
    } catch (error) {
      console.error('Failed to decline draw:', error);
      showTempMessage('Failed to decline draw', 'error');
    }
  }, [gameId, showTempMessage]);

  // Handle game ending when timer reaches zero
  useEffect(() => {
    if (gameState.status === 'active' && (timeLeft.white === 0 || timeLeft.black === 0)) {
      const winner = timeLeft.white === 0 ? 'black' : 'white';
      
      // Update game state to finished
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        result: winner === 'white' ? '1-0' : '0-1'
      }));
    }
  }, [timeLeft.white, timeLeft.black, gameState.status]);

  const handleGameStateUpdate = useCallback((data) => {
    const chessGame = new Chess(data.fen);
    setGame(chessGame);
    
    // Try different user properties in case username is not the right one
    const userId = username;
    
    const myColor = data.player_white === userId ? 'white' : 
                   data.player_black === userId ? 'black' : null
    
    const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
    const isMyTurn = myColor === currentPlayer && data.status === 'active'
    
    setGameState(prev => ({
      ...prev,
      fen: data.fen,
      status: data.status,
      player_white: data.player_white,
      player_black: data.player_black,
      time_control: data.time_control,
      result: data.result,
      currentPlayer,
      isMyTurn,
      myColor,
      error: null
    }));
  }, [username]);

  const handleMoveUpdate = useCallback((data) => {
    const chessGame = new Chess(data.fen);
    setGame(chessGame);
    
    setGameState(prev => {
      const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
      
      // Determine myColor if not already set
      let updatedMyColor = prev.myColor;
      if (!updatedMyColor && user?.username) {
        if (user.username === prev.player_white) {
          updatedMyColor = 'white';
        } else if (user.username === prev.player_black) {
          updatedMyColor = 'black';
        }
      }
      
      // Determine the game status - use data.status if provided, otherwise keep existing status or default to 'active'
      const gameStatus = data.status !== undefined ? data.status : (prev.status || 'active');
      
      const isMyTurn = updatedMyColor === currentPlayer && gameStatus === 'active'
      
      return {
        ...prev,
        fen: data.fen,
        currentPlayer,
        isMyTurn,
        myColor: updatedMyColor,
        status: gameStatus,
        result: data.result
      }
    });
  }, [user?.username]);

  // Clear move highlights when it's not the player's turn or game state changes
  useEffect(() => {
    if (!gameState.isMyTurn || gameState.status !== 'active') {
      clearMoveHighlights();
    }
  }, [gameState.isMyTurn, gameState.status, clearMoveHighlights]);

  // Authentication check
  useEffect(() => {
    if (authChecked) return; // Prevent multiple executions
    
    const authCheckTimer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        navigate(`/auth?return=${encodeURIComponent(location.pathname)}`);
      }
    }, 100)

    return () => clearTimeout(authCheckTimer)
  }, [user, navigate, location.pathname, authChecked])

  // Main game loading and WebSocket connection effect
  useEffect(() => {
    // Early return if user auth hasn't been checked yet or no user
    if (!authChecked || !user || !username) {
      return
    }

    // Prevent duplicate connections
    if (wsConnectedRef.current) {
      return;
    }

    const loadGameState = async () => {
      try {
        const gameData = await apiService.getGame(gameId);
        
        const chessGame = new Chess(gameData.fen);
        setGame(chessGame);
        
        // Determine user's color
        const userId = user.username;
        const myColor = gameData.player_white === userId ? 'white' : 
                       gameData.player_black === userId ? 'black' : null
        
        const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
        const isMyTurn = myColor === currentPlayer && gameData.status === 'active'
        
        setGameState({
          id: gameData.id,
          fen: gameData.fen,
          status: gameData.status,
          player_white: gameData.player_white,
          player_black: gameData.player_black,
          time_control: gameData.time_control,
          result: gameData.result,
          currentPlayer,
          isMyTurn,
          myColor,
          error: null,
          loading: false
        });
        
      } catch (error) {
        console.error('Failed to load game:', error);
        setGameState(prev => ({ 
          ...prev, 
          error: error.message || 'Failed to load game',
          loading: false 
        }));
      }
    }

    const connectWebSocket = () => {
      if (wsConnectedRef.current) {
        return
      }
      
      const unsubscribe = webSocketService.subscribe(gameId, (data) => {
        switch (data.type) {
          case 'connected':
            wsConnectedRef.current = true;
            break
            
          case 'game_state':
            handleGameStateUpdate(data);
            break
            
          case 'game_joined':
            setGameState(prev => ({
              ...prev,
              player_white: data.player_white,
              player_black: data.player_black,
              status: 'active'
            }));
            break
            
          case 'move_made':
            handleMoveUpdate(data);
            break
            
          case 'game_over':
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              result: data.result
            }));
            break
            
          case 'game_ended':
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              result: data.result
            }));
            break
            
          case 'draw_offered':
            // Only show the draw offer dialog to the intended recipient
            if (data.to_player === username) {
              setDrawOffer({
                from: data.from_player,
                timestamp: new Date()
              });
              // Auto-clear after 10 seconds
              setTimeout(() => setDrawOffer(null), 10000);
            }
            break

          case 'draw_declined':
            setDrawOffer(null);
            // Only show message to the player who offered the draw
            if (data.to_player === username) {
              showTempMessage(`Draw offer was declined by ${data.from_player}`, 'info');
            }
            break

          case 'game_finished':
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              result: data.game_state?.result || data.result || '1/2-1/2' // Ensure result is set for modal
            }));
            setDrawOffer(null); // Clear any pending draw offers
            if (data.game_state?.reason === 'draw_accepted') {
              showTempMessage('Draw accepted - Game ended in a draw', 'info');
            } else if (data.game_state?.reason === 'resignation') {
              const resignedPlayer = data.game_state?.resigned_player;
              showTempMessage(`${resignedPlayer} resigned`, 'info');
            }
            break
            
          case 'error':
            console.error('WebSocket error received:', data.message);
            setGameState(prev => ({
              ...prev,
              error: data.message
            }));
            break
            
          case 'move_error':
            console.error('Move error received:', data.message);
            // Don't update the game state, just log the error
            // The UI should handle this gracefully without breaking
            break
            
          default:
            // Unknown WebSocket message type - can be safely ignored
            break;
        }
      });
      
      unsubscribeRef.current = unsubscribe;
      webSocketService.connect(gameId, username);
      wsConnectedRef.current = true;
    }

    loadGameState();
    connectWebSocket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      wsConnectedRef.current = false;
      webSocketService.disconnect(gameId);
    }
  }, [gameId, username, authChecked, user, handleGameStateUpdate, handleMoveUpdate, showTempMessage]);

  // Loading states
  if (!authChecked) {
    return (
      <div className="page"><div className="container"><div className="loading"><p>Loading...</p></div></div></div>
    );
  }
  if (!user) {
    return (
      <div className="page"><div className="container"><div className="loading"><p>Authentication required...</p><p>Redirecting to login...</p></div></div></div>
    );
  }
  if (gameState.loading) {
    return (
      <div className="page"><div className="container"><div className="loading">Loading game...</div></div></div>
    );
  }
  if (gameState.error) {
    return (
      <div className="page"><div className="container"><h1 className="title">Error Loading Game</h1><div className="error" style={{ color: '#e74c3c', background: '#ffeaea', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{gameState.error}</div><div style={{ textAlign: 'center' }}><button className="btn btn-secondary" onClick={() => navigate('/setup')} style={{ marginRight: '1rem' }}>Create New Game</button><button className="btn btn-secondary" onClick={() => navigate('/')}>Home</button></div></div></div>
    );
  }

  // Show modal for finished games (more permissive condition to ensure it shows)
  const shouldShowModal = gameState.status === 'finished';

  return (
    <div className="chess-page">
      <div className="chess-layout">
        {/* Left Sidebar */}
        <div className="chess-sidebar">
          <div className="chess-info-panel">
            <h3 style={{ color: '#fff', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Game Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0a0' }}>Game ID:</span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>{gameId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0a0' }}>Time Control:</span>
                <span style={{ color: '#fff' }}>{gameState.time_control || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0a0' }}>Status:</span>
                <span style={{ color: '#fff' }}>{getStatusMessage()}</span>
              </div>
              {gameState.myColor && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a0a0a0' }}>Playing as:</span>
                  <span style={{ color: '#fff' }}>{gameState.myColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Message */}
          {gameState.status === 'waiting' && !canJoinGame() && (
            <div className="chess-info-panel">
              <h3 style={{ color: '#fff', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Waiting for Opponent</h3>
              <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                Share this game ID with a friend: <br />
                <strong style={{ color: '#81b64c', fontFamily: 'monospace' }}>{gameId}</strong>
              </p>
            </div>
          )}

          {/* Join Game Button */}
          {canJoinGame() && (
            <div className="chess-info-panel">
              <button 
                className="create-game-btn" 
                onClick={joinGame}
                style={{ width: '100%', padding: '12px' }}
              >
                Join Game
              </button>
            </div>
          )}


        </div>

        {/* Main Game Area */}
        <div className="chess-main">
          {/* Opponent Info (Top) */}
          <div className={`chess-player-info ${
            gameState.myColor && gameState.currentPlayer !== gameState.myColor && gameState.status === 'active' ? 'active' : ''
          }`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>
                {gameState.myColor === 'white' ? '♛' : '♔'}
              </span>
              <span className="chess-player-name">
                {gameState.myColor === 'white' 
                  ? (gameState.player_black || 'Waiting for player...') 
                  : (gameState.player_white || 'Waiting for player...')
                }
              </span>
            </div>
            {gameState.myColor && gameState.status === 'active' && (
              <div className={`chess-timer ${
                gameState.currentPlayer !== gameState.myColor ? 'active' : ''
              } ${
                (gameState.myColor === 'white' ? timeLeft.black : timeLeft.white) < 60 ? 'low-time' : ''
              }`}>
                {gameState.myColor === 'white' && timeLeft.black !== null && (
                  <>{Math.floor(timeLeft.black / 60)}:{(timeLeft.black % 60).toString().padStart(2, '0')}</>
                )}
                {gameState.myColor === 'black' && timeLeft.white !== null && (
                  <>{Math.floor(timeLeft.white / 60)}:{(timeLeft.white % 60).toString().padStart(2, '0')}</>
                )}
              </div>
            )}
          </div>

          {/* Chess Board */}
          <div className="chess-board-container">
            <ChessBoard 
              gameState={effectiveGameState}
              moveHighlights={moveHighlights}
              onDrop={onDrop}
              onSquareClick={onSquareClick}
            />
            
            {/* Check indicator */}
            {game.isCheck() && gameState.status === 'active' && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                backgroundColor: '#e74c3c', 
                color: 'white',
                borderRadius: '4px', 
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                CHECK!
              </div>
            )}

            {/* Turn indicator */}
            {gameState.status === 'active' && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '0.5rem', 
                fontSize: '0.9rem', 
                color: '#a0a0a0' 
              }}>
                {gameState.isMyTurn ? 
                  `Your turn (${gameState.myColor}) - Make your move` : 
                  `Waiting for ${gameState.currentPlayer === 'white' ? gameState.player_white : gameState.player_black}`
                }
              </div>
            )}
          </div>

          {/* Player Info (Bottom) */}
          <div className={`chess-player-info ${
            gameState.myColor && gameState.currentPlayer === gameState.myColor && gameState.status === 'active' ? 'active' : ''
          }`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>
                {gameState.myColor === 'white' ? '♔' : '♛'}
              </span>
              <span className="chess-player-name">
                {gameState.myColor === 'white' 
                  ? (gameState.player_white || 'Waiting for player...') 
                  : (gameState.player_black || 'Waiting for player...')
                }
              </span>
            </div>
            {gameState.myColor && gameState.status === 'active' && (
              <div className={`chess-timer ${
                gameState.currentPlayer === gameState.myColor ? 'active' : ''
              } ${
                (gameState.myColor === 'white' ? timeLeft.white : timeLeft.black) < 60 ? 'low-time' : ''
              }`}>
                {gameState.myColor === 'white' && timeLeft.white !== null && (
                  <>{Math.floor(timeLeft.white / 60)}:{(timeLeft.white % 60).toString().padStart(2, '0')}</>
                )}
                {gameState.myColor === 'black' && timeLeft.black !== null && (
                  <>{Math.floor(timeLeft.black / 60)}:{(timeLeft.black % 60).toString().padStart(2, '0')}</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="chess-sidebar">
          {/* Game Controls */}
          <div className="chess-info-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {gameState.status === 'active' && (gameState.myColor === 'white' || gameState.myColor === 'black') && (
                <>
                  <button 
                    className="chess-modal-btn chess-modal-btn-danger" 
                    onClick={handleLeaveGame}
                    style={{ width: '100%' }}
                  >
                    Leave Game (Resign)
                  </button>
                  <button 
                    className="chess-modal-btn chess-modal-btn-secondary" 
                    onClick={handleOfferDraw}
                    style={{ width: '100%' }}
                  >
                    Offer Draw
                  </button>
                </>
              )}
              {gameState.status !== 'active' && (
                <button 
                  className="chess-modal-btn chess-modal-btn-secondary" 
                  onClick={() => navigate('/')}
                  style={{ width: '100%' }}
                >
                  Back to Home
                </button>
              )}
            </div>
          </div>

          {/* Debug Info (only in development) */}
          {import.meta.env.DEV && (
            <div className="chess-info-panel">
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Debug Info</h4>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', fontFamily: 'monospace' }}>
                <div>WS: {wsConnectedRef.current ? 'Connected' : 'Disconnected'}</div>
                <div>Status: {gameState.status}</div>
                <div>My Color: {gameState.myColor || 'Observer'}</div>
                <div>My Turn: {gameState.isMyTurn ? 'Yes' : 'No'}</div>
                <div>Current: {gameState.currentPlayer}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Temporary Messages */}
      {tempMessage && (
        <div style={{ 
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999,
          padding: '1rem', 
          backgroundColor: tempMessage.type === 'error' ? '#e74c3c' : '#3498db', 
          color: 'white',
          borderRadius: '8px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {tempMessage.message}
        </div>
      )}

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={shouldShowModal}
        onClose={() => {/* Modal close handled by navigation */}}
        result={gameState.result || '1/2-1/2'} // Default to draw if no result
        reason={game.isCheckmate() ? 'checkmate' : game.isStalemate() ? 'stalemate' : 'unknown'}
        myColor={gameState.myColor}
        playerWhite={gameState.player_white}
        playerBlack={gameState.player_black}
      />

      {/* Error Display */}
      {gameState.error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#312e2b',
          color: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Error Loading Game</h2>
          <p style={{ marginBottom: '1.5rem' }}>{gameState.error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="chess-modal-btn chess-modal-btn-secondary" onClick={() => navigate('/setup')}>
              Create New Game
            </button>
            <button className="chess-modal-btn chess-modal-btn-secondary" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </div>
      )}

      {/* Leave Game Confirmation */}
      {showLeaveConfirmation && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#312e2b',
          color: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Resign Game?</h2>
          <p style={{ marginBottom: '1.5rem' }}>Are you sure you want to resign? This will end the game and you will lose.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="chess-modal-btn chess-modal-btn-secondary" 
              onClick={() => setShowLeaveConfirmation(false)}
            >
              Cancel
            </button>
            <button 
              className="chess-modal-btn chess-modal-btn-danger" 
              onClick={confirmLeaveGame}
            >
              Yes, Resign
            </button>
          </div>
        </div>
      )}

      {/* Draw Offer Dialog */}
      {drawOffer && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#312e2b',
          color: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          textAlign: 'center',
          zIndex: 1000,
          minWidth: '350px',
          border: '2px solid #f39c12'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#f39c12' }}>Draw Offer</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <strong>{drawOffer.from}</strong> has offered a draw
          </p>
          <div style={{ 
            marginBottom: '1.5rem', 
            fontSize: '0.9rem', 
            color: '#a0a0a0' 
          }}>
            This offer will expire automatically in 10 seconds
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="chess-modal-btn chess-modal-btn-secondary" 
              onClick={declineDraw}
              style={{ minWidth: '100px' }}
            >
              Decline
            </button>
            <button 
              className="chess-modal-btn chess-modal-btn-success" 
              onClick={acceptDraw}
              style={{ minWidth: '100px' }}
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
