const initEngine = require('stockfish');

class StockfishService {
  constructor() {
    this.engine = null;
    this.ready = false;
    this.pendingResolve = null;
    this.pendingReject = null;
    this.buffer = '';
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        this.engine = await initEngine();
        this.ready = true;

        // Set UCI protocol
        this.sendCommand('uci');
        await this.waitFor('uciok');

        // Set default options
        this.sendCommand('setoption name UCI_AnalyseMode value true');
        this.sendCommand('setoption name MultiPV value 1');

        console.log('✓ Stockfish engine initialized');
        resolve();
      } catch (err) {
        console.error('✗ Stockfish engine initialization failed:', err.message);
        reject(err);
      }
    });

    return this.initPromise;
  }

  sendCommand(cmd) {
    if (!this.engine) return;
    this.engine.sendCommand(cmd);
  }

  waitFor(expected) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for: ${expected}`));
      }, 10000);

      const handler = (line) => {
        this.buffer += line + '\n';
        if (line.includes(expected)) {
          clearTimeout(timeout);
          this.engine.onmessage = null;
          resolve();
        }
      };

      this.engine.onmessage = handler;
    });
  }

  async getBestMove(fen, options = {}) {
    const {
      skillLevel = 10,       // 0 (weak) to 20 (strong)
      moveTime = 500,        // ms to think
      depth = 12,            // search depth limit
    } = options;

    if (!this.ready) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.engine.onmessage = null;
        reject(new Error('Stockfish getBestMove timeout'));
      }, moveTime + 3000);

      let bestMove = null;
      let bestMoveFound = false;

      // Set skill level
      this.sendCommand(`setoption name Skill Level value ${skillLevel}`);

      // Set position
      this.sendCommand(`position fen ${fen}`);

      // Start calculation
      this.sendCommand(`go movetime ${moveTime} depth ${depth}`);

      this.engine.onmessage = (line) => {
        // Parse bestmove from output
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          bestMove = parts[1];
          bestMoveFound = true;
        }

        // Also parse info lines for score
        if (line.startsWith('info') && line.includes('score')) {
          // Could extract score for evaluation display
        }

        if (bestMoveFound) {
          clearTimeout(timeout);
          this.engine.onmessage = null;

          if (bestMove && bestMove !== '(none)') {
            // Convert from e2e4 format to { from: 'e2', to: 'e4' }
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
            resolve({ from, to, promotion });
          } else {
            resolve(null);
          }
        }
      };
    });
  }

  async getBestMoveWithScore(fen, options = {}) {
    const move = await this.getBestMove(fen, options);
    return move;
  }

  // Set position and get evaluation
  async evaluate(fen) {
    if (!this.ready) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.engine.onmessage = null;
        reject(new Error('Stockfish evaluate timeout'));
      }, 5000);

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand('go depth 8');

      this.engine.onmessage = (line) => {
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          this.engine.onmessage = null;
          resolve();
        }
      };
    });
  }

  // Clean up
  destroy() {
    if (this.engine) {
      this.sendCommand('quit');
      this.engine = null;
      this.ready = false;
    }
  }
}

module.exports = { StockfishService };