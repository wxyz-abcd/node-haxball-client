import { useState } from "react";
import Toggle from "./Toggle";

export default function SoundContent({ player, setPlayerField }) {
  const [playerCopy, setPlayerCopy] = useState(player);

  const changed = (field, value) => {
    setPlayerField(field, value);
    setPlayerCopy(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="section selected">
        <Toggle text='Sounds enabled' state={playerCopy.soundMain} onClick={() => changed("soundMain", !playerCopy.soundMain)}/>
        <Toggle text='Chat sound enabled' state={playerCopy.soundChat} onClick={() => changed("soundChat", !playerCopy.soundChat)}/>
        <Toggle text='Nick highlight sound enabled' state={playerCopy.soundHighlight} onClick={() => changed("soundHighlight", !playerCopy.soundHighlight)}/>
        <Toggle text='Crowd sound enabled' state={playerCopy.soundCrowd} onClick={() => changed("soundCrowd", !playerCopy.soundCrowd)}/>
    </div>
  );
}
