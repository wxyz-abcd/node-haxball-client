import { useState } from "react";

export default function Toggle({ title, help, value, onChange, defaultValue }) {
  const [showHelp, setShowHelp] = useState(false);

  const restart = (e) => {
    e.stopPropagation();
    onChange(defaultValue);
  };

  const handleClick = () => {
    onChange(!value);
  };

  const toggleHelp = (e) => {
    e.stopPropagation();
    setShowHelp((prev) => !prev);
  };

  return (
    <div
      onClick={handleClick}
      className="toggle"
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
    >
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <i className={`icon-${value ? "ok" : "cancel"}`} />
        {title}
        {help && (
          <span
            onClick={toggleHelp}
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            title={help}
            style={{
              marginLeft: "6px",
              cursor: "help",
              color: "#888",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <i className="icon-help" />
            {showHelp && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: "6px",
                  padding: "6px 10px",
                  background: "#222",
                  color: "#fff",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  borderRadius: "4px",
                  width: "220px",
                  whiteSpace: "normal",
                  zIndex: 10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {help}
              </div>
            )}
          </span>
        )}
      </div>
      {value !== defaultValue && (
        <a
          onClick={restart}
          style={{
            marginLeft: "10px",
            cursor: value !== defaultValue ? "pointer" : "not-allowed",
            fontSize: "12px",
            color: "#888",
          }}
        >
          Reset
        </a>
      )}
    </div>
  );
}