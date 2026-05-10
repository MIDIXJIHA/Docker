import React, { useState } from 'react';
import OperatorSelector from '../components/OperatorSelector';
import GTFSRouteMap from '../components/GTFSRouteMap';
import RealtimeTracker from '../components/RealtimeTracker';
import WeatherWidget from '../components/WeatherWidget';
import './Dashboard.css';

function Dashboard() {
  const [selectedStaticOperator, setSelectedStaticOperator] = useState(null);
  const [selectedRealtimeOperator, setSelectedRealtimeOperator] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('routes');

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🚊 Malaysia Transit Hub</h1>
            <p>Comprehensive public transportation tracking and information</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-icon">🗺️</span>
              <div>
                <span className="stat-label">GTFS Agencies</span>
                <span className="stat-value">15+</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📍</span>
              <div>
                <span className="stat-label">Data Portal</span>
                <span className="stat-value">data.gov.my</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Tabs */}
          <div className="content-tabs">
            <button
              className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
              onClick={() => setActiveTab('routes')}
            >
              📍 Routes on Map
            </button>
            <button
              className={`tab-btn ${activeTab === 'realtime' ? 'active' : ''}`}
              onClick={() => setActiveTab('realtime')}
            >
              🚗 Live Tracking
            </button>
            <button
              className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
            >
              🌦️ Weather
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Routes Tab */}
            {activeTab === 'routes' && (
              <div className="tab-panel">
                <div className="tab-header">
                  <OperatorSelector type="static" onSelectOperator={setSelectedStaticOperator} />
                </div>
                {selectedStaticOperator ? (
                  <GTFSRouteMap
                    operator={selectedStaticOperator}
                    selectedRoute={selectedRoute}
                    onSelectRoute={setSelectedRoute}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📍</div>
                    <h3>Select a Route Operator</h3>
                    <p>Choose a transit operator to view routes on the map.</p>
                  </div>
                )}
              </div>
            )}

            {/* Realtime Tab */}
            {activeTab === 'realtime' && (
              <div className="tab-panel">
                <div className="tab-header">
                  <OperatorSelector type="realtime" onSelectOperator={setSelectedRealtimeOperator} />
                </div>
                {selectedRealtimeOperator ? (
                  <RealtimeTracker operator={selectedRealtimeOperator} />
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🚗</div>
                    <h3>Select a Realtime Operator</h3>
                    <p>Choose a transit operator to view live vehicle positions.</p>
                  </div>
                )}
              </div>
            )}

            {/* Weather Tab */}
            {activeTab === 'weather' && (
              <div className="tab-panel weather-panel">
                <WeatherWidget />
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="dashboard-info">
          <div className="info-card">
            <h4>📚 Data Sources</h4>
            <ul>
              <li>GTFS Static: Routes, stops, and schedules</li>
              <li>GTFS Realtime: Vehicle positions (30s updates)</li>
              <li>Weather API: Forecasts and warnings</li>
              <li>Source: Malaysia Open Data Portal</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>🏢 Transit Operators</h4>
            <ul>
              <li>KTMB (Trains nationwide)</li>
              <li>Prasarana (LRT, MRT, Monorail, Buses)</li>
              <li>BAS.MY (Stage buses, multiple states)</li>
              <li>Service data updated regularly</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>⚡ Features</h4>
            <ul>
              <li>Real-time vehicle tracking</li>
              <li>Route planning and schedules</li>
              <li>Stop information and arrivals</li>
              <li>Weather and alerts integration</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          🔗 Data from <strong>Malaysia Open Data Portal</strong> (developer.data.gov.my) •
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
