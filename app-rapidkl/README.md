# 🚊 Malaysia Transit Hub

A full-stack application for exploring Malaysian public transit routes, tracking live vehicles, and checking weather forecasts — powered by the [Malaysia Open Data Portal](https://developer.data.gov.my).

## Overview

```
┌─────────────────────────────────────────────┐
│           Malaysia Transit Hub              │
├────────────────┬────────────────┬───────────┤
│ 📍 Routes Map  │ 🚗 Live Track  │ 🌦️ Weather │
│ GTFS static    │ GTFS Realtime  │ Forecasts  │
│ route polylines│ 30s auto-refresh│ Location   │
│ stop markers   │ vehicle markers │ selector   │
│ schedule panel │ sidebar list    │            │
└────────────────┴────────────────┴───────────┘
```

## Project Structure

```
containers/app-rapidkl/
├── backend/                          # Node.js Express API server
│   └── src/
│       └── server.js                 # All API routes (inline)
├── frontend/                         # React single-page app
│   └── src/
│       ├── components/
│       │   ├── GTFSRouteMap.js/.css  # Route → stops → schedule
│       │   ├── RealtimeTracker.js/.css # Live vehicle tracking
│       │   ├── WeatherWidget.js/.css # Forecast + location picker
│       │   └── OperatorSelector.js/.css # Operator dropdown
│       ├── pages/
│       │   └── Dashboard.js/.css     # Tabbed layout
│       ├── services/
│       │   └── api.js                # Axios API client
│       └── App.js                    # Root component
├── docker/                           # Docker configs
│   ├── nginx/                        # Reverse proxy
│   └── node/                         # Node.js Dockerfile
├── docker-compose.yml
└── .env / .env.example
```

## Quick Start

### Docker (recommended)

```bash
cd containers/app-rapidkl
cp .env.example .env
docker-compose up --build            # http://localhost
```

Docker automatically runs `npm install` and starts both the backend (port 5001) and frontend (port 3000) behind an Nginx reverse proxy on port 80.

### Local development (manual)

```bash
# Terminal 1 — Backend
cd containers/app-rapidkl/backend
npm install && npm start             # http://localhost:5001

# Terminal 2 — Frontend
cd containers/app-rapidkl/frontend
npm install && npm start             # http://localhost:3000
```

## Features

### 📍 Routes on Map (GTFS Static)

- Select a transit operator (KTMB, Prasarana LRT/MRT/Bus, BAS.MY)
- All routes are drawn as coloured polylines on a Leaflet/OpenStreetMap map
- Click a route in the sidebar to highlight it and zoom to its bounds
- **Stop markers** appear for the selected route — click any stop to:
  - See its name, code, and coordinates in a popup
  - **View departure times** in a schedule panel at the bottom of the sidebar
- Search routes by name or short code
- Sidebar route list scrolls when too long

### 🚗 Live Tracking (GTFS Realtime)

- Select a realtime-capable operator
- **Vehicle markers** show live positions with bearing arrows, updated every 30 seconds
- Toggle auto-refresh and route overlays
- **Click a vehicle** in the sidebar or on the map to:
  - Fly the map to that vehicle's location (zoom level 15)
  - See vehicle ID, route, trip, speed, and bearing
- Route polylines can be shown/hidden

### 🌦️ Weather (Malaysia MET data)

- Fetches 50 forecast entries from `data.gov.my` (respects the 4 req/min rate limit)
- **Location dropdown** — pick from all available Malaysian locations/districts
- Display: weather icon, max temperature, morning/afternoon/night conditions, date
- Auto-retries on 429 rate-limit errors with 2-second backoff

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Server health check |
| `GET /api/operators` | List static GTFS operators |
| `GET /api/gtfs/:operator/routes` | Routes for operator |
| `GET /api/gtfs/:operator/stops` | All stops for operator |
| `GET /api/gtfs/:operator/routes/:routeId/stops` | Stops on a route |
| `GET /api/gtfs/:operator/routes/:routeId/schedule?stopId=X` | Schedule for a stop |
| `GET /api/realtime/operators` | Realtime-capable operators |
| `GET /api/realtime/vehicle-positions/:operator` | Live vehicle positions |
| `GET /api/weather/forecast` | 7-day forecast |
| `GET /api/weather/warnings` | Weather warnings |
| `GET /api/weather/earthquake-warnings` | Earthquake data |

## Supported Operators

| Operator | ID | GTFS Static | GTFS Realtime |
|---|---|---|---|
| KTMB (Trains) | `ktmb` | ✓ | ✓ |
| Prasarana KL (LRT/MRT) | `prasarana-kl` | ✓ | ✓ |
| Prasarana Bus KL | `prasarana-bus-kl` | ✓ | — |
| BAS.MY Kangar | `mybas-kangar` | ✓ | — |
| BAS.MY Alor Setar | `mybas-alor-setar` | ✓ | — |
| BAS.MY Kota Bharu | `mybas-kota-bharu` | ✓ | — |
| BAS.MY Terengganu | `mybas-terengganu` | ✓ | — |
| BAS.MY Ipoh | `mybas-ipoh` | ✓ | — |
| BAS.MY Seremban | `mybas-seremban` | ✓ | — |
| BAS.MY Melaka | `mybas-melaka` | ✓ | — |
| BAS.MY Johor | `mybas-johor` | ✓ | — |
| BAS.MY Kuching | `mybas-kuching` | ✓ | — |

## Rate Limits

The Malaysia Open Data Portal enforces **4 requests per minute** per API type (Weather, GTFS Static, GTFS Realtime). The application handles this with:
- **24-hour client-side cache** for GTFS static data
- **429 retry with backoff** for Weather API
- 30-second polling interval for realtime vehicle positions (one request fits comfortably within the limit)

## Environment Variables

```env
NODE_ENV=development
PORT=5001
REACT_APP_API_URL=http://localhost:5001/api
```

## Data Sources

- **GTFS Static**: [data.gov.my](https://api.data.gov.my/gtfs-static)
- **GTFS Realtime**: [data.gov.my](https://api.data.gov.my/gtfs-realtime)
- **Weather**: [data.gov.my](https://api.data.gov.my/weather)
- **Map tiles**: OpenStreetMap (via Leaflet)

## License

MIT