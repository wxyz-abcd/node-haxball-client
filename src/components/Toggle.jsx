export default function Toggle({ title, value, onChange, defaultValue }) {
  const restart = () => {
    onChange(defaultValue);
  };

  const handleClick = () => {
    onChange(!value);
  };

  return (
    <div onClick={handleClick} className="toggle" style={{ display:'flex', justifyContent: 'space-between', alignItems:'center'}}>
      <div>
        <i className={`icon-${value ? "ok" : "cancel"}`} />
        {title}
      </div>
      {value !== defaultValue && (
        <a onClick={restart} style={{ float: "right", display: "inline" }}>
          Restart value
        </a>
      )}
    </div>
  );
}
