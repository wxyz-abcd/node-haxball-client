import { usePlayerData } from "../../../hooks/usePlayerData";
import { useEffect, useState } from "react";

export default function AuthSetter() {
  const { player, setPlayerField } = usePlayerData();
  const API = window.API;
  const [auth, authSet] = useState(null);
  const authInputChanged = (e) => {
    const value = e.target.value;
    console.log(value.length);
    if (value.length == 137) setPlayerField('authKey', value);
    authSet(value);
  }
  useEffect(() => {
    if (player.authKey) {
        authSet(player.authKey);
    } else {
        authSet('');
    }
  }, [player.authKey]);
    return (
    <div>
        Auth:
        <br></br>
        <input value={auth} onChange={authInputChanged}></input>
    </div>
  );
}
