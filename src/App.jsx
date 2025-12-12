import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import NameForm from "./features/player-data/nameForm";
import RoomList from "./features/rooms/RoomList";
import CreateRoom from "./features/rooms/CreateRoom";
import JoinRoom from "./features/rooms/JoinRoom";
import CreateSandbox from "./features/rooms/CreateSandbox";
import Headless from "./features/rooms/Headless";
import { usePlayerData } from "./hooks/usePlayerData";
import { languageLoaders } from "./utils/languageLoaders";

function App() {
  const { player } = usePlayerData();
useEffect(() => {
  const API = window.API;
  if (!API || !player?.language) return;

  const load = languageLoaders[player.language];
  if (!load) {
    console.log(load)
    languageLoaders.english().then((mod) => {
      API.Language.current = mod.default ?? mod;
    });
    return;
  }

  let mounted = true;
  load()
    .then((mod) => {
      if (!mounted) return;
      API.Language.current = new mod.default(API);
    })
    .catch((err) => console.error("Failed to load language:", err));

  return () => {
    mounted = false;
  };
}, [player?.language]);

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
