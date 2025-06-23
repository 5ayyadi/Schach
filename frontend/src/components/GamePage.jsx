import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';
import GameTimer from './GameTimer';
import GameInfo from './GameInfo';
import ChessBoard from './ChessBoard';
import MoveHistory from './MoveHistory';
import useGameLogic from '../hooks/useGameLogic';
import usePieceSelection from '../hooks/usePieceSelection';

function GamePage({ user }) {
  console.log('[GAME PAGE] Component mounting/rendering with user:', user?.username || 'no user');
  
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('[GAME PAGE] Initial state - gameId:', gameId, 'path:', location.pathname);
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
  const [moveHistory, setMoveHistory] = useState([]);
  const unsubscribeRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState({ white: null, black: null });
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [tempMessage, setTempMessage] = useState(null);

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
    effectiveGameState, setGameState, setGame, setMoveHistory, gameId, timeLeft, setTimeLeft, user, showTempMessage
  );

  console.log('[TURN DEBUG]', {
    myColor: gameState.myColor,
    currentPlayer: gameState.currentPlayer,
    status: gameState.status,
    storedIsMyTurn: gameState.isMyTurn,
    calculatedIsMyTurn: actualIsMyTurn
  });

  const { moveHighlights, onSquareClick, onDrop, clearMoveHighlights } = usePieceSelection(
    game, effectiveGameState, makeMove
  );

  // Debug: Log critical state
  useEffect(() => {
    console.log('[CRITICAL DEBUG] Auth and user state:', { 
      authChecked, 
      user: user?.username || 'no user', 
      gameId 
    });
  }, [authChecked, user, gameId]);
  useEffect(() => {
    console.log('[DEBUG] User prop:', user);
  }, [user]);

  // Initialize time controls when game state updates
  useEffect(() => {
    console.log('Time control initialization effect:', { 
      timeControl: gameState.time_control, 
      currentTimeLeft: timeLeft 
    });
    
    if (gameState.time_control && timeLeft.white === null && timeLeft.black === null) {
      const { baseTime } = parseTimeControl(gameState.time_control);
      
      if (baseTime !== null) {
        console.log('Setting initial time controls:', baseTime);
        setTimeLeft({
          white: baseTime,
          black: baseTime
        });
      }
    }
  }, [gameState.time_control, timeLeft, parseTimeControl]);

  const handleGameStateUpdate = useCallback((data) => {
    console.log('Game state update received:', data);
    console.log('Current user in handleGameStateUpdate:', user);
    console.log('User type and structure:', { 
      userType: typeof user, 
      userKeys: user ? Object.keys(user) : 'null',
      username: user?.username,
      name: user?.name,
      id: user?.id
    });
    
    const chessGame = new Chess(data.fen);
    setGame(chessGame);
    
    // Try different user properties in case username is not the right one
    const userId = user?.username || user?.name || user?.id;
    
    // Debug the exact comparison
    console.log('Color comparison debug:', {
      userId,
      userIdType: typeof userId,
      playerWhite: data.player_white,
      playerWhiteType: typeof data.player_white,
      playerBlack: data.player_black,
      playerBlackType: typeof data.player_black,
      whiteMatch: data.player_white === userId,
      blackMatch: data.player_black === userId,
      whiteStrictEquality: String(data.player_white) === String(userId),
      blackStrictEquality: String(data.player_black) === String(userId)
    });
    
    const myColor = data.player_white === userId ? 'white' : 
                   data.player_black === userId ? 'black' : null
    
    const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
    const isMyTurn = myColor === currentPlayer && data.status === 'active'
    
    console.log('Turn calculation debug:', {
      chessGameTurn: chessGame.turn(),
      currentPlayer,
      myColor,
      dataStatus: data.status,
      colorMatch: myColor === currentPlayer,
      statusActive: data.status === 'active',
      finalIsMyTurn: isMyTurn
    });
    
    console.log('User comparison:', { 
      userId,
      userUsername: user?.username, 
      userName: user?.name,
      userIdProp: user?.id,
      playerWhite: data.player_white, 
      playerBlack: data.player_black,
      myColor, 
      currentPlayer, 
      isMyTurn, 
      gameStatus: data.status 
    });
    
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
    
    const history = chessGame.history({ verbose: true });
    setMoveHistory(history);
    console.log('Move history updated:', history.length, 'moves');
  }, [user]);

  const handleMoveUpdate = useCallback((data) => {
    console.log('Move update received:', data);
    
    const chessGame = new Chess(data.fen);
    setGame(chessGame);
    
    setGameState(prev => {
      const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
      
      // Determine myColor if not already set
      let updatedMyColor = prev.myColor;
      if (!updatedMyColor && user?.username) {
        console.log('Determining myColor in handleMoveUpdate:', { 
          username: user.username, 
          playerWhite: prev.player_white, 
          playerBlack: prev.player_black 
        });
        if (user.username === prev.player_white) {
          updatedMyColor = 'white';
        } else if (user.username === prev.player_black) {
          updatedMyColor = 'black';
        }
      }
      
      // Determine the game status - use data.status if provided, otherwise keep existing status or default to 'active'
      const gameStatus = data.status !== undefined ? data.status : (prev.status || 'active');
      
      const isMyTurn = updatedMyColor === currentPlayer && gameStatus === 'active'
      
      console.log('Move update - calculated state:', { 
        currentPlayer, 
        isMyTurn, 
        myColor: updatedMyColor, 
        status: gameStatus,
        dataStatus: data.status 
      });
      
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
    
    const history = chessGame.history({ verbose: true });
    setMoveHistory(history);
  }, [user?.username]);

  // Clear move highlights when it's not the player's turn or game state changes
  useEffect(() => {
    console.log('Checking if should clear highlights:', { 
      isMyTurn: gameState.isMyTurn, 
      gameStatus: gameState.status 
    });
    
    if (!gameState.isMyTurn || gameState.status !== 'active') {
      console.log('Clearing highlights due to game state change');
      clearMoveHighlights();
    }
  }, [gameState.isMyTurn, gameState.status, clearMoveHighlights]);

  // Authentication check
  useEffect(() => {
    console.log('[AUTH CHECK] Effect triggered:', { user: user?.username, authChecked });
    
    const authCheckTimer = setTimeout(() => {
      console.log('[AUTH CHECK] Timer fired - setting authChecked to true');
      setAuthChecked(true);
      if (!user) {
        console.log('[AUTH CHECK] No user found, redirecting to auth');
        navigate(`/auth?return=${encodeURIComponent(location.pathname)}`);
      }
    }, 100)

    return () => clearTimeout(authCheckTimer)
  }, [user, navigate, location.pathname, authChecked])

  // Main game loading and WebSocket connection effect
  useEffect(() => {
    console.log('[MAIN EFFECT] Triggered:', { 
      authChecked, 
      userExists: !!user, 
      username: user?.username,
      gameId 
    });
    
    // Early return if user auth hasn't been checked yet or no user
    if (!authChecked || !user) {
      console.log('[MAIN EFFECT] Skipping - auth not ready');
      return
    }

    const loadGameState = async () => {
      console.log('Loading game state for game:', gameId);
      console.log('User object during loadGameState:', user);
      try {
        const gameData = await apiService.getGame(gameId);
        console.log('Game data loaded:', gameData);
        
        const chessGame = new Chess(gameData.fen);
        setGame(chessGame);
        
        // Determine user's color
        // Try different user properties in case username is not the right one
        const userId = user.username || user.name || user.id;
        const myColor = gameData.player_white === userId ? 'white' : 
                       gameData.player_black === userId ? 'black' : null
        
        const currentPlayer = chessGame.turn() === 'w' ? 'white' : 'black'
        const isMyTurn = myColor === currentPlayer && gameData.status === 'active'
        
        console.log('Initial game state calculated:', { 
          userId,
          gameDataPlayerWhite: gameData.player_white,
          gameDataPlayerBlack: gameData.player_black, 
          myColor, 
          currentPlayer, 
          isMyTurn,
          gameDataStatus: gameData.status
        });
        
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
        
        // Set move history
        const history = chessGame.history({ verbose: true });
        setMoveHistory(history);
        console.log('Initial move history set:', history.length, 'moves');
        
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
        console.log('[WEBSOCKET] Already connected');
        return
      }
      
      console.log('[WEBSOCKET] Connecting for game:', gameId);
      
      const unsubscribe = webSocketService.subscribe(gameId, (data) => {
        console.log('[WEBSOCKET] Message received:', data.type, data);
        
        switch (data.type) {
          case 'connected':
            console.log('[WEBSOCKET] Connected successfully');
            wsConnectedRef.current = true;
            break
            
          case 'game_state':
            console.log('[WEBSOCKET] Processing game_state message');
            handleGameStateUpdate(data);
            break
            
          case 'game_joined':
            console.log('Processing game_joined message');
            setGameState(prev => ({
              ...prev,
              player_white: data.player_white,
              player_black: data.player_black,
              status: 'active'
            }));
            break
            
          case 'move_made':
            console.log('Processing move_made message');
            handleMoveUpdate(data);
            break
            
          case 'game_over':
            console.log('Processing game_over message');
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              result: data.result
            }));
            break
            
          case 'game_ended':
            console.log('Processing game_ended message');
            setGameState(prev => ({
              ...prev,
              status: 'finished',
              result: data.result
            }));
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
            console.log('Unknown WebSocket message type:', data.type);
        }
      });
      
      unsubscribeRef.current = unsubscribe;
      webSocketService.connect(gameId, user?.username);
    }

    loadGameState();
    connectWebSocket();

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      wsConnectedRef.current = false;
      webSocketService.disconnect(gameId);
    }
  }, [gameId, user, authChecked, handleGameStateUpdate, handleMoveUpdate]);

  // Loading states
  if (!authChecked) {
    console.log('[RENDER] Auth check loading - authChecked:', authChecked);
    return (
      <div className="page"><div className="container"><div className="loading"><p>Loading...</p></div></div></div>
    );
  }
  if (!user) {
    console.log('[RENDER] No user - redirecting', { user });
    return (
      <div className="page"><div className="container"><div className="loading"><p>Authentication required...</p><p>Redirecting to login...</p></div></div></div>
    );
  }
  if (gameState.loading) {
    console.log('[RENDER] Game loading state');
    return (
      <div className="page"><div className="container"><div className="loading">Loading game...</div></div></div>
    );
  }
  if (gameState.error) {
    console.log('[RENDER] Error state:', gameState.error);
    return (
      <div className="page"><div className="container"><h1 className="title">Error Loading Game</h1><div className="error" style={{ color: '#e74c3c', background: '#ffeaea', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{gameState.error}</div><div style={{ textAlign: 'center' }}><button className="btn btn-secondary" onClick={() => navigate('/setup')} style={{ marginRight: '1rem' }}>Create New Game</button><button className="btn btn-secondary" onClick={() => navigate('/')}>Home</button></div></div></div>
    );
  }

  // Main render
  console.log('[RENDER] Main game page - gameState:', {
    status: gameState.status,
    myColor: gameState.myColor, 
    currentPlayer: gameState.currentPlayer,
    storedIsMyTurn: gameState.isMyTurn,
    calculatedIsMyTurn: actualIsMyTurn
  });
  return (
    <div className="page">
      <div className="container">
        <h1 className="title">Chess Game</h1>
        <GameInfo gameId={gameId} gameState={gameState} getStatusMessage={getStatusMessage} />
        {gameState.error && <div className="error">{gameState.error}</div>}
        
        {/* Temporary Messages */}
        {tempMessage && (
          <div style={{ 
            textAlign: 'center', 
            margin: '1rem 0', 
            padding: '0.75rem', 
            backgroundColor: tempMessage.type === 'error' ? '#ffebee' : '#e3f2fd', 
            color: tempMessage.type === 'error' ? '#c62828' : '#1565c0',
            border: `1px solid ${tempMessage.type === 'error' ? '#e57373' : '#90caf9'}`,
            borderRadius: '6px',
            fontWeight: '500'
          }}>
            {tempMessage.message}
          </div>
        )}
        
        {/* Game End Result Display */}
        {gameState.status === 'finished' && (
          <div style={{ 
            textAlign: 'center', 
            margin: '2rem 0', 
            padding: '2rem', 
            backgroundColor: '#e8f5e8', 
            border: '2px solid #4caf50', 
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>🏁 Game Finished!</h2>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1b5e20' }}>
              {(() => {
                if (gameState.result === 'draw') {
                  return '🤝 Draw!';
                } else if (gameState.result === '1-0') {
                  return `🎉 ${gameState.player_white} (White) wins!`;
                } else if (gameState.result === '0-1') {
                  return `🎉 ${gameState.player_black} (Black) wins!`;
                } else if (gameState.result === 'abandoned') {
                  return '⏰ Game was abandoned';
                } else {
                  return 'Game finished';
                }
              })()}
            </div>
            {game.isCheckmate() && (
              <p style={{ marginTop: '0.5rem', color: '#2e7d32' }}>Checkmate!</p>
            )}
            {game.isDraw() && (
              <p style={{ marginTop: '0.5rem', color: '#2e7d32' }}>
                {game.isStalemate() ? 'Stalemate!' : 
                 game.isThreefoldRepetition() ? 'Draw by threefold repetition!' :
                 game.isInsufficientMaterial() ? 'Draw by insufficient material!' :
                 'Draw!'}
              </p>
            )}
          </div>
        )}
        
        {canJoinGame() && (
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button className="btn" onClick={joinGame}>Join Game</button>
          </div>
        )}
        <GameTimer 
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          gameState={effectiveGameState}
          isClockRunning={isClockRunning}
          setIsClockRunning={setIsClockRunning}
          setGameState={setGameState}
        />
        <ChessBoard 
          gameState={effectiveGameState}
          moveHighlights={moveHighlights}
          onDrop={onDrop}
          onSquareClick={onSquareClick}
        />
        {gameState.status === 'waiting' && !canJoinGame() && (
          <div className="waiting-message">
            <h3>⏳ Waiting for opponent...</h3>
            <p>Share this game ID with a friend: <strong>{gameId}</strong></p>
            <p>Game will start automatically when someone joins</p>
          </div>
        )}
        {game.isCheck() && gameState.status === 'active' && (
          <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', color: '#856404' }}>
            <strong>Check!</strong>
          </div>
        )}
        <MoveHistory moveHistory={moveHistory} />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/setup')} style={{ marginRight: '1rem' }}>New Game</button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Home</button>
        </div>
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '0.875rem', color: '#6c757d' }}>
          <p><strong>WebSocket Status:</strong> {wsConnectedRef.current ? 'Connected' : 'Disconnected'}</p>
          <p><strong>Game Status:</strong> {gameState.status}</p>
          <p><strong>Your Color:</strong> {gameState.myColor || 'Observer'}</p>
          <p><strong>Is My Turn:</strong> {gameState.isMyTurn ? 'Yes' : 'No'}</p>
          <p><strong>Current Player:</strong> {gameState.currentPlayer}</p>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
