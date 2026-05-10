import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';

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

function FitBounds({ vehicles, routePolylines }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    // Vehicle positions
    vehicles.forEach(v => {
      if (v.lat && v.lng) {
        points.push([v.lat, v.lng]);
      }
    });

    // Route polyline positions
    routePolylines.forEach(route => {
      route.coordinates.forEach(coord => {
        points.push(coord);
      });
    });

    if (!points.length) return;

    const bounds = L.latLngBounds(points);

    // Defer to after layout settles to avoid el._leaflet_pos race
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: false,
      });
    }, 0);
  }, [vehicles, routePolylines, map]);

  return null;
}

/**
 * Watches for selectedVehicle changes and flies the map to that vehicle's position.
 */
function FlyToVehicle({ vehicle }) {
  const map = useMap();
  useEffect(() => {
    if (!vehicle || !vehicle.lat || !vehicle.lng) return;
    setTimeout(() => {
      map.invalidateSize();
      map.setView([vehicle.lat, vehicle.lng], 15, { animate: true });
    }, 0);
  }, [vehicle, map]);
  return null;
}

function RealtimeTracker({ operator }) {
  const [vehicles, setVehicles] = useState([]);
  const [routePolylines, setRoutePolylines] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // KL Center
  const center = [3.1390, 101.6869];

  // =========================
  // Route Colors
  // =========================

  const getRouteColor = routeId => {
    if (!routeId) return '#3498db';

    const hash = routeId
      .split('')
      .reduce(
        (acc, char) =>
          acc + char.charCodeAt(0),
        0
      );

    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
      '#3498DB',
      '#E74C3C',
      '#2ECC71',
      '#F39C12',
    ];

    return colors[hash % colors.length];
  };

  // =========================
  // Vehicle Colors
  // =========================

  const getVehicleColor = op => {
    const colors = {
      ktmb: '#E74C3C',
      'prasarana-kl': '#3498DB',
      'prasarana-kl-bus': '#F39C12',
      'prasarana-kl-lrt': '#3498DB',
      'prasarana-kl-mrt': '#9B59B6',
      'prasarana-kl-monorail': '#34495E',
      'prasarana-kl-mrt-feeder': '#1ABC9C',
      'prasarana-penang': '#2980B9',
      'prasarana-kuantan': '#D35400',
      mybas: '#27AE60',
    };

    return colors[op] || '#95A5A6';
  };

  // =========================
  // Vehicle Icon
  // =========================

  const vehicleIcon = (
    color = '#3498db',
    bearing = 0
  ) =>
    L.divIcon({
      className: 'custom-vehicle-icon',
      html: `
        <div
          style="
            width:24px;
            height:24px;
            background:${color};
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 5px rgba(0,0,0,0.3);
            transform: rotate(${bearing}deg);
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;
            font-size:12px;
            font-weight:bold;
          "
        >
          →
        </div>
      `,
      iconSize: [24, 24],
    });

  // =========================
  // Fetch Routes + Stops
  // =========================

  useEffect(() => {
    if (!operator || !showRoutes) return;

    const fetchRoutes = async () => {
      try {
        const routeList =
          await RapidKLAPI.getGTFSRoutes(
            operator
          );

        const polylines = [];

        for (const route of routeList || []) {
          try {
            // Fix: use route.id (route_id) instead of route.route_id
            const stops =
              await RapidKLAPI.getRouteStops(
                operator,
                route.id
              );

            if (!stops || stops.length < 2) {
              continue;
            }

            const sortedStops = [
              ...stops,
            ].sort(
              (a, b) =>
                (a.stop_sequence || 0) -
                (b.stop_sequence || 0)
            );

            const coordinates =
              sortedStops
                .filter(
                  s =>
                    s.stop_lat != null &&
                    s.stop_lon != null
                )
                .map(s => [
                  parseFloat(s.stop_lat),
                  parseFloat(s.stop_lon),
                ]);

            if (coordinates.length > 1) {
              polylines.push({
                route_id: route.id,
                route_name:
                  route.name ||
                  route.code ||
                  route.id,
                color: getRouteColor(
                  route.id
                ),
                coordinates,
              });
            }
          } catch (err) {
            console.error(
              `Failed route ${route.id}`,
              err
            );
          }
        }

        setRoutePolylines(polylines);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoutes();
  }, [operator, showRoutes]);

  // =========================
  // Fetch Vehicles
  // =========================

  useEffect(() => {
    if (!operator) return;

    const fetchVehicles = async () => {
      try {
        setError(null);

        const data =
          await RapidKLAPI.getVehiclePositions(
            operator
          );

        const vehicleList =
          data?.vehicles || [];

        setVehicles(vehicleList);

        setLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          'Failed to load realtime vehicle data'
        );

        setVehicles([]);
        setLoading(false);
      }
    };

    fetchVehicles();

    let interval;

    if (autoRefresh) {
      interval = setInterval(
        fetchVehicles,
        30000
      );
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [operator, autoRefresh]);

  // =========================
  // Loading
  // =========================

  if (loading && vehicles.length === 0) {
    return (
      <div className="realtime-tracker">
        <div className="tracker-loading">
          <div className="spinner"></div>
          <p>Loading realtime vehicles...</p>
        </div>
      </div>
    );
  }

  // =========================
  // Render
  // =========================

  return (
    <div className="realtime-tracker">

      {/* Controls */}
      <div className="tracker-controls">

        <div className="control-group">
          <label className="control-checkbox">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e =>
                setAutoRefresh(
                  e.target.checked
                )
              }
            />
            Auto Refresh
          </label>

          <label className="control-checkbox">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={e =>
                setShowRoutes(
                  e.target.checked
                )
              }
            />
            Show Routes
          </label>
        </div>

        <span className="vehicle-count">
          {vehicles.length} active vehicles
        </span>

      </div>

      {/* Map + Sidebar row */}
      <div className="realtime-map-body">

        <div className="realtime-map-container">

          <MapContainer
            center={center}
            zoom={11}
            style={{
              height: '100%',
              width: '100%',
            }}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds
              vehicles={vehicles}
              routePolylines={
                routePolylines
              }
            />
            <FlyToVehicle
              vehicle={selectedVehicle}
            />

            {/* Route Polylines */}
            {showRoutes &&
              routePolylines.map(route => (
                <Polyline
                  key={route.route_id}
                  positions={
                    route.coordinates
                  }
                  pathOptions={{
                    color: route.color,
                    weight: 4,
                    opacity: 0.7,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>
                        {route.route_name}
                      </strong>

                      <br />

                      Route ID:
                      {' '}
                      {route.route_id}
                    </div>
                  </Popup>
                </Polyline>
              ))}

            {/* Vehicles */}
            {vehicles.map(vehicle => (
              <Marker
                key={vehicle.id}
                position={[
                  vehicle.lat,
                  vehicle.lng,
                ]}
                icon={vehicleIcon(
                  getVehicleColor(
                    operator
                  ),
                  vehicle.bearing
                )}
                eventHandlers={{
                  click: () =>
                    setSelectedVehicle(
                      vehicle
                    ),
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
                    {vehicle.routeId ||
                      'N/A'}

                    <br />

                    Trip:
                    {' '}
                    {vehicle.tripId ||
                      'N/A'}

                    <br />

                    Speed:
                    {' '}
                    {vehicle.speed
                      ? `${Math.round(
                          vehicle.speed
                        )} km/h`
                      : 'Stationary'}

                    <br />

                    Bearing:
                    {' '}
                    {vehicle.bearing || 0}
                    °
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>

        </div>

        {/* Error overlay inside map area */}
        {error && (
          <div className="tracker-error">
            {error}
          </div>
        )}

        {/* Sidebar */}
        <div className="vehicle-list-sidebar">

          <h4>
            Active Vehicles (
            {vehicles.length})
          </h4>

          <div className="vehicle-scroll">

            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className={`vehicle-item ${
                  selectedVehicle?.id ===
                  vehicle.id
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  setSelectedVehicle(
                    vehicle
                  )
                }
              >

                <div
                  className="vehicle-icon"
                  style={{
                    backgroundColor:
                      getVehicleColor(
                        operator
                      ),
                  }}
                />

                <div className="vehicle-details">

                  <div className="vehicle-id">
                    {vehicle.id}
                  </div>

                  <div className="vehicle-route">
                    Route:
                    {' '}
                    {vehicle.routeId ||
                      'N/A'}
                  </div>

                  <div className="vehicle-trip">
                    Trip:
                    {' '}
                    {vehicle.tripId ||
                      'N/A'}
                  </div>

                  <div className="vehicle-speed">
                    {vehicle.speed
                      ? `${Math.round(
                          vehicle.speed
                        )} km/h`
                      : 'Stationary'}
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}

export default RealtimeTracker;