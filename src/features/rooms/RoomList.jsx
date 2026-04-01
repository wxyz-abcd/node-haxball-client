import { useState, useRef, useEffect, memo, useCallback } from "react";
import PerfectScrollbar from "perfect-scrollbar";
import { getRooms } from "./rooms.service.js";
import { useNavigate } from "react-router-dom";
import SettingsPopup from "../../components/SettingsPopup.jsx";
import Popup from "../../components/Popup.jsx";
import InputDialog from "../../components/InputDialog.jsx";
import { usePlayerData } from "../../hooks/usePlayerData.jsx";

const RoomListItem = memo(({ room, isSelected, onClick, onDoubleClick }) => {
  const flagClass = "flagico " + "f-" + room.data.flag;
  const click = useCallback(()=>onClick(room.id), [onClick, room.id]);
  const doubleClick = useCallback(()=>onDoubleClick(room.id), [onDoubleClick, room.id]);

  return (
    <tr
      onClick={click}
      onDoubleClick={doubleClick}
      className={isSelected ? "selected" : ""}
    >
      <td>
        <span data-hook="name">{room.data.name}</span>
      </td>
      <td data-hook="players">
        {room.data.players}/{room.data.maxPlayers}
      </td>
      <td data-hook="pass">{room.data.password ? "Yes" : "No"}</td>
      <td>
        <div data-hook="flag" className={flagClass}></div>
        <span data-hook="distance">{Math.round(room.dist)}km</span>
      </td>
    </tr>
  );
});

function RoomList() {
  const { player, setPlayerField } = usePlayerData();
  const [rooms, setRooms] = useState([]);
  const containerRef = useRef(null);
  const [roomSelected, setRoomSelected] = useState(null);
  const [popupComponent, setPopupComponent] = useState(null);
  const [popupProps, setPopupProps] = useState({});
  const navigate = useNavigate();
  const join = useCallback((roomId) => navigate(`/JoinRoom/${roomId}`), [navigate]);
  const closePopup = useCallback(()=>{
    setPopupComponent(null);
    setPopupProps({});
  }, []);

  /** Opens the InputDialog popup with a promise-based API */
  const promptUser = useCallback((dialogProps) => {
    return new Promise((resolve) => {
      setPopupProps({
        ...dialogProps,
        onSubmit: (value) => {
          setPopupComponent(null);
          setPopupProps({});
          resolve(value);
        },
        onCancel: () => {
          setPopupComponent(null);
          setPopupProps({});
          resolve(null);
        },
      });
      setPopupComponent(() => InputDialog);
    });
  }, []);

  const handleRowClick = useCallback((roomId) => setRoomSelected(roomId), [setRoomSelected]);

  const handleRowDoubleClick = useCallback(async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.data?.password) {
      const password = await promptUser({
        title: "Password required",
        message: "This room requires a password:",
        placeholder: "Enter password…",
        inputType: "password",
        submitText: "Join",
      });
      if (password === null) return;
      navigate(`/JoinRoom/${roomId}`, { state: { password } });
    } else {
      navigate(`/JoinRoom/${roomId}`);
    }
  }, [navigate, rooms, promptUser]);

  const handleJoinClick = useCallback(async () => {
    const room = rooms.find(r => r.id === roomSelected);
    if (room?.data?.password) {
      const password = await promptUser({
        title: "Password required",
        message: "This room requires a password:",
        placeholder: "Enter password…",
        inputType: "password",
        submitText: "Join",
      });
      if (password === null) return;
      navigate(`/JoinRoom/${roomSelected}`, { state: { password } });
    } else {
      navigate(`/JoinRoom/${roomSelected}`);
    }
  }, [navigate, roomSelected, rooms, promptUser]);

  const handleJoinHidden = useCallback(async () => {
    const input = await promptUser({
      title: "Join hidden room",
      message: "Enter the room link or ID:",
      placeholder: "https://www.haxball.com/play?c=… or ID",
      submitText: "Next",
    });
    if (!input) return;
    const trimmed = input.trim();
    const match = trimmed.match(/\?c=([^&]+)/);
    const roomId = match ? match[1] : trimmed;
    if (!roomId) return;

    // Ask for password (optional – user can leave blank)
    const password = await promptUser({
      title: "Room password",
      message: "If the room has a password, enter it below.\nLeave empty if none.",
      placeholder: "Password (optional)",
      inputType: "password",
      submitText: "Join",
    });
    if (password === null) return; // cancelled
    navigate(`/JoinRoom/${roomId}`, { state: { password: password || null } });
  }, [navigate, promptUser]);

  const showCreateRoom = useCallback(() => navigate("/CreateRoom"), [navigate]);
  const handleSettings = useCallback(() => {
    setPopupProps({});
    setPopupComponent(()=>SettingsPopup);
  }, []);
  const refresh = useCallback(() => {
    setRooms([]);
    if (player.geo)
      getRooms(player.geo).then(setRooms);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const goToNameForm = useCallback(() => navigate('/'), [navigate]);
  const goToHeadless = useCallback(() => navigate('/Headless'), [navigate]);
  const goToSandbox = useCallback(() => navigate('/CreateSandbox'), [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const ps = new PerfectScrollbar(containerRef.current);
    return () => ps.destroy();
  }, []);

  useEffect(() => {
    if (!player.geo) {
      window.API.Utils.getGeo().then(geo => {
        setPlayerField('geo', geo);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container flexRow">
      <div className="flexCol flexGrow">
        <div className="roomlist-view">
          <Popup
            PopupComponent={popupComponent}
            popupComponentProps={popupProps}
            closePopup={closePopup}
          />
          <div className="dialog">
            <h1>Room list</h1>
            <p>Tip: Join rooms near you to reduce lag.</p>
            <div className="splitter">
              <div className="list">
                <table className="header">
                  <colgroup>
                    <col></col>
                    <col></col>
                    <col></col>
                    <col></col>
                  </colgroup>
                  <thead>
                    <tr>
                      <td>Name</td>
                      <td>Players</td>
                      <td>Pass</td>
                      <td>Distance</td>
                    </tr>
                  </thead>
                </table>
                <div className="separator"></div>
                <div
                  ref={containerRef}
                  className="content"
                  data-hook="listscroll"
                >
                  <table>
                    <colgroup>
                      <col></col>
                      <col></col>
                      <col></col>
                      <col></col>
                    </colgroup>
                    <tbody data-hook="list">
                      {rooms.map((room) => (
                        <RoomListItem
                          key={room.id}
                          room={room}
                          isSelected={roomSelected === room.id}
                          onClick={handleRowClick}
                          onDoubleClick={handleRowDoubleClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="filters">
                  <span className="bool" data-hook="fil-pass">
                    Show locked <i className="icon-ok"></i>
                  </span>
                  <span className="bool" data-hook="fil-full">
                    Show full <i className="icon-ok"></i>
                  </span>
                  <span className="bool" data-hook="fill-empty">
                    Show empty <i className="icon-ok"></i>
                  </span>
                </div>
              </div>
              <div className="buttons">
                <button data-hook="refresh" onClick={refresh}>
                  <i className="icon-cw"></i>
                  <div>Refresh</div>
                </button>
                <button
                  data-hook="join"
                  onClick={handleJoinClick}
                  disabled={!roomSelected}
                >
                  <i className="icon-login"></i>
                  <div>Join Room</div>
                </button>
                <button
                  data-hook="join-hidden"
                  onClick={handleJoinHidden}
                >
                  <i className="icon-login"></i>
                  <div>Join Hidden</div>
                </button>
                <button data-hook="create" onClick={showCreateRoom}>
                  <i className="icon-plus"></i>
                  <div>Create Room</div>
                </button>
                <div className="spacer"></div>
                <button
                  onClick={goToSandbox}
                  data-hook="sandbox"
                >
                  <div>Sandbox</div>
                </button>
                <button
                  onClick={goToHeadless}
                  data-hook="headless"
                >
                  <div>Headless</div>
                </button>
                <div className="file-btn">
                  <label htmlFor="replayfile">
                    <i className="icon-play"></i>
                    <div>Replays</div>
                  </label>
                  <input
                    id="replayfile"
                    type="file"
                    accept=".hbr2"
                    data-hook="replayfile"
                  ></input>
                </div>
                <button onClick={handleSettings} data-hook="settings">
                  <i className="icon-cog"></i>
                  <div>Settings</div>
                </button>
                <button onClick={goToNameForm} data-hook="changenick">
                  <i className="icon-cw"></i>
                  <div>Change Nick</div>
                </button>
              </div>
            </div>
            <p>{/* count all players of rooms */}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomList;
