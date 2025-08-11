import React, { createContext } from 'react';
import { useLocalStorageState } from './useLocalStorageState';

export const PlayerDataContext = createContext({
  player: {},
  setPlayerField: () => {}
});

export function PlayerDataProvider({ children }) {
  const [player, setPlayer] = useLocalStorageState('playerData', {
    name: null,
    authToken: null,
    geo: null,
    avatar: null
  });

  const setPlayerField = (field, value) => {
    setPlayer(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PlayerDataContext.Provider value={{ player, setPlayerField }}>
      {children}
    </PlayerDataContext.Provider>
  );
}
