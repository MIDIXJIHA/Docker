# Chess Docker Container

A full-stack chess application with real-time multiplayer, AI bot opponents, and PostgreSQL persistence. Built with React, Node.js/Express, chess.js, and chessboard.js.

## 📋 Structure

```
app-chess/
├── docker-compose.yml           # Container orchestration
├── .env                         # Environment variables
├── .env.example                 # Example environment config
├── README.md
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf           # Nginx main config
│   │   └── default.conf         # Nginx site config with WebSocket support
│   ├── node/
│   │   └── Dockerfile           # Node.js 18 backend container
│   └── postgres/
│       └── init.sql             # Database schema initialization
├── backend/
│   ├── package.json             # Node.js dependencies
│   └── src/
│       ├── server.js            # Express + WebSocket server
│       ├── routes/
│       │   ├── auth.js          # Authentication routes (register, login, guest)
│       │   └── games.js         # Game history & leaderboard routes
│       └── services/
│           ├── chessService.js  # Chess game logic (chess.js wrapper + AI bots)
│           └── gameManager.js   # WebSocket game session management
└── frontend/
    ├── Dockerfile               # React frontend container
    ├── package.json             # React dependencies
    ├── public/
    │   └── index.html           # HTML entry point
    └── src/
        ├── index.js             # React entry point
        ├── App.js               # Main application component
        ├── components/
        │   └── ChessBoard.js    # Chessboard UI component
        ├── services/
        │   └── api.js           # REST API client
        └── styles/
            └── index.css        # Application styles
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Starting the Application

```bash
# Navigate to the container directory
cd app-chess

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Access the Application

- **Web Interface**: http://localhost
- **Backend API**: http://localhost:5002/api
- **Health Check**: http://localhost:5002/api/health
- **WebSocket**: ws://localhost:5002/ws

### Stopping the Application

```bash
docker-compose down
```

## ⚙️ Configuration

Edit the `.env` file to customize settings:

```env
# PostgreSQL Configuration
POSTGRES_DB=chessdb
POSTGRES_USER=chessuser
POSTGRES_PASSWORD=chesspass123

# Backend Configuration
NODE_ENV=development
PORT=5002
DB_HOST=db
DB_PORT=5432
JWT_SECRET=change-this-to-a-secure-random-secret

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5002/api
```

## 🎮 Features

### Game Modes
- **Play Online** - Match with a random opponent via WebSocket
- **Play vs Bot** - Practice against AI opponents with different play styles

### AI Bots
| Bot | Rating | Description |
|-----|--------|-------------|
| **Random Mover** | 800 | Makes random legal moves |
| **Aggressive Bot** | 1200 | Prioritizes captures, checks, and center control |
| **Defensive Bot** | 1400 | Focuses on king safety, piece development, and protection |

### Game Features
- Full chess rules engine (chess.js)
- Drag-and-drop piece movement
- Real-time move updates via WebSocket
- Move history with algebraic notation
- Captured pieces tracking
- Check, checkmate, stalemate, and draw detection
- Draw offers and resignations
- Auto-promotion to queen
- Persistent game storage in PostgreSQL

## 🔧 Services

| Service | Image | Port | Container Name |
|---------|-------|------|----------------|
| **Web Server** | nginx:alpine | 80, 443 | chess-nginx |
| **Frontend** | node:18-alpine | 3000 | chess-frontend |
| **Backend API** | node:18-alpine | 5002 | chess-backend |
| **Database** | postgres:16-alpine | 5432 | chess-postgres |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Guest login
- `GET /api/auth/profile` - Get user profile

### Games
- `GET /api/games/history` - Get user's game history
- `GET /api/games/:id` - Get specific game with moves
- `GET /api/games/leaderboard` - Get top players

### Bots
- `GET /api/bots` - List available AI bots

### WebSocket Messages
- `create_game` - Create a new online game
- `join_game` - Join an existing game
- `make_move` - Make a chess move
- `resign` - Resign from game
- `draw_offer` - Offer a draw
- `draw_response` - Accept/decline draw
- `play_bot` - Start a game against AI

## 📚 Common Commands

```bash
# View container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands inside containers
docker-compose exec backend node -v
docker-compose exec frontend sh

# Access PostgreSQL
docker-compose exec db psql -U chessuser -d chessdb

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Reset database
docker-compose down -v
docker-compose up -d
```

## 🔐 Security Notes

- Change `JWT_SECRET` in `.env` for production use
- Update default PostgreSQL passwords
- The application runs on HTTP by default; configure SSL for production
- Guest users have limited functionality

## 🗄️ Database Schema

### Users
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - bcrypt hashed password
- `rating` - ELO rating (default: 1200)
- `games_played/won/drawn/lost` - Statistics

### Games
- `id` - Primary key
- `white_player_id` / `black_player_id` - References users
- `status` - active, completed, abandoned
- `result` - 1-0, 0-1, 1/2-1/2
- `pgn` - Portable Game Notation
- `fen` - Current board position
- `moves` - Array of move notations

### Game Moves
- `id` - Primary key
- `game_id` - References game
- `move_number` - Sequential move number
- `move_from` / `move_to` - Source and target squares
- `piece` / `captured` / `promotion` - Move details
- `san` - Standard Algebraic Notation
- `fen_before` / `fen_after` - Board state snapshots