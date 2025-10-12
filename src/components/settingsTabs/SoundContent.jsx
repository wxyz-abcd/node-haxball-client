import { useState } from "react";
import Toggle from "../Toggle";
import playerDefaultValues from "../../hooks/PlayerDataDefaultValues"

export default function SoundContent({ player, setPlayerField }) {
  const [playerCopy, setPlayerCopy] = useState(player);

  const changed = (field, value) => {
    setPlayerField('chat', { ...player.sound, [field]: value });
    setPlayerCopy(prev => ({ ...prev, sound: { ...prev.sound, [field]: value } }));
  };

  return (
    <div className="section selected">
        <Toggle title='Sounds enabled' value={playerCopy.sound.main} defaultValue={playerDefaultValues.sound.main} onChange={(value) => changed("main", value)}/>
        <Toggle title='Chat sound enabled' value={playerCopy.sound.chat} defaultValue={playerDefaultValues.sound.chat} onChange={(value) => changed("chat", value)}/>
        <Toggle title='Nick highlight sound enabled' value={playerCopy.sound.highlight} defaultValue={playerDefaultValues.sound.highlight} onChange={(value) => changed("highlight", value)}/>
        <Toggle title='Crowd sound enabled' value={playerCopy.sound.crowd} defaultValue={playerDefaultValues.sound.crowd} onChange={(value) => changed("crowd", value)}/>
    </div>
  );
}
