import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../utils/sounds';

const PIECE_FA = {
  wK: 'fa-chess-king', wQ: 'fa-chess-queen', wR: 'fa-chess-rook', wB: 'fa-chess-bishop', wN: 'fa-chess-knight', wP: 'fa-chess-pawn',
  bK: 'fa-chess-king', bQ: 'fa-chess-queen', bR: 'fa-chess-rook', bB: 'fa-chess-bishop', bN: 'fa-chess-knight', bP: 'fa-chess-pawn',
};

const PIECE_NAMES = {
  p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King'
};

function LocalChess({ onBack }) {
  const [fen, setFen] = useState('start');
  const [turn, setTurn] = useState('w');
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [isStalemate, setIsStalemate] = useState(false);
  const [isThreefold, setIsThreefold] = useState(false);
  const [isFiftyMove, setIsFiftyMove] = useState(false);
  const [isInsufficientMaterial, setIsInsufficientMaterial] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [moveNotation, setMoveNotation] = useState('');
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [lastMove, setLastMove] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState(null);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const gameRef = useRef(null);
  const moveListRef = useRef(null);

  const updateState = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    
    setFen(g.fen());
    setTurn(g.turn());
    setIsCheck(g.isCheck());
    setIsCheckmate(g.isCheckmate());
    setIsDraw(g.isDraw());
    setIsStalemate(g.isStalemate());
    setIsGameOver(g.isGameOver());
    
    const hist = g.history({ verbose: true });
    setHistory(hist);
    
    if (moveListRef.current) {
      setTimeout(() => {
        moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
      }, 50);
    }

    if (g.isGameOver() && !g.isCheckmate() && !g.isStalemate()) {
      if (g.isThreefoldRepetition && g.isThreefoldRepetition()) {
        setIsThreefold(true);
      }
      if (g.history().length >= 100) {
        setIsFiftyMove(true);
      }
    }
  }, []);

  const executeMove = (from, to, promotion) => {
    const g = gameRef.current;
    if (!g) return;
    
    try {
      const move = g.move({ from, to, promotion });
      if (!move) return;

      setMoveNotation(move.san);
      setLastMove({ from: move.from, to: move.to });
      
      if (move.captured) {
        setCapturedPieces(prev => {
          const capturedBy = move.color === 'w' ? 'w' : 'b';
          return { ...prev, [capturedBy]: [...prev[capturedBy], move.captured] };
        });
      }

      if (soundEnabled) {
        if (move.captured) playCaptureSound();
        else playMoveSound();
      }

      updateState();

      if (g.isCheck() && soundEnabled) setTimeout(() => playCheckSound(), 100);
      if (g.isGameOver() && soundEnabled) setTimeout(() => playGameOverSound(), 200);

      if (g.isCheckmate()) {
        setWinner(g.turn() === 'w' ? 'Black' : 'White');
      } else if (g.isDraw()) {
        setWinner('draw');
      }

    } catch (e) { /* illegal move */ }
  };

  const handleMove = useCallback((from, to) => {
    const g = gameRef.current;
    if (!g || g.isGameOver()) return;

    const piece = g.get(from);
    const isPromotion = piece && piece.type === 'p' && 
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    if (isPromotion) {
      setShowPromotion(true);
      setPromotionSquare({ from, to });
      return;
    }

    executeMove(from, to, 'q');
  }, []);

  const handlePromotion = useCallback((piece) => {
    if (!promotionSquare) return;
    const { from, to } = promotionSquare;
    setShowPromotion(false);
    setPromotionSquare(null);
    executeMove(from, to, piece);
  }, [promotionSquare]);

  const undoLastMove = () => {
    const g = gameRef.current;
    if (!g || g.history().length === 0) return;

    const undone = g.undo();
    if (!undone) return;

    if (undone.captured) {
      setCapturedPieces(prev => {
        const capturedBy = undone.color === 'w' ? 'w' : 'b';
        return { ...prev, [capturedBy]: prev[capturedBy].slice(0, -1) };
      });
    }

    updateState();
    setWinner(null);
    const hist = g.history({ verbose: true });
    setMoveNotation(hist.length > 0 ? hist[hist.length - 1].san : '');
    setLastMove(null);
    setIsThreefold(false);
    setIsFiftyMove(false);
    setIsInsufficientMaterial(false);
  };

  const resetGame = () => {
    const g = gameRef.current;
    if (g) {
      g.reset();
      updateState();
      setCapturedPieces({ w: [], b: [] });
      setLastMove(null);
      setMoveNotation('');
      setMoveHistory([]);
      setWinner(null);
      setIsThreefold(false);
      setIsFiftyMove(false);
      setIsInsufficientMaterial(false);
    }
  };

  const startGame = () => {
    gameRef.current = new Chess();
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setMoveNotation('');
    setMoveHistory([]);
    setWinner(null);
    setIsThreefold(false);
    setIsFiftyMove(false);
    setIsInsufficientMaterial(false);
    setGameStarted(true);
    updateState();
  };

  const copyPGN = () => {
    const g = gameRef.current;
    if (!g) return;
    navigator.clipboard.writeText(g.pgn()).then(() => {
      alert('PGN copied to clipboard!');
    });
  };

  const toggleBoardFlip = () => setBoardFlipped(prev => !prev);
  const toggleSound = () => setSoundEnabled(prev => !prev);

  const statusClass = isCheckmate ? 'checkmate'
    : isDraw ? 'draw'
    : isCheck ? 'check'
    : turn === 'w' ? 'turn-white' : 'turn-black';

  let statusText = '';
  if (isCheckmate) statusText = `Checkmate! ${winner} wins!`;
  else if (isStalemate) statusText = 'Stalemate — Draw';
  else if (isDraw) {
    if (isThreefold) statusText = 'Draw by threefold repetition';
    else if (isFiftyMove) statusText = 'Draw by 50-move rule';
    else if (isInsufficientMaterial) statusText = 'Draw — insufficient material';
    else statusText = 'Draw';
  } else if (isCheck) statusText = `${turn === 'w' ? 'White' : 'Black'} is in check!`;
  else statusText = `${turn === 'w' ? "White" : "Black"}'s turn`;

  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || null
    });
  }

  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const whiteMaterial = capturedPieces.w.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackMaterial = capturedPieces.b.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);

  const renderPieceIcon = (color, type) => (
    <i className={`fas ${PIECE_FA[`${color}${type.toUpperCase()}`]} fa-fw`}></i>
  );

  const renderCapturedPiece = (piece, isWhite) => (
    <i key={piece + Math.random()} className={`fas ${PIECE_FA[`${isWhite ? 'b' : 'w'}${piece.toUpperCase()}`]} fa-fw captured-fa`}></i>
  );

  if (!gameStarted) {
    return (
      <div className="local-lobby">
        <div className="local-lobby-card">
          <div className="local-icon">
            <i className="fas fa-chess-king local-icon-piece local-icon-black"></i>
            <span className="local-icon-vs">VS</span>
            <i className="fas fa-chess-king local-icon-piece local-icon-white"></i>
          </div>
          <h2>Local 1v1</h2>
          <p className="local-desc">Two players, one device. Play chess with a friend on the same screen.</p>
          <div className="local-rules">
            <div className="local-rule">
              <i className="fas fa-user local-rule-icon"></i>
              <span>Player 1: White (bottom)</span>
            </div>
            <div className="local-rule">
              <i className="fas fa-user local-rule-icon"></i>
              <span>Player 2: Black (top)</span>
            </div>
            <div className="local-rule">
              <i className="fas fa-sync-alt local-rule-icon"></i>
              <span>Board flips automatically each turn</span>
            </div>
            <div className="local-rule">
              <i className="fas fa-music local-rule-icon"></i>
              <span>Move sounds + check detection</span>
            </div>
          </div>
          <div className="local-actions">
            <button className="btn btn-primary" onClick={startGame}>
              <i className="fas fa-play"></i> Start Game
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="game-layout">
        <div className="board-section">
          <div className="board-header">
            <div className="board-header-left">
              <i className="fas fa-chess-board board-header-icon"></i>
              <span className="board-label">Local 1v1</span>
            </div>
            <div className="board-header-right">
              <button 
                className={`icon-btn ${soundEnabled ? '' : 'muted'}`} 
                onClick={toggleSound}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                <i className={`fas fa-${soundEnabled ? 'volume-up' : 'volume-mute'}`}></i>
              </button>
              <button 
                className="icon-btn" 
                onClick={toggleBoardFlip}
                title="Flip board"
              >
                <i className="fas fa-exchange-alt"></i>
              </button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <ChessBoard
              fen={fen}
              onMove={handleMove}
              playerColor={turn}
              isGameOver={isGameOver}
              lastMove={lastMove}
              orientation={boardFlipped ? (turn === 'w' ? 'b' : 'w') : turn}
            />
            {isGameOver && (
              <div className="game-over-overlay">
                <div className="result-icon">
                  {winner === 'draw' ? <i className="fas fa-handshake"></i> : <i className="fas fa-trophy"></i>}
                </div>
                <div className="result-text">
                  {winner === 'draw' ? 'Draw' : `${winner} Wins!`}
                </div>
                <div className="result-subtext">{statusText}</div>
                <div className="overlay-buttons">
                  <button className="btn btn-primary btn-sm" onClick={resetGame}>
                    <i className="fas fa-undo-alt"></i> Play Again
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i> Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-panel">
          {/* Player indicators */}
          <div className="player-indicators">
            <div className={`player-indicator ${turn === 'b' ? 'active' : ''}`}>
              <i className="fas fa-chess-king player-indicator-icon black"></i>
              <span className="player-label">Black</span>
              {turn === 'b' && <i className="fas fa-circle player-turn-indicator"></i>}
            </div>
            <div className="player-vs">VS</div>
            <div className={`player-indicator ${turn === 'w' ? 'active' : ''}`}>
              <i className="fas fa-chess-king player-indicator-icon white"></i>
              <span className="player-label">White</span>
              {turn === 'w' && <i className="fas fa-circle player-turn-indicator"></i>}
            </div>
          </div>

          <div className="panel-box">
            <div className="panel-header">
              <h3>Status</h3>
              <span className="panel-badge">{turn === 'w' ? "White's Turn" : "Black's Turn"}</span>
            </div>
            <div className={`status-text ${statusClass}`}>{statusText}</div>
            {moveNotation && !isGameOver && (
              <div className="last-move">
                <i className="fas fa-chevron-right"></i> Last move: <strong>{moveNotation}</strong>
              </div>
            )}

            {/* Material advantage bar */}
            {(whiteMaterial > 0 || blackMaterial > 0) && (
              <div className="material-bar">
                <div className="material-item">
                  <i className="fas fa-chess-king material-icon black"></i>
                  <span className="material-value">+{whiteMaterial}</span>
                </div>
                <span className="material-divider">|</span>
                <div className="material-item">
                  <i className="fas fa-chess-king material-icon white"></i>
                  <span className="material-value">+{blackMaterial}</span>
                </div>
              </div>
            )}

            {/* Game over reason */}
            {isGameOver && (
              <div className="game-over-reason">
                {isCheckmate && <span><i className="fas fa-crown"></i> Checkmate</span>}
                {isStalemate && <span><i className="fas fa-hand-peace"></i> Stalemate</span>}
                {isThreefold && <span><i className="fas fa-redo-alt"></i> Threefold Repetition</span>}
                {isFiftyMove && <span><i className="fas fa-hourglass-half"></i> 50-Move Rule</span>}
                {isInsufficientMaterial && <span><i className="fas fa-chess-pawn"></i> Insufficient Material</span>}
              </div>
            )}
          </div>

          <div className="panel-box">
            <div className="panel-header">
              <h3>Moves</h3>
              <span className="panel-badge">{history.length}</span>
            </div>
            <div className="move-history" ref={moveListRef}>
              <div className="move-grid">
                <div className="move-header">#</div>
                <div className="move-header">White</div>
                <div className="move-header">Black</div>
                {movePairs.map((pair) => (
                  <React.Fragment key={pair.number}>
                    <div className="move-number">{pair.number}.</div>
                    <div className={`move-white ${pair.white?.san?.includes('#') ? 'move-checkmate' : pair.white?.san?.includes('+') ? 'move-check' : ''}`}>
                      {pair.white?.san?.includes('O-O') ? <><i className="fas fa-chess-rook"></i> {pair.white.san}</> : pair.white?.san || ''}
                    </div>
                    <div className={`move-black ${pair.black?.san?.includes('#') ? 'move-checkmate' : pair.black?.san?.includes('+') ? 'move-check' : ''}`}>
                      {pair.black?.san?.includes('O-O') ? <><i className="fas fa-chess-rook"></i> {pair.black.san}</> : pair.black?.san || ''}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-box">
            <h3><i className="fas fa-trash-alt"></i> Captured Pieces</h3>
            <div className="captured-section">
              <div className="captured-group">
                <div className="captured-label">
                  <i className="fas fa-chess-king white"></i> By White
                </div>
                <div className="captured-pieces">
                  {capturedPieces.w.length > 0 ? (
                    capturedPieces.w.sort((a,b) => pieceValues[b] - pieceValues[a]).map((p, i) => (
                      <span key={i} className="piece-icon">{renderCapturedPiece(p, true)}</span>
                    ))
                  ) : (
                    <span className="empty">None</span>
                  )}
                </div>
                {whiteMaterial > 0 && <div className="material-count"><i className="fas fa-plus-circle"></i> +{whiteMaterial}</div>}
              </div>
              <div className="captured-group">
                <div className="captured-label">
                  <i className="fas fa-chess-king black"></i> By Black
                </div>
                <div className="captured-pieces">
                  {capturedPieces.b.length > 0 ? (
                    capturedPieces.b.sort((a,b) => pieceValues[b] - pieceValues[a]).map((p, i) => (
                      <span key={i} className="piece-icon">{renderCapturedPiece(p, false)}</span>
                    ))
                  ) : (
                    <span className="empty">None</span>
                  )}
                </div>
                {blackMaterial > 0 && <div className="material-count"><i className="fas fa-plus-circle"></i> +{blackMaterial}</div>}
              </div>
            </div>
          </div>

          {!isGameOver ? (
            <div className="panel-box">
              <div className="game-controls">
                <button className="btn btn-secondary" onClick={undoLastMove} disabled={history.length === 0}>
                  <i className="fas fa-undo-alt"></i> Undo Move
                </button>
                <button className="btn btn-secondary" onClick={copyPGN}>
                  <i className="fas fa-copy"></i> Copy PGN
                </button>
                <button className="btn btn-danger" onClick={() => { if (window.confirm('Are you sure you want to reset the game?')) resetGame(); }}>
                  <i className="fas fa-redo-alt"></i> Reset Game
                </button>
                <button className="btn btn-secondary" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Leave Game
                </button>
              </div>
            </div>
          ) : (
            <div className="panel-box">
              <div className="game-controls">
                <button className="btn btn-primary" onClick={resetGame}>
                  <i className="fas fa-undo-alt"></i> Play Again
                </button>
                <button className="btn btn-secondary" onClick={copyPGN}>
                  <i className="fas fa-copy"></i> Copy PGN
                </button>
                <button className="btn btn-secondary" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Dialog */}
      {showPromotion && (
        <div className="promotion-overlay" onClick={() => setShowPromotion(false)}>
          <div className="promotion-dialog" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-arrow-up"></i> Promote Pawn</h3>
            <p>Choose a piece</p>
            <div className="promotion-choices">
              {['q', 'r', 'b', 'n'].map(piece => {
                const icons = { q: 'fa-chess-queen', r: 'fa-chess-rook', b: 'fa-chess-bishop', n: 'fa-chess-knight' };
                const labels = { q:'Queen', r:'Rook', b:'Bishop', n:'Knight' };
                return (
                  <button key={piece} className="promotion-choice" onClick={() => handlePromotion(piece)}>
                    <i className={`fas ${icons[piece]} promotion-piece-fa`}></i>
                    <span className="promotion-label">{labels[piece]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocalChess;