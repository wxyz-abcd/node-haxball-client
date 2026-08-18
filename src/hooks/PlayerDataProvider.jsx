import { useLocalStorageState } from "./useLocalStorageState";
import { PlayerDataContext } from "./PlayerDataContext";
import { clonePlayerData, createAccountId, createInitialAccountStore, normalizeAccountStore, PLAYER_ACCOUNTS_STORAGE_KEY } from "./playerAccounts.js";
import { useCallback, useEffect, useMemo } from "react";

export default function PlayerDataProvider({ children }) {
  const initialStore = useMemo(() => createInitialAccountStore(), []);
  const [storedAccounts, setStoredAccounts] = useLocalStorageState(PLAYER_ACCOUNTS_STORAGE_KEY, initialStore);
  const accountStore = useMemo(() => normalizeAccountStore(storedAccounts, initialStore), [initialStore, storedAccounts]);
  const activeAccount = accountStore.accounts.find((account) => account.id === accountStore.activeAccountId) || accountStore.accounts[0];
  const player = activeAccount.player;

  useEffect(() => {
    if (JSON.stringify(storedAccounts) !== JSON.stringify(accountStore)) {
      setStoredAccounts(accountStore);
    }
  }, [accountStore, setStoredAccounts, storedAccounts]);

  useEffect(() => {
    localStorage.setItem("playerData", JSON.stringify(player));
  }, [player]);

  const setPlayerField = useCallback((field, value) => {
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      return {
        ...normalized,
        accounts: normalized.accounts.map((account) => account.id === normalized.activeAccountId
          ? { ...account, player: { ...account.player, [field]: value } }
          : account),
      };
    });
  }, [initialStore, setStoredAccounts]);

  const setAccountPlayerField = useCallback((accountId, field, value) => {
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      return {
        ...normalized,
        accounts: normalized.accounts.map((account) => account.id === accountId
          ? { ...account, player: { ...account.player, [field]: value } }
          : account),
      };
    });
  }, [initialStore, setStoredAccounts]);

  const switchAccount = useCallback((accountId) => {
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      if (!normalized.accounts.some((account) => account.id === accountId)) return normalized;
      return { ...normalized, activeAccountId: accountId };
    });
  }, [initialStore, setStoredAccounts]);

  const createAccount = useCallback(({ name, authKey, nickname }) => {
    const id = createAccountId();
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      const currentAccount = normalized.accounts.find((account) => account.id === normalized.activeAccountId) || normalized.accounts[0];
      const accountPlayer = clonePlayerData(currentAccount.player);
      accountPlayer.authKey = authKey;
      accountPlayer.name = nickname || null;
      return {
        ...normalized,
        activeAccountId: id,
        accounts: [...normalized.accounts, { id, name: name.trim(), player: accountPlayer }],
      };
    });
    return id;
  }, [initialStore, setStoredAccounts]);

  const renameAccount = useCallback((accountId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      return {
        ...normalized,
        accounts: normalized.accounts.map((account) => account.id === accountId
          ? { ...account, name: trimmedName }
          : account),
      };
    });
  }, [initialStore, setStoredAccounts]);

  const deleteAccount = useCallback((accountId) => {
    setStoredAccounts((current) => {
      const normalized = normalizeAccountStore(current, initialStore);
      if (normalized.accounts.length === 1) return normalized;
      const accounts = normalized.accounts.filter((account) => account.id !== accountId);
      return {
        ...normalized,
        accounts,
        activeAccountId: normalized.activeAccountId === accountId ? accounts[0].id : normalized.activeAccountId,
      };
    });
  }, [initialStore, setStoredAccounts]);

  const contextValue = useMemo(() => ({
    player,
    setPlayerField,
    setAccountPlayerField,
    accounts: accountStore.accounts,
    activeAccount,
    activeAccountId: accountStore.activeAccountId,
    switchAccount,
    createAccount,
    renameAccount,
    deleteAccount,
  }), [accountStore, activeAccount, createAccount, deleteAccount, player, renameAccount, setAccountPlayerField, setPlayerField, switchAccount]);

  return (
    <PlayerDataContext.Provider value={contextValue}>
      {children}
    </PlayerDataContext.Provider>
  );
}
