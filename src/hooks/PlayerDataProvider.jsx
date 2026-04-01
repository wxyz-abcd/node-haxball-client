import { useLocalStorageState } from "./useLocalStorageState";
import { PlayerDataContext } from "./PlayerDataContext";
import playerDataDefaultValues from "./PlayerDataDefaultValues";
import { useCallback, useMemo } from "react";

export default function PlayerDataProvider({ children }) {
  const [player, setPlayer] = useLocalStorageState("playerData", playerDataDefaultValues);

  const setPlayerField = useCallback((field, value) => {
    setPlayer((prev) => ({ ...prev, [field]: value }));
  }, [setPlayer]);

  const contextValue = useMemo(() => ({ player, setPlayerField }), [player, setPlayerField]);

  return (
    <PlayerDataContext.Provider value={contextValue}>
      {children}
    </PlayerDataContext.Provider>
  );
}
