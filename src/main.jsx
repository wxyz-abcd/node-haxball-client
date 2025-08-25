import { createRoot } from 'react-dom/client';
import PlayerDataProvider from './hooks/PlayerDataProvider';
import App from './App';
import './assets/css/game.css';
import './assets/css/fontello.css'
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PlayerDataProvider>
      <App />
    </PlayerDataProvider>
  </BrowserRouter>
);
