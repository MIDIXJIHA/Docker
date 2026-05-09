import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import RapidKLAPI from '../services/api';
import './RealtimeTracker.css';

// Set Mapbox token (you'll need to set REACT_APP_MAPBOX_TOKEN in .env)
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazAwMDAwMDAwIn0.XXXXXXXXXXXXXXXXXXXXXXXX';

function RealtimeTracker({ operator }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [zoom, setZoom] = useState(11);
  const vehicleMarkers = useRef({});
  const routeLines = useRef({});

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Malaysia center coordinates (KL area)
    const center = [101.6869, 3.1390];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.on('zoom', () => {
      setZoom(map.current.getZoom());
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // Fetch route data for drawing polylines
  useEffect(() => {
    if (!operator) return;

    const fetchRouteData = async () => {
      try {
        const routeList = await RapidKLAPI.getGTFSRoutes(operator);
        setRoutes(routeList || []);
      } catch (err) {
        console.error('Failed to fetch routes:', err);
      }
    };

    fetchRouteData();
  }, [operator]);

  // Fetch and update vehicle positions
  useEffect(() => {
    if (!operator || !map.current) return;

    const fetchVehicles = async () => {
      try {
        setError(null);
        const data = await RapidKLAPI.getVehiclePositions(operator);
        
        // Parse vehicle data from protobuf response
        let vehicleList = [];
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            vehicleList = data;
          } else if (data.entity) {
            vehicleList = data.entity
              .filter(e => e.vehicle && e.vehicle.position)
              .map(e => ({
                id: e.id || e.vehicle.trip?.tripId,
                lat: e.vehicle.position.latitude,
                lng: e.vehicle.position.longitude,
                bearing: e.vehicle.position.bearing || 0,
                speed: e.vehicle.position.speed || 0,
                routeId: e.vehicle.trip?.routeId,
                tripId: e.vehicle.trip?.tripId,
                stopSequence: e.vehicle.currentStopSequence,
              }));
          }
        }

        setVehicles(vehicleList);
        setLoading(false);

        // Update map markers
        if (map.current) {
          updateMapMarkers(vehicleList);
        }
      } catch (err) {
        setError('No real-time data available for this operator');
        setVehicles([]);
        console.error('Failed to fetch vehicles:', err);
        setLoading(false);
      }
    };

    fetchVehicles();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchVehicles, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [operator, autoRefresh]);

  // Update vehicle markers on map
  const updateMapMarkers = (vehicleList) => {
    if (!map.current) return;

    // Remove old markers
    Object.values(vehicleMarkers.current).forEach(marker => marker.remove());
    vehicleMarkers.current = {};

    // Add new markers
    vehicleList.forEach(vehicle => {
      if (!vehicle.lat || !vehicle.lng) return;

      const markerElement = document.createElement('div');
      markerElement.className = 'vehicle-marker';
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.backgroundImage = getVehicleIcon(vehicle);
      markerElement.style.backgroundSize = 'contain';
      markerElement.style.backgroundRepeat = 'no-repeat';
      markerElement.style.backgroundPosition = 'center';
      markerElement.style.cursor = 'pointer';
      markerElement.style.transform = `rotate(${vehicle.bearing || 0}deg)`;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="vehicle-popup">
          <strong>Vehicle: ${vehicle.id || 'Unknown'}</strong><br/>
          Route: ${vehicle.routeId || 'N/A'}<br/>
          Speed: ${vehicle.speed ? Math.round(vehicle.speed) + ' km/h' : 'N/A'}<br/>
          Bearing: ${vehicle.bearing || 0}°
        </div>`
      );

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([vehicle.lng, vehicle.lat])
        .setPopup(popup)
        .addTo(map.current);

      markerElement.addEventListener('click', () => {
        setSelectedVehicle(vehicle);
        marker.togglePopup();
      });

      vehicleMarkers.current[vehicle.id] = marker;
    });

    // Fit map to show all vehicles
    if (vehicleList.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      vehicleList.forEach(v => {
        if (v.lat && v.lng) bounds.extend([v.lng, v.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  };

  const getVehicleIcon = (vehicle) => {
    // SVG icon for vehicle marker
    const color = getVehicleColor(operator);
    const svg = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10h16V10c0-1.1-.9-2-2-2zm-7-2c1.66 0 3 1.34 3 3H8c0-1.66 1.34-3 3-3z"/>
      </svg>
    `)}`;
    return svg;
  };

  const getVehicleColor = (op) => {
    const colors = {
      'ktmb': '#E74C3C',
      'prasarana-kl': '#3498DB',
      'prasarana-bus-kl': '#F39C12',
      'mybas': '#27AE60',
    };
    return colors[op] || '#9B59B6';
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="realtime-tracker">
        <div className="tracker-loading">
          <div className="spinner"></div>
          <p>Loading real-time vehicle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-tracker">
      {/* Controls */}
      <div className="tracker-controls">
        <div className="control-group">
          <label className="control-checkbox">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (30s)</span>
          </label>
          <label className="control-checkbox">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
            />
            <span>Show routes</span>
          </label>
        </div>
        <div className="vehicle-count">
          {vehicles.length} vehicles active
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        <div ref={mapContainer} className="map" />
      </div>

      {/* Error Message */}
      {error && <div className="tracker-error">{error}</div>}

      {/* Vehicle List Sidebar */}
      <div className="vehicle-list-sidebar">
        <h4>Active Vehicles ({vehicles.length})</h4>
        <div className="vehicle-scroll">
          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedVehicle(vehicle);
                if (map.current) {
                  map.current.flyTo({
                    center: [vehicle.lng, vehicle.lat],
                    zoom: 15,
                    duration: 1000,
                  });
                }
              }}
            >
              <div className="vehicle-icon" style={{ backgroundColor: getVehicleColor(operator) }}></div>
              <div className="vehicle-details">
                <div className="vehicle-id">{vehicle.id || 'Unknown'}</div>
                <div className="vehicle-route">Route: {vehicle.routeId || 'N/A'}</div>
                <div className="vehicle-speed">
                  {vehicle.speed ? `${Math.round(vehicle.speed)} km/h` : 'Stationary'}
                </div>
              </div>
              <div className="vehicle-bearing">
                <span style={{ transform: `rotate(${vehicle.bearing || 0}deg)` }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Vehicle Details */}
      {selectedVehicle && (
        <div className="vehicle-detail-panel">
          <button className="close-btn" onClick={() => setSelectedVehicle(null)}>×</button>
          <h4>Vehicle Details</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Vehicle ID:</span>
              <span className="value">{selectedVehicle.id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Route:</span>
              <span className="value">{selectedVehicle.routeId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Speed:</span>
              <span className="value">{selectedVehicle.speed ? Math.round(selectedVehicle.speed) + ' km/h' : 'Stationary'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Bearing:</span>
              <span className="value">{selectedVehicle.bearing || 0}°</span>
            </div>
            <div className="detail-item">
              <span className="label">Position:</span>
              <span className="value">{selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Trip:</span>
              <span className="value">{selectedVehicle.tripId || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealtimeTracker;
