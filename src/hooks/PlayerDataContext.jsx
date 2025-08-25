import React, { createContext } from 'react';

export const PlayerDataContext = createContext({
  player: {},
  setPlayerField: () => {}
});