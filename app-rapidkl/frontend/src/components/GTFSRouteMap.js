import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import RapidKLAPI from '../services/api';
import './GTFSRouteMap.css';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Watches for selectedRoute changes and flies the map to that route's bounds.
 */
function FlyToRoute({ selectedRoute, polylines }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedRoute) return;
    const route = polylines.find(r => r.route_id === selectedRoute);
    if (!route || !route.coordinates.length) return;
    const bounds = L.latLngBounds(route.coordinates);
    if (bounds.isValid()) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
      }, 0);
    }
  }, [selectedRoute, polylines, map]);
  return null;
}

function GTFSRouteMap({ operator, selectedRoute, onSelectRoute }) {
  const [routePolylines, setRoutePolylines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const center = [3.1390, 101.6869];

  const fetchSchedule = async (routeId, stopId) => {
    if (!operator || !routeId || !stopId) return;
    try {
      setScheduleLoading(true);
      const data = await RapidKLAPI.getSchedule(operator, routeId, stopId);
      setSchedule(data || []);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleStopClick = (routeId, stop) => {
    setSelectedStop(stop);
    fetchSchedule(routeId, stop.stop_id);
  };

  useEffect(() => {
    if (!operator) return;

    const fetchAndDrawRoutes = async () => {
      try {
        setLoading(true);
        setError(null);

        const routeList = await RapidKLAPI.getGTFSRoutes(operator);

        const polylines = [];

        for (const route of routeList || []) {
          try {
            const stops = await RapidKLAPI.getRouteStops(operator, route.id);

            if (!Array.isArray(stops)) continue;

            const validStops = stops.filter(stop =>
              stop.stop_lat !== null &&
              stop.stop_lat !== undefined &&
              stop.stop_lon !== null &&
              stop.stop_lon !== undefined
            );

            if (validStops.length < 2) continue;

            validStops.sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));

            // Try to fetch the exact shape path from shapes.txt
            let shapeCoordinates = await RapidKLAPI.getRouteShape(operator, route.id);
            if (!Array.isArray(shapeCoordinates) || shapeCoordinates.length < 2) {
              // Fallback to straight lines between stops
              shapeCoordinates = validStops.map(stop => [
                Number(stop.stop_lat),
                Number(stop.stop_lon),
              ]);
            }

            polylines.push({
              id: route.id,
              route_id: route.id,
              route_short_name: route.code,
              route_long_name: route.name,
              route_type: route.type,
              color: route.color
                ? `#${route.color.replace('#', '')}`
                : getRouteColor(route.id),
              coordinates: shapeCoordinates,
              stops: validStops,
            });

          } catch (err) {
            console.error(`Failed route ${route.id}`, err);
          }
        }

        setRoutePolylines(polylines);

      } catch (err) {
        console.error(err);
        setError(`Failed loading routes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndDrawRoutes();
  }, [operator]);

  const getRouteColor = routeId => {
    const hash = routeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];

    return colors[hash % colors.length];
  };

  const filteredPolylines = routePolylines.filter(route => {
    const search = searchTerm.toLowerCase();

    return (
      !search ||
      route.route_short_name?.toLowerCase().includes(search) ||
      route.route_long_name?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="gtfs-route-map">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gtfs-route-map">

      <div className="route-map-controls">
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="route-search"
        />

        <span className="route-count">
          {filteredPolylines.length} routes
        </span>
      </div>

      {error && (
        <div className="route-error">
          {error}
        </div>
      )}

      <div className="route-map-body">

      <div className="route-map-container">

        <MapContainer
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsComponent
            polylines={filteredPolylines}
            center={center}
          />
          <FlyToRoute
            selectedRoute={selectedRoute}
            polylines={filteredPolylines}
          />

          {filteredPolylines.map(route => (
            <Polyline
              key={route.route_id}
              positions={route.coordinates}
              pathOptions={{
                color: route.color,
                weight: selectedRoute === route.route_id ? 5 : 3,
                opacity: selectedRoute === route.route_id ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelectRoute?.(route.route_id),
              }}
            />
          ))}

          {filteredPolylines
            .filter(route => selectedRoute === route.route_id)
            .map((route, routeIdx) =>
              route.stops.map((stop, stopIdx) => (
                <Marker
                  key={`stop-${routeIdx}-${stopIdx}`}
                  position={[
                    Number(stop.stop_lat),
                    Number(stop.stop_lon),
                  ]}
                  icon={L.divIcon({
                    className: 'stop-marker',
                    html: `
                      <div
                        class="stop-marker-inner"
                        style="
                          background:${route.color};
                          width:24px;
                          height:24px;
                          border-radius:50%;
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          color:white;
                          font-size:10px;
                          font-weight:bold;
                          border:2px solid white;
                        "
                      >
                        ${stopIdx + 1}
                      </div>
                    `,
                    iconSize: [24, 24],
                  })}
                  eventHandlers={{
                    click: () => handleStopClick(route.route_id, stop),
                  }}
                >
                  <Popup>
                    <div className="stop-popup">
                      <strong>{stop.stop_name}</strong>

                      <br />

                      Code: {stop.stop_id}

                      <br />

                      Sequence: {stop.stop_sequence}

                      <br />

                      Lat: {Number(stop.stop_lat).toFixed(4)}

                      <br />

                      Lon: {Number(stop.stop_lon).toFixed(4)}

                      <br />

                      <button
                        className="schedule-btn"
                        onClick={() => handleStopClick(route.route_id, stop)}
                      >
                        View Schedule
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))
            )}

        </MapContainer>

      </div>

      <div className="route-list-sidebar">

        <h4>
          Routes ({filteredPolylines.length})
        </h4>

        <div className="route-list-scroll">

          {filteredPolylines.map(route => (
            <div
              key={route.route_id}
              className={`route-item ${
                selectedRoute === route.route_id
                  ? 'selected'
                  : ''
              }`}
              onClick={() => onSelectRoute?.(route.route_id)}
            >

              <div
                className="route-color"
                style={{
                  backgroundColor: route.color,
                }}
              />

              <div className="route-info">

                <div className="route-short">
                  {route.route_short_name || route.route_id}
                </div>

                <div className="route-long">
                  {route.route_long_name || 'N/A'}
                </div>

                <div className="route-stops">
                  {route.stops.length} stops
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* Schedule Panel */}
        {selectedStop && (
          <div className="schedule-panel">
            <div className="schedule-panel-header">
              <strong>{selectedStop.stop_name}</strong>
              <button
                className="schedule-close-btn"
                onClick={() => {
                  setSelectedStop(null);
                  setSchedule([]);
                }}
              >
                ×
              </button>
            </div>

            {scheduleLoading ? (
              <div className="schedule-loading">Loading schedule...</div>
            ) : schedule.length === 0 ? (
              <div className="schedule-empty">No departure times available</div>
            ) : (
              <div className="schedule-list-scroll">
                {schedule.slice(0, 30).map((item, idx) => (
                  <div key={idx} className="schedule-time-item">
                    <span className="schedule-time">{item.arrivalTime || item.departureTime || 'N/A'}</span>
                    <span className="schedule-trip">Trip: {item.tripId || item.trip_id || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      </div>

    </div>
  );
}

/**
 * Inner component that uses useMap() to fit bounds after the map has mounted.
 * The setTimeout + invalidateSize pattern avoids Leaflet's el._leaflet_pos
 * zoom-transition race that occurs when fitBounds is called synchronously
 * during the first render cycle while the flex container may have clientHeight=0.
 */
function FitBoundsComponent({ polylines, center }) {
  const map = useMap();

  useEffect(() => {
    if (!polylines.length) {
      // No routes yet — set default KL view
      map.setView(center, 11, { animate: false });
      return;
    }

    const bounds = L.latLngBounds();
    polylines.forEach(route => {
      route.coordinates.forEach(coord => bounds.extend(coord));
    });
    if (!bounds.isValid()) return;

    // Defer to after the current render-paint cycle. This guarantees the
    // map's container element has a non-zero clientHeight (from flex layout),
    // so invalidateSize and fitBounds don't race against uninitialised panes.
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
    }, 0);

    return () => clearTimeout(timer);
  }, [polylines, map, center]);

  return null;
}

export default GTFSRouteMap;