import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";

const MOUSE_BUTTON_NAMES = {
  0: "Mouse Left",
  1: "Mouse Middle",
  2: "Mouse Right",
};

const formatKeyLabel = (key) => {
  if (key.startsWith("Mouse")) {
    const button = key.replace("Mouse", "");
    return MOUSE_BUTTON_NAMES[button] ?? key;
  }
  return key;
};

export default function InputContent({ player, setPlayerField }) {
  const [keys, setKeys] = useState(player.keys);
  const [waitingForKey, setWaitingForKey] = useState(null);

  const bindKey = useCallback((newKey) => {
    setKeys((prevKeys) => {
      const updatedKeys = { ...prevKeys };
      if (!updatedKeys[waitingForKey].includes(newKey)) {
        updatedKeys[waitingForKey] = [...updatedKeys[waitingForKey], newKey];
      }
      setPlayerField("keys", updatedKeys);
      return updatedKeys;
    });
    setWaitingForKey(null);
  }, [setPlayerField, waitingForKey]);
  
  const handleKeyDown = useCallback((event) => {
    if (!waitingForKey) return;
    event.preventDefault();
    bindKey(event.code);
  }, [waitingForKey, bindKey]);

  const handleMouseDown = useCallback((event) => {
    if (!waitingForKey) return;
    event.preventDefault();
    bindKey(`Mouse${event.button}`);
  }, [waitingForKey, bindKey]);

  const handleContextMenu = useCallback((event) => {
    if (waitingForKey) event.preventDefault();
  }, [waitingForKey]);

  const handleRemoveKey = (action, key) => {
    setKeys((prevKeys) => {
      const updatedKeys = { ...prevKeys };
      updatedKeys[action] = updatedKeys[action].filter((k) => k !== key);
      setPlayerField("keys", updatedKeys);
      return updatedKeys;
    });
  };

  useEffect(() => {
    if (waitingForKey) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("contextmenu", handleContextMenu);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [handleKeyDown, handleMouseDown, handleContextMenu, waitingForKey]);

  return (
    <div className="section selected">
        {waitingForKey && (
            <div style={{margin:0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                Press a key or click a mouse button to bind for {waitingForKey} action...
            </div>
        )} 
        {Object.keys(keys).map((action) => (
            <div key={action} className="inputrow">
                <div>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                </div>
                {keys[action].map((key) => {
                    return (
                    <div key={key}>
                        {formatKeyLabel(key)}
                        {<i onClick={()=>handleRemoveKey(action, key)} className="icon-cancel"></i>}
                    </div>
                )})}

                <i onClick={()=>setWaitingForKey(action)} className="icon-plus"/>
            </div>
        ))}
    </div>
  );    
}