import { useMemo, useState } from "react";
import { usePlayerData } from "../../hooks/usePlayerData.jsx";

const text = {
  accounts: "Accounts", createAccount: "Create account", editAccount: "Edit account", hint: "Each account keeps its own auth, identity and local settings.",
  nickname: "Nickname", notSet: "Not set", configured: "Configured", auth: "Auth", active: "Active", switch: "Switch", edit: "Edit profile", configure: "Full settings",
  delete: "Delete", current: "Current account", close: "Close", accountName: "Account name", authKey: "Auth key", avatar: "Player avatar",
  avatarHint: "Up to 2 characters", extrapolation: "Extrapolation (ms)", generate: "Generate new auth", createHint: "The new account starts with a copy of the current local settings.",
  createAndSwitch: "Create and switch", save: "Save", back: "Back", working: "Working...", nameRequired: "Enter a name for the account.",
  authRequired: "Generate or enter an auth key.", invalidAuth: "The auth key is invalid.", generateError: "Could not generate an auth key.",
  invalidExtrapolation: "Extrapolation must be between -1000 and 10000 ms.", deleteConfirm: "Delete account", configureTitle: "Activate this account and open all local settings",
};

function formatAuthKey(authKey) {
  if (!authKey) return text.notSet;
  if (authKey.length < 18) return text.configured;
  return `${authKey.slice(0, 8)}...${authKey.slice(-6)}`;
}

export default function AccountsPopup({ onClose, onConfigure }) {
  const { accounts, activeAccountId, switchAccount, createAccount, renameAccount, deleteAccount, setAccountPlayerField, player } = usePlayerData();
  const [view, setView] = useState("list");
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [nickname, setNickname] = useState(player.name || "");
  const [authKey, setAuthKey] = useState("");
  const [avatar, setAvatar] = useState("");
  const [extrapolation, setExtrapolation] = useState("0");
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);

  const activeAccount = useMemo(() => accounts.find((account) => account.id === activeAccountId), [accounts, activeAccountId]);

  const resetForm = () => {
    setAccountId(null);
    setAccountName("");
    setNickname(player.name || "");
    setAuthKey("");
    setAvatar("");
    setExtrapolation("0");
    setError(null);
  };

  const showCreate = () => {
    resetForm();
    setView("create");
  };

  const showEdit = (account) => {
    setAccountId(account.id);
    setAccountName(account.name);
    setNickname(account.player.name || "");
    setAuthKey(account.player.authKey || "");
    setAvatar(account.player.avatar || "");
    setExtrapolation(String(account.player.extrapolation ?? 0));
    setError(null);
    setView("edit");
  };

  const generateAuth = async () => {
    setWorking(true);
    setError(null);
    try {
      const [generatedKey] = await window.API.Utils.generateAuth();
      setAuthKey(generatedKey);
    } catch (authError) {
      setError(authError?.toString?.() || text.generateError);
    } finally {
      setWorking(false);
    }
  };

  const validateForm = async () => {
    const trimmedName = accountName.trim();
    const trimmedAuthKey = authKey.trim();
    const extrapolationValue = Number(extrapolation);
    if (!trimmedName) throw new Error(text.nameRequired);
    if (!trimmedAuthKey) throw new Error(text.authRequired);
    if (!Number.isFinite(extrapolationValue) || extrapolationValue < -1000 || extrapolationValue > 10000) throw new Error(text.invalidExtrapolation);
    await window.API.Utils.authFromKey(trimmedAuthKey);
    return { trimmedName, trimmedAuthKey, extrapolationValue };
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const values = await validateForm();
      if (view === "create") {
        const newAccountId = createAccount({ name: values.trimmedName, authKey: values.trimmedAuthKey, nickname: nickname.trim() });
        setAccountPlayerField(newAccountId, "avatar", avatar.trim() || null);
        setAccountPlayerField(newAccountId, "extrapolation", values.extrapolationValue);
      } else {
        renameAccount(accountId, values.trimmedName);
        setAccountPlayerField(accountId, "name", nickname.trim() || null);
        setAccountPlayerField(accountId, "authKey", values.trimmedAuthKey);
        setAccountPlayerField(accountId, "avatar", avatar.trim() || null);
        setAccountPlayerField(accountId, "extrapolation", values.extrapolationValue);
      }
      resetForm();
      setView("list");
    } catch (formError) {
      const message = formError?.message;
      setError([text.nameRequired, text.authRequired, text.invalidExtrapolation].includes(message) ? message : text.invalidAuth);
    } finally {
      setWorking(false);
    }
  };

  const removeAccount = (account) => {
    if (accounts.length === 1) return;
    if (window.confirm(`${text.deleteConfirm} "${account.name}"?`)) deleteAccount(account.id);
  };

  return (
    <div className="dialog basic-dialog accounts-view">
      <h1>{view === "create" ? text.createAccount : view === "edit" ? text.editAccount : text.accounts}</h1>
      {view === "list" ? (
        <>
          <p className="accounts-view__hint">{text.hint}</p>
          <div className="accounts-view__list">
            {accounts.map((account) => {
              const isActive = account.id === activeAccountId;
              return (
                <div className={`accounts-view__item${isActive ? " active" : ""}`} key={account.id}>
                  <div className="accounts-view__details">
                    <strong>{account.name}</strong>
                    <span>{text.nickname}: {account.player.name || text.notSet}</span>
                    <span>{text.auth}: {formatAuthKey(account.player.authKey)}</span>
                    <span>{text.extrapolation}: {account.player.extrapolation ?? 0}</span>
                  </div>
                  <div className="accounts-view__actions">
                    <button onClick={() => switchAccount(account.id)} disabled={isActive}>{isActive ? text.active : text.switch}</button>
                    <button onClick={() => showEdit(account)}>{text.edit}</button>
                    <button onClick={() => onConfigure?.(account.id)} title={text.configureTitle}>{text.configure}</button>
                    <button onClick={() => removeAccount(account)} disabled={accounts.length === 1}>{text.delete}</button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="accounts-view__current">{text.current}: {activeAccount?.name}</p>
          <div className="buttons">
            <button onClick={showCreate}><i className="icon-plus"></i>{text.createAccount}</button>
            <button onClick={onClose}>{text.close}</button>
          </div>
        </>
      ) : (
        <form onSubmit={saveAccount}>
          <label>{text.accountName}<input value={accountName} maxLength={40} onChange={(event) => setAccountName(event.target.value)} autoFocus /></label>
          <label>{text.nickname}<input value={nickname} maxLength={25} onChange={(event) => setNickname(event.target.value)} /></label>
          <label>{text.avatar}<input value={avatar} maxLength={2} placeholder={text.avatarHint} onChange={(event) => setAvatar(event.target.value)} /></label>
          <label>{text.extrapolation}<input type="number" min="-1000" max="10000" step="1" value={extrapolation} onChange={(event) => setExtrapolation(event.target.value)} /></label>
          <label>{text.authKey}<textarea value={authKey} onChange={(event) => setAuthKey(event.target.value)} spellCheck={false} /></label>
          <button type="button" onClick={generateAuth} disabled={working}>{text.generate}</button>
          {view === "create" && <p className="accounts-view__hint">{text.createHint}</p>}
          {error && <p className="accounts-view__error">{error}</p>}
          <div className="buttons">
            <button type="submit" disabled={working}>{working ? text.working : view === "create" ? text.createAndSwitch : text.save}</button>
            <button type="button" onClick={() => { resetForm(); setView("list"); }}>{text.back}</button>
          </div>
        </form>
      )}
    </div>
  );
}
