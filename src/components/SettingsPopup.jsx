import { useState } from "react";
import { usePlayerData } from "../hooks/usePlayerData.jsx";
import SoundContent from "./settingsTabs/SoundContent.jsx";
import VideoContent from "./settingsTabs/VideoContent.jsx";
import InputContent from "./settingsTabs/InputContent.jsx";
import MiscContent from "./settingsTabs/MiscContent.jsx";
import { useCallback } from "react";

function SettingsPopup({onClose, roomRef /*PlayerDataProvider*/}) {
  const { player, setPlayerField } = usePlayerData();
  const setPlayerFieldCb = useCallback((field, value) => {
    setPlayerField(field, value);
  }, [setPlayerField]);

  const [content, setContent] = useState(()=><SoundContent player={player} setPlayerField={setPlayerFieldCb} />)

  return (
    <div className="view-wrapper">
      <div className="dialog settings-view">
        <h1>Settings</h1>
        <button onClick={onClose} data-hook="close">Close</button>
        <div className="tabs">
          <button onClick={() => setContent(<SoundContent player={player} setPlayerField={setPlayerFieldCb} />)} data-hook="soundbtn" className="">
          Sound
          </button>
          <button onClick={() => setContent(<VideoContent player={player} setPlayerField={setPlayerFieldCb} roomRef={roomRef} />)} data-hook="videobtn" className="" >
          Video
          </button>
          <button onClick={() => setContent(<InputContent player={player} setPlayerField={setPlayerFieldCb} />)} data-hook="inputbtn" className="" >
          Input
          </button>
          <button onClick={() => setContent(<MiscContent player={player} setPlayerField={setPlayerFieldCb} />)} data-hook="miscbtn" className="" >
          Misc
          </button>
        </div>
        <div className="tabContents">
          {content}
        </div>
      </div>
    </div>
  );
}

export default SettingsPopup;
