import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";

export default function InputContent({ player, setPlayerField }) {
  const [keys, setKeys] = useState(player.keys);
  const [waitingForKey, setWaitingForKey] = useState(null);
  
  const handleKeyDown = useCallback((event) => {
    if (waitingForKey) {
      event.preventDefault();
      const newKey = event.code;
      setKeys((prevKeys) => {
        const updatedKeys = { ...prevKeys };
        if (!updatedKeys[waitingForKey].includes(newKey)) {
          updatedKeys[waitingForKey] = [...updatedKeys[waitingForKey], newKey];
        }
        setPlayerField("keys", updatedKeys);
        return updatedKeys;
      });
      setWaitingForKey(null);
    }
  }, [setPlayerField, waitingForKey]);

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
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, waitingForKey]);

  return (
    <div className="section selected">
        {waitingForKey && (
            <div onKeyDown={handleKeyDown} style={{margin:0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                Press a key to bind for {waitingForKey} action...
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
                        {key}
                        {<i onClick={()=>handleRemoveKey(action, key)} className="icon-cancel"></i>}
                    </div>
                )})}

                <i onClick={()=>setWaitingForKey(action)} className="icon-plus"/>
            </div>
        ))}
    </div>
  );    
}