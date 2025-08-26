import { Routes, Route } from "react-router-dom";
import NameForm from "./features/player-data/nameForm";
import RoomList from "./features/rooms/RoomList";
import CreateRoom from "./features/rooms/CreateRoom";
import JoinRoom from "./features/rooms/JoinRoom";
import CreateSandbox from "./features/rooms/CreateSandbox";
import Headless from "./features/rooms/Headless";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NameForm />} />
      <Route path="/RoomList" element={<RoomList />} />
      <Route path="/CreateRoom" element={<CreateRoom />} />
      <Route path="/JoinRoom/:id" element={<JoinRoom />} />
      <Route path="/CreateSandbox" element={<CreateSandbox />} />
      <Route path="/Headless" element={<Headless />} />
    </Routes>
  );
}

export default App;
