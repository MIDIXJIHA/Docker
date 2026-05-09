import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap} from 'react-leaflet';
import L from 'leaflet';
import RapidKLAPI from '../services/api';
import './RealtimeTracker.css';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Auto fit bounds helper
function FitBounds({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (!vehicles.length) return;

    const bounds = L.latLngBounds(
      vehicles.map(v => [v.lat, v.lng])
    );

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
    });
  }, [vehicles, map]);

  return null;
}

function RealtimeTracker({ operator }) {
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const center = [3.1390, 101.6869];

  // Fetch routes
  useEffect(() => {
    if (!operator) return;
    const fetchRoutes = async () => {
      try {
        const data = await RapidKLAPI.getGTFSRoutes(operator);
        setRoutes(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoutes();
  }, [operator]);

  // Fetch realtime vehicles
  useEffect(() => {
    if (!operator) return;
    const fetchVehicles = async () => {
      try {
        setError(null);
        const data = await RapidKLAPI.getVehiclePositions(operator);
        const vehicleList = data?.vehicles || [];
        setVehicles(vehicleList);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load realtime vehicle data');
        setVehicles([]);
        setLoading(false);
      }
    };

    fetchVehicles();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchVehicles, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [operator, autoRefresh]);

  // Vehicle icon
  const vehicleIcon = (color = '#3498db') =>
    L.divIcon({
      className: 'custom-vehicle-icon',
      html: `
        <div
          style="
            width:18px;
            height:18px;
            background:${color};
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 5px rgba(0,0,0,0.3);
          "
        ></div>
      `,
      iconSize: [18, 18],
    });

  const getVehicleColor = op => {
    const colors = {
      ktmb: '#E74C3C',
      'prasarana-kl': '#3498DB',
      'prasarana-bus-kl': '#F39C12',
      mybas: '#27AE60',
    };

    return colors[op] || '#9B59B6';
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="tracker-loading">
        <p>Loading realtime vehicles...</p>
      </div>
    );
  }

  return (
    <div className="realtime-tracker">

      {/* Controls */}
      <div className="tracker-controls">

        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e =>
              setAutoRefresh(e.target.checked)
            }
          />

          Auto Refresh
        </label>

        <span>
          {vehicles.length} active vehicles
        </span>

      </div>

      {/* Map */}
      <div className="map-container">

        <MapContainer
          center={center}
          zoom={11}
          style={{
            height: '700px',
            width: '100%',
          }}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds vehicles={vehicles} />

          {/* Vehicles */}
          {vehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[
                vehicle.lat,
                vehicle.lng
              ]}
              icon={vehicleIcon(
                getVehicleColor(operator)
              )}
              eventHandlers={{
                click: () =>
                  setSelectedVehicle(vehicle),
              }}
            >
              <Popup>
                <div>
                  <strong>
                    {vehicle.id}
                  </strong>

                  <br />

                  Route:
                  {' '}
                  {vehicle.routeId || 'N/A'}

                  <br />

                  Speed:
                  {' '}
                  {vehicle.speed
                    ? `${Math.round(vehicle.speed)} km/h`
                    : 'Stationary'}

                  <br />

                  Bearing:
                  {' '}
                  {vehicle.bearing || 0}°
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Optional route lines */}
          {routes.map((route, index) => {
            if (!route.coordinates) return null;

            return (
              <Polyline
                key={index}
                positions={route.coordinates}
              />
            );
          })}

        </MapContainer>

      </div>

      {/* Error */}
      {error && (
        <div className="tracker-error">
          {error}
        </div>
      )}

      {/* Sidebar */}
      <div className="vehicle-list-sidebar">

        <h4>
          Active Vehicles ({vehicles.length})
        </h4>

        <div className="vehicle-scroll">

          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className={`vehicle-item ${
                selectedVehicle?.id === vehicle.id
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                setSelectedVehicle(vehicle)
              }
            >

              <div
                className="vehicle-icon"
                style={{
                  backgroundColor:
                    getVehicleColor(operator),
                }}
              />

              <div className="vehicle-details">

                <div className="vehicle-id">
                  {vehicle.id}
                </div>

                <div className="vehicle-route">
                  Route:
                  {' '}
                  {vehicle.routeId || 'N/A'}
                </div>

                <div className="vehicle-speed">
                  {vehicle.speed
                    ? `${Math.round(vehicle.speed)} km/h`
                    : 'Stationary'}
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

export default RealtimeTracker;