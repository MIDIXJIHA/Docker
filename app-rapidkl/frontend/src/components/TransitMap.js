import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './TransitMap.css';

function TransitMap({ routeId }) {
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!routeId) return;

    const fetchTransits = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RapidKLAPI.getTransits(routeId);
        setTransits(data);
      } catch (err) {
        setError('Failed to fetch transits: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransits();

    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchTransits, 30000);
    }

    return () => clearInterval(interval);
  }, [routeId, autoRefresh]);

  if (!routeId) {
    return <div className="transit-map">Select a route to view transits</div>;
  }

  if (loading) {
    return <div className="transit-map loading">Loading transits...</div>;
  }

  if (error) {
    return <div className="transit-map error">{error}</div>;
  }

  return (
    <div className="transit-map">
      <div className="transit-controls">
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (30s)
        </label>
      </div>

      <div className="transits-grid">
        {transits.length === 0 ? (
          <p className="no-transits">No transits currently in service</p>
        ) : (
          transits.map((transit) => (
            <div key={transit.id} className="transit-card">
              <div className="transit-header">
                <span className="vehicle-id">#{transit.vehicleId}</span>
                <span className={`delay-badge ${transit.delay <= 2 ? 'on-time' : 'delayed'}`}>
                  {transit.delayStatus}
                </span>
              </div>

              <div className="transit-body">
                <div className="next-stop">
                  <small>Next Stop</small>
                  <p>{transit.nextStop}</p>
                </div>

                <div className="occupancy">
                  <small>Occupancy</small>
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-fill"
                      style={{ width: `${transit.occupancy}%` }}
                    ></div>
                  </div>
                  <p className={`occupancy-text ${transit.occupancy < 33 ? 'empty' : transit.occupancy < 66 ? 'moderate' : 'crowded'}`}>
                    {transit.occupancyStatus}
                  </p>
                </div>

                <div className="transit-footer">
                  <small className="timestamp">
                    Updated: {new Date(transit.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TransitMap;
