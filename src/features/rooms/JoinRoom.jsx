import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useRoomJoin from "../../hooks/useRoomJoin.jsx";
import Game from "../game/Game.jsx";

export default function JoinRoom() {
  const { id } = useParams();
  const [joined, setJoined] = useState(false);
  const { roomRef, loading, joinRoom } = useRoomJoin();

  useEffect(() => {
    if (!id) return;
    joinRoom({
      id,
      onOpen: () => setJoined(true),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="connecting">Connecting...</div>;
  if (joined) return <Game roomRef={roomRef} />;
}
