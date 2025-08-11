import React, { useState } from 'react';
import { usePlayerData } from '../../hooks/usePlayerData';
import haxballImage from '../../assets/images/haxball.png';

export default function NameForm({ onNameSet }) {
  const { player, setPlayerField } = usePlayerData();
  const [name, setName] = useState(player.name || '');

  const handleSubmit = e => {
    e.preventDefault();
    setPlayerField('name', name);
    onNameSet();
  };

  return (
    <div className="choose-nickname-view">
      <img src={haxballImage}></img>
      <div className="dialog">
        <h1>Choose nickname</h1>
        <div className="label-input">
          <label>Nick:</label>
          <input
           data-hook="input"
           type="text"
           maxLength="25"
           value={name}
           onChange={e => setName(e.target.value)}
          />
        </div>
        <button data-hook="ok" onClick={handleSubmit}>Ok</button>
      </div>
    </div>
  );
}
