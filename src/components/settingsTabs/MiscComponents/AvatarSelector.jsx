import React, { useState } from "react";

export default function AvatarSelector({ onSelect, selected }) {
  const [avatarUrl, setAvatarUrl] = useState(selected);

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
          const base64Image = e.target.result;
          setAvatarUrl(base64Image);
          if (onSelect) {
              onSelect(base64Image);
          }
          };

          reader.readAsDataURL(file);
      }
    };

  const handleClear = () => {
    setAvatarUrl(null);
    if (onSelect) {
      onSelect(null);
    }
  };

  return (
    <div className="label-input" style={{ flexDirection: "column", gap: "8px", padding: "8px" }}>
      {/* 1. Header label element */}
      <label style={{ fontWeight: "bold" }}>Avatar Selector</label>

      {/* 2. Current selected image preview element */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50px" }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Current Avatar"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid var(--border-accent)",
            }}
          />
        ) : (
          <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>No avatar selected</span>
        )}
      </div>

      {/* 3. Select / Change / Clear action elements */}
      <div className="row" style={{ width: "100%", gap: "6px" }}>
        <div className="file-btn" style={{ flex: 1 }}>
          <label htmlFor="avatar-file-input">
            {avatarUrl ? "Change Image" : "Select Image"}
          </label>
          <input
            id="avatar-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {avatarUrl && (
          <button
            type="button"
            onClick={handleClear}
            style={{ backgroundColor: "var(--btn-danger)", flex: "0 0 auto" }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}