import { useState } from "react";
import { usePlayerData } from "../hooks/usePlayerData.jsx";
import SoundContent from "./settingsTabs/SoundContent.jsx";
import VideoContent from "./settingsTabs/VideoContent.jsx";
import InputContent from "./settingsTabs/InputContent.jsx";
import MiscContent from "./settingsTabs/MiscContent.jsx";

function SettingsPopup({onClose}) {
  const { player, setPlayerField } = usePlayerData();
  const [content, setContent] = useState(()=><SoundContent player={player} setPlayerField={setPlayerField} />)
  const changeContent = (content) => {
    setContent(content)
  }

  return (
    <div className="view-wrapper">
      <div className="dialog settings-view">
        <h1>Settings</h1>
        <button onClick={onClose} data-hook="close">Close</button>
        <div className="tabs">
          <button onClick={() => changeContent(<SoundContent player={player} setPlayerField={setPlayerField} />)} data-hook="soundbtn" className="">
          Sound
          </button>
          <button onClick={() => changeContent(<VideoContent player={player} setPlayerField={setPlayerField} />)} data-hook="videobtn" className="" >
          Video
          </button>
          <button onClick={() => changeContent(<InputContent player={player} setPlayerField={setPlayerField} />)} data-hook="inputbtn" className="" >
          Input
          </button>
          <button onClick={() => changeContent(<MiscContent player={player} setPlayerField={setPlayerField} />)} data-hook="miscbtn" className="" >
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
