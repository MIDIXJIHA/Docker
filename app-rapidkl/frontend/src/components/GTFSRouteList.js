import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './GTFSRouteList.css';

function GTFSRouteList({ operator, onSelectRoute }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!operator) return;

    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RapidKLAPI.getGTFSRoutes(operator);
        setRoutes(data);
      } catch (err) {
        setError('Failed to fetch routes: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [operator]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="gtfs-route-list loading">Loading routes...</div>;
  if (error) return <div className="gtfs-route-list error">{error}</div>;

  return (
    <div className="gtfs-route-list">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search routes..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="routes-container">
        {filteredRoutes.length === 0 ? (
          <p className="no-routes">No routes found</p>
        ) : (
          <ul>
            {filteredRoutes.map((route) => (
              <li
                key={route.id}
                onClick={() => onSelectRoute(route)}
                className="route-item"
              >
                <div className="route-code" style={{ backgroundColor: route.color }}>
                  {route.code}
                </div>
                <div className="route-info">
                  <h4>{route.name}</h4>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default GTFSRouteList;
