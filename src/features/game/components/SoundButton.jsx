import { useState, useRef } from "react";

export default function SoundButton({ soundInstance, setPlayerField, sound }) {
  const [volume, setVolume] = useState(sound.gain);
  const [volumeAtMute, setVolumeAtMute] = useState(sound.gain);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  const applyVolume = (v) => {
    if (soundInstance) soundInstance.gain.gain.value = v;
    setVolume(v);
    return v;
  };

  const commitVolume = (v) => {
    setPlayerField('sound', { ...sound, gain: v });
  };

  const handleChange = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const percent = 1 - offsetY / rect.height;
    const clamped = Math.max(0, Math.min(1, percent));
    return applyVolume(clamped);
  };

  const handleMouseDown = (e) => {
    e.preventDefault()
    containerRef.current.classList.add("dragging");
    let localVol = handleChange(e);

    const handleMove = (ev) => {
      localVol = handleChange(ev);
    };
    const handleUp = () => {
      commitVolume(localVol);
      containerRef.current.classList.remove("dragging");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleButtonClick = () => {
    if (volume === 0) {
      const v = applyVolume(volumeAtMute || 1);
      commitVolume(v);
    } else {
      setVolumeAtMute(volume);
      const v = applyVolume(0);
      commitVolume(v);
    }
  };

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
