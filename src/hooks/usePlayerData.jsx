import { useContext } from 'react';
import { PlayerDataContext } from './PlayerDataContext';

export function usePlayerData() {
  const context = useContext(PlayerDataContext);
  if (!context) {
    throw new Error('usePlayerData must be used within PlayerDataProvider');
  }
  return context;
}
