import { useState } from "react";
import { usePlayerData } from "../hooks/usePlayerData.jsx";
import SoundContent from "./settingsTabs/SoundContent.jsx";
import VideoContent from "./settingsTabs/VideoContent.jsx";
import InputContent from "./settingsTabs/InputContent.jsx";
import MiscContent from "./settingsTabs/MiscContent.jsx";
import ThemeContent from "./settingsTabs/ThemeContent.jsx";
import { useCallback } from "react";

function SettingsPopup({onClose, roomRef /*PlayerDataProvider*/}) {
  const { player, setPlayerField } = usePlayerData();
  const setPlayerFieldCb = useCallback((field, value) => {
    setPlayerField(field, value);
  }, [setPlayerField]);

  const [activeTab, setActiveTab] = useState("sound");

  const renderContent = () => {
    switch (activeTab) {
      case "sound": return <SoundContent player={player} setPlayerField={setPlayerFieldCb} />;
      case "video": return <VideoContent player={player} setPlayerField={setPlayerFieldCb} roomRef={roomRef} />;
      case "input": return <InputContent player={player} setPlayerField={setPlayerFieldCb} />;
      case "misc": return <MiscContent player={player} setPlayerField={setPlayerFieldCb} />;
      case "theme": return <ThemeContent />;
      default: return null;
    }
  };

  return (
    <div className="view-wrapper">
      <div className="dialog settings-view">
        <h1>Settings</h1>
        <button onClick={onClose} data-hook="close">Close</button>
        <div className="tabs">
          <button 
            onClick={() => setActiveTab("sound")} 
            data-hook="soundbtn" 
            className={activeTab === "sound" ? "active" : ""}
          >
          Sound
          </button>
          <button 
            onClick={() => setActiveTab("video")} 
            data-hook="videobtn" 
            className={activeTab === "video" ? "active" : ""}
          >
          Video
          </button>
          <button 
            onClick={() => setActiveTab("input")} 
            data-hook="inputbtn" 
            className={activeTab === "input" ? "active" : ""}
          >
          Input
          </button>
          <button 
            onClick={() => setActiveTab("misc")} 
            data-hook="miscbtn" 
            className={activeTab === "misc" ? "active" : ""}
          >
          Misc
          </button>
          <button 
            onClick={() => setActiveTab("theme")} 
            data-hook="themebtn" 
            className={activeTab === "theme" ? "active" : ""}
          >
          Theme
          </button>
        </div>
        <div className="tabcontents">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsPopup;
