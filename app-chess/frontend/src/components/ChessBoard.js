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

function ChessBoard({ fen, onMove, playerColor, isGameOver, lastMove, orientation }) {
  const boardRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const initializedRef = useRef(false);
  
  // Use refs for callbacks to avoid stale closures
  const onMoveRef = useRef(onMove);
  const playerColorRef = useRef(playerColor);
  const isGameOverRef = useRef(isGameOver);
  const lastMoveRef = useRef(lastMove);
  const orientationRef = useRef(orientation);

  // Keep refs in sync with props
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { lastMoveRef.current = lastMove; }, [lastMove]);
  useEffect(() => { orientationRef.current = orientation; }, [orientation]);

  // Initialize board once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadScripts();
      if (!mounted) return;

      if (!boardRef.current || initializedRef.current) return;

      const Chessboard = window.Chessboard;

      // Determine initial orientation: 'w' = white at bottom, 'b' = black at bottom
      const initOrientation = orientationRef.current === 'b' ? 'black' : 'white';

      const config = {
        draggable: true,
        position: fen || 'start',
        orientation: initOrientation,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: (source, piece) => {
          if (isGameOverRef.current) return false;
          // In local mode, allow dragging pieces of the current turn's color
          // In online mode, only allow dragging your own color
          const color = playerColorRef.current;
          if (color === 'w' && piece.search(/^b/) !== -1) return false;
          if (color === 'b' && piece.search(/^w/) !== -1) return false;
          // If color is 'white' or 'black' (online mode), restrict to that color
          if (color === 'white' && piece.search(/^b/) !== -1) return false;
          if (color === 'black' && piece.search(/^w/) !== -1) return false;
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

  // Flip board orientation when turn changes (local mode)
  useEffect(() => {
    if (boardInstanceRef.current && orientation) {
      const orient = orientation === 'b' ? 'black' : 'white';
      boardInstanceRef.current.orientation(orient);
    }
  }, [orientation]);

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