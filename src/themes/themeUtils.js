/**
 * Theme color utility functions.
 * Used for auto-generating hover/active button variants from base colors.
 */

/** Parse a hex color (#abc or #aabbcc) into [r, g, b] */
export function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Convert [r, g, b] to #rrggbb */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/** Lighten a hex color by a percentage (0–100). Used for hover states. */
export function lighten(hex, percent = 15) {
  const [r, g, b] = hexToRgb(hex);
  const amt = percent / 100;
  return rgbToHex(
    r + (255 - r) * amt,
    g + (255 - g) * amt,
    b + (255 - b) * amt
  );
}

/** Darken a hex color by a percentage (0–100). Used for active states. */
export function darken(hex, percent = 15) {
  const [r, g, b] = hexToRgb(hex);
  const amt = 1 - percent / 100;
  return rgbToHex(r * amt, g * amt, b * amt);
}

/** Convert hex to "r, g, b" string for use in rgba() */
export function hexToRgbString(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Base -> derived variable relationships. This is the single source of
 * truth used both by expandThemeVariables (auto-fill on save/preview) and
 * by the theme editor UI (to offer a "customize" override per base color).
 *
 * Each entry maps a base CSS variable key to the list of variables that get
 * auto-derived from it, along with how to compute the default value.
 */
const BUTTON_FAMILIES = ['btn-primary', 'btn-danger', 'btn-success', 'btn-cancel', 'btn-info'];

export const DERIVED_VAR_CONFIG = {};

for (const family of BUTTON_FAMILIES) {
  const key = `--${family}`;
  DERIVED_VAR_CONFIG[key] = [
    { key: `${key}-hover`, label: 'Hover', compute: (v) => lighten(v, 15) },
    { key: `${key}-active`, label: 'Active', compute: (v) => darken(v, 15) },
  ];
}

DERIVED_VAR_CONFIG['--bg-primary'] = [
  { key: '--bg-hover', label: 'Hover', compute: (v) => lighten(v, 12) },
  { key: '--bg-selected', label: 'Selected', compute: (v) => lighten(v, 18) },
  { key: '--bg-odd-row', label: 'Odd row', compute: (v) => lighten(v, 5) },
  { key: '--bg-player-hover', label: 'Player hover', compute: (v) => lighten(v, 3) },
  { key: '--scrollbar-thumb', label: 'Scrollbar thumb', compute: (v) => lighten(v, 25) },
  { key: '--scrollbar-thumb-hover', label: 'Scrollbar thumb hover', compute: (v) => lighten(v, 35) },
  { key: '--scrollbar-alt', label: 'Scrollbar alt', compute: (v) => lighten(v, 40) },
];

/**
 * Given a partial theme (user-defined base colors, plus any derived
 * variables the user chose to customize), auto-generate the full set of
 * CSS variables. Anything already present in baseVars is left untouched —
 * that's what lets the editor's "customize" toggle override a derived
 * value: once it's set explicitly, this function will never overwrite it.
 */
export function expandThemeVariables(baseVars) {
  const expanded = { ...baseVars };

  for (const [baseKey, derivedList] of Object.entries(DERIVED_VAR_CONFIG)) {
    const baseVal = expanded[baseKey];
    if (!baseVal) continue;
    for (const derived of derivedList) {
      if (!expanded[derived.key]) {
        expanded[derived.key] = derived.compute(baseVal);
      }
    }
  }

  // bg-primary-rgb is a plain derived string, never user-editable as a color
  if (expanded['--bg-primary']) {
    expanded['--bg-primary-rgb'] = hexToRgbString(expanded['--bg-primary']);
  }

  return expanded;
}

/**
 * List of all CSS variable names grouped by category.
 * Category labels are used in the theme editor UI.
 */
export const VARIABLE_GROUPS = [
  {
    label: 'Backgrounds',
    vars: [
      { key: '--bg-primary', label: 'Panel background' },
      { key: '--bg-secondary', label: 'Input/list background' },
      { key: '--bg-body', label: 'Page background fallback' },
      { key: '--bg-body-color', label: 'Page background color' },
      { key: '--bg-body-image', label: 'Background image (url or none)' },
      { key: '--bg-restricted', label: 'Restricted game bg' },
      { key: '--bg-header', label: 'Header/black bg' },
    ]
  },
  {
    label: 'Buttons',
    vars: [
      { key: '--btn-primary', label: 'Primary button' },
      { key: '--btn-danger', label: 'Danger/stop button' },
      { key: '--btn-success', label: 'Success/start button' },
      { key: '--btn-cancel', label: 'Cancel button' },
      { key: '--btn-info', label: 'Info/OK button' },
      { key: '--btn-disabled', label: 'Disabled button' },
    ]
  },
  {
    label: 'Text',
    vars: [
      { key: '--text-primary', label: 'Primary text' },
      { key: '--text-secondary', label: 'Secondary text' },
      { key: '--text-link', label: 'Link text' },
      { key: '--text-admin', label: 'Admin/highlight text' },
      { key: '--text-notice', label: 'Notice text' },
      { key: '--text-muted', label: 'Muted text' },
      { key: '--text-dark', label: 'Dark text (autocomplete)' },
    ]
  },
  {
    label: 'Team Colors',
    vars: [
      { key: '--team-red', label: 'Red team' },
      { key: '--team-blue', label: 'Blue team' },
      { key: '--team-red-text', label: 'Red team text' },
      { key: '--team-blue-text', label: 'Blue team text' },
    ]
  },
  {
    label: 'Accents',
    vars: [
      { key: '--border-accent', label: 'Accent border (H1)' },
      { key: '--border-input-focus', label: 'Input focus border' },
      { key: '--separator-color', label: 'Separator' },
      { key: '--slider-thumb', label: 'Slider thumb' },
    ]
  },
  {
    label: 'Game',
    vars: [
      { key: '--game-popup-overlay', label: 'Game popup overlay' },
    ]
  },
];

/**
 * Get all variable keys from the groups (the base keys only,
 * not auto-generated hover/active variants).
 */
export function getBaseVariableKeys() {
  const keys = [];
  for (const group of VARIABLE_GROUPS) {
    for (const v of group.vars) {
      keys.push(v.key);
    }
  }
  return keys;
}
