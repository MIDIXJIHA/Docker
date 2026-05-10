import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './WeatherWidget.css';

function WeatherWidget() {
  const [forecasts, setForecasts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAllForecasts = async (retries = 2) => {
      try {
        setLoading(true);
        setError(null);
        // Keep limit moderate — the Weather API has a 4 req/min rate limit.
        // A single request is well within budget.
        const data = await RapidKLAPI.getWeatherForecast({ limit: 50 });
        if (cancelled) return;
        setForecasts(data || []);
        if (data && data.length > 0) {
          setSelectedLocation(data[0].location?.location_name || '');
        }
      } catch (err) {
        // 429 Too Many Requests — retry with backoff if retries remain
        if (err.response?.status === 429 && retries > 0) {
          console.warn(`Weather rate-limited, retrying in 2s… (${retries} left)`);
          await new Promise(r => setTimeout(r, 2000));
          if (!cancelled) return fetchAllForecasts(retries - 1);
        }
        if (!cancelled) {
          console.error('Weather fetch error:', err);
          setError('Unable to fetch weather data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllForecasts();
    return () => { cancelled = true; };
  }, []);

  // Build unique sorted list of location names from forecasts.
  // The API returns location as a nested object: { location: { location_id, location_name } }
  const getLocationName = f => f.location?.location_name || '';
  const locations = [...new Set(forecasts.map(getLocationName).filter(Boolean))].sort();

  // Find the forecast entry for the selected location (first matching date for simplicity)
  const forecast = forecasts.find(f => getLocationName(f) === selectedLocation) || null;

  const getWeatherIcon = (condition) => {
    if (!condition) return '☀️';
    if (condition.includes('Hujan')) return '🌧️';
    if (condition.includes('Berjerebu')) return '😶';
    if (condition.includes('Ribut')) return '⛈️';
    if (condition.includes('Cerah')) return '☀️';
    if (condition.includes('Awan')) return '☁️';
    if (condition.includes('Kabut')) return '🌫️';
    return '☀️';
  };

  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="spinner"></div>
        <p>Loading weather data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="weather-widget error">{error}</div>;
  }

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <h3>🌦️ Weather Forecast</h3>
      </div>

      {/* Location selector */}
      {locations.length > 0 && (
        <div className="weather-location-selector">
          <label htmlFor="weather-location">Location:</label>
          <select
            id="weather-location"
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )}

      {!forecast && locations.length === 0 && (
        <div className="weather-body">
          <p className="weather-unavailable">Weather data unavailable</p>
        </div>
      )}

      {!forecast && locations.length > 0 && (
        <div className="weather-body">
          <p className="weather-unavailable">No forecast for selected location</p>
        </div>
      )}

      {forecast && (
        <>
          <div className="weather-location-name">{getLocationName(forecast)}</div>

          <div className="weather-body">
            <div className="weather-condition">
              <span className="weather-icon">{getWeatherIcon(forecast.afternoon_forecast)}</span>
              <span className="weather-temp">{forecast.max_temp}°C</span>
            </div>

            <div className="weather-details">
              <div className="weather-detail">
                <small>Morning</small>
                <p className="forecast-text">{forecast.morning_forecast || 'N/A'}</p>
                {forecast.min_temp && <p className="forecast-temp">{forecast.min_temp}°C</p>}
              </div>
              <div className="weather-detail">
                <small>Afternoon</small>
                <p className="forecast-text">{forecast.afternoon_forecast || 'N/A'}</p>
              </div>
              <div className="weather-detail">
                <small>Night</small>
                <p className="forecast-text">{forecast.night_forecast || 'N/A'}</p>
              </div>
            </div>

            {/* Date info */}
            {forecast.date && (
              <div className="weather-date">
                {new Date(forecast.date).toLocaleDateString('en-MY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default WeatherWidget;