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
 * Given a partial theme (user-defined base colors), auto-generate the full
 * set of CSS variables including hover/active variants.
 * 
 * The user only needs to define the base colors; hover = lighten(15%),
 * active = darken(15%) are computed automatically.
 */
export function expandThemeVariables(baseVars) {
  const expanded = { ...baseVars };

  // Auto-generate hover/active for button families
  const buttonFamilies = ['btn-primary', 'btn-danger', 'btn-success', 'btn-cancel', 'btn-info'];
  for (const family of buttonFamilies) {
    const key = `--${family}`;
    if (expanded[key] && !expanded[`${key}-hover`]) {
      expanded[`${key}-hover`] = lighten(expanded[key], 15);
    }
    if (expanded[key] && !expanded[`${key}-active`]) {
      expanded[`${key}-active`] = darken(expanded[key], 15);
    }
  }

  // Auto-generate bg-hover and bg-selected from bg-primary if not set
  if (expanded['--bg-primary'] && !expanded['--bg-hover']) {
    expanded['--bg-hover'] = lighten(expanded['--bg-primary'], 12);
  }
  if (expanded['--bg-primary'] && !expanded['--bg-selected']) {
    expanded['--bg-selected'] = lighten(expanded['--bg-primary'], 18);
  }
  if (expanded['--bg-primary'] && !expanded['--bg-odd-row']) {
    expanded['--bg-odd-row'] = lighten(expanded['--bg-primary'], 5);
  }
  if (expanded['--bg-primary'] && !expanded['--bg-player-hover']) {
    expanded['--bg-player-hover'] = lighten(expanded['--bg-primary'], 3);
  }

  // Auto-generate bg-primary-rgb from bg-primary
  if (expanded['--bg-primary']) {
    expanded['--bg-primary-rgb'] = hexToRgbString(expanded['--bg-primary']);
  }

  // Auto-generate scrollbar colors from bg-primary
  if (expanded['--bg-primary'] && !expanded['--scrollbar-thumb']) {
    expanded['--scrollbar-thumb'] = lighten(expanded['--bg-primary'], 25);
  }
  if (expanded['--bg-primary'] && !expanded['--scrollbar-thumb-hover']) {
    expanded['--scrollbar-thumb-hover'] = lighten(expanded['--bg-primary'], 35);
  }
  if (expanded['--bg-primary'] && !expanded['--scrollbar-alt']) {
    expanded['--scrollbar-alt'] = lighten(expanded['--bg-primary'], 40);
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
