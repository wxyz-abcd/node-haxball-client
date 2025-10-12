import { useLocalStorageState } from "./useLocalStorageState";
import { PlayerDataContext } from "./PlayerDataContext";
import playerDataDefaultValues from "./PlayerDataDefaultValues";

export default function PlayerDataProvider({ children }) {
  const [player, setPlayer] = useLocalStorageState("playerData", playerDataDefaultValues);

  const setPlayerField = (field, value) => {
    setPlayer((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <PlayerDataContext.Provider value={{ player, setPlayerField }}>
      {children}
    </PlayerDataContext.Provider>
  );
}
