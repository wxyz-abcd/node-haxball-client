import React, { useState } from "react";
import { usePlayerData } from "../../hooks/usePlayerData.jsx";
import Game from "../game/Game.jsx";
import useRoomCreate from "../../hooks/useRoomCreate.jsx";
import Recaptcha from "./Recaptcha.jsx";
import Popup from "../../components/Popup.jsx";

export default function CreateRoom() {
  const { player, setPlayerField } = usePlayerData();
  const [name, setName] = useState(`${player.name}'s room`);
  const [password, setPassword] = useState("");
  const [maxPl, setMaxPl] = useState(10);
  const [showInRoomList, setShowInRoomList] = useState(true);

  const { roomRef, loading, error, createRoom } = useRoomCreate();
  const [roomCreated, setRoomCreated] = useState(false);
  const [popup, setPopup] = useState(null);
  const handleCreate = async (token) => {
    const geo = player.geo || await window.API.Utils.getGeo();
    setPlayerField('geo', geo);
    await createRoom({
      name,
      password,
      maxPlayerCount: maxPl,
      showInRoomList,
      storage: { player_name: player.name, avatar: player.avatar, player_auth_key: player.authKey, geo: player.geo },
      token  // we must show basro's token recaptcha somehow
    });
    setRoomCreated(true);
  };

  if (loading) return <div>connecting</div>
  if (error) return <div className="connect-error">Error: {String(error)}</div>;
  if (roomCreated) return <Game roomRef={roomRef} />;

  return (
    <div className="create-room-view">
      <Popup PopupComponent={popup?.component} popupComponentProps={{...popup?.props}} closePopup={()=>setPopup(null)} />
      <div className="dialog">
        <h1>Create room</h1>

        <div className="label-input">
          <label>Room name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="label-input">
          <label>Password:</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="label-input">
          <label>Max players:</label>
          <select value={maxPl} onChange={(e) => setMaxPl(Number(e.target.value))}>
            {Array.from({ length: 19 }, (_, i) => i + 2).map(n => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setShowInRoomList(p => !p)}>
          Show in room list: {showInRoomList ? "Yes" : "No"}
        </button>

        <div className="row">
          <button onClick={() => window.history.back()}>Cancel</button>
          <button onClick={() => setPopup({component: Recaptcha, props: {onSuccess:(token)=>handleCreate(token)}})}>Create</button>
        </div>
      </div>
    </div>
  );
}
