import React, { useState } from 'react';
import OperatorSelector from '../components/OperatorSelector';
import GTFSRouteList from '../components/GTFSRouteList';
import GTFSSchedule from '../components/GTFSSchedule';
import './Dashboard.css';

function Dashboard() {
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚊 Malaysia Transit Tracker</h1>
          <p>GTFS-powered real-time and scheduled transit information</p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="sidebar">
            <OperatorSelector onSelectOperator={setSelectedOperator} />
            {selectedOperator && <GTFSRouteList operator={selectedOperator} onSelectRoute={setSelectedRoute} />}
          </div>

          <div className="content">
            <div className="route-details">
              {selectedRoute ? (
                <div>
                  <h2>{selectedRoute.code}: {selectedRoute.name}</h2>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select an operator and route to view schedule</p>
                </div>
              )}
            </div>

            {selectedRoute && selectedOperator && (
              <GTFSSchedule operator={selectedOperator} route={selectedRoute} />
            )}
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>Data from Malaysia Open Data Portal (data.gov.my)</p>
      </footer>
    </div>
  );
}

export default Dashboard;
