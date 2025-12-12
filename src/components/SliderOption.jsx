import { useState } from "react";

export default function SliderOption({title, min, max, step, value, defaultValue, onChange}) {
    const [sliderValue, setSliderValue] = useState(value);
    const handleChange = (e) => {
        setSliderValue(e.target.value);
        onChange(parseFloat(e.target.value));
    };

    const handleRestart = () => {
        setSliderValue(defaultValue);
        onChange(parseFloat(defaultValue));
    };

    return (
        <div className="option-row">
            <div style={{marginRight: '10px', flex: 1, maxWidth:'115px'}}>{title}</div>
            <div style={{width: '40px'}}>{sliderValue}</div>
            <input
                className="slider"
                type="range"
                min={min}
                max={max}
                step={step}
                value={sliderValue}
                onChange={handleChange}
            />
            {value !== defaultValue && (
                <a onClick={handleRestart} style={{ marginLeft: '10px' }}>
                Restart value
                </a>
            )}
        </div>
    )
}