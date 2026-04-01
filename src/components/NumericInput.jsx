import { useState, useEffect } from "react";

export default function NumericInput({title, min, max, value, defaultValue, onChange}) {
    // Keep local string state to allow for intermediate empty/partial states without snapping
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync from props only when not focused or if value changed externally
    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        
        const numericValue = parseInt(newValue);
        if (!isNaN(numericValue)) {
            // Apply bounds check but don't snap the input text immediately if possible
            let clamped = numericValue;
            if (clamped < min) clamped = min;
            if (clamped > max) clamped = max;
            
            // Only fire onChange if it's a valid number within reasonable constraints
            // We don't call onChange(0) if the user just cleared the field to type "3"
            onChange(clamped);
        }
    };

    const handleBlur = () => {
        // On blur, ensure the text matches the actual numeric value (clean up partials)
        let numericValue = parseInt(localValue);
        if (isNaN(numericValue)) numericValue = defaultValue;
        if (numericValue < min) numericValue = min;
        if (numericValue > max) numericValue = max;
        
        setLocalValue(numericValue.toString());
        onChange(numericValue);
    };

    const handleRestart = () => {
        setLocalValue(defaultValue.toString());
        onChange(defaultValue);
    };

    return (
        <div className="option-row">
            <div style={{marginRight: '10px', flex: 1, minWidth:'115px'}}>{title}</div>
            <input
                className="input"
                type="number"
                style={{
                    width: '80px',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    fontSize: '13px'
                }}
                min={min}
                max={max}
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
            />
            {value !== defaultValue && (
                <a onClick={handleRestart} style={{ marginLeft: '10px', cursor: 'pointer', fontSize: '12px', color: '#888' }}>
                Reset
                </a>
            )}
        </div>
    );
}
