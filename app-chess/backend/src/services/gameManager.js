const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor(chessService, pool) {
    this.chessService = chessService;
    this.pool = pool;
    this.activeGames = new Map(); // gameId -> { white, black, spectators, chess, status }
    this.clients = new Map(); // ws -> { userId, gameId, color }
    this.waitingPlayers = []; // { ws, userId, timeControl }
  }

  async createGame(ws, payload) {
    const { userId, timeControl } = payload;
    const gameId = uuidv4();

    this.chessService.createGame(gameId);

    const game = {
      id: gameId,
      white: ws,
      black: null,
      spectators: new Set(),
      chess: this.chessService.getGame(gameId),
      status: 'waiting',
      timeControl: timeControl || { initial: 600, increment: 5 },
      whiteTime: (timeControl?.initial || 600) * 1000,
      blackTime: (timeControl?.initial || 600) * 1000,
      lastMoveTime: Date.now(),
      moves: [],
      result: null,
    };

    this.activeGames.set(gameId, game);
    this.clients.set(ws, { userId, gameId, color: 'white' });

    // Add to waiting list
    this.waitingPlayers.push({ ws, userId, gameId, timeControl });

    ws.send(JSON.stringify({
      type: 'game_created',
      payload: {
        gameId,
        color: 'white',
        timeControl: game.timeControl,
        message: 'Waiting for opponent...',
      }
    }));

    // Try to match with a waiting player
    this.matchPlayers();
  }

  async joinGame(ws, payload) {
    const { gameId, userId } = payload;
    const game = this.activeGames.get(gameId);

    if (!game) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Game not found' } }));
      return;
    }

    if (game.black) {
      // Join as spectator
      game.spectators.add(ws);
      this.clients.set(ws, { userId, gameId, color: 'spectator' });

      const state = this.chessService.getGameState(gameId);
      ws.send(JSON.stringify({
        type: 'game_state',
        payload: { ...state, gameId, color: 'spectator' }
      }));
      return;
    }

    // Join as black player
    game.black = ws;
    game.status = 'active';
    game.lastMoveTime = Date.now();
    this.clients.set(ws, { userId, gameId, color: 'black' });

    // Remove from waiting list if present
    this.waitingPlayers = this.waitingPlayers.filter(p => p.gameId !== gameId);

    const state = this.chessService.getGameState(gameId);

    // Notify both players
    const whiteMsg = JSON.stringify({
      type: 'game_start',
      payload: { ...state, gameId, color: 'white', opponent: 'Black' }
    });
    const blackMsg = JSON.stringify({
      type: 'game_start',
      payload: { ...state, gameId, color: 'black', opponent: 'White' }
    });

    game.white.send(whiteMsg);
    game.black.send(blackMsg);
  }

  async makeMove(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not in a game' } }));
      return;
    }

    const { gameId, color } = client;
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Game is not active' } }));
      return;
    }

    const { from, to, promotion } = payload;

    try {
      const result = this.chessService.makeMove(gameId, from, to, promotion || 'q');
      game.moves.push(result.move);
      game.lastMoveTime = Date.now();

      // Save move to database
      try {
        await this.pool.query(
          `INSERT INTO game_moves (game_id, move_number, move_from, move_to, piece, captured, promotion, san, fen_before, fen_after)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            gameId,
            game.moves.length,
            result.move.from,
            result.move.to,
            result.move.piece,
            result.move.captured || null,
            result.move.promotion || null,
            result.move.san,
            result.move.before,
            result.fen,
          ]
        );
      } catch (dbError) {
        console.error('Failed to save move to DB:', dbError.message);
      }

      // Broadcast move to all players and spectators
      const moveMsg = JSON.stringify({
        type: 'move_made',
        payload: {
          gameId,
          move: result.move,
          fen: result.fen,
          pgn: result.pgn,
          isCheck: result.isCheck,
          isCheckmate: result.isCheckmate,
          isDraw: result.isDraw,
          isStalemate: result.isStalemate,
          isGameOver: result.isGameOver,
          turn: result.turn,
          history: result.history,
        }
      });

      game.white?.send(moveMsg);
      game.black?.send(moveMsg);
      game.spectators.forEach(s => s.send(moveMsg));

      // Handle game over
      if (result.isGameOver) {
        game.status = 'completed';
        let winner = null;
        let resultStr = '*';

        if (result.isCheckmate) {
          winner = result.turn === 'w' ? 'black' : 'white';
          resultStr = winner === 'white' ? '1-0' : '0-1';
        } else if (result.isDraw) {
          resultStr = '1/2-1/2';
        }

        game.result = resultStr;

        const gameOverMsg = JSON.stringify({
          type: 'game_over',
          payload: {
            gameId,
            result: resultStr,
            winner,
            isCheckmate: result.isCheckmate,
            isDraw: result.isDraw,
            isStalemate: result.isStalemate,
            pgn: result.pgn,
          }
        });

        game.white?.send(gameOverMsg);
        game.black?.send(gameOverMsg);
        game.spectators.forEach(s => s.send(gameOverMsg));

        // Save to database
        try {
          await this.pool.query(
            `UPDATE games SET status = 'completed', result = $1, winner = $2, pgn = $3, fen = $4, moves = $5, completed_at = NOW()
             WHERE id = $6`,
            [resultStr, winner, result.pgn, result.fen, game.moves.map(m => m.san), gameId]
          );
        } catch (dbError) {
          console.error('Failed to save game result to DB:', dbError.message);
        }
      }

      // If playing against bot, make bot move
      if (game.botId && !result.isGameOver) {
        setTimeout(() => this.makeBotMove(gameId), 500);
      }

    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
    }
  }

  async makeBotMove(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    try {
      let move;
      switch (game.botId) {
        case 'beginner':
          move = await this.chessService.getBeginnerMove(gameId);
          break;
        case 'intermediate':
          move = await this.chessService.getIntermediateMove(gameId);
          break;
        case 'advanced':
          move = await this.chessService.getAdvancedMove(gameId);
          break;
        case 'expert':
          move = await this.chessService.getExpertMove(gameId);
          break;
        case 'master':
          move = await this.chessService.getMasterMove(gameId);
          break;
        default:
          move = await this.chessService.getIntermediateMove(gameId);
      }

      if (!move) return;

      const result = this.chessService.makeMove(gameId, move.from, move.to, move.promotion || 'q');
      game.moves.push(result.move);

      const moveMsg = JSON.stringify({
        type: 'move_made',
        payload: {
          gameId,
          move: result.move,
          fen: result.fen,
          pgn: result.pgn,
          isCheck: result.isCheck,
          isCheckmate: result.isCheckmate,
          isDraw: result.isDraw,
          isStalemate: result.isStalemate,
          isGameOver: result.isGameOver,
          turn: result.turn,
          history: result.history,
        }
      });

      game.white?.send(moveMsg);
      game.black?.send(moveMsg);

      if (result.isGameOver) {
        game.status = 'completed';
        let winner = null;
        let resultStr = '*';

        if (result.isCheckmate) {
          winner = result.turn === 'w' ? 'black' : 'white';
          resultStr = winner === 'white' ? '1-0' : '0-1';
        } else if (result.isDraw) {
          resultStr = '1/2-1/2';
        }

        game.result = resultStr;

        const gameOverMsg = JSON.stringify({
          type: 'game_over',
          payload: {
            gameId,
            result: resultStr,
            winner,
            isCheckmate: result.isCheckmate,
            isDraw: result.isDraw,
            isStalemate: result.isStalemate,
            pgn: result.pgn,
          }
        });

        game.white?.send(gameOverMsg);
        game.black?.send(gameOverMsg);
      }
    } catch (error) {
      console.error('Bot move error:', error.message);
    }
  }

  async resign(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { gameId, color } = client;
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    game.status = 'completed';
    const winner = color === 'white' ? 'black' : 'white';
    game.result = winner === 'white' ? '1-0' : '0-1';

    const msg = JSON.stringify({
      type: 'game_over',
      payload: {
        gameId,
        result: game.result,
        winner,
        reason: `${color === 'white' ? 'White' : 'Black'} resigned`,
      }
    });

    game.white?.send(msg);
    game.black?.send(msg);
    game.spectators.forEach(s => s.send(msg));
  }

  async drawOffer(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { gameId, color } = client;
    const game = this.activeGames.get(gameId);
    if (!game) return;

    const opponent = color === 'white' ? game.black : game.white;
    if (opponent) {
      opponent.send(JSON.stringify({
        type: 'draw_offer',
        payload: { gameId, from: color }
      }));
    }
  }

  async drawResponse(ws, payload) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { gameId, color } = client;
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    if (payload.accept) {
      game.status = 'completed';
      game.result = '1/2-1/2';

      const msg = JSON.stringify({
        type: 'game_over',
        payload: {
          gameId,
          result: '1/2-1/2',
          winner: 'draw',
          reason: 'Draw agreed',
        }
      });

      game.white?.send(msg);
      game.black?.send(msg);
      game.spectators.forEach(s => s.send(msg));
    } else {
      const opponent = color === 'white' ? game.black : game.white;
      if (opponent) {
        opponent.send(JSON.stringify({
          type: 'draw_declined',
          payload: { gameId }
        }));
      }
    }
  }

  async playBot(ws, payload) {
    const { userId, botId } = payload;
    const gameId = uuidv4();

    this.chessService.createGame(gameId);

    const game = {
      id: gameId,
      white: ws,
      black: null,
      spectators: new Set(),
      chess: this.chessService.getGame(gameId),
      status: 'active',
      botId,
      timeControl: { initial: 600, increment: 5 },
      moves: [],
      result: null,
    };

    this.activeGames.set(gameId, game);
    this.clients.set(ws, { userId, gameId, color: 'white' });

    const state = this.chessService.getGameState(gameId);
    ws.send(JSON.stringify({
      type: 'game_start',
      payload: {
        ...state,
        gameId,
        color: 'white',
        opponent: `Bot (${botId})`,
        isBot: true,
      }
    }));
  }

  matchPlayers() {
    if (this.waitingPlayers.length < 2) return;

    const player1 = this.waitingPlayers.shift();
    const player2 = this.waitingPlayers.shift();

    // Player1 stays as white, player2 joins as black
    const gameId = player1.gameId;
    const game = this.activeGames.get(gameId);

    if (game && !game.black) {
      game.black = player2.ws;
      game.status = 'active';
      game.lastMoveTime = Date.now();
      this.clients.set(player2.ws, { userId: player2.userId, gameId, color: 'black' });

      const state = this.chessService.getGameState(gameId);

      player1.ws.send(JSON.stringify({
        type: 'game_start',
        payload: { ...state, gameId, color: 'white', opponent: 'Black' }
      }));

      player2.ws.send(JSON.stringify({
        type: 'game_start',
        payload: { ...state, gameId, color: 'black', opponent: 'White' }
      }));
    }
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { gameId, color } = client;
    const game = this.activeGames.get(gameId);

    if (game) {
      if (game.status === 'active') {
        // Notify opponent
        const opponent = color === 'white' ? game.black : game.white;
        if (opponent && opponent !== ws) {
          opponent.send(JSON.stringify({
            type: 'opponent_disconnected',
            payload: { gameId, message: 'Your opponent disconnected' }
          }));
        }
      }

      // Clean up game
      this.activeGames.delete(gameId);
      this.chessService.deleteGame(gameId);
    }

    // Remove from waiting list
    this.waitingPlayers = this.waitingPlayers.filter(p => p.ws !== ws);
    this.clients.delete(ws);
  }
}

module.exports = { GameManager };