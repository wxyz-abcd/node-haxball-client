export default function Toggle({ text, state, onClick }) {
  return (
    <div onClick={onClick} className="toggle">
      <i className={`icon-${state ? "ok" : "cancel"}`} />
      {text}
    </div>
  );
}
