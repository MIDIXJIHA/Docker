import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './OperatorSelector.css';

function OperatorSelector({ onSelectOperator, type = 'both' }) {
  const [staticOperators, setStaticOperators] = useState([]);
  const [realtimeOperators, setRealtimeOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState('');

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both types
        const staticData = await RapidKLAPI.getOperators();
        const realtimeData = await RapidKLAPI.getRealtimeOperators();

        setStaticOperators(staticData || []);
        setRealtimeOperators(realtimeData || []);

        // Set default based on type requested
        let defaultOp = '';
        if (type === 'static' && staticData.length > 0) {
          defaultOp = staticData[0].id || staticData[0];
        } else if (type === 'realtime' && realtimeData.length > 0) {
          defaultOp = realtimeData[0].id;
        } else if (type === 'both') {
          if (staticData.length > 0) {
            defaultOp = staticData[0].id || staticData[0];
          }
        }

        if (defaultOp) {
          setSelectedOperator(defaultOp);
          onSelectOperator(defaultOp);
        }
      } catch (err) {
        setError('Failed to fetch operators: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, [type, onSelectOperator]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedOperator(value);
    onSelectOperator(value);
  };

  if (loading) return <div className="operator-selector loading">Loading operators...</div>;
  if (error) return <div className="operator-selector error">{error}</div>;

  return (
    <div className="operator-selector">
      {type === 'both' ? (
        <>
          <label htmlFor="operator-select">Transit Operator:</label>
          <select id="operator-select" onChange={handleChange} value={selectedOperator} className="operator-select">
            <optgroup label="📍 Static Data (Routes & Schedules)">
              {staticOperators.map((op) => (
                <option key={`static-${op.id || op}`} value={op.id || op}>
                  {typeof op === 'string' ? op : op.name || op.id}
                </option>
              ))}
            </optgroup>
          </select>
        </>
      ) : type === 'static' ? (
        <>
          <label htmlFor="operator-select">📍 Route Operator:</label>
          <select id="operator-select" onChange={handleChange} value={selectedOperator} className="operator-select">
            {staticOperators.map((op) => (
              <option key={`static-${op.id || op}`} value={op.id || op}>
                {typeof op === 'string' ? op : op.name || op.id}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label htmlFor="operator-select">🚗 Realtime Operator:</label>
          <select id="operator-select" onChange={handleChange} value={selectedOperator} className="operator-select">
            {realtimeOperators.map((op) => (
              <option key={`realtime-${op.id}`} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

export default OperatorSelector;
