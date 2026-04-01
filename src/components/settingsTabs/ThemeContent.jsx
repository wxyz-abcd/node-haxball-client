import { useState, useCallback, useRef } from 'react';
import { useTheme } from '../../themes/ThemeContext.jsx';
import { VARIABLE_GROUPS, expandThemeVariables } from '../../themes/themeUtils.js';
import { usePlayerData } from '../../hooks/usePlayerData.jsx';

/**
 * Theme settings tab. Contains:
 * - Theme selector dropdown
 * - Edit / Delete buttons for custom themes
 * - Theme creator/editor with color pickers
 * - Import / Export functionality
 */
export default function ThemeContent() {
  const {
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
  } = useTheme();
  const { setPlayerField } = usePlayerData();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVars, setEditVars] = useState({});
  const [editId, setEditId] = useState(null); // null for new, string for editing existing
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const themes = getThemeList();

  // ── Theme switching ──
  const handleThemeChange = useCallback((e) => {
    const id = e.target.value;
    switchTheme(id);
    setPlayerField('theme', id);
  }, [switchTheme, setPlayerField]);

  // ── Create new theme ──
  const handleCreateNew = useCallback(() => {
    const current = getTheme(activeThemeId);
    if (current) {
      setEditName('My Theme');
      setEditVars({ ...current.variables });
      setEditId(null);
      setEditing(true);
    }
  }, [getTheme, activeThemeId]);

  // ── Edit existing custom theme ──
  const handleEdit = useCallback(() => {
    const theme = getTheme(activeThemeId);
    if (theme && !theme.builtIn) {
      setEditName(theme.name);
      setEditVars({ ...theme.variables });
      setEditId(theme.id);
      setEditing(true);
    }
  }, [getTheme, activeThemeId]);

  // ── Delete custom theme ──
  const handleDelete = useCallback(() => {
    if (window.confirm('Delete this theme?')) {
      deleteCustomTheme(activeThemeId);
      setPlayerField('theme', 'classic');
    }
  }, [deleteCustomTheme, activeThemeId, setPlayerField]);

  // ── Color picker change (live preview) ──
  const handleColorChange = useCallback((varKey, value) => {
    setEditVars(prev => {
      const updated = { ...prev, [varKey]: value };
      const expanded = expandThemeVariables(updated);
      previewTheme(expanded);
      return updated;
    });
  }, [previewTheme]);

  // ── Background image toggle ──
  const handleBgImageToggle = useCallback(() => {
    setEditVars(prev => {
      const current = prev['--bg-body-image'] || 'url("../images/bg.png")';
      const updated = {
        ...prev,
        '--bg-body-image': current === 'none' ? 'url("../images/bg.png")' : 'none',
      };
      previewTheme(expandThemeVariables(updated));
      return updated;
    });
  }, [previewTheme]);

  // ── Save edited theme ──
  const handleSave = useCallback(() => {
    const id = editId || editName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || 'custom_' + Date.now();
    const theme = saveCustomTheme({ id, name: editName, variables: editVars });
    switchTheme(theme.id);
    setPlayerField('theme', theme.id);
    setEditing(false);
  }, [editId, editName, editVars, saveCustomTheme, switchTheme, setPlayerField]);

  // ── Cancel editing ──
  const handleCancel = useCallback(() => {
    cancelPreview();
    setEditing(false);
  }, [cancelPreview]);

  // ── Export ──
  const handleExport = useCallback(() => {
    const json = exportTheme(activeThemeId);
    if (!json) return;
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme_${activeThemeId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(json);
    }
  }, [exportTheme, activeThemeId]);

  // ── Import ──
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const theme = importTheme(ev.target.result);
      if (theme) {
        switchTheme(theme.id);
        setPlayerField('theme', theme.id);
      } else {
        setImportError('Invalid theme file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-imported
  }, [importTheme, switchTheme, setPlayerField]);

  const currentTheme = getTheme(activeThemeId);
  const isCustom = currentTheme && !currentTheme.builtIn;

  // ── Render ──
  if (editing) {
    return (
      <div className="section selected" style={{ gap: 4 }}>
        {/* Theme name */}
        <div className="option-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ marginRight: 10, whiteSpace: 'nowrap' }}>Theme name:</span>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            style={{ flex: 1, height: 26, padding: '0 8px' }}
          />
        </div>

        {/* Background image toggle */}
        <div
          className="toggle"
          onClick={handleBgImageToggle}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div>
            <i className={`icon-${editVars['--bg-body-image'] !== 'none' ? 'ok' : 'cancel'}`} />
            Show background image
          </div>
        </div>

        {/* Color pickers grouped by category */}
        <div style={{
          maxHeight: 280,
          overflowY: 'auto',
          marginTop: 4,
          paddingRight: 4,
        }} className="subtle-thin-scrollbar">
          {VARIABLE_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 10 }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 4,
                opacity: 0.6,
              }}>
                {group.label}
              </div>
              {group.vars.map(v => {
                const currentVal = editVars[v.key] || '';
                const isColor = /^#[0-9a-fA-F]{3,8}$/.test(currentVal);
                return (
                  <div key={v.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                    padding: '2px 4px',
                    borderRadius: 3,
                  }}>
                    <span style={{ fontSize: 13, flex: 1 }}>{v.label}</span>
                    {isColor ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{currentVal}</span>
                        <input
                          type="color"
                          value={currentVal.length === 4 ?
                            '#' + currentVal[1] + currentVal[1] + currentVal[2] + currentVal[2] + currentVal[3] + currentVal[3] :
                            currentVal
                          }
                          onChange={e => handleColorChange(v.key, e.target.value)}
                          style={{
                            width: 28,
                            height: 22,
                            border: 'none',
                            padding: 0,
                            background: 'none',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={currentVal}
                        onChange={e => handleColorChange(v.key, e.target.value)}
                        style={{ width: 120, height: 22, padding: '0 6px', fontSize: 12 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Save / Cancel buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={handleSave} style={{ flex: 1 }}>Save</button>
          <button onClick={handleCancel} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Main view (not editing) ──
  return (
    <div className="section selected" style={{ gap: 6 }}>
      {/* Theme selector */}
      <div className="option-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Theme</span>
        <select
          value={activeThemeId}
          onChange={handleThemeChange}
          style={{
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '2px 5px',
            fontSize: '13px',
            cursor: 'pointer',
            marginLeft: 10,
          }}
        >
          {themes.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}{t.builtIn ? '' : ' ★'}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={handleCreateNew} style={{ flex: 1 }}>
          Create New
        </button>
        {isCustom && (
          <>
            <button onClick={handleEdit} style={{ flex: 1 }}>
              Edit
            </button>
            <button onClick={handleDelete} style={{ flex: 1 }}>
              Delete
            </button>
          </>
        )}
      </div>

      {/* Import / Export */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleExport} style={{ flex: 1 }}>
          Export
        </button>
        <button onClick={handleImportClick} style={{ flex: 1 }}>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </div>

      {importError && (
        <p style={{ color: '#e56e56', fontSize: 12, marginTop: 4 }}>{importError}</p>
      )}
    </div>
  );
}
