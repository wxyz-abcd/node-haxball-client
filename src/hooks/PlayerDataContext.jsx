import React, { createContext } from 'react';

export const PlayerDataContext = createContext({
  player: {},
  setPlayerField: () => {},
  setAccountPlayerField: () => {},
  accounts: [],
  activeAccount: null,
  activeAccountId: null,
  switchAccount: () => {},
  createAccount: () => null,
  renameAccount: () => {},
  deleteAccount: () => {},
});
