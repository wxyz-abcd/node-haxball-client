import { useState, useRef } from "react";

export default function SoundButton({ soundInstance, setPlayerField, player, initialVolume }) {
  const [volume, setVolume] = useState(initialVolume);
  const [volumeAtMute, setVolumeAtMute] = useState(initialVolume);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  const updateVolume = (v) => {
    setVolume(v);
    if (soundInstance) {
      soundInstance.gain.gain.value = v;
      setPlayerField('sound', {...player.sound, gain: v });
    }
  };

  const handleChange = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const percent = 1 - offsetY / rect.height;
    const clamped = Math.max(0, Math.min(1, percent));
    updateVolume(clamped);
  };

  const handleMouseDown = (e) => {
    e.preventDefault()
    containerRef.current.classList.add("dragging");
    handleChange(e);

    const handleMove = (ev) => handleChange(ev);
    const handleUp = () => {
      containerRef.current.classList.remove("dragging");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleButtonClick = () => {
    if (volume == 0) {
      updateVolume(volumeAtMute || 1);
    } else {
      setVolumeAtMute(volume);
      updateVolume(0);
    };
  }

  let iconClass = "icon-volume-up";
  if (volume === 0) iconClass = "icon-volume-off";
  else if (volume <= 0.5) iconClass = "icon-volume-down";

  return (
    <div
      ref={containerRef}
      className="sound-button-container"
      data-hook="sound"
    >
      <div
        className="sound-slider"
        data-hook="sound-slider"
        ref={sliderRef}
        onMouseDown={handleMouseDown}
      >
        <div className="sound-slider-bar-bg" data-hook="sound-bar-bg">
          <div
            className="sound-slider-bar"
            data-hook="sound-bar"
            style={{ top: `${(1 - volume) * 100}%` }}
          />
        </div>
      </div>
      <button onClick={handleButtonClick} data-hook="sound-btn">
        <i className={iconClass} data-hook="sound-icon" />
      </button>
    </div>
  );
}
