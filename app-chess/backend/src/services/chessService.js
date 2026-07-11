const { Chess } = require('chess.js');
const { StockfishService } = require('./stockfishService');

class ChessService {
  constructor() {
    this.games = new Map(); // gameId -> Chess instance
    this.stockfish = new StockfishService();
  }

  createGame(gameId, fen) {
    const chess = fen ? new Chess(fen) : new Chess();
    this.games.set(gameId, chess);
    return chess;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  makeMove(gameId, from, to, promotion = 'q') {
    const chess = this.games.get(gameId);
    if (!chess) throw new Error('Game not found');

    const move = chess.move({ from, to, promotion });
    if (!move) throw new Error('Illegal move');

    return {
      move,
      fen: chess.fen(),
      pgn: chess.pgn(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isStalemate: chess.isStalemate(),
      isGameOver: chess.isGameOver(),
      turn: chess.turn(),
      history: chess.history({ verbose: true }),
    };
  }

  undoMove(gameId) {
    const chess = this.games.get(gameId);
    if (!chess) throw new Error('Game not found');

    const move = chess.undo();
    if (!move) throw new Error('No moves to undo');

    return {
      move,
      fen: chess.fen(),
      pgn: chess.pgn(),
      turn: chess.turn(),
      history: chess.history({ verbose: true }),
    };
  }

  getGameState(gameId) {
    const chess = this.games.get(gameId);
    if (!chess) throw new Error('Game not found');

    return {
      fen: chess.fen(),
      pgn: chess.pgn(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isStalemate: chess.isStalemate(),
      isGameOver: chess.isGameOver(),
      turn: chess.turn(),
      history: chess.history({ verbose: true }),
    };
  }

  loadGame(gameId, pgn) {
    const chess = new Chess();
    chess.loadPgn(pgn);
    this.games.set(gameId, chess);
    return chess;
  }

  loadFen(gameId, fen) {
    const chess = new Chess(fen);
    this.games.set(gameId, chess);
    return chess;
  }

  deleteGame(gameId) {
    this.games.delete(gameId);
  }

  getLegalMoves(gameId, square) {
    const chess = this.games.get(gameId);
    if (!chess) throw new Error('Game not found');

    if (square) {
      return chess.moves({ square, verbose: true });
    }
    return chess.moves({ verbose: true });
  }

  isMoveLegal(gameId, from, to) {
    const chess = this.games.get(gameId);
    if (!chess) return false;

    const moves = chess.moves({ verbose: true });
    return moves.some(m => m.from === from && m.to === to);
  }

  // Stockfish-powered bot moves
  async getStockfishMove(gameId, skillLevel = 10, moveTime = 500) {
    const chess = this.games.get(gameId);
    if (!chess) throw new Error('Game not found');

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    try {
      const stockfishMove = await this.stockfish.getBestMove(chess.fen(), {
        skillLevel,
        moveTime,
        depth: 12,
      });

      if (!stockfishMove) {
        // Fallback to random if Stockfish fails
        return moves[Math.floor(Math.random() * moves.length)];
      }

      // Find the matching verbose move from chess.js
      const matchedMove = moves.find(
        m => m.from === stockfishMove.from && m.to === stockfishMove.to
      );

      if (matchedMove) {
        return matchedMove;
      }

      // If Stockfish suggests a promotion, try to match with promotion
      if (stockfishMove.promotion) {
        const promoMove = moves.find(
          m => m.from === stockfishMove.from && m.to === stockfishMove.to && m.promotion === stockfishMove.promotion
        );
        if (promoMove) return promoMove;
      }

      // Fallback to random if move not found in legal moves
      return moves[Math.floor(Math.random() * moves.length)];
    } catch (err) {
      console.error('Stockfish error, falling back to random move:', err.message);
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }

  // Bot AI: Beginner (Stockfish skill 1) - ~800 Elo
  async getBeginnerMove(gameId) {
    return this.getStockfishMove(gameId, 1, 200);
  }

  // Bot AI: Intermediate (Stockfish skill 5) - ~1200 Elo
  async getIntermediateMove(gameId) {
    return this.getStockfishMove(gameId, 5, 400);
  }

  // Bot AI: Advanced (Stockfish skill 10) - ~1500 Elo
  async getAdvancedMove(gameId) {
    return this.getStockfishMove(gameId, 10, 600);
  }

  // Bot AI: Expert (Stockfish skill 15) - ~2000 Elo
  async getExpertMove(gameId) {
    return this.getStockfishMove(gameId, 15, 800);
  }

  // Bot AI: Master (Stockfish skill 20) - ~2500+ Elo
  async getMasterMove(gameId) {
    return this.getStockfishMove(gameId, 20, 1000);
  }
}

module.exports = { ChessService };