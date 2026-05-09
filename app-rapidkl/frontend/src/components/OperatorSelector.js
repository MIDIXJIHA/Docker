import React, { useState, useEffect } from 'react';
import RapidKLAPI from '../services/api';
import './OperatorSelector.css';

function OperatorSelector({ onSelectOperator }) {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RapidKLAPI.getOperators();
        setOperators(data);
        // Select first operator by default
        if (data.length > 0) {
          onSelectOperator(data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch operators: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, [onSelectOperator]);

  if (loading) return <div className="operator-selector loading">Loading operators...</div>;
  if (error) return <div className="operator-selector error">{error}</div>;

  return (
    <div className="operator-selector">
      <label htmlFor="operator-select">Transit Operator:</label>
      <select
        id="operator-select"
        onChange={(e) => onSelectOperator(e.target.value)}
        defaultValue={operators.length > 0 ? operators[0].id : ''}
        className="operator-select"
      >
        {operators.map((op) => (
          <option key={op.id} value={op.id}>
            {op.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default OperatorSelector;
