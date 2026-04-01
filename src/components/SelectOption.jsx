import { useState, useEffect } from "react";

export default function SelectOption({ title, value, options, onChange, defaultValue }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleRestart = (e) => {
    e.stopPropagation();
    setLocalValue(defaultValue);
    onChange(defaultValue);
  };

  return (
    <div className="option-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
      <div style={{ flex: 1 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <select
          className="input"
          value={localValue}
          onChange={handleChange}
          style={{
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '2px 5px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {value !== defaultValue && (
          <a 
            onClick={handleRestart} 
            style={{ 
              marginLeft: '10px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              color: '#888',
              textDecoration: 'none'
            }}
          >
            Reset
          </a>
        )}
      </div>
    </div>
  );
}
