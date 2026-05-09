import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './RouteList.css';

function RouteList({ onSelectRoute }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RapidKLAPI.getRoutes();
      setRoutes(data);
    } catch (err) {
      setError('Failed to fetch routes: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      fetchRoutes();
    } else {
      try {
        const data = await RapidKLAPI.searchRoutes(query);
        setRoutes(data);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  if (loading) return <div className="route-list loading">Loading routes...</div>;
  if (error) return <div className="route-list error">{error}</div>;

  return (
    <div className="route-list">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search routes (e.g., LRT, BRT)..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="routes-container">
        {routes.length === 0 ? (
          <p className="no-routes">No routes found</p>
        ) : (
          <ul>
            {routes.map((route) => (
              <li
                key={route.id}
                onClick={() => onSelectRoute(route)}
                className="route-item"
              >
                <div className="route-code">{route.code}</div>
                <div className="route-info">
                  <h4>{route.name}</h4>
                  <p>{route.origin} → {route.destination}</p>
                  <small>{route.stopCount} stops • {route.type}</small>
                </div>
                <div className={`route-status ${route.status}`}>
                  {route.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={fetchRoutes} className="refresh-btn">
        Refresh Routes
      </button>
    </div>
  );
}

export default RouteList;
