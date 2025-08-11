import { createRoot } from 'react-dom/client';
import { PlayerDataProvider } from './hooks/PlayerDataContext';
import Root from './Root';
import './assets/css/game.css';
import './assets/css/fontello.css'
import { StrictMode } from 'react';

createRoot(document.getElementById('root')).render(
    <PlayerDataProvider>
      <Root />
    </PlayerDataProvider>
);
