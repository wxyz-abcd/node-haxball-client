import { useEffect, useRef, useState } from "react";
import { usePlayerData } from './usePlayerData';
const ConnectionStateMessages = {
  [-1]: 'Trying reverse connection...',
  [0]: 'Connecting to master...',
  [1]: 'Connecting to peer...',
  [2]: 'Awaiting state...',
  [3]: 'Active',
  [4]: 'Connection failed'
};

export default function useRoomJoin() {
  const roomRef = useRef(null);
  const initialChatRowsRef = useRef([]);
  const cancelRef = useRef(null);
  const attemptIdRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [connInfo, setConnInfo] = useState('');
  const API = window.API;
  const { Room, Utils } = API;
  const { player, setPlayerField } = usePlayerData();

  const clearActiveJoin = () => {
    const cancel = cancelRef.current;
    cancelRef.current = null;
    if (cancel) {
      try {
        cancel();
      } catch (e) {
        // ignore cancellation errors from older attempts
      }
    }
    attemptIdRef.current += 1;
    try {
      API.Callback.remove("Wheel");
    } catch (e) {
      // ignore cleanup errors from older attempts
    }
  };

  const joinRoom = async ({ id, password = null, onOpen, onError, onClose, recaptchaVal = null, recaptchaFn } = {}) => {
    clearActiveJoin();
    setLoading(true);
    setConnInfo('');
    roomRef.current = null;
    initialChatRowsRef.current = [];
    const attemptId = attemptIdRef.current;
    let authObj = null;
    let authKey = null;

    try {
      if (player.authKey) {
        authKey = player.authKey;
        authObj = await Utils.authFromKey(authKey);
      } else {
        [authKey, authObj] = await Utils.generateAuth();
        setPlayerField('authKey', authKey);
      }
      API.Callback.add("Wheel");
      const geo = player.geo || await Utils.getGeo();
      setPlayerField('geo', geo);
      const token = recaptchaVal || null;

      const { cancel } = Room.join({
        id,
        password,
        authObj,
        token,
      }, {
        storage: {
          player_name: player?.name?.slice(0, 25) || "",
          avatar: player?.avatar?.slice(0, 2) || null,
          player_auth_key: authKey,
          geo: player?.geo || { lon: 0, lat: 0 }
        },
        renderer: null,
        onOpen: (room) => {
          if (attemptIdRef.current !== attemptId) return;
          roomRef.current = room;
          cancelRef.current = null;
          setLoading(false);
          if (onOpen) onOpen(room);
        },
        preInit: (room) => {
          if (attemptIdRef.current !== attemptId) return;
          roomRef.current = room;
          const pushInitialRow = (row) => {
            const rows = initialChatRowsRef.current;
            rows.push(row);
            if (rows.length > 200) rows.shift();
          };
          room.onAfterPlayerChat = (id, message) => {
            const playerObj = room.getPlayer(id);
            if (!playerObj) return;
            pushInitialRow({ type: "chat", playerName: playerObj.name, message });
          };
          room.onAfterAnnouncement = (message, color, style, sound) => {
            pushInitialRow({ type: "announcement", message, color, style, sound });
          };
        },
        onClose: (reason) => {
          if (attemptIdRef.current !== attemptId) return;
          cancelRef.current = null;
          try {
            API.Callback.remove("Wheel");
          } catch (e) {}
          setLoading(false);
          if (reason && reason.code == 38) {
            if (recaptchaFn) recaptchaFn(reason);
          } else {
            if (onClose) onClose(reason);
          }
        },
        onError: (err) => {
          if (attemptIdRef.current !== attemptId) return;
          cancelRef.current = null;
          try {
            API.Callback.remove("Wheel");
          } catch (e) {}
          setLoading(false);
          if (onError) onError(err);
        },
        onConnInfo: (state) => {
          if (attemptIdRef.current !== attemptId) return;
          setConnInfo((prev) => prev+"," + ConnectionStateMessages[state]);
        }
      });

      cancelRef.current = cancel;
      return cancel;
    } catch (err) {
      cancelRef.current = null;
      setLoading(false);
      if (onError) onError(err);
    }
  }

  useEffect(() => {
    return () => {
      clearActiveJoin();
    };
  }, []);

  return { roomRef, initialChatRowsRef, loading, connInfo, joinRoom };
}
