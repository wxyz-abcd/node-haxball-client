import { useState, useEffect, useRef } from "react";

/**
 * A styled input dialog that replaces window.prompt().
 * Renders inside the existing Popup system, using Haxball's native CSS classes.
 *
 * Props:
 *  - title:       Dialog heading (string)
 *  - message:     Description text (string, optional)
 *  - placeholder: Input placeholder (string, optional)
 *  - submitText:  Label for the confirm button (default "OK")
 *  - cancelText:  Label for the cancel button (default "Cancel")
 *  - inputType:   "text" | "password" (default "text")
 *  - onSubmit:    (value: string) => void
 *  - onCancel:    () => void   (called when user cancels; falls back to onClose)
 *  - onClose:     () => void   (provided automatically by <Popup />)
 */
export default function InputDialog({
  title = "Input",
  message,
  placeholder = "",
  submitText = "OK",
  cancelText = "Cancel",
  inputType = "text",
  onSubmit,
  onCancel,
  onClose,
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const handleCancel = onCancel || onClose;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel?.();
    }
  };

  return (
    <div className="room-password-view" onKeyDown={handleKeyDown}>
      <form className="dialog" onSubmit={handleSubmit} style={{ minWidth: 300 }}>
        <h1>{title}</h1>
        {message && <p style={{ lineHeight: "1.4em", marginBottom: 8 }}>{message}</p>}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          style={{ height: 30 }}
        />
        <div className="buttons" style={{ marginTop: 8 }}>
          <button type="submit">{submitText}</button>
          <button type="button" onClick={handleCancel}>{cancelText}</button>
        </div>
      </form>
    </div>
  );
}
