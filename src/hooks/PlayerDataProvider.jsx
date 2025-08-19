import { useLocalStorageState } from './useLocalStorageState';
import { PlayerDataContext } from './PlayerDataContext';

export default function PlayerDataProvider({ children }) {
  const [player, setPlayer] = useLocalStorageState('playerData', {
    name: null,
    authKey: null,
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
