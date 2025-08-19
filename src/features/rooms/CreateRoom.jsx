import React, { useState } from "react";
import { usePlayerData } from "../../hooks/usePlayerData";
import Game from "../game/Game";
import useRoomCreate from "../../hooks/useRoomCreate.jsx";
import Recaptcha from "./Recaptcha.jsx";

export default function CreateRoom() {
  const { player } = usePlayerData();
  const [name, setName] = useState(`${player.name}'s room`);
  const [password, setPassword] = useState("");
  const [maxPl, setMaxPl] = useState(10);
  const [showInRoomList, setShowInRoomList] = useState(true);

  const { roomRef, loading, error, createRoom } = useRoomCreate();
  const [roomCreated, setRoomCreated] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false);

  const handleCreate = async (token) => {
    await createRoom({
      name,
      password,
      maxPlayerCount: maxPl,
      showInRoomList,
      storage: { player_name: player.name, avatar: player.avatar },
      token  // we must show basro's token recaptcha somehow
    });
    setRoomCreated(true);
  };

  if (loading) return <div className="connecting">Creating room…</div>;
  if (error) return <div className="connect-error">Error: {String(error)}</div>;
  if (roomCreated) return <Game roomRef={roomRef} />;
  if (showRecaptcha) return <Recaptcha onSuccess={(token)=>handleCreate(token)} />

  return (
    <div className="create-room-view">
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
          <button onClick={() => setShowRecaptcha(true)}>Create</button>
        </div>
      </div>
    </div>
  );
}
