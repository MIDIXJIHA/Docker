# RapidKL Tracker - Full Stack Application

A complete web application for tracking Malaysian RapidKL public transit in real-time.

## Overview

This application provides real-time tracking of RapidKL (Malaysia's public transit system) with:
- **Frontend**: React-based dashboard with route selection and real-time transit visualization
- **Backend**: Node.js Express API server with RapidKL data parsing
- **Component**: Reusable `rapidkl-component` for easy API integration
- **Docker**: Complete containerized setup with nginx reverse proxy

## Project Structure

```
app-rapidkl/
├── backend/           # Node.js Express API server
├── frontend/          # React dashboard application
├── docker/            # Docker configuration
│   ├── nginx/         # Nginx reverse proxy config
│   └── node/          # Node.js Dockerfile
├── docker-compose.yml # Container orchestration
└── README.md
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Docker and Docker Compose
- RapidKL API key from https://developer.data.gov.my

## Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```env
RAPIDKL_API_KEY=your_api_key_from_data_gov_my
RAPIDKL_API_BASE_URL=https://developer.data.gov.my
MAPBOX_TOKEN=your_mapbox_token_optional
```

### 2. Docker Setup (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Nginx proxy: http://localhost
```

### 3. Local Development Setup

#### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## API Endpoints

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:routeId` - Get specific route
- `GET /api/routes/search?q=query` - Search routes

### Transits
- `GET /api/transits/:routeId` - Get transits for a route

### Stops
- `GET /api/stops/:stopId` - Get stop details
- `GET /api/stops/:stopId/arrivals` - Get arrivals at a stop

### Service
- `GET /api/status` - Get service status
- `POST /api/cache/clear` - Clear API cache

## Frontend Features

- **Route List**: Browse and search all available RapidKL routes
- **Real-time Transit**: View active transits on each route
- **Occupancy Status**: See how crowded each transit is
- **Delay Tracking**: Monitor on-time status and delays
- **Auto-refresh**: Automatic data updates every 30 seconds
- **Responsive Design**: Works on desktop and mobile

## Backend Features

- **RapidKL API Integration**: Fetches and parses official RapidKL data
- **Caching**: Redis-compatible caching system
- **Error Handling**: Graceful error handling and logging
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Checks**: Service health monitoring

## Component Usage

The `rapidkl-component` can be used independently:

```javascript
const { RapidKLService } = require('rapidkl-component');

const service = new RapidKLService();
await service.initialize();

const routes = service.getRoutes();
const transits = await service.getTransitsByRoute('LRT1');
```

## Development

### Hot Reloading

The application supports hot module reloading:

- **Frontend**: React hot reload enabled by default
- **Backend**: Uses nodemon for automatic restart

### Debugging

- Frontend: Use browser DevTools (F12)
- Backend: Check console logs in terminal

### Testing

```bash
# Test the component
cd ../../rapidkl-component
npm test
```

## Production Deployment

### Build Docker Images

```bash
docker-compose build --no-cache
```

### Environment Variables for Production

Set these in your production environment:

```env
NODE_ENV=production
RAPIDKL_API_KEY=your_production_key
CACHE_ENABLED=true
CACHE_TTL=600
```

## Troubleshooting

### API Connection Failed
- Check if `RAPIDKL_API_KEY` is set correctly
- Verify the API endpoint is accessible
- Check network connectivity

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS configuration in backend/src/server.js
- Verify REACT_APP_API_URL environment variable

### Docker Issues
- Clear volumes: `docker-compose down -v`
- Rebuild: `docker-compose build --no-cache`
- Check logs: `docker-compose logs -f`

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP/HTTPS
       ▼
┌─────────────────┐
│ Nginx Reverse   │
│ Proxy (Port 80) │
└─────┬───────────┘
      │
      ├──────┬──────────┐
      │      │          │
      ▼      ▼          ▼
   React   Node.js   Static
   App     Backend   Files
 (3000)    (5000)
      │      │
      │      └─────────┐
      │                │
      ▼                ▼
  RapidKL API    rapidkl-
  (data.gov.my)  component
```

## License

MIT

## Support

For issues or questions, refer to:
- RapidKL API Docs: https://developer.data.gov.my
- React Documentation: https://react.dev
- Express Documentation: https://expressjs.com
