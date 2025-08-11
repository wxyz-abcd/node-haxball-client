import { useEffect, useRef, useState, useCallback } from "react";
import defaultRenderer from './renderer.js';
import grass from '../../assets/images/grass.png';
import concrete from '../../assets/images/concrete.png';
import concrete2 from '../../assets/images/concrete2.png';
import typing from '../../assets/images/typing.png';
import { loadImage } from "../../utils/loadImage.js";
import setGameInputs from "./gameInput.js";
import { usePlayerData } from '../../hooks/usePlayerData';
import PlayerListView from '../../components/PlayerListView.jsx'

/**
 * @typedef {import('../../types/index.js').API} API
 */

var oldGUIValues = {};

function Game({ roomId }) {
    const API = window.API;
    const [isVisible, setIsVisible] = useState(false)
    const [ping, setPing] = useState(0);
    const [roomName, setRoomName] = useState(null);
    const [roomScore, setRoomScore] = useState({ red: 0, blue: 0 });
    const [stadiumName, setStadiumName] = useState(null);
    const [timeWarn, setTimeWarn] = useState(false);
    const [overtime, setOvertime] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showRoomView, setShowRoomView] = useState(false)
    const [chatRows, setChatRows] = useState([])
    const [inputValue, setInputValue] = useState("");
    const [players, setPlayers] = useState([])
    const [teamsLocked, setTeamsLocked] = useState(true)
    const [gameStarted, setGameStarted] = useState(false)
    const [m1, setM1] = useState(0)
    const [m2, setM2] = useState(0)
    const [s1, setS1] = useState(0)
    const [s2, setS2] = useState(0)
    const canvasRef = useRef(null);
    const { player } = usePlayerData();
    const handleChangeRoomView = useCallback(() => {
        setShowRoomView(prev => !prev);
    }, [])
    const { Room, Utils } = API;
    const addChatLog = (player_name, message) => {
        setChatRows(prev => [...prev, `${player_name}: ${message}`]);
    }
    const inputKeyDown = (e) => {
        if (e.code === "Enter" || e.code === "NumpadEnter") {
            roomRef.current.sendChat(inputValue)
            setInputValue("")
        }
    }
    const handleRec = () => { }
    const handleLeave = () => { }
    const handleLink = () => { }
    const handleStadiumPick = () => { }
    const updateGameStateGUI = (gameState) => {
        if (!gameState) return
        var _redScore = gameState.redScore, _blueScore = gameState.blueScore;
        if (oldGUIValues.redScore != _redScore) {
            setRoomScore({ red: _redScore, blue: _blueScore });
            oldGUIValues.redScore = _redScore;
        }
        if (oldGUIValues.blueScore != _blueScore) {
            setRoomScore({ red: _redScore, blue: _blueScore });
            oldGUIValues.blueScore = _blueScore;
        }
        var totalGameTime = 60 * gameState.timeLimit, elapsedGameTime = gameState.timeElapsed | 0;
        var s = elapsedGameTime % 60, m = (elapsedGameTime / 60) | 0;
        if (elapsedGameTime < totalGameTime && elapsedGameTime > totalGameTime - 30) {
            if (!oldGUIValues.timeWarningActive) {
                setTimeWarn(true)
                oldGUIValues.timeWarningActive = true;
            }
        }
        else if (oldGUIValues.timeWarningActive) {
            setTimeWarn(false)
            oldGUIValues.timeWarningActive = false;
        }
        if (totalGameTime != 0 && elapsedGameTime > totalGameTime) {
            if (!oldGUIValues.overtimeActive) {
                setOvertime(true)
                oldGUIValues.overtimeActive = true;
            }
        }
        else if (oldGUIValues.overtimeActive) {
            setOvertime(false)
            oldGUIValues.overtimeActive = false;
        }
        var m1 = ((m / 10) | 0) % 10, m2 = m % 10, s1 = ((s / 10) | 0) % 10, s2 = s % 10;
        if (oldGUIValues.m1 != m1) {
            setM1("" + m1);
            oldGUIValues.m1 = m1;
        }
        if (oldGUIValues.m2 != m2) {
            setM2("" + m2);
            oldGUIValues.m2 = m2;
        }
        if (oldGUIValues.s1 != s1) {
            setS1("" + s1);
            oldGUIValues.s1 = s1;
        }
        // we dont need check for s2 because this function runs once in each second, therefore the last digit should always be different.
        //if (oldGUIValues.s2!=s2){
        setS2("" + s2)
        //oldGUIValues.s2 = s2;
        //}
    }

    const roomRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const authObj = await Utils.generateAuth();
            const jParams = {
                id: roomId,
                password: null,
                token: null,
                authObj: authObj[0]
            };

            const storage = {
                player_name: player.name,
                avatar: 'a',
                player_auth_key: authObj[1],
            };

            Room.join(jParams, {
                storage: storage,
                renderer: null,
                onOpen: (room) => {
                    roomRef.current = room;
                    setIsVisible(true)
                    setGameStarted(!!room.gameState)
                    setPlayers([...room.players])
                    setRoomName(room.name)
                    setStadiumName(room.stadium.name)
                    setRoomScore({ red: room.redScore, blue: room.blueScore })
                    setGameInputs(room, handleChangeRoomView)
                    room.mixConfig({
                        onAfterPingChange: (instantPing, avg, max) => {
                            setPing(`Ping: ${Math.round(instantPing)} - ${Math.round(max)}`)
                        },
                        onAfterStadiumChange: (stadium) => {
                            setStadiumName(stadium.name)
                        },
                        onAfterTeamGoal: () => {
                            setRoomScore({ red: room.redScore, blue: room.blueScore })
                        },
                        onAfterPlayerAdminChange: (id, isAdmin) => {
                            if (id === room.currentPlayerId) {
                                setIsAdmin(isAdmin)
                            }
                        },
                        onAfterPlayerChat: (id, message) => {
                            const player_name = room.getPlayer(id).name
                            addChatLog(player_name, message)
                        },
                        onAfterPlayerTeamChange: () => {
                            setPlayers([...room.players])
                        },
                        onAfterPlayerJoin: () => {
                            setPlayers([...room.players])
                        },
                        onAfterPlayerLeave: () => {
                            setPlayers([...room.players])
                        },
                        onAfterTeamsLockChange: (value) => {
                            setTeamsLocked(value)
                        },
                        onAfterGameStop: () => {
                            setGameStarted(false)
                        },
                        onAfterGameStart: () => {
                            setGameStarted(true)
                        }
                    })
                    const images = [grass, concrete, concrete2, typing];
                    Promise.all(images.map(img => loadImage(img))).then(([grass, concrete, concrete2, typing]) => {
                        const canvas = canvasRef.current;
                        const defaultRendererObj = new defaultRenderer(API, { canvas, paintGame: true, images: { grass, concrete, concrete2, typing }, onRequestAnimationFrame: () => { updateGameStateGUI(room.gameState) } })
                        room.setRenderer(defaultRendererObj)
                    });
                },
                onClose: (reason) => {
                    console.log('Room closed:', reason.code);
                },
            });
        }
        init();
        return () => {
            roomRef.current.setRenderer(null)
            roomRef.current?.leave()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>{isVisible ? (
            <div>
                <div className="game-view">
                    <div className="gameplay-section">
                        <div className="game-state-view">
                            <div className="bar-container">
                                <div className="bar">
                                    <div className="scoreboard">
                                        <div className="teamicon red"></div>
                                        <div className="score">{roomScore.red}</div>
                                        <div className="-">-</div>
                                        <div className="score">{roomScore.blue}</div>
                                        <div className="teamicon blue"></div>
                                    </div>
                                    <div className="fps-limit-fix"></div>
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
                            <canvas className="canvas" ref={canvasRef} id="canvas"></canvas>
                        </div>
                    </div>
                    <div className="top-section" data-hook="top-section">
                        <div className="room-view" style={{ display: showRoomView ? 'flex' : 'none' }}>
                            <div className="container">
                                <h1 data-hook="room-name">{roomName}</h1>
                                <div className="header-btns">
                                    <button data-hook="rec-btn" onClick={handleRec}><i className="icon-circle"></i>Rec</button>
                                    <button data-hook="link-btn" onClick={handleLink}><i className="icon-link"></i>Link</button>
                                    <button data-hook="leave-btn" onClick={handleLeave}><i className="icon-logout"></i>Leave</button>
                                </div>
                                <div className="teams">
                                    <div className="tools">
                                        <button data-hook="auto-btn" hidden={!isAdmin} onClick={() => roomRef.current.autoTeams()}>Auto</button>
                                        <button data-hook="rand-btn" hidden={!isAdmin} onClick={() => roomRef.current.randTeams()}>Rand</button>
                                        <button data-hook="lock-btn" hidden={!isAdmin} onClick={() => roomRef.current.lockTeams()}><i className="icon-lock-open"></i>Lock</button>
                                        <button data-hook="reset-all-btn" hidden={!isAdmin} disabled="" onClick={() => roomRef.current.resetTeams()}>Reset</button>
                                    </div>
                                    <PlayerListView
                                        players={players}
                                        teamId={1}
                                        teamClass={"t-red"}
                                        joinLabel="Red"
                                        showReset
                                        gameStarted={gameStarted}
                                        teamsLocked={teamsLocked}
                                        isAdmin={isAdmin}
                                        room={roomRef.current}
                                    />
                                    <PlayerListView
                                        players={players}
                                        teamId={0}
                                        teamClass={"t-spec"}
                                        joinLabel="Spectators"
                                        showReset={false}
                                        gameStarted={gameStarted}
                                        teamsLocked={teamsLocked}
                                        isAdmin={isAdmin}
                                        room={roomRef.current}
                                    />
                                    <PlayerListView
                                        players={players}
                                        teamId={2}
                                        teamClass={"t-blue"}
                                        joinLabel="Blue"
                                        showReset
                                        gameStarted={gameStarted}
                                        teamsLocked={teamsLocked}
                                        isAdmin={isAdmin}
                                        room={roomRef.current}
                                    />
                                    <div className="spacer "></div>
                                </div>
                                <div className="settings">
                                    <div>
                                        <label className="lbl">Time limit</label>
                                        <select data-hook="time-limit-sel" hidden={!isAdmin} disabled=""><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option><option>11</option><option>12</option><option>13</option><option>14</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="lbl">Score limit</label>
                                        <select data-hook="score-limit-sel" hidden={!isAdmin} disabled=""><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option><option>11</option><option>12</option><option>13</option><option>14</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="lbl">Stadium</label>
                                        <label className="val" data-hook="stadium-name">{stadiumName}</label>
                                        <button className="" data-hook="stadium-pick" hidden={!isAdmin} disabled="" onClick={handleStadiumPick}>Pick</button>
                                    </div>

                                </div>
                                <div className="controls">
                                    <button data-hook="start-btn" hidden={!isAdmin} onClick={() => roomRef.current.startGame()}><i className="icon-play" ></i>Start game</button>
                                    <button data-hook="stop-btn" hidden={!isAdmin} onClick={() => roomRef.current.stopGame()}><i className="icon-stop"></i>Stop game</button>
                                    <button data-hook="pause-btn" hidden={!isAdmin} onClick={() => roomRef.current.pauseGame()}><i className="icon-pause"></i>Pause (P)</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bottom-section">
                        <div className="stats-view-container">
                            <div className="stats-view">
                                <p data-hook="ping">{ping}</p>
                                <p data-hook="fps"></p>
                                <div className="graph">
                                    <canvas></canvas>
                                </div>
                            </div>
                        </div>
                        <div className="chatbox-view">
                            <div className="chatbox-view-contents">
                                <div data-hook="drag" className="drag"></div>
                                <div data-hook="log" className="log subtle-thin-scrollbar">
                                    <div className="log-contents">
                                        {chatRows.map((text, i) => (
                                            <p key={i}>{text}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="input">
                                    <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={inputKeyDown} data-hook="input" type="text" maxLength={140}></input>
                                </div>
                            </div>
                        </div>
                        <div className="bottom-spacer"></div>
                    </div>
                    <div className="buttons">
                        <div className="sound-button-container" data-hook="sound">
                            <div className="sound-slider" data-hook="sound-slider">
                                <div className="sound-slider-bar-bg" data-hook="sound-bar-bg">
                                    <div className="sound-slider-bar" data-hook="sound-bar" style={{ top: '100%' }}></div>
                                </div>
                            </div>
                            <button data-hook="sound-btn"><i className="icon-volume-off" data-hook="sound-icon"></i></button>
                        </div>
                        <button data-hook="menu" onClick={handleChangeRoomView}><i className="icon-menu"></i>Menu<span className="tooltip">Toggle room menu [Escape]</span></button><button data-hook="settings"><i className="icon-cog"></i></button>
                    </div>
                </div>
            </div>
        ) : null /*we will show the onConnInfo here later*/}</>
    );
}

export default Game;
