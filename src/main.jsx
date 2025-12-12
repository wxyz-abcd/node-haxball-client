import { createRoot } from 'react-dom/client';
import PlayerDataProvider from './hooks/PlayerDataProvider';
import App from './App';
import './assets/css/game.css';
import './assets/css/fontello.css'
import { HashRouter } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <PlayerDataProvider>
      <App />
    </PlayerDataProvider>
  </HashRouter>
);
