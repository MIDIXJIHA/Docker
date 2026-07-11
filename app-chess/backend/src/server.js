require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { ChessService } = require('./services/chessService');
const { GameManager } = require('./services/gameManager');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chessdb',
  user: process.env.DB_USER || 'chessuser',
  password: process.env.DB_PASSWORD || 'chesspass123',
});

// Middleware
app.use(cors());
app.use(express.json());

// Make pool available to routes
app.set('db', pool);

// Services
const chessService = new ChessService();
const gameManager = new GameManager(chessService, pool);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get available bots
app.get('/api/bots', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'beginner', name: 'Beginner Bot', rating: 800, description: 'Stockfish at skill level 1 - makes basic moves' },
      { id: 'intermediate', name: 'Intermediate Bot', rating: 1200, description: 'Stockfish at skill level 5 - moderate strength' },
      { id: 'advanced', name: 'Advanced Bot', rating: 1500, description: 'Stockfish at skill level 10 - strong play' },
      { id: 'expert', name: 'Expert Bot', rating: 2000, description: 'Stockfish at skill level 15 - very strong' },
      { id: 'master', name: 'Master Bot', rating: 2500, description: 'Stockfish at skill level 20 - full strength' },
    ]
  });
});

// WebSocket server for real-time games
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { type, payload } = message;

      switch (type) {
        case 'create_game':
          await gameManager.createGame(ws, payload);
          break;
        case 'join_game':
          await gameManager.joinGame(ws, payload);
          break;
        case 'make_move':
          await gameManager.makeMove(ws, payload);
          break;
        case 'resign':
          await gameManager.resign(ws, payload);
          break;
        case 'draw_offer':
          await gameManager.drawOffer(ws, payload);
          break;
        case 'draw_response':
          await gameManager.drawResponse(ws, payload);
          break;
        case 'play_bot':
          await gameManager.playBot(ws, payload);
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Unknown message type' } }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    gameManager.handleDisconnect(ws);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, async () => {
  console.log(`\n[i] Chess Backend running on port ${PORT}`);
  console.log(`[i] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[i] WebSocket: ws://localhost:${PORT}/ws\n`);

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✓ PostgreSQL connected: ${result.rows[0].now}`);
    client.release();
  } catch (error) {
    console.error('✗ PostgreSQL connection failed:', error.message);
  }
});