import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './WeatherWidget.css';

function WeatherWidget() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch weather for major locations
        const data = await RapidKLAPI.getWeatherForecast({ limit: 5 });
        if (data && data.length > 0) {
          setForecast(data[0]);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  if (loading) return <div className="weather-widget loading">Loading weather...</div>;
  if (error) return <div className="weather-widget error">{error}</div>;

  if (!forecast) {
    return <div className="weather-widget">Weather data unavailable</div>;
  }

  const getWeatherIcon = (condition) => {
    if (condition.includes('Hujan')) return '🌧️';
    if (condition.includes('Berjerebu')) return '😶';
    if (condition.includes('Ribut')) return '⛈️';
    return '☀️';
  };

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <h3>Weather</h3>
        <span className="weather-location">{forecast.location_name}</span>
      </div>
      <div className="weather-body">
        <div className="weather-condition">
          <span className="weather-icon">{getWeatherIcon(forecast.afternoon_forecast)}</span>
          <span className="weather-temp">{forecast.max_temp}°C</span>
        </div>
        <div className="weather-details">
          <div className="weather-detail">
            <small>Morning</small>
            <p className="forecast-text">{forecast.morning_forecast || 'N/A'}</p>
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
      </div>
    </div>
  );
}

export default WeatherWidget;
