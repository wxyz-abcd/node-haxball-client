import { ThemeProvider } from './ThemeContext.jsx';
import { usePlayerData } from '../hooks/usePlayerData.jsx';

/**
 * Bridge component that reads the saved theme ID from player data
 * and passes it into the ThemeProvider as its initial theme.
 * Must be rendered inside PlayerDataProvider.
 */
export default function ThemeInitializer({ children }) {
  const { player } = usePlayerData();
  return (
    <ThemeProvider initialThemeId={player?.theme || 'classic'}>
      {children}
    </ThemeProvider>
  );
}
