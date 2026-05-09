import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './GTFSSchedule.css';

function GTFSSchedule({ operator, route }) {
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!operator || !route) return;

    const fetchStops = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RapidKLAPI.getRouteStops(operator, route.id);
        setStops(data);
        if (data.length > 0) {
          setSelectedStop(data[0]);
          fetchSchedule(data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch stops: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, [operator, route]);

  const fetchSchedule = async (stopId) => {
    try {
      const data = await RapidKLAPI.getSchedule(operator, route.id, stopId);
      setSchedule(data);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setSchedule([]);
    }
  };

  const handleStopSelect = (stop) => {
    setSelectedStop(stop);
    fetchSchedule(stop.id);
  };

  if (loading) return <div className="gtfs-schedule loading">Loading stops...</div>;
  if (error) return <div className="gtfs-schedule error">{error}</div>;

  return (
    <div className="gtfs-schedule">
      <div className="stops-list">
        <h3>Stops</h3>
        <div className="stops-scroll">
          {stops.map((stop, idx) => (
            <button
              key={stop.id}
              className={`stop-btn ${selectedStop?.id === stop.id ? 'active' : ''}`}
              onClick={() => handleStopSelect(stop)}
            >
              <span className="stop-number">{idx + 1}</span>
              <span className="stop-name">{stop.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-list">
        <h3>
          Schedule for {selectedStop?.name}
        </h3>
        {schedule.length === 0 ? (
          <p className="no-schedule">No schedule available</p>
        ) : (
          <div className="schedule-times">
            {schedule.slice(0, 20).map((item, idx) => (
              <div key={idx} className="time-item">
                <span className="time">{item.arrivalTime}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GTFSSchedule;
