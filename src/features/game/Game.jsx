import React, { useEffect, useRef, useState } from "react";
import defaultRenderer from './renderer.js';
import grass from '../../assets/images/grass.png';
import concrete from '../../assets/images/concrete.png';
import concrete2 from '../../assets/images/concrete2.png';
import typing from '../../assets/images/typing.png';
import { loadImage } from "../../utils/loadImage.js";
import setGameInputs from "./gameInput.js";
import { usePlayerData } from '../../hooks/usePlayerData';
import LeaveRoomPopup from "./components/popups/LeaveRoomPopup.jsx";
import RoomLinkPopup from "./components/popups/RoomLinkPopup.jsx";
import StadiumPickPopup from "./components/popups/StadiumPickPopup.jsx";
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

var oldGUIValues = {};

function Sound() {
  this.audio = new (window.AudioContext || window.webkitAudioContext)();
  this.gain = this.audio.createGain();
  this.gain.gain.value = 1;
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

export default function Game({ roomRef }) {
  console.log("logging Game component render", roomRef?.current?.name);
  const API = window.API;
  const { player, setPlayerField } = usePlayerData();

  const [ping, setPing] = useState(0);
  const [roomName, setRoomName] = useState(null);
  const [roomScore, setRoomScore] = useState({ red: 0, blue: 0 });
  const [stadiumName, setStadiumName] = useState(null);
  const [timeWarn, setTimeWarn] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRoomView, setShowRoomView] = useState(true);
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
  const soundRef = useRef(null);

  const chatApi = {
    receiveChatMessage: (nick, msg) => setChatRows(prev => [...prev, { type: 0, content: nick + ": " + msg }]),
    receiveAnnouncement: (msg, color, style) => setChatRows(prev => [...prev, { type: 1, content: msg, color, font: style }]),
    receiveNotice: (msg) => setChatRows(prev => [...prev, { type: 0, content: msg, className: "notice" }]),
    focusOnChat: () => {
      if (document.activeElement === chatInput.current) chatInput.current.blur();
      else chatInput.current.focus();
    },
    blurChat: () => chatInput.current.blur()
  };

  const analyzeChatCommand = (msg) => {
    if (!msg || msg.charAt(0) !== "/") return false;
    const tokens = msg.substring(1).split(" ");
    switch (tokens[0]) {
      case "avatar":
        if (tokens[1]) {
          roomRef.current?.setAvatar(tokens[1]);
          setPlayerField('avatar', tokens[1]);
          chatApi.receiveNotice("Avatar set");
        }
        break;
      case "clear_avatar":
        roomRef.current?.setAvatar(null);
        setPlayerField('avatar', null);
        chatApi.receiveNotice("Avatar cleared");
        break;
      default:
        chatApi.receiveNotice(`Unknown command: ${tokens[0]}`);
    }
    return true;
  };

  const inputKeyDown = (e) => {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (inputValue.length > 0 && !analyzeChatCommand(inputValue)) {
        roomRef.current?.sendChat(inputValue);
      }
      setInputValue("");
    }
  };

  const make2Digits = (a) => {
    let s = String(a || "");
    while (s.length < 2) s = "0" + s;
    return s;
  };

  const handleRec = () => {
    if (!roomRef.current) return;
    if (roomRef.current.isRecording()) {
      const data = roomRef.current.stopRecording();
      const date = new Date();
      const fileName = `HBReplay-${date.getFullYear()}-${make2Digits(date.getMonth()+1)}-${make2Digits(date.getDate())}-${make2Digits(date.getHours())}h${make2Digits(date.getMinutes())}m.hbr2`;
      downloadFile(fileName, "octet/stream", data);
      setIsRecording(false);
    } else {
      roomRef.current.startRecording();
      setIsRecording(true);
    }
  };

  const handleLeave = () => setPopup(<LeaveRoomPopup room={roomRef.current} showPopup={setPopup} />);
  const handleLink = () => setPopup(<RoomLinkPopup link={roomRef.current?.link} showPopup={setPopup} />);
  const handleStadiumPick = () => setPopup(<StadiumPickPopup room={roomRef.current} showPopup={setPopup} />);

  const updateGameStateGUI = (gameState) => {
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
  };

  useEffect(() => {
    const room = roomRef?.current;

    setGameStarted(!!room.gameState);
    setPlayers([...room.players]);
    setRoomName(room.name);
    setStadiumName(room.stadium?.name || "");
    setRoomScore({ red: room.redScore, blue: room.blueScore });
    setTimeLimit(room.timeLimit);
    setScoreLimit(room.scoreLimit);
    setTeamsLocked(room.state?.teamsLocked ?? true);
    setIsAdmin(room.currentPlayer.isAdmin);

    const s = new Sound();
    soundRef.current = s;
    Promise.all([chatSnd, crowdSnd, goalSnd, highlightSnd, joinSnd, kickSnd, leaveSnd].map(url => s.loadSound(url)))
      .then(([chatB, crowdB, goalB, hiB, joinB, kickB, leaveB]) => {
        s.chat = chatB; s.crowd = crowdB; s.goal = goalB; s.highlight = hiB; s.join = joinB; s.kick = kickB; s.leave = leaveB;
      }).catch(err => { console.warn("sound load", err); });

    room.mixConfig({
      onAfterPingChange: (instantPing, avg, max) => setPing(`Ping: ${Math.round(instantPing)} - ${Math.round(max)}`),
      onAfterStadiumChange: (stadium) => setStadiumName(stadium.name),
      onAfterTeamGoal: () => { setRoomScore({ red: room.redScore, blue: room.blueScore }); s.playSound(s.goal); },
      onAfterPlayerAdminChange: (id, admin) => { if (id === room.currentPlayerId) setIsAdmin(admin); },
      onAfterPlayerTeamChange: () => setPlayers([...room.players]),
      onAfterPlayerChat: (id, message) => {
        const playerObj = room.state.players.find(x => x.id == id);
        if (!playerObj) return;
        chatApi.receiveChatMessage(playerObj.name, message);
        s.playSound(s.chat);
      },
      onAfterPlayerJoin: () => { setPlayers([...room.players]); s.playSound(s.join); },
      onAfterPlayerLeave: () => { setPlayers([...room.players]); s.playSound(s.leave); },
      onAfterTeamsLockChange: (value) => setTeamsLocked(value),
      onAfterGameStop: () => { setShowRoomView(true); setGameStarted(false); },
      onAfterGameStart: () => { setShowRoomView(false); setGameStarted(true); },
      onAfterAnnouncement: (msg, color, style, _sound) => {
        chatApi.receiveAnnouncement(msg, color, style);
        if (_sound === 1) s.playSound(s.chat);
        if (_sound === 2) s.playSound(s.highlight);
      },
      onAfterPlayerBallKick: () => s.playSound(s.kick),
      onAfterScoreLimitChange: (value) => setScoreLimit(value),
      onAfterTimeLimitChange: (value) => setTimeLimit(value),
      onRoomLink: (link) => {
        console.log(link);
      }
    });

    const initRenderer = async () => {
      try {
        const imgs = await Promise.all([grass, concrete, concrete2, typing].map(loadImage));
        const canvas = canvasRef.current;
        if (!canvas) return;
        const defaultRendererObj = new defaultRenderer(API, {
          canvas,
          paintGame: true,
          images: { grass: imgs[0], concrete: imgs[1], concrete2: imgs[2], typing: imgs[3] },
          onRequestAnimationFrame: () => updateGameStateGUI(room.gameState)
        });
        room.setRenderer(defaultRendererObj);
        if (player.extrapolation != null) room.renderer.extrapolation = player.extrapolation;
        setGameInputs(room, () => setShowRoomView(prev => !prev), chatApi);
      } catch (err) {
        console.error("Renderer init error:", err);
      }
    };
    initRenderer();

    return () => {
      try {
        // leave() will detach everything maybe
        room.leave();
      } catch (e) { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeScoreLimit = (value) => {
    setScoreLimit(value);
    roomRef.current?.setScoreLimit(value);
  };
  const changeTimeLimit = (value) => {
    setTimeLimit(value);
    roomRef.current?.setTimeLimit(value);
  };

  return (
    <div className="game-view">
      <div className="gameplay-section">
        <div className="game-state-view">
          <div className="bar-container">
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

      <div className="top-section" data-hook="top-section">
        { showRoomView ? (
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
        ) : null }
      </div>

      <div className="bottom-section">
        <div className="stats-view-container">
          <div className="stats-view">
            <p data-hook="ping">{ping}</p>
            <p data-hook="fps" />
            <div className="graph">
              <canvas />
            </div>
          </div>
        </div>

        <ChatBox
          chatRows={chatRows}
          inputValue={inputValue}
          setInputValue={setInputValue}
          inputKeyDown={inputKeyDown}
          chatInputRef={chatInput}
        />

        <div className="bottom-spacer" />
      </div>

      <div className="buttons">
        <div className="sound-button-container" data-hook="sound">
          <div className="sound-slider" data-hook="sound-slider">
            <div className="sound-slider-bar-bg" data-hook="sound-bar-bg">
              <div className="sound-slider-bar" data-hook="sound-bar" style={{ top: '0%' }} />
            </div>
          </div>
          <button data-hook="sound-btn"><i className="icon-volume-up" data-hook="sound-icon" /></button>
        </div>
        <button data-hook="menu" disabled={!gameStarted} onClick={() => setShowRoomView(prev => !prev)}><i className="icon-menu" />Menu<span className="tooltip">Toggle room menu [Escape]</span></button>
        <button data-hook="settings"><i className="icon-cog" /></button>
      </div>

      <div data-hook="popups" style={{ display: popup ? 'flex' : 'none' }}>
        {popup}
      </div>
    </div>
  );
}
