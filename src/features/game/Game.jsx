import React, { useEffect, useRef, useState, useMemo } from "react";
import defaultRenderer from './renderer.js';
import grass from '../../assets/images/grass.png';
import concrete from '../../assets/images/concrete.png';
import concrete2 from '../../assets/images/concrete2.png';
import typing from '../../assets/images/typing.png';
import { loadImage } from "../../utils/loadImage.js";
import setGameInputs from "./gameInput.js";
import { usePlayerData } from '../../hooks/usePlayerData.jsx';
import LeaveRoomPopup from "./components/popups/LeaveRoomPopup.jsx";
import RoomLinkPopup from "./components/popups/RoomLinkPopup.jsx";
import StadiumPickPopup from "./components/popups/StadiumPickPopup.jsx";
import SettingsPopup from '../../components/SettingsPopup.jsx'
import { downloadFile } from "../../utils/downloadFile.js";
import ChatBox from './components/ChatBox.jsx';
import RoomHeader from './components/RoomHeader.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import chatSnd from "../../assets/sounds/chat.ogg"
import crowdSnd from "../../assets/sounds/crowd.ogg"
import goalSnd from "../../assets/sounds/goal.ogg"
import highlightSnd from "../../assets/sounds/highlight.wav"
import joinSnd from "../../assets/sounds/join.ogg"
import kickSnd from "../../assets/sounds/kick.ogg"
import leaveSnd from "../../assets/sounds/leave.ogg"
import Popup from '../../components/Popup.jsx'
import { useCallback } from "react";
import SoundButton from "./components/SoundButton.jsx";

var oldGUIValues = {};

function Sound(volume) {
  this.audio = new (window.AudioContext || window.webkitAudioContext)();
  this.gain = this.audio.createGain();
  this.gain.gain.value = volume;
  this.gain.connect(this.audio.destination);
  this.loadSound = (path) => {
    return fetch(path).then(res => {
      if (!res.ok) throw new Error("failed load");
      return res.arrayBuffer();
    }).then(buf => new Promise((resolve, reject) =>
      this.audio.decodeAudioData(buf, resolve, reject)
    ));
  };
  this.playSound = (sound) => {
    if (!sound) return;
    const src = this.audio.createBufferSource();
    src.buffer = sound;
    src.connect(this.gain);
    src.start();
  };
}

export default function Game({ roomRef, usingCustomAPI }) {
  const API = useMemo(()=>(usingCustomAPI || window.API), [usingCustomAPI]);
  const { player, setPlayerField } = usePlayerData();
  const [roomName, setRoomName] = useState(null);
  const [roomScore, setRoomScore] = useState({ red: 0, blue: 0 });
  const [stadiumName, setStadiumName] = useState(null);
  const [timeWarn, setTimeWarn] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRoomView, setShowRoomView] = useState(false);
  const [chatRows, setChatRows] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [players, setPlayers] = useState([]);
  const [teamsLocked, setTeamsLocked] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [m1, setM1] = useState("0");
  const [m2, setM2] = useState("0");
  const [s1, setS1] = useState("0");
  const [s2, setS2] = useState("0");
  const [popup, setPopup] = useState(null);
  const [timeLimit, setTimeLimit] = useState(0);
  const [scoreLimit, setScoreLimit] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef(null);
  const chatInput = useRef(null);
  const soundInstanceRef = useRef(null);
  const soundRef = useRef(null);
  const chatApi = useMemo(()=>({
    receiveChatMessage: (nick, msg) => setChatRows(prev => [...prev, { type: 0, content: nick + ": " + msg }]),
    receiveAnnouncement: (msg, color, style) => setChatRows(prev => [...prev, { type: 1, content: msg, color, font: style }]),
    receiveNotice: (msg) => setChatRows(prev => [...prev, { type: 0, content: msg, className: "notice" }]),
    focusOnChat: () => {
      if (document.activeElement === chatInput.current) canvasRef.current.focus();
      else chatInput.current.focus();
    },
    blurChat: () => chatInput.current.blur()
  }), []);

  const analyzeChatCommand = useCallback((msg) => {
    if (!msg || msg.charAt(0) !== "/") return false;
    const room = roomRef.current;
    const tokens = msg.substring(1).split(" ");
    var { parseHexInt } = API.Utils;
    switch (tokens[0]) {
      case "avatar":
        if (tokens[1]) {
          room.setAvatar(tokens[1]);
          setPlayerField('avatar', tokens[1]);
          chatApi.receiveNotice("Avatar set");
        }
        break;
      case "clear_avatar":
        room.setAvatar(null);
        setPlayerField('avatar', null);
        chatApi.receiveNotice("Avatar cleared");
        break;
      case "checksum":
        var cs = room.stadium.calculateChecksum();
        if (!cs)
          chatApi.receiveNotice('Current stadium is original: "' + room.stadium.name + '"')
        else
          chatApi.receiveNotice('Stadium: "' + room.stadium.name + '" (checksum: ' + cs + ")")
        break;
      case "clear_bans":
        if (room.isHost) {
          room.clearBans(null);
          chatApi.receiveNotice("All bans have been cleared");
        }
        else
          chatApi.receiveNotice("Only the host can clear bans");
        break;
      case "set_password":
        if (tokens.length == 2) {
          if (room.isHost) {
            room.setProperties({ password: tokens[1] });
            chatApi.receiveNotice("Password set");
          }
          else
            chatApi.receiveNotice("Only the host can change the password");
        }
        break;
      case "clear_password":
        if (room.isHost) {
          room.setProperties({ password: null });
          chatApi.receiveNotice("Password cleared");
        }
        else
          chatApi.receiveNotice("Only the host can change the password");
        break;
      case "colors":
        try {
          var teamId = (tokens[1] == "blue") ? 2 : 1;
          var angle = tokens[2];
          if (angle == "clear") {
            angle = 0;
            msg = [];
          }
          else
            msg.splice(0, 3);
          room.setTeamColors(teamId, angle, ...msg.map(c => parseHexInt("0x" + c)));
        } catch (g) {
          chatApi.receiveNotice(msg.toString());
        }
        break;
      case "extrapolation":
        if (tokens.length == 2) {
          const value = parseHexInt(tokens[1]);
          if (value != null) { // && -200 <= msg && 200 >= msg
            room.renderer.extrapolation = value;
            chatApi.receiveNotice("Extrapolation set to " + value + " msec");
            setPlayerField("extrapolation", value);
          }
          else
            chatApi.receiveNotice("Extrapolation must be a value between -200 and 200 milliseconds");
        }
        else
          chatApi.receiveNotice("Extrapolation requires a value in milliseconds.");
        break;
      case "handicap":
        if (tokens.length == 2) {
          const value = parseHexInt(tokens[1]);
          if (value != null) { // && 0 <= msg && 300 >= msg
            room.setHandicap(value);
            chatApi.receiveNotice("Ping handicap set to " + value + " msec");
          }
          else
            chatApi.receiveNotice("Ping handicap must be a value between 0 and 300 milliseconds");
        }
        else
          chatApi.receiveNotice("Ping handicap requires a value in milliseconds.");
        break;
      case "kick_ratelimit":
        if (tokens.length < 4)
          chatApi.receiveNotice("Usage: /kick_ratelimit <min> <rate> <burst>");
        else {
          var d = parseHexInt(tokens[1]), e = parseHexInt(tokens[2]);
          const value = parseHexInt(tokens[3]);
          if (d == null || e == null || value == null)
            chatApi.receiveNotice("Invalid arguments");
          else
            room.setKickRateLimit(d, e, msg);
        }
        break;
      case "recaptcha":
        if (!room.isHost)
          chatApi.receiveNotice("Only the host can set recaptcha mode");
        else
          try {
            if (tokens.length == 2) {
              switch (tokens[1]) {
                case "off":
                  e = false;
                  break;
                case "on":
                  e = true;
                  break;
                default:
                  throw null;
              }
              room.setRecaptcha(e);
              chatApi.receiveNotice("Room join Recaptcha " + (e ? "enabled" : "disabled"));
            }
            else
              throw null;
          } catch (g) {
            chatApi.receiveNotice("Usage: /recaptcha <on|off>");
          }
        break;
      case "store":
        var f = room.stadium;
        if (!f.isCustom)
          chatApi.receiveNotice("Can't store default stadium.");
        else {
          chatApi.receiveNotice("Not implemented to keep the web examples simple.");
          //insertStadium({name: f.name, contents: API.Utils.exportStadium(f)}).then(()=>{
          //chatApi.receiveNotice("Stadium stored");
          //}, ()=>{
          //chatApi.receiveNotice("Couldn't store stadium");
          //});
        };
        break;
      default:
        chatApi.receiveNotice(`Unknown command: ${tokens[0]}`);
    }
    return true;
  }, [API.Utils, chatApi, roomRef, setPlayerField]);

  const inputKeyDown = useCallback((e) => {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (inputValue.length > 0 && !analyzeChatCommand(inputValue)) {
        roomRef.current?.sendChat(inputValue);
      }
      setInputValue("");
    }
  }, [analyzeChatCommand, inputValue, roomRef]);

  const make2Digits = useCallback((a) => {
    let s = String(a || "");
    while (s.length < 2) s = "0" + s;
    return s;
  }, []);

  const handleRec = useCallback(() => {
    if (!roomRef.current) return;
    if (roomRef.current.isRecording()) {
      const data = roomRef.current.stopRecording();
      const date = new Date();
      const fileName = `HBReplay-${date.getFullYear()}-${make2Digits(date.getMonth() + 1)}-${make2Digits(date.getDate())}-${make2Digits(date.getHours())}h${make2Digits(date.getMinutes())}m.hbr2`;
      downloadFile(fileName, "octet/stream", data);
      setIsRecording(false);
    } else {
      roomRef.current.startRecording();
      setIsRecording(true);
    }
  }, [make2Digits, roomRef]);

  const handleLeave = useCallback(() => setPopup({
    component: LeaveRoomPopup, 
    props: {
      room: roomRef.current,
      showPopup: setPopup
    }
  }), [roomRef]);
  const handleLink = useCallback(() => setPopup({
    component: RoomLinkPopup,
    props: {
      link:roomRef.current?.link,
      showPopup: setPopup
    }
  }), [roomRef]);
  const handleStadiumPick = useCallback(() => setPopup({
    component: StadiumPickPopup,
    props: {
      room:roomRef.current,
      showPopup:setPopup
    }
  }), [roomRef]);
  const handleSettings = useCallback(()=>setPopup({
    component: SettingsPopup,
    props: {
      roomRef: roomRef?.current
    }

  }), [roomRef]);

  const handleMenu = useCallback(() => setShowRoomView(prev => !prev), []);
  const updateGameStateGUI = useCallback((gameState) => {
    if (!gameState) return;
    const _redScore = gameState.redScore, _blueScore = gameState.blueScore;
    if (oldGUIValues.redScore !== _redScore || oldGUIValues.blueScore !== _blueScore) {
      setRoomScore({ red: _redScore, blue: _blueScore });
      oldGUIValues.redScore = _redScore;
      oldGUIValues.blueScore = _blueScore;
    }
    const totalGameTime = 60 * gameState.timeLimit;
    const elapsedGameTime = gameState.timeElapsed | 0;
    const s = elapsedGameTime % 60, m = (elapsedGameTime / 60) | 0;
    if (elapsedGameTime < totalGameTime && elapsedGameTime > totalGameTime - 30) {
      if (!oldGUIValues.timeWarningActive) {
        setTimeWarn(true); oldGUIValues.timeWarningActive = true;
      }
    } else if (oldGUIValues.timeWarningActive) {
      setTimeWarn(false); oldGUIValues.timeWarningActive = false;
    }
    if (totalGameTime !== 0 && elapsedGameTime > totalGameTime) {
      if (!oldGUIValues.overtimeActive) { setOvertime(true); oldGUIValues.overtimeActive = true; }
    } else if (oldGUIValues.overtimeActive) { setOvertime(false); oldGUIValues.overtimeActive = false; }

    const mm1 = ((m / 10) | 0) % 10, mm2 = m % 10, ss1 = ((s / 10) | 0) % 10, ss2 = s % 10;
    if (oldGUIValues.m1 !== mm1) { setM1("" + mm1); oldGUIValues.m1 = mm1; }
    if (oldGUIValues.m2 !== mm2) { setM2("" + mm2); oldGUIValues.m2 = mm2; }
    if (oldGUIValues.s1 !== ss1) { setS1("" + ss1); oldGUIValues.s1 = ss1; }
    setS2("" + ss2);
  }, []);
  
  useEffect(() => {
    const room = roomRef?.current;
    const canvas = canvasRef.current;
    if (!room || !canvas) return;
    canvas.focus();
    setGameStarted(!!room.gameState);
    setPlayers([...room.players]);
    setRoomName(room.name);
    setStadiumName(room.stadium?.name || "");
    setRoomScore({ red: room.redScore, blue: room.blueScore });
    setTimeLimit(room.timeLimit);
    setScoreLimit(room.scoreLimit);
    setTeamsLocked(room.state?.teamsLocked ?? true);
    setIsAdmin(room.currentPlayer.isAdmin);
    if (!room.gameState) setShowRoomView(true);
    const s = new Sound(player.sound.gain);
    soundInstanceRef.current = s;
    soundRef.current = s;
    Promise.all([chatSnd, crowdSnd, goalSnd, highlightSnd, joinSnd, kickSnd, leaveSnd].map(url => s.loadSound(url)))
      .then(([chatB, crowdB, goalB, hiB, joinB, kickB, leaveB]) => {
        s.chat = chatB; s.crowd = crowdB; s.goal = goalB; s.highlight = hiB; s.join = joinB; s.kick = kickB; s.leave = leaveB;
      }).catch(err => { console.warn("sound load", err); });

    const initRenderer = async () => {
      try {
        const imgs = await Promise.all([grass, concrete, concrete2, typing].map(loadImage));
        var counter = 0;
        const defaultRendererObj = new defaultRenderer(API, {
          canvas,
          paintGame: true,
          images: { grass: imgs[0], concrete: imgs[1], concrete2: imgs[2], typing: imgs[3] },
          onRequestAnimationFrame: () => {
            counter++;
            if (counter>30){
							counter=0;
							updateGameStateGUI(room.gameState);
						}
          }
        });
        const rendererOptions = ["discLineWidth", "generalLineWidth", "resolutionScale", "showTeamColors", "showAvatars", "showChatIndicators"]
        for (let i = 0; i < rendererOptions.length; i++) {
            defaultRendererObj[rendererOptions[i]] = player.renderer[rendererOptions[i]];
        }
        room.setRenderer(defaultRendererObj);
        room.renderer.extrapolation = player.extrapolation;
        if (player.extrapolation != null) room.renderer.extrapolation = player.extrapolation;
      } catch (err) {
        console.error("Renderer init error:", err);
      }
    };
    initRenderer();

    return () => {
      API.Callback.remove('Wheel')
      try {
        // leave() will detach everything maybe
        room.leave();
      } catch (e) { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const room = roomRef?.current;
    if (!room) return;
    const s = soundRef.current;

    room.onAfterStadiumChange = (stadium) => setStadiumName(stadium.name);
    room.onAfterTeamGoal = () => {
      setRoomScore({ red: room.redScore, blue: room.blueScore });
      if (player.sound.main) s.playSound(s.goal);
    };
    room.onAfterPlayerAdminChange = (id, admin) => {
      if (id === room.currentPlayerId) setIsAdmin(admin);
    };
    room.onAfterPlayerTeamChange = (id, teamId, byId) => {
      setPlayers([...room.players]);
      const moved = room.getPlayer(id);
      const playerObj = room.getPlayer(byId);
      const team = API.Impl.Core.Team.byId[teamId];
      if (playerObj)
        chatApi.receiveNotice(
          `${moved.name} was moved to a team team by ${playerObj.name}`
        );
    };
    room.onAfterPlayerChat = (id, message) => {
      const playerObj = room.state.players.find((x) => x.id == id);
      if (!playerObj) return;
      chatApi.receiveChatMessage(playerObj.name, message);
      if (player.sound.chat) s.playSound(s.chat);
    };
    room.onAfterPlayerJoin = (playerObj) => {
      setPlayers([...room.players]);
      if (player.sound.chat) s.playSound(s.join);
      chatApi.receiveNotice(`${playerObj.name} has joined`);
    };
    room.onAfterPlayerLeave = (playerObj) => {
      setPlayers([...room.players]);
      if (player.sound.main) s.playSound(s.leave);
      chatApi.receiveNotice(`${playerObj.name} has left`);
    };
    room.onAfterTeamsLockChange = (value) => setTeamsLocked(value);
    room.onAfterGameStop = (byId) => {
      setShowRoomView(true);
      setGameStarted(false);
      const playerObj = room.getPlayer(byId);
      if (playerObj)
        chatApi.receiveNotice(`Game stopped by ${playerObj.name}`)
    };
    room.onAfterGameStart = (byId) => {
      setShowRoomView(false);
      setGameStarted(true);
      const playerObj = room.getPlayer(byId);
      if (playerObj)
        chatApi.receiveNotice(`Game started by ${playerObj.name}`)
      else chatApi.receiveNotice(`Game started`)
    };
    room.onAfterAnnouncement = (msg, color, style, _sound) => {
      chatApi.receiveAnnouncement(msg, color, style);
      if (_sound === 1 && player.sound.chat) s.playSound(s.chat);
      if (_sound === 2 && player.sound.chat) s.playSound(s.highlight);
    };
    room.onAfterPlayerBallKick = () => {
      if (player.sound.main) s.playSound(s.kick);
    };
    room.onAfterScoreLimitChange = (value) => setScoreLimit(value);
    room.onAfterTimeLimitChange = (value) => setTimeLimit(value);
  }, [player, roomRef, soundRef]);

  useEffect(() => {
    const room = roomRef.current;
    const canvas = canvasRef.current;
    const chatInputEl = chatInput.current;
    const keysHandler = setGameInputs(room, () => setShowRoomView(prev => !prev), chatApi, player.keys, canvas, chatInputEl);
    return () => { keysHandler.kill(); };
  }, [chatApi, player, roomRef, canvasRef, chatInput]);

  const changeScoreLimit = useCallback((value) => {
    setScoreLimit(value);
    roomRef.current?.setScoreLimit(value);
  }, [roomRef]);
  const changeTimeLimit = useCallback((value) => {
    setTimeLimit(value);
    roomRef.current?.setTimeLimit(value);
  }, [roomRef]);

  return (
    <div tabIndex={-1} className="game-view" style={{ "--chat-opacity": `${player.chat.opacity}`}}>
      <div className="gameplay-section">
        <div className="game-state-view" style={{visibility: !gameStarted ? 'hidden' : 'visible'}}>
          <div className="bar-container" style={{pointerEvents:'none'}}>
            <div className="bar">
              <div className="scoreboard">
                <div className="teamicon red" />
                <div className="score">{roomScore.red}</div>
                <div className="-">-</div>
                <div className="score">{roomScore.blue}</div>
                <div className="teamicon blue" />
              </div>
              <div className="fps-limit-fix" />
              <div className={`game-timer-view ${timeWarn ? 'time-warn' : ''}`}>
                <span className={`overtime ${overtime ? 'on' : ''}`}>OVERTIME!</span>
                <span className="digit">{m1}</span>
                <span className="digit">{m2}</span>
                <span className="null">:</span>
                <span className="digit">{s1}</span>
                <span className="digit">{s2}</span>
              </div>
            </div>
          </div>
          <GameCanvas canvasRef={canvasRef} />
        </div>
      </div>

      <div className="top-section" style={{zIndex: showRoomView ? 2 : 0}}>
        {showRoomView ? (
          <RoomHeader
            roomRef={roomRef}
            roomName={roomName}
            stadiumName={stadiumName}
            isAdmin={isAdmin}
            teamsLocked={teamsLocked}
            gameStarted={gameStarted}
            timeLimit={timeLimit}
            scoreLimit={scoreLimit}
            setTimeLimit={changeTimeLimit}
            setScoreLimit={changeScoreLimit}
            handleRec={handleRec}
            handleLink={handleLink}
            handleLeave={handleLeave}
            handleStadiumPick={handleStadiumPick}
            players={players}
            setPopup={setPopup}
          />
        ) : null}
      </div>

      <div tabIndex={-1} className="bottom-section" style={{zIndex:2, width:'50vw'}}>

        <ChatBox
          chatRows={chatRows}
          inputValue={inputValue}
          setInputValue={setInputValue}
          inputKeyDown={inputKeyDown}
          chatInputRef={chatInput}
          height={player.chat.height}
          player={player}
          setPlayerField={setPlayerField}
          roomRef={roomRef}
        />

        <div className="bottom-spacer" />
      </div>

      <div className="buttons" style={{zIndex:2}}>
        <SoundButton player={player} initialVolume={player.sound.gain} soundInstance={soundInstanceRef.current} setPlayerField={setPlayerField}></SoundButton>
        <button data-hook="menu" disabled={!gameStarted} onClick={handleMenu}><i className="icon-menu" />Menu<span className="tooltip">Toggle room menu [Escape]</span></button>
        <button data-hook="settings" onClick={handleSettings}><i className="icon-cog" /></button>
      </div>
      <Popup PopupComponent={popup?.component} closePopup={()=>setPopup(null)} popupComponentProps={popup?.props} ></Popup>
    </div>
  );
}
