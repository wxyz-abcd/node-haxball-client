import { useState } from 'react';
import RoomList from './RoomList.jsx';
import Game from './Game.jsx';

function App() {
  const [roomJoined, setRoomJoined] = useState(null);

  if (roomJoined) {
    return <Game roomId='a'/>;
  }

  return <RoomList onJoin={setRoomJoined} />;
}

export default App;