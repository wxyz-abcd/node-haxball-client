import { useRef, useState } from "react";
import { usePlayerData } from './usePlayerData';

export default function useRoomJoin() {
  const roomRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const API = window.API;
  const { Room, Utils } = API;
  const { player, setPlayerField } = usePlayerData();

  const joinRoom = async ({ id, password = null, onOpen, onError, onClose } = {}) => {
    setLoading(true);
    let authObj = null;
    let cancelled = false;
    let authKey = null;

    try {
      if (player.authKey) {
        authKey = player.authKey;
        authObj = await Utils.authFromKey(authKey);
      } else {
        [authKey, authObj] = await Utils.generateAuth();
        setPlayerField('authKey', authKey);
      }

      Room.join({
        id,
        password,
        authObj
      }, {
        storage: {
          name: player.name,
          avatar: player.avatar,
          player_auth_key: authKey,
        },
        renderer: null,
        onOpen: (room) => {
          if (cancelled) return;
          roomRef.current = room;
          setLoading(false);
          if (onOpen) onOpen(room);
        },
        preInit: (room) => {
          if (cancelled) return;
          roomRef.current = room;
        },
        onClose: (reason) => {
          if (onClose) onClose(reason);
        },
        onError: (err) => {
          setLoading(false);
          if (onError) onError(err);
        }
      });
    } catch (err) {
      setLoading(false);
      if (onError) onError(err);
    }
  }

  return { roomRef, loading, joinRoom };
}
