import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useRoomJoin from "../../hooks/useRoomJoin.jsx";
import Game from "../game/Game.jsx";
import ConnectingState from "./components/ConnectingState.jsx";
import ErrorConnection from "./components/ErrorConnection.jsx";

export default function JoinRoom() {
  const { id } = useParams();
  const [joined, setJoined] = useState(false);
  const [cancel, setCancel] = useState(null);
  const [disconnectedMessage, setDisconnectedMessage] = useState(null);                                                                                                                                                                          
  const { roomRef, loading, connInfo, joinRoom } = useRoomJoin();

  useEffect(() => {
    if (!id) return;

    joinRoom({
      id,
      onOpen: () => setJoined(true),
      onClose: (err) => {
        setDisconnectedMessage(err.toString());
      }
    }).then((cancelFn) => {
      setCancel(() => cancelFn);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && connInfo) return (<ConnectingState cancel={cancel} connInfo={connInfo} />)
  if (disconnectedMessage) return (<ErrorConnection message={disconnectedMessage}/>)
  if (joined) return <Game roomRef={roomRef} />;
}
