import React, { useEffect, useRef, useCallback } from 'react';

// Load jQuery and chessboard.js globally
const loadScripts = () => {
  return new Promise((resolve) => {
    if (window.$ && window.Chessboard) {
      resolve();
      return;
    }

    // Load jQuery
    const jqScript = document.createElement('script');
    jqScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
    jqScript.onload = () => {
      // Load chessboard.js
      const cbScript = document.createElement('script');
      cbScript.src = 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js';
      cbScript.onload = resolve;
      document.head.appendChild(cbScript);
    };
    document.head.appendChild(jqScript);
  });
};

function ChessBoard({ fen, onMove, playerColor, isGameOver }) {
  const boardRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const initializedRef = useRef(false);
  
  // Use refs for callbacks to avoid stale closures
  const onMoveRef = useRef(onMove);
  const playerColorRef = useRef(playerColor);
  const isGameOverRef = useRef(isGameOver);

  // Keep refs in sync with props
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

  // Initialize board once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadScripts();
      if (!mounted) return;

      if (!boardRef.current || initializedRef.current) return;

      const Chessboard = window.Chessboard;

      const config = {
        draggable: true,
        position: fen || 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: (source, piece) => {
          if (isGameOverRef.current) return false;
          if (playerColorRef.current === 'white' && piece.search(/^b/) !== -1) return false;
          if (playerColorRef.current === 'black' && piece.search(/^w/) !== -1) return false;
          return true;
        },
        onDrop: (source, target) => {
          if (onMoveRef.current) {
            onMoveRef.current(source, target);
          }
          return 'snapback'; // Always snap back, position updated via fen prop
        },
        onSnapEnd: () => {
          // Position updated via fen prop effect below
        },
      };

      boardInstanceRef.current = Chessboard(boardRef.current, config);
      initializedRef.current = true;
    };

    init();

    return () => { mounted = false; };
  }, []); // Only run once on mount

  // Update position when fen changes
  useEffect(() => {
    if (boardInstanceRef.current && fen) {
      boardInstanceRef.current.position(fen, false);
    }
  }, [fen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (boardInstanceRef.current) {
        try {
          boardInstanceRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        boardInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  return <div id="chess-board" ref={boardRef}></div>;
}

export default ChessBoard;