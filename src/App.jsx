import { useState } from 'react';
import RoomList from './features/rooms/RoomList.jsx';
import Game from './features/game/Game.jsx';

function App({ showNameForm }) {
  const [roomJoined, setRoomJoined] = useState(null);

  if (roomJoined) {
    return <Game roomId={'yzkD7r_fbzQ'} />;
  }

  return <RoomList showNameForm={showNameForm} onJoin={setRoomJoined} />;
}

export default App;