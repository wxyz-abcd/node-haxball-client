import React, { useState, useEffect } from "react";

export default function GameStateGUI({ roomRef }) {
  const [roomScore, setRoomScore] = useState({ red: 0, blue: 0 });
  const [timeWarn, setTimeWarn] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [m1, setM1] = useState("0");
  const [m2, setM2] = useState("0");
  const [s1, setS1] = useState("0");
  const [s2, setS2] = useState("0");

  useEffect(() => {
    // We poll gameState to avoid binding re-renders to the 60fps renderer
    const oldGUIValues = {};
    const interval = setInterval(() => {
      const room = roomRef.current;
      if (!room || !room.gameState) return;
      const gameState = room.gameState;
      
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
      if (oldGUIValues.s2 !== ss2) { setS2("" + ss2); oldGUIValues.s2 = ss2; }
    }, 500); // Check twice a second

    return () => clearInterval(interval);
  }, [roomRef]);

  return (
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
  );
}
