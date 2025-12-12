import { useRef, useState } from "react";

export default function useRoomCreate() {
  const API = window.API;
  const { Room } = API;
  const roomRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createRoom = async ({ name, password = null, maxPlayerCount = 10, storage, showInRoomList = true, token = null, onOpen, onError, onClose } = {}) => {
    setLoading(true);
    setError(null);

    try {
      API.Callback.add("Wheel");
      Room.create({
        name,
        password: password || null,
        showInRoomList: !!showInRoomList,
        maxPlayerCount: Number(maxPlayerCount),
        token,
      }, {
        storage,
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
          if (onClose) onClose(reason);
        },
        onError: (err) => {
          setError(err);
          setLoading(false);
          if (onError) onError(err);
        }
      });
    } catch (err) {
      setError(err);
      setLoading(false);
      if (onError) onError(err);
    }
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
  };

  return { roomRef, loading, error, createRoom, leaveRoom };
}
