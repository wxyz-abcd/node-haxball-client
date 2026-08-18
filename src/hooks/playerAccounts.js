import playerDataDefaultValues from "./PlayerDataDefaultValues.js";
import { mergeDefaults } from "./useLocalStorageState.js";

export const PLAYER_ACCOUNTS_STORAGE_KEY = "playerAccounts";
export const PLAYER_ACCOUNTS_VERSION = 1;

export function createAccountId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `account-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizePlayerData(player) {
  return mergeDefaults(player || {}, playerDataDefaultValues);
}

export function clonePlayerData(player) {
  return JSON.parse(JSON.stringify(normalizePlayerData(player)));
}

function readLegacyPlayerData() {
  try {
    const stored = localStorage.getItem("playerData");
    return stored ? JSON.parse(stored) : playerDataDefaultValues;
  } catch {
    return playerDataDefaultValues;
  }
}

export function createInitialAccountStore() {
  const player = clonePlayerData(readLegacyPlayerData());
  const id = createAccountId();
  return {
    version: PLAYER_ACCOUNTS_VERSION,
    activeAccountId: id,
    accounts: [{
      id,
      name: player.name ? `${player.name}` : "Default account",
      player,
    }],
  };
}

export function normalizeAccountStore(store, fallbackStore) {
  const sourceAccounts = Array.isArray(store?.accounts) && store.accounts.length > 0
    ? store.accounts
    : fallbackStore.accounts;
  const accounts = sourceAccounts.map((account, index) => ({
    id: account.id || createAccountId(),
    name: `${account.name || `Account ${index + 1}`}`,
    player: clonePlayerData(account.player),
  }));
  const activeAccountId = accounts.some((account) => account.id === store?.activeAccountId)
    ? store.activeAccountId
    : accounts[0].id;

  return {
    version: PLAYER_ACCOUNTS_VERSION,
    activeAccountId,
    accounts,
  };
}
