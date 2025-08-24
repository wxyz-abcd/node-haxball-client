import React, { useState } from "react";
import { usePlayerData } from "../../hooks/usePlayerData.jsx";
import Game from "../game/Game.jsx";
import { useEffect } from "react";
import { useRef } from "react";
import sandboxWrapper from "./sandbox/sandboxWrapper.js";

export default function CreateSandbox() {
  const { player } = usePlayerData();
  const [roomCreated, setRoomCreated] = useState(false);
  const roomRef = useRef(null);
  const [usingAPI, setUsingAPI] = useState(null);

  useEffect(() => {
    const API = sandboxWrapper(window.API);
    API.Room.create({
      name: "sandbox", 
      password: null, 
      noPlayer: false,
      showInRoomList: true, 
      playerCount: 27,
      maxPlayerCount: 10,
      unlimitedPlayerCount: true,
      //fakePassword: false,
      geo: { /*lat: 11, lon: 11,*/ flag: "au" },
      token: "sandbox" 
    },{
      storage: {
        crappy_router: false,
        player_name: player.name,
        geo: {
          lat: 41.021999,
          lon: 28.971162,
          flag: "au"
        },
        avatar: player.avatar
      },
      onOpen: (room)=>{
        roomRef.current = room;
        room.mixConfig({
          onPlayerJoin: (playerObj) => {
            var {id, auth} = playerObj;
            console.log("Player joined : ", auth);
            room.setPlayerAdmin(id, true);
          }
        });
        room.setPlayerAdmin(0, true);
        room.hostPing = 1987987987;
        room.setPlayerTeam(0, 1)
        //room.addAuthBan(null);
        room.setTimeLimit(0);
        room.setScoreLimit(0);
        room.startGame();
        setUsingAPI(API);
        setRoomCreated(true);
      }
    });
  }, []);

  if (roomCreated) return <Game roomRef={roomRef} API={usingAPI} />;

  return <>hello</>
}
