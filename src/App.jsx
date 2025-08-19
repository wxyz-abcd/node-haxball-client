import { Routes, Route } from "react-router-dom";
import NameForm from "./features/player-data/nameForm";
import RoomList from "./features/rooms/RoomList";
import CreateRoom from "./features/rooms/CreateRoom";
import JoinRoom from "./features/rooms/JoinRoom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NameForm />} />
      <Route path="/RoomList" element={<RoomList />} />
      <Route path="/CreateRoom" element={<CreateRoom />} />
      <Route path="/JoinRoom/:id" element={<JoinRoom />} />
    </Routes>
  );
}

export default App;
