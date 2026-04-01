# node-haxball-client

A custom desktop client for [HaxBall](https://www.haxball.com/) built with React, Vite, and NW.js. It uses the [node-haxball](https://github.com/wxyz-abcd/node-haxball) library and provides a fully featured UI with extended capabilities beyond the original web client.

## Features

- **Custom Resolution Support** — Set any resolution, including native monitor resolutions and custom sizes
- **Fullscreen with Resolution Override** — Change your monitor's display resolution while in fullscreen mode
- **Unlocked FPS** — Bypass browser frame rate limits
- **Theming System** — Choose from 3 built-in themes (Classic, Midnight, Emerald) or create your own with a visual editor
- **Theme Import/Export** — Share custom themes as JSON files
- **Multi-language Support** — Localization system with language loaders
- **High-Performance Rendering (WebGPU)** — 
The client includes a custom PIXI.js renderer that supports both WebGL and the newer **WebGPU** API. WebGPU can offer significantly better performance and lower CPU usage on supported hardware.

## Installation

1. Go to the [Releases](https://github.com/wxyz-abcd/node-haxball-client/releases) page.
2. Download the latest `.zip` file for your platform (Windows or Linux).
3. Extract the contents to a folder.
4. Run `node-haxball-client.exe` (Windows) or `node-haxball-client` (Linux).

## Development

If you want to contribute or build from source:

### Prerequisites

- **Node.js** >= 18.x (recommended: 22.x)
- **npm** >= 9.x
- **Windows** 7 SP1+ (required for display resolution switching)
- **PowerShell** (used for display management on Windows)

### Setup

```bash
# Clone the repository
git clone https://github.com/wxyz-abcd/node-haxball-client.git
cd node-haxball-client

# Install dependencies
npm install

# Start development server
npm run dev
```

The development environment uses **Vite** with HMR at `http://localhost:5173` and **NW.js** as the desktop shell.

## Building

### Preview build (local testing)

```bash
npm run preview
```

Builds the Vite production bundle, then opens it in NW.js locally.

### Distribution builds

```bash
# Windows
npm run dist:win

# Linux
npm run dist:linux

# Both platforms
npm run dist:all
```

Output goes to `../node-haxball-client-out/win` or `../node-haxball-client-out/linux`.

### Zipped releases

```bash
# Windows (builds + zips)
npm run zip:win

# Linux (builds + zips)
npm run zip:linux
```

Creates a `.zip` archive in `../node-haxball-client-out/`.

## Project Structure

```
node-haxball-client/
├── main.js                    # NW.js entry point (loads API, opens window)
├── index.html                 # HTML shell
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies, scripts, NW.js config
├── resolutions.json           # Custom display resolutions (user-editable)
│
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Router & main app component
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── game.css       # Main stylesheet (CSS variables for theming)
│   │   │   ├── fontello.css   # Icon font
│   │   │   └── flags.css      # Country flag sprites
│   │   ├── font/              # Icon fonts
│   │   ├── images/            # Backgrounds, sprites, icons
│   │   └── sounds/            # Game sound effects
│   │
│   ├── components/            # Reusable UI components
│   │   ├── SettingsPopup.jsx  # Settings dialog (tabs: Sound/Video/Input/Misc/Theme)
│   │   ├── InputDialog.jsx    # Styled input prompt (replaces window.prompt)
│   │   ├── Popup.jsx          # Generic popup overlay
│   │   ├── Toggle.jsx         # Toggle switch component
│   │   ├── SliderOption.jsx   # Slider setting component
│   │   ├── SelectOption.jsx   # Dropdown setting component
│   │   ├── NumericInput.jsx   # Numeric input with +/- buttons
│   │   └── settingsTabs/      # Settings tab content
│   │       ├── SoundContent.jsx
│   │       ├── VideoContent.jsx
│   │       ├── InputContent.jsx
│   │       ├── MiscContent.jsx
│   │       └── ThemeContent.jsx
│   │
│   ├── features/
│   │   ├── game/              # In-game components
│   │   │   ├── Game.jsx       # Main game container
│   │   │   ├── renderer.js    # PIXI.js game renderer
│   │   │   ├── gameInput.js   # Keyboard input handler
│   │   │   └── components/    # Game UI (ChatBox, GameCanvas, GameStateGUI)
│   │   ├── rooms/             # Room management
│   │   │   ├── RoomList.jsx   # Room browser + hidden room join
│   │   │   ├── JoinRoom.jsx   # Connection flow + password retry
│   │   │   ├── CreateRoom.jsx # Room creation
│   │   │   ├── CreateSandbox.jsx
│   │   │   └── Headless.jsx   # Headless room mode
│   │   └── player-data/       # Player name/avatar entry
│   │
│   ├── hooks/                 # React hooks
│   │   ├── PlayerDataProvider.jsx  # Player data context (localStorage)
│   │   ├── PlayerDataDefaultValues.js
│   │   ├── usePlayerData.jsx
│   │   ├── useLocalStorageState.js
│   │   ├── useRoomJoin.jsx    # Room connection logic
│   │   ├── useRoomCreate.jsx
│   │   └── useWindowSettings.js  # Resolution & fullscreen management
│   │
│   ├── themes/                # Theme system
│   │   ├── themes.js          # Built-in theme definitions (Classic, Midnight, Emerald)
│   │   ├── ThemeContext.jsx   # Theme provider + file-based persistence
│   │   ├── ThemeInitializer.jsx  # Bridge between PlayerData and ThemeProvider
│   │   └── themeUtils.js      # Color manipulation (lighten/darken/expand)
│   │
│   └── utils/
│       ├── screenResolution.js  # Windows display resolution via PowerShell/P-Invoke
│       └── languageLoaders.js   # Dynamic language loading
│
└── themes/                    # Custom theme files (auto-created at runtime)
    └── *.json                 # Saved custom themes
```

## Configuration Files

### `resolutions.json`

Add custom display resolutions that appear in **Settings → Video → Resolution**:

```json
[
  { "label": "720p", "value": "1280x720" },
  { "label": "Ultrawide", "value": "3440x1440" }
]
```

The system also auto-detects your monitor's supported resolutions on Windows.

### Custom Themes

Theme files are stored as JSON in the `themes/` directory next to the executable (or project root in dev mode). They can be created via **Settings → Theme → Create New**, or manually:

```json
{
  "id": "my_theme",
  "name": "My Theme",
  "variables": {
    "--bg-primary": "#1a2125",
    "--btn-primary": "#244967",
    "--text-primary": "#ffffff"
  }
}
```

See `src/themes/themes.js` for the full list of available CSS variables.

## Contributing

### Branch Structure

- **`main`** — Stable releases
- **`development`** — Active development branch

### How to Contribute

1. **Fork** the repository
2. **Create a feature branch** from `development`:
   ```bash
   git checkout development
   git checkout -b feature/my-feature
   ```
3. **Make your changes** and test them with `npm run dev`
4. **Commit** with a descriptive message:
   ```bash
   git add .
   git commit -m "Add: description of your feature"
   ```
5. **Push** your branch and open a **Pull Request** against `development`

### Guidelines

- Test your changes by running `npm run dev` and verifying the UI works correctly
- If modifying `game.css`, use CSS custom properties (`var(--variable-name)`) for any colors to maintain theme compatibility
- Follow existing patterns for new components (see `src/components/` for examples)
- New settings should be added to `PlayerDataDefaultValues.js` with a sensible default
- Keep commits focused — one feature/fix per commit when possible

### Adding New Theme Variables

If you add new CSS colors to `game.css`:
1. Add the variable to the `:root` block at the top of `game.css`
2. Use `var(--your-variable)` in the CSS rule instead of a hardcoded color
3. Add the default value to all built-in themes in `src/themes/themes.js`
4. Optionally add it to `VARIABLE_GROUPS` in `src/themes/themeUtils.js` to make it editable in the theme editor

## Tech Stack

| Technology | Purpose |
|---|---|
| [NW.js](https://nwjs.io/) | Desktop runtime (Chromium + Node.js) |
| [Vite](https://vite.dev/) | Build tool & dev server with HMR |
| [React 19](https://react.dev/) | UI framework |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [node-haxball](https://github.com/nickreserved/node-haxball) | HaxBall backend API |
| [PIXI.js](https://pixijs.com/) | Game rendering (via node-haxball) |
| [@koush/wrtc](https://github.com/nickreserved/node-webrtc) | WebRTC for peer connections |
| [perfect-scrollbar](https://github.com/mdbootstrap/perfect-scrollbar) | Custom scrollbars |

## License

[MIT](LICENSE)
