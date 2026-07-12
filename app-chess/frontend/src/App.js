import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, botsAPI } from './services/api';
import ChessBoard from './components/ChessBoard';
import LocalChess from './components/LocalChess';

const PIECE_ICONS = {
  w: { K: 'fa-chess-king', Q: 'fa-chess-queen', R: 'fa-chess-rook', B: 'fa-chess-bishop', N: 'fa-chess-knight', P: 'fa-chess-pawn' },
  b: { K: 'fa-chess-king', Q: 'fa-chess-queen', R: 'fa-chess-rook', B: 'fa-chess-bishop', N: 'fa-chess-knight', P: 'fa-chess-pawn' }
};

function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [ws, setWs] = useState(null);
  const [bots, setBots] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [lastMove, setLastMove] = useState(null);
  const [moveNotation, setMoveNotation] = useState('');
  const wsRef = useRef(null);

  // Auth form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  const handleWebSocketMessage = useCallback((message) => {
    const { type, payload } = message;

    switch (type) {
      case 'game_created':
        setGameState(prev => ({ ...prev, gameId: payload.gameId, color: payload.color, status: 'waiting' }));
        setScreen('game');
        break;

      case 'game_start':
        setGameState({
          gameId: payload.gameId,
          color: payload.color,
          opponent: payload.opponent,
          status: 'active',
          fen: payload.fen,
          pgn: payload.pgn,
          turn: payload.turn,
          isCheck: payload.isCheck,
          isCheckmate: payload.isCheckmate,
          isDraw: payload.isDraw,
          isStalemate: payload.isStalemate,
          isGameOver: payload.isGameOver,
          history: payload.history || [],
          isBot: payload.isBot || false,
        });
        setCapturedPieces({ w: [], b: [] });
        setLastMove(null);
        setMoveNotation('');
        setScreen('game');
        break;

      case 'game_state':
        setGameState(prev => ({ ...prev, ...payload }));
        break;

      case 'move_made':
        setGameState(prev => ({
          ...prev,
          fen: payload.fen,
          pgn: payload.pgn,
          turn: payload.turn,
          isCheck: payload.isCheck,
          isCheckmate: payload.isCheckmate,
          isDraw: payload.isDraw,
          isStalemate: payload.isStalemate,
          isGameOver: payload.isGameOver,
          history: payload.history || [],
        }));

        if (payload.move) {
          setLastMove({ from: payload.move.from, to: payload.move.to });
          setMoveNotation(payload.move.san);

          if (payload.move.captured) {
            setCapturedPieces(prev => {
              const capturedBy = payload.move.color === 'w' ? 'w' : 'b';
              return {
                ...prev,
                [capturedBy]: [...prev[capturedBy], payload.move.captured]
              };
            });
          }
        }
        break;

      case 'game_over':
        setGameState(prev => ({
          ...prev,
          status: 'completed',
          result: payload.result,
          winner: payload.winner,
          reason: payload.reason || '',
          isCheckmate: payload.isCheckmate,
          isDraw: payload.isDraw,
        }));
        break;

      case 'draw_offer':
        if (window.confirm(`${payload.from === 'white' ? 'White' : 'Black'} offers a draw. Accept?`)) {
          wsRef.current?.send(JSON.stringify({
            type: 'draw_response',
            payload: { gameId: payload.gameId, accept: true }
          }));
        } else {
          wsRef.current?.send(JSON.stringify({
            type: 'draw_response',
            payload: { gameId: payload.gameId, accept: false }
          }));
        }
        break;

      case 'draw_declined':
        alert('Draw offer declined');
        break;

      case 'opponent_disconnected':
        alert(payload.message);
        break;

      case 'error':
        setError(payload.message);
        break;

      default:
        console.log('Unknown message:', type, payload);
    }
  }, []);

  // Connect WebSocket
  const connectWebSocket = useCallback((token) => {
    const wsUrl = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace(/^http/, 'ws').replace('/api', '') + '/ws'
      : 'ws://localhost:5002/ws';

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    setWs(socket);

    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    socket.onclose = () => console.log('WebSocket disconnected');

    return socket;
  }, [handleWebSocketMessage]);

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authAPI.login(loginForm);
      const { user: userData, token } = res.data.data;
      localStorage.setItem('chess_token', token);
      localStorage.setItem('chess_user', JSON.stringify(userData));
      setUser(userData);
      connectWebSocket(token);
      setScreen('lobby');
      loadBots();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authAPI.register(registerForm);
      const { user: userData, token } = res.data.data;
      localStorage.setItem('chess_token', token);
      localStorage.setItem('chess_user', JSON.stringify(userData));
      setUser(userData);
      connectWebSocket(token);
      setScreen('lobby');
      loadBots();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleGuest = async () => {
    setError('');
    try {
      const res = await authAPI.guest();
      const { user: userData, token } = res.data.data;
      localStorage.setItem('chess_token', token);
      localStorage.setItem('chess_user', JSON.stringify(userData));
      setUser(userData);
      connectWebSocket(token);
      setScreen('lobby');
      loadBots();
    } catch (err) {
      setError('Guest login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chess_token');
    localStorage.removeItem('chess_user');
    setUser(null);
    setGameState(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWs(null);
    setScreen('login');
  };

  const loadBots = async () => {
    try {
      const res = await botsAPI.list();
      setBots(res.data.data);
    } catch (err) {
      console.error('Failed to load bots:', err);
    }
  };

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('chess_token');
    const savedUser = localStorage.getItem('chess_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      connectWebSocket(token);
      setScreen('lobby');
      loadBots();
    }
  }, [connectWebSocket]);

  const startOnlineGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create_game',
        payload: { userId: user?.id, timeControl: { initial: 600, increment: 5 } }
      }));
    }
  };

  const startBotGame = (botId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'play_bot',
        payload: { userId: user?.id, botId }
      }));
    }
  };

  const handleMove = (from, to) => {
    if (!gameState || gameState.status !== 'active') return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'make_move',
        payload: { gameId: gameState.gameId, from, to, promotion: 'q' }
      }));
    }
  };

  const handleResign = () => {
    if (!gameState || gameState.status !== 'active') return;
    if (!window.confirm('Are you sure you want to resign?')) return;
    wsRef.current?.send(JSON.stringify({
      type: 'resign',
      payload: { gameId: gameState.gameId }
    }));
  };

  const handleDrawOffer = () => {
    if (!gameState || gameState.status !== 'active') return;
    wsRef.current?.send(JSON.stringify({
      type: 'draw_offer',
      payload: { gameId: gameState.gameId }
    }));
  };

  const handleNewGame = () => {
    setGameState(null);
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setMoveNotation('');
    setScreen('lobby');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Render functions
  const renderAuth = () => (
    <div className="auth-section">
      <h2>{screen === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
      {error && <div className="error-message">{error}</div>}

      {screen === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Sign In</button>
          <div className="auth-links">
            <a onClick={() => { setError(''); setScreen('register'); }}>Create account</a>
            <span className="separator">|</span>
            <a onClick={handleGuest}>Play as Guest</a>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
          <div className="auth-links">
            <a onClick={() => { setError(''); setScreen('login'); }}>Already have an account? Sign in</a>
          </div>
        </form>
      )}
    </div>
  );

  const renderLobby = () => (
    <div className="lobby">
      <div className="user-info">
        <div className="user-details">
          <div className="avatar">{getInitials(user?.username)}</div>
          <div>
            <span className="username">{user?.username}</span>
            <span className="rating"><i className="fas fa-chess-pawn"></i> {user?.rating || 1200}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <h2>Choose Your Game</h2>
      <div className="lobby-options">
        <div className="lobby-card" onClick={startOnlineGame}>
          <span className="icon"><i className="fas fa-globe"></i></span>
          <h3>Play Online</h3>
          <p>Match with a random opponent in real-time</p>
          <span className="lobby-badge">Multiplayer</span>
        </div>
        <div className="lobby-card" onClick={() => setScreen('bots')}>
          <span className="icon"><i className="fas fa-robot"></i></span>
          <h3>Play vs Bot</h3>
          <p>Practice against AI opponents at various levels</p>
          <span className="lobby-badge">AI</span>
        </div>
        <div className="lobby-card" onClick={() => setScreen('local')}>
          <span className="icon"><i className="fas fa-users"></i></span>
          <h3>Local 1v1</h3>
          <p>Play with a friend on the same device</p>
          <span className="lobby-badge">Offline</span>
        </div>
      </div>
    </div>
  );

  const renderBotSelection = () => (
    <div className="lobby">
      <div className="user-info">
        <div className="user-details">
          <div className="avatar">{getInitials(user?.username)}</div>
          <div>
            <span className="username">{user?.username}</span>
            <span className="rating"><i className="fas fa-chess-pawn"></i> {user?.rating || 1200}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={() => setScreen('lobby')}>Back</button>
      </div>

      <h2>Select Bot Opponent</h2>
      <div className="bot-list">
        {bots.map((bot) => (
          <div key={bot.id} className="bot-card" onClick={() => startBotGame(bot.id)}>
            <div className="bot-info">
              <div className="bot-name">
                <i className="fas fa-robot"></i> {bot.name}
              </div>
              <div className="bot-desc">{bot.description}</div>
            </div>
            <div className="bot-rating"><i className="fas fa-chess-pawn"></i> {bot.rating}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGame = () => {
    if (!gameState) return null;

    if (gameState.status === 'waiting') {
      return (
        <div className="waiting-screen">
          <div className="spinner-container">
            <div className="spinner"></div>
            <div className="spinner-pulse"></div>
          </div>
          <h2>Waiting for opponent...</h2>
          <p>You are playing as White</p>
          <button className="btn btn-danger" onClick={handleNewGame} style={{ marginTop: '24px', width: 'auto', display: 'inline-block' }}>
            Cancel
          </button>
        </div>
      );
    }

    const statusClass = gameState.isCheckmate ? 'checkmate'
      : gameState.isDraw ? 'draw'
      : gameState.isCheck ? 'check'
      : gameState.turn === 'w' ? 'turn-white' : 'turn-black';

    let statusText = '';
    if (gameState.isCheckmate) {
      statusText = `Checkmate! ${gameState.turn === 'w' ? 'Black' : 'White'} wins!`;
    } else if (gameState.isDraw) {
      statusText = gameState.isStalemate ? 'Stalemate – Draw' : 'Draw';
    } else if (gameState.isCheck) {
      statusText = `${gameState.turn === 'w' ? 'White' : 'Black'} is in check!`;
    } else {
      statusText = `${gameState.turn === 'w' ? "White" : "Black"}'s turn`;
    }

    if (gameState.status === 'completed') {
      if (gameState.winner === 'draw') {
        statusText = 'Draw agreed';
      } else if (gameState.reason) {
        statusText = gameState.reason;
      }
    }

    const moves = gameState.history || [];
    const movePairs = [];
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push({
        number: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1] || null
      });
    }

    const whiteCaptured = capturedPieces.w;
    const blackCaptured = capturedPieces.b;

    const isMyTurn = (gameState.turn === 'w' && gameState.color === 'white') ||
                     (gameState.turn === 'b' && gameState.color === 'black');

    return (
      <div>
        <div className="user-info">
          <div className="user-details">
            <div className="avatar">{getInitials(user?.username)}</div>
            <div>
              <span className="username">{user?.username}</span>
              <span className="rating"><i className="fas fa-chess-pawn"></i> {user?.rating || 1200}</span>
              <span className="opponent-info"> vs {gameState.opponent || 'Opponent'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleNewGame}>New Game</button>
        </div>

        <div className="game-layout">
          <div className="board-section">
            <div className="board-label">
              {gameState.color === 'black' ? 'You play as Black' : 'You play as White'}
              {gameState.isBot && ' (vs Bot)'}
            </div>
            <div style={{ position: 'relative' }}>
              <ChessBoard
                fen={gameState.fen}
                onMove={handleMove}
                playerColor={gameState.color}
                isGameOver={gameState.status === 'completed'}
                lastMove={lastMove}
              />
              {gameState.status === 'completed' && (
                <div className="game-over-overlay">
                  <div className="result-icon">
                    {gameState.winner === 'draw' ? <i className="fas fa-handshake"></i> : gameState.winner === gameState.color ? <i className="fas fa-trophy"></i> : <i className="fas fa-frown"></i>}
                  </div>
                  <div className="result-text">
                    {gameState.winner === 'draw' ? 'Draw' :
                     gameState.winner === gameState.color ? 'You Win!' : 'You Lose'}
                  </div>
                  <div className="result-subtext">{statusText}</div>
                  <button className="btn btn-primary btn-sm" onClick={handleNewGame}>Play Again</button>
                </div>
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="panel-box">
              <div className="panel-header">
                <h3>Status</h3>
                {gameState.status === 'active' && (
                  <span className="panel-badge">
                    {isMyTurn ? 'Your Turn' : 'Waiting'}
                  </span>
                )}
              </div>
              <div className={`status-text ${statusClass}`}>{statusText}</div>
              {moveNotation && gameState.status === 'active' && (
                <div className="last-move">
                  Last move: <strong>{moveNotation}</strong>
                </div>
              )}
            </div>

            <div className="panel-box">
              <h3>Captured Pieces</h3>
              <div className="captured-section">
                <div className="captured-group">
                  <div className="captured-label">By White</div>
                  <div className="captured-pieces">
                    {whiteCaptured.length > 0 ? (
                      whiteCaptured.map((p, i) => (
                        <span key={i} className="piece-icon"><i className={`fas ${PIECE_ICONS.b[p]} fa-fw`}></i></span>
                      ))
                    ) : (
                      <span className="empty">None</span>
                    )}
                  </div>
                </div>
                <div className="captured-group">
                  <div className="captured-label">By Black</div>
                  <div className="captured-pieces">
                    {blackCaptured.length > 0 ? (
                      blackCaptured.map((p, i) => (
                        <span key={i} className="piece-icon"><i className={`fas ${PIECE_ICONS.w[p]} fa-fw`}></i></span>
                      ))
                    ) : (
                      <span className="empty">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-box">
              <div className="panel-header">
                <h3>Moves</h3>
                <span className="panel-badge">{moves.length}</span>
              </div>
              <div className="move-history">
                <div className="move-grid">
                  <div className="move-header">#</div>
                  <div className="move-header">White</div>
                  <div className="move-header">Black</div>
                  {movePairs.map((pair) => (
                    <React.Fragment key={pair.number}>
                      <div className="move-number">{pair.number}.</div>
                      <div className="move-white">{pair.white?.san || ''}</div>
                      <div className="move-black">{pair.black?.san || ''}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {gameState.status === 'active' && (
              <div className="panel-box">
                <div className="game-controls">
                  <button className="btn btn-warning" onClick={handleDrawOffer}>
                    Offer Draw
                  </button>
                  <button className="btn btn-danger" onClick={handleResign}>
                    Resign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1><i className="fas fa-chess-rook"></i> Chess Arena</h1>
        <p className="subtitle">Play chess with friends, bots, or random opponents</p>
      </div>

      {!user && screen !== 'game' && screen !== 'local' && renderAuth()}
      {user && screen === 'lobby' && renderLobby()}
      {user && screen === 'bots' && renderBotSelection()}
      {screen === 'game' && renderGame()}
      {screen === 'local' && <LocalChess onBack={() => setScreen('lobby')} />}
    </div>
  );
}

export default App;