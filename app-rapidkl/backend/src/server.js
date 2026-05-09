require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { RapidKLService, GTFSService, GTFSRealtimeParser, WeatherAPI } = require('rapidkl-component');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let rapidklService;
let gtfsService;
let gtfsRealtimeParser;
let weatherAPI;

// Initialize services on startup
async function initializeServices() {
  try {
    rapidklService = new RapidKLService();
    await rapidklService.initialize();
    console.log('✓ RapidKL Service initialized');
  } catch (error) {
    console.error('✗ Failed to initialize RapidKL Service:', error.message);
  }

  gtfsService = new GTFSService();
  console.log('✓ GTFS Service initialized');

  gtfsRealtimeParser = new GTFSRealtimeParser();
  console.log('✓ GTFS Realtime Service initialized');

  weatherAPI = new WeatherAPI();
  console.log('✓ Weather API initialized');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============ WEATHER ENDPOINTS ============

app.get('/api/weather/forecast', async (req, res) => {
  try {
    if (!weatherAPI) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const filters = {};
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    if (req.query.location) filters.contains = `${req.query.location}@location__location_name`;
    
    const forecast = await weatherAPI.getForecast(filters);
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weather/warnings', async (req, res) => {
  try {
    if (!weatherAPI) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const filters = {};
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    const warnings = await weatherAPI.getWarnings(filters);
    res.json({ success: true, data: warnings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weather/earthquake-warnings', async (req, res) => {
  try {
    if (!weatherAPI) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const filters = {};
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    const earthquakes = await weatherAPI.getEarthquakeWarnings(filters);
    res.json({ success: true, data: earthquakes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ GTFS REALTIME ENDPOINTS ============

app.get('/api/realtime/operators', (req, res) => {
  try {
    if (!gtfsRealtimeParser) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const operators = gtfsRealtimeParser.getOperators();
    res.json({ success: true, data: operators });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/realtime/vehicle-positions/:operator', async (req, res) => {
  try {
    if (!gtfsRealtimeParser) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const buffer = await gtfsRealtimeParser.getVehiclePositions(req.params.operator);
    const parsed = gtfsRealtimeParser.parseProtobuf(buffer);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ GTFS STATIC ENDPOINTS ============

app.get('/api/operators', (req, res) => {
  try {
    if (!gtfsService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const operators = gtfsService.getOperators();
    res.json({ success: true, data: operators });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtfs/:operator/routes', async (req, res) => {
  try {
    if (!gtfsService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const routes = await gtfsService.getRoutes(req.params.operator);
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtfs/:operator/stops', async (req, res) => {
  try {
    if (!gtfsService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const stops = await gtfsService.getStops(req.params.operator);
    res.json({ success: true, data: stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtfs/:operator/routes/:routeId/stops', async (req, res) => {
  try {
    if (!gtfsService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const stops = await gtfsService.getRouteStops(req.params.operator, req.params.routeId);
    res.json({ success: true, data: stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtfs/:operator/routes/:routeId/schedule', async (req, res) => {
  try {
    if (!gtfsService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const stopId = req.query.stopId;
    if (!stopId) {
      return res.status(400).json({ error: 'stopId query parameter required' });
    }
    const schedule = await gtfsService.getSchedule(req.params.operator, req.params.routeId, stopId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RAPIDKL ENDPOINTS (Legacy) ============

app.get('/api/routes', (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const routes = rapidklService.getRoutes();
    res.json({ success: true, data: routes.map(r => r.toJSON()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/routes/:routeId', (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const route = rapidklService.getRouteById(req.params.routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ success: true, data: route.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/routes/search', (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const query = req.query.q || '';
    const results = rapidklService.searchRoutes(query);
    res.json({ success: true, data: results.map(r => r.toJSON()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transits/:routeId', async (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const transits = await rapidklService.getTransitsByRoute(req.params.routeId);
    res.json({ success: true, data: transits.map(t => t.toJSON()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stops/:stopId', async (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const stop = await rapidklService.getStopDetails(req.params.stopId);
    res.json({ success: true, data: stop.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  try {
    if (!rapidklService) {
      return res.status(503).json({ error: 'Service not initialized' });
    }
    const status = rapidklService.getServiceStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n✓ Backend server running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
  await initializeServices();
});
