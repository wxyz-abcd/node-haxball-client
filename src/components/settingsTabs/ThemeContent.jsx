import { useState, useCallback, useRef } from 'react';
import { useTheme } from '../../themes/ThemeContext.jsx';
import { VARIABLE_GROUPS, DERIVED_VAR_CONFIG, expandThemeVariables } from '../../themes/themeUtils.js';
import { usePlayerData } from '../../hooks/usePlayerData.jsx';

function computeInitialCustomDerived(vars) {
  const set = new Set();
  Object.values(DERIVED_VAR_CONFIG).forEach(derivedList => {
    derivedList.forEach(d => {
      if (vars[d.key] !== undefined) set.add(d.key);
    });
  });
  return set;
}

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
  const [customDerived, setCustomDerived] = useState(new Set());
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
      setCustomDerived(computeInitialCustomDerived(current.variables));
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
      setCustomDerived(computeInitialCustomDerived(theme.variables));
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

  const handleToggleDerived = useCallback((baseKey, derivedList) => {
    const turningOn = !derivedList.every(d => customDerived.has(d.key));

    setCustomDerived(prev => {
      const next = new Set(prev);
      derivedList.forEach(d => (turningOn ? next.add(d.key) : next.delete(d.key)));
      return next;
    });

    setEditVars(prev => {
      const updated = { ...prev };
      if (turningOn) {
        const baseVal = updated[baseKey];
        derivedList.forEach(d => {
          if (updated[d.key] === undefined && baseVal) {
            updated[d.key] = d.compute(baseVal);
          }
        });
      } else {
        derivedList.forEach(d => {
          delete updated[d.key];
        });
      }
      previewTheme(expandThemeVariables(updated));
      return updated;
    });
  }, [previewTheme, customDerived]);

  // ── Background image toggle ──
  const handleBgImageToggle = useCallback(() => {
    setEditVars(prev => {
      const current = prev['--bg-body-image'] || 'none';
      const updated = {
        ...prev,
        '--bg-body-image': 'none',
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
                const derivedList = DERIVED_VAR_CONFIG[v.key];
                const isCustomizing = derivedList && derivedList.every(d => customDerived.has(d.key));
                return (
                  <div key={v.key} style={{ marginBottom: 3 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
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

                    {/* Manual override toggle for auto-derived hover/active/etc. */}
                    {derivedList && (
                      <div style={{ marginLeft: 10, marginTop: 1, marginBottom: 2 }}>
                        <label style={{
                          fontSize: 11,
                          opacity: 0.65,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}>
                          <input
                            type="checkbox"
                            checked={isCustomizing}
                            onChange={() => handleToggleDerived(v.key, derivedList)}
                            style={{ width: 12, height: 12 }}
                          />
                          Personalizar {derivedList.map(d => d.label).join(' / ')}
                        </label>

                        {isCustomizing && (
                          <div style={{ marginTop: 3, marginLeft: 2 }}>
                            {derivedList.map(d => {
                              const dVal = editVars[d.key] || '';
                              return (
                                <div key={d.key} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 3,
                                }}>
                                  <span style={{ fontSize: 12, opacity: 0.75 }}>{d.label}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{dVal}</span>
                                    <input
                                      type="color"
                                      value={dVal.length === 4 ?
                                        '#' + dVal[1] + dVal[1] + dVal[2] + dVal[2] + dVal[3] + dVal[3] :
                                        (dVal || '#000000')
                                      }
                                      onChange={e => handleColorChange(d.key, e.target.value)}
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
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
