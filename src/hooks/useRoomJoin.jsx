import { useRef, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [connInfo, setConnInfo] = useState('');
  const API = window.API;
  const { Room, Utils } = API;
  const { player, setPlayerField } = usePlayerData();

  const joinRoom = async ({ id, password = null, onOpen, onError, onClose } = {}) => {
    setLoading(true);
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
      console.log(geo)
      const { cancel } = Room.join({
        id,
        password,
        authObj
      }, {
        storage: {
          player_name: player.name,
          avatar: player.avatar,
          player_auth_key: authKey,
          geo: player.geo
        },
        renderer: null,
        onOpen: (room) => {
          roomRef.current = room;
          setLoading(false);
          if (onOpen) onOpen(room);
        },
        preInit: (room) => {
          roomRef.current = room;
        },
        onClose: (reason) => {
          setLoading(false);
          if (onClose) onClose(reason);
        },
        onError: (err) => {
          setLoading(false);
          if (onError) onError(err);
        },
        onConnInfo: (state) => {
          setConnInfo((prev) => prev+"," + ConnectionStateMessages[state]);
        }
      });

      return cancel;
    } catch (err) {
      setLoading(false);
      if (onError) onError(err);
    }
  }

  return { roomRef, loading, connInfo, joinRoom };
}
