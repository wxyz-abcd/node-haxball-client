import React from "react";
import PlayerListView from './PlayerListView.jsx';

export default function RoomHeader({
  roomRef,
  roomName,
  stadiumName,
  isAdmin,
  teamsLocked,
  gameStarted,
  timeLimit,
  scoreLimit,
  setTimeLimit,
  setScoreLimit,
  handleRec,
  handleLink,
  handleLeave,
  handleStadiumPick,
  players,
  setPopup
}) {

  const safeRoom = roomRef?.current;

  return (
    <div className="room-view" style={{ display: 'flex' }}>
      <div className="container">
        <h1 data-hook="room-name">{roomName}</h1>
        <div className="header-btns">
          <button data-hook="rec-btn" onClick={handleRec} className={safeRoom && safeRoom.isRecording() ? 'active' : ''}><i className="icon-circle"></i>Rec</button>
          <button data-hook="link-btn" onClick={handleLink}><i className="icon-link"></i>Link</button>
          <button data-hook="leave-btn" onClick={handleLeave}><i className="icon-logout"></i>Leave</button>
        </div>
        <div className="teams">
          <div className="tools">
            <button data-hook="auto-btn" hidden={!isAdmin} onClick={() => safeRoom?.autoTeams()}>Auto</button>
            <button data-hook="rand-btn" hidden={!isAdmin} onClick={() => safeRoom?.randTeams()}>Rand</button>
            <button data-hook="lock-btn" hidden={!isAdmin} onClick={() => safeRoom?.lockTeams()}><i className={`icon-lock${teamsLocked ? '' : '-open'}`}></i>Lock</button>
            <button data-hook="reset-all-btn" hidden={!isAdmin} disabled="" onClick={() => safeRoom?.resetTeams()}>Reset</button>
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
            room={safeRoom}
            showPopup={setPopup}
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
            room={safeRoom}
            showPopup={setPopup}
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
            room={safeRoom}
            showPopup={setPopup}
          />
          <div className="spacer "></div>
        </div>
        <div className="settings">
          <div>
            <label className="lbl">Time limit</label>
            <select onChange={(e) => setTimeLimit(Number(e.target.value))} value={timeLimit} data-hook="time-limit-sel" disabled={!isAdmin || !!safeRoom?.gameState}>
              {[...Array(15).keys()].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">Score limit</label>
            <select onChange={(e) => setScoreLimit(Number(e.target.value))} value={scoreLimit} data-hook="score-limit-sel" disabled={!isAdmin || !!safeRoom?.gameState}>
              {[...Array(15).keys()].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl">Stadium</label>
            <label className={`val ${safeRoom?.stadium?.isCustom ? 'custom' : ''}`} data-hook="stadium-name">{stadiumName}</label>
            <button className="" data-hook="stadium-pick" hidden={!isAdmin} disabled={!!safeRoom?.gameState} onClick={handleStadiumPick}>Pick</button>
          </div>
        </div>
        <div className="controls">
          <button data-hook="start-btn" hidden={!isAdmin || !!safeRoom?.gameState} onClick={() => safeRoom?.startGame()}><i className="icon-play" ></i>Start game</button>
          <button data-hook="stop-btn" hidden={!isAdmin || !safeRoom?.gameState} onClick={() => safeRoom?.stopGame()}><i className="icon-stop"></i>Stop game</button>
          <button data-hook="pause-btn" hidden={!isAdmin} onClick={() => safeRoom?.pauseGame()}><i className="icon-pause"></i>Pause (P)</button>
        </div>
      </div>
    </div>
  );
}
