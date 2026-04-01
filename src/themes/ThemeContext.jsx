import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BUILTIN_THEMES, DEFAULT_THEME_ID } from './themes.js';
import { expandThemeVariables } from './themeUtils.js';

const ThemeContext = createContext(null);

// ── File-based storage helpers (NW.js) ──

function getThemesDir() {
  try {
    const path = window.require('path');
    let isDev = false;
    try { isDev = window.nw.App.argv.includes('development'); } catch (e) { }
    let processPath = '';
    try { processPath = window.process.cwd(); } catch (e) { }
    if (!isDev) {
      try { processPath = path.dirname(window.process.execPath); } catch (e) { }
    }
    return path.join(processPath, 'themes');
  } catch (e) {
    return null;
  }
}

function ensureThemesDir() {
  try {
    const fs = window.require('fs');
    const dir = getThemesDir();
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch (e) {
    return null;
  }
}

function loadCustomThemesFromDisk() {
  try {
    const fs = window.require('fs');
    const path = window.require('path');
    const dir = getThemesDir();
    if (!dir || !fs.existsSync(dir)) return {};
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const themes = {};
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        if (data && data.id && data.variables) {
          data.builtIn = false;
          themes[data.id] = data;
        }
      } catch (e) {
        console.warn(`Failed to load theme file ${file}:`, e);
      }
    }
    return themes;
  } catch (e) {
    console.warn('Failed to load custom themes:', e);
    return {};
  }
}

function saveCustomThemeToDisk(theme) {
  try {
    const fs = window.require('fs');
    const path = window.require('path');
    const dir = ensureThemesDir();
    if (!dir) return false;
    const filename = theme.id.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
    const data = { id: theme.id, name: theme.name, variables: theme.variables };
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save theme:', e);
    return false;
  }
}

function deleteCustomThemeFromDisk(themeId) {
  try {
    const fs = window.require('fs');
    const path = window.require('path');
    const dir = getThemesDir();
    if (!dir) return false;
    const filename = themeId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (e) {
    console.error('Failed to delete theme:', e);
    return false;
  }
}

// ── Apply theme to DOM ──

function applyThemeToDOM(variables) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
}

function clearThemeFromDOM() {
  const root = document.documentElement;
  // Remove all custom properties set by themes
  const allVarKeys = Object.keys(BUILTIN_THEMES.classic.variables);
  for (const key of allVarKeys) {
    root.style.removeProperty(key);
  }
}

// ── Provider ──

export function ThemeProvider({ children, initialThemeId }) {
  const [customThemes, setCustomThemes] = useState(() => loadCustomThemesFromDisk());
  const [activeThemeId, setActiveThemeId] = useState(initialThemeId || DEFAULT_THEME_ID);

  // Build the full map of available themes
  const allThemes = useMemo(() => ({
    ...BUILTIN_THEMES,
    ...customThemes,
  }), [customThemes]);

  // Apply theme on mount and when active theme changes
  useEffect(() => {
    const theme = allThemes[activeThemeId];
    if (theme) {
      const expanded = theme.builtIn ? theme.variables : expandThemeVariables(theme.variables);
      applyThemeToDOM(expanded);
    } else {
      // Fallback to classic
      applyThemeToDOM(BUILTIN_THEMES.classic.variables);
    }
  }, [activeThemeId, allThemes]);

  const switchTheme = useCallback((themeId) => {
    setActiveThemeId(themeId);
  }, []);

  const previewTheme = useCallback((variables) => {
    const expanded = expandThemeVariables(variables);
    applyThemeToDOM(expanded);
  }, []);

  const cancelPreview = useCallback(() => {
    const theme = allThemes[activeThemeId];
    if (theme) {
      const expanded = theme.builtIn ? theme.variables : expandThemeVariables(theme.variables);
      applyThemeToDOM(expanded);
    }
  }, [activeThemeId, allThemes]);

  const saveCustomTheme = useCallback((theme) => {
    const themeData = {
      id: theme.id,
      name: theme.name,
      builtIn: false,
      variables: theme.variables,
    };
    saveCustomThemeToDisk(themeData);
    setCustomThemes(prev => ({ ...prev, [themeData.id]: themeData }));
    return themeData;
  }, []);

  const deleteCustomTheme = useCallback((themeId) => {
    if (BUILTIN_THEMES[themeId]) return false; // Can't delete built-in
    deleteCustomThemeFromDisk(themeId);
    setCustomThemes(prev => {
      const copy = { ...prev };
      delete copy[themeId];
      return copy;
    });
    if (activeThemeId === themeId) {
      setActiveThemeId(DEFAULT_THEME_ID);
    }
    return true;
  }, [activeThemeId]);

  const exportTheme = useCallback((themeId) => {
    const theme = allThemes[themeId];
    if (!theme) return null;
    return JSON.stringify({ id: theme.id, name: theme.name, variables: theme.variables }, null, 2);
  }, [allThemes]);

  const importTheme = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.name || !data.variables) {
        throw new Error('Invalid theme format: missing name or variables');
      }
      // Generate a unique ID if it collides with built-in
      let id = data.id || data.name.toLowerCase().replace(/\s+/g, '_');
      if (BUILTIN_THEMES[id]) {
        id = id + '_custom';
      }
      const theme = { id, name: data.name, builtIn: false, variables: data.variables };
      saveCustomThemeToDisk(theme);
      setCustomThemes(prev => ({ ...prev, [id]: theme }));
      return theme;
    } catch (e) {
      console.error('Failed to import theme:', e);
      return null;
    }
  }, []);

  const getThemeList = useCallback(() => {
    return Object.values(allThemes).map(t => ({
      id: t.id,
      name: t.name,
      builtIn: !!t.builtIn,
    }));
  }, [allThemes]);

  const getTheme = useCallback((id) => {
    return allThemes[id] || null;
  }, [allThemes]);

  const contextValue = useMemo(() => ({
    activeThemeId,
    switchTheme,
    previewTheme,
    cancelPreview,
    saveCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    getThemeList,
    getTheme,
  }), [
    activeThemeId,
    switchTheme,
    previewTheme,
    cancelPreview,
    saveCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    getThemeList,
    getTheme,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
