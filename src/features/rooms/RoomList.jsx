import { useState, useRef, useEffect } from 'react';
import PerfectScrollbar from 'perfect-scrollbar';
import { getRooms } from './rooms.service.js';

function RoomList({ showNameForm, onJoin }) {
  const [rooms, setRooms] = useState([]);
  const [roomSelected, setRoomSelected] = useState(null);
  const hasPassword = (room) => room.data.password ? "Yes" : "No";
  const handleRowClick = (roomId) => {
    setRoomSelected(roomId)
  };
  const handleRowDoubleClick = (roomId) => onJoin(roomId);
  const handleJoinClick = () => {if(roomSelected)onJoin(roomSelected)};
  const refresh = () => {
    setRooms([])
    getRooms().then(setRooms)
  };
  const containerRef = useRef(null);

  useEffect(() => {
    const ps = new PerfectScrollbar(containerRef.current);
    return () => ps.destroy();
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className='container flexRow'>
      <div className='flexCol flexGrow'>
        <div className='roomlist-view'>
          <div className='dialog'>
            <h1>Room list</h1>
            <p>Tip: Join rooms near you to reduce lag.</p>
            <div className='splitter'>
              <div className='list'>
                <table className='header'>
                  <colgroup>
                    <col></col>
                    <col></col>
                    <col></col>
                    <col></col>
                  </colgroup>
                  <thead><tr><td>Name</td><td>Players</td><td>Pass</td><td>Distance</td></tr></thead>
                </table>
                <div className='separator'></div>
                <div ref={containerRef} className='content' data-hook="listscroll">
                  <table>
                    <colgroup>
                      <col></col>
                      <col></col>
                      <col></col>
                      <col></col>
                    </colgroup>
                    <tbody data-hook="list">
                      {
                        rooms.map(room => {
                          const flagClass = "flagico "+"f-"+room.data.flag;
                          return (
                            <tr
                              key={room.id}
                              onClick={() => handleRowClick(room.id)}
                              onDoubleClick={() => handleRowDoubleClick(room.id)}
                              className={roomSelected === room.id ? "selected" : ""}
                            >
                              <td>
                                <span data-hook="name">{room.data.name}</span>
                              </td>
                              <td data-hook="players">{room.data.players}/{room.data.maxPlayers}</td>
                              <td data-hook="pass">{hasPassword(room)}</td>
                              <td>
                                <div data-hook="flag" className={flagClass}></div>
                                <span data-hook="distance">{Math.round(room.dist)}km</span>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
                <div className="filters">
                  <span className="bool" data-hook="fil-pass">Show locked <i className="icon-ok"></i></span>
                  <span className="bool" data-hook="fil-full">Show full <i className="icon-ok"></i></span>
                  <span className="bool" data-hook="fill-empty">Show empty <i className="icon-ok"></i></span>
                </div>
              </div>
              <div className="buttons">
                <button data-hook="refresh">
                  <i className="icon-cw"></i>
                  <div onClick={refresh}>Refresh</div>
                </button>
                <button data-hook="join" onClick={handleJoinClick} disabled={!roomSelected}>
                  <i className="icon-login"></i>
                  <div>Join Room</div>
                </button>
                <button data-hook="create">
                  <i className="icon-plus"></i>
                  <div>Create Room</div>
                </button>
                <div className="spacer"></div>
                <div className="file-btn">
                  <label htmlFor="replayfile">
                    <i className="icon-play"></i>
                    <div>Replays</div>
                  </label>
                  <input id="replayfile" type="file" accept=".hbr2" data-hook="replayfile"></input>
                </div>
                <button data-hook="settings">
                  <i className="icon-cog"></i>
                  <div>Settings</div>
                </button>
                <button data-hook="changenick">
                  <i className="icon-cw"></i>
                  <div onClick={showNameForm}>Change Nick</div>
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
