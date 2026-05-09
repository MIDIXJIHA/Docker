# 🚊 Malaysia Transit Hub - Real-Time Vehicle Tracking

A production-grade full-stack application for tracking Malaysian public transit in real-time using GTFS data and Mapbox GL.

## Overview

This application provides comprehensive real-time tracking of Malaysian transit operators with:
- **🗺️ Interactive Maps**: Real-time vehicle positions on Mapbox GL maps
- **🚗 Live Tracking**: 30-second updates with vehicle speed, bearing, and route information
- **📍 Multi-Operator Support**: KTMB (KTM trains), Prasarana (LRT/MRT/Monorail/Buses), BAS.MY (Stage buses)
- **📊 GTFS Integration**: Complete route schedules, stops, and timetable data
- **🌦️ Weather Integration**: Real-time forecasts and weather alerts from MET Malaysia
- **💼 Professional UI**: Production-grade dashboard with responsive design
- **🐳 Docker Ready**: Complete containerized setup with Nginx reverse proxy

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
- **Mapbox Account** (free): https://account.mapbox.com/auth/signup/
- Malaysia Open Data Portal Account (optional): https://developer.data.gov.my

## Quick Start - Docker (Recommended)

```bash
# 1. Clone and navigate
cd /path/to/containers/app-rapidkl

# 2. Set up environment with Mapbox token
cp .env.example .env
# Edit .env and add your Mapbox token:
# REACT_APP_MAPBOX_TOKEN=pk.eyJ1...your_token...

# 3. Build and start all services
docker-compose up --build

# 4. Access the application
# Browser: http://localhost
# or
# Frontend directly: http://localhost:3000
# Backend API: http://localhost:5001/api
```

## Getting a Mapbox Token

1. Visit https://account.mapbox.com/auth/signup/
2. Create a free account (allows up to 50,000 map loads/month)
3. Go to "Tokens" in your account dashboard
4. Create a new token with scope: `Maps:Read`, `CORS:Enabled`
5. Copy the token and paste it in your `.env` file as `REACT_APP_MAPBOX_TOKEN`

## Environment Setup

Create/update `.env` in the project root:

```env
# Backend
NODE_ENV=development
PORT=5001
CACHE_ENABLED=true
CACHE_TTL=300

# Frontend
REACT_APP_API_URL=http://localhost:5001/api

# Mapbox - REQUIRED for real-time map tracking
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieW91ciIsImEiOiJjazAwMDAwMDAwIn0.XXXXXXX

# Malaysia Open Data Portal (Optional)
RAPIDKL_API_KEY=your_api_key_here
RAPIDKL_API_BASE_URL=https://developer.data.gov.my
```

## Core Features

### 🗺️ Real-Time Vehicle Tracking Map
- Interactive Mapbox GL map showing live vehicle positions
- Color-coded by operator (Red: KTMB, Blue: Prasarana, Orange: BAS.MY)
- Vehicle markers with bearing/direction indicator
- Popup information on hover with speed, route, trip ID
- Auto-fit to show all active vehicles
- Click vehicle in sidebar to fly map to location

### 📋 Route & Schedule Browsing
- Search and filter routes by operator
- View all stops on a route with geographic coordinates
- Display complete timetables (stop times) for each route
- One-click navigation to schedule for each stop

### 🌦️ Weather Integration
- 7-day weather forecast for major Malaysian cities
- Weather alerts and warnings
- Earthquake warning data
- Updates every 30 minutes

### 🚗 Auto-Refresh System
- Vehicles update every 30 seconds
- Toggleable auto-refresh with manual refresh option
- Efficient client-side caching

### 📱 Responsive Design
- Desktop: Full sidebar with vehicle list
- Tablet: Adjusted layout with collapsible panels
- Mobile: Bottom panel for vehicle list, full-screen map

## Supported Transit Operators

### KTMB (KTM Trains)
- 🚆 All KTM train routes nationwide
- GTFS Static: Daily updates at 00:01 UTC
- GTFS Realtime: Vehicle positions every 30s

### Prasarana (LRT/MRT/Monorail)
- 🚊 rapid-kl (KL LRT)
- rapid-rail-kl (KL Monorail)
- rapid-bus-kl (KL City Buses)
- rapid-bus-mrtfeeder (MRT Feeder Buses)
- rapid-bus-kuantan (Kuantan Buses)
- rapid-bus-penang (Penang Buses)
- Updates as needed via Open Data Portal

### BAS.MY (State Buses)
- 🚌 Multiple regional operators:
  - Kangar (Perlis)
  - Alor Setar (Kedah)
  - Kota Bharu (Kelantan)
  - Kuala Terengganu (Terengganu)
  - Ipoh (Perak)
  - Seremban A & B (Negeri Sembilan)
  - Melaka, Johor, Kuching

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check

### Operators
- `GET /api/operators` - List all operators with metadata

### GTFS Static Data (Routes & Schedules)
- `GET /api/gtfs/:operator/routes` - All routes for operator
- `GET /api/gtfs/:operator/stops` - All stops for operator
- `GET /api/gtfs/:operator/routes/:routeId/stops` - Stops on specific route
- `GET /api/gtfs/:operator/routes/:routeId/schedule?stopId=X` - Timetable for stop

### GTFS Realtime Data (Vehicle Positions)
- `GET /api/realtime/operators` - List realtime-capable operators
- `GET /api/realtime/vehicle-positions/:operator` - Current vehicle positions (protobuf decoded)

### Weather Data
- `GET /api/weather/forecast` - 7-day weather forecast
- `GET /api/weather/warnings` - Active weather warnings
- `GET /api/weather/earthquake-warnings` - Earthquake data

## Dashboard Tabs

### 📋 Schedule Tab
- Browse routes and stops
- View complete timetables
- Search routes by name
- Click on stops to see timetable details
- Responsive grid layout for stop times

### 🚗 Realtime Tab
- Interactive Mapbox map with live vehicles
- Vehicle sidebar showing active vehicles
- Real-time updates every 30 seconds
- Click vehicle to see detailed information:
  - Vehicle ID, Route ID, Speed
  - Bearing (direction), GPS coordinates
  - Trip information
- Auto-refresh toggle
- Show/hide routes toggle

### 🌦️ Weather Tab
- 7-day forecast for 5 major Malaysian cities
- Current conditions with temperature
- Precipitation and wind data
- Active warnings and alerts
- Color-coded weather severity

## Advanced Features

### Map Interactions
- Zoom in/out to see vehicle details
- Pan to follow vehicles
- Popup information on vehicle markers
- Sidebar vehicle list with quick navigation
- Bearing indicator on vehicle markers

### Data Caching
- GTFS data cached for 24 hours to reduce API load
- Client-side caching of vehicle position data
- Configurable cache TTL via environment

### Error Handling
- Graceful fallback when data unavailable
- Clear error messages to user
- Automatic retry for transient failures
- Rate limit awareness for external APIs

## Local Development

### Backend Development
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5001
```

### Frontend Development
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000 with hot reload
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5001/api/health

# List operators
curl http://localhost:5001/api/operators

# Get routes for KTMB
curl http://localhost:5001/api/gtfs/ktmb/routes

# Get live vehicles for KTMB
curl http://localhost:5001/api/realtime/vehicle-positions/ktmb
```
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
