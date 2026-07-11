const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chess-secret-key-change-in-production';

// Middleware to extract user from token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Token invalid, continue as guest
    }
  }
  next();
}

router.use(authMiddleware);

// Get game history for a user
router.get('/history', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const userId = req.user?.id;

    if (!userId) {
      return res.json({ success: true, data: [] });
    }

    const result = await pool.query(
      `SELECT g.id, g.status, g.result, g.winner, g.pgn, g.started_at, g.completed_at,
              w.username as white_player, b.username as black_player
       FROM games g
       LEFT JOIN users w ON g.white_player_id = w.id
       LEFT JOIN users b ON g.black_player_id = b.id
       WHERE g.white_player_id = $1 OR g.black_player_id = $1
       ORDER BY g.started_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific game
router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { id } = req.params;

    const result = await pool.query(
      `SELECT g.*, w.username as white_player, b.username as black_player,
              COALESCE(json_agg(json_build_object(
                'move_number', gm.move_number,
                'san', gm.san,
                'from', gm.move_from,
                'to', gm.move_to,
                'piece', gm.piece,
                'captured', gm.captured,
                'fen_before', gm.fen_before,
                'fen_after', gm.fen_after
              ) ORDER BY gm.move_number) FILTER (WHERE gm.id IS NOT NULL), '[]') as moves
       FROM games g
       LEFT JOIN users w ON g.white_player_id = w.id
       LEFT JOIN users b ON g.black_player_id = b.id
       LEFT JOIN game_moves gm ON gm.game_id = g.id
       WHERE g.id = $1
       GROUP BY g.id, w.username, b.username`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const pool = req.app.get('db');

    const result = await pool.query(
      `SELECT username, rating, games_played, games_won, games_drawn, games_lost,
              ROUND(CASE WHEN games_played > 0 THEN (games_won::decimal / games_played) * 100 ELSE 0 END, 1) as win_rate
       FROM users
       WHERE games_played > 0
       ORDER BY rating DESC
       LIMIT 100`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;