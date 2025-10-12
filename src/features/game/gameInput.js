class GameKeysHandler {
    constructor(playerKeys, room) {
        this.keyState = 0;
        this.room = room;

        const keys = new Map();
        Object.entries(playerKeys).forEach(([action, keyList]) => {
            keyList.forEach((key) => {
                keys.set(key, action.charAt(0).toUpperCase() + action.slice(1));
            });
        });

        const keyValue = (key) => {
            switch (keys.get(key)) {
                case "Down": return 2;
                case "Kick": return 16;
                case "Left": return 4;
                case "Right": return 8;
                case "Up": return 1;
                default: return 0;
            }
        };

        this.pressKey = (key) => {
            this.keyState |= keyValue(key);
            this.room.setKeyState(this.keyState, true);
        };

        this.releaseKey = (key) => {
            this.keyState &= ~keyValue(key);
            this.room.setKeyState(this.keyState, true);
        };

        this.reset = () => {
            if (this.keyState === 0) return;
            this.keyState = 0;
            this.room.setKeyState(0, true);
        };
    }
};

export default function setGameInputs(room, roomView, chatApi, keys, canvas, chatInput) {
    const gameKeysHandler = new GameKeysHandler(keys, room);

    const handleKeyDown = (e) => {
        switch (e.code) {
            case 'Tab':
            case 'Enter':
            case 'NumpadEnter':
                chatApi.focusOnChat();
                e.preventDefault();
                break;
            case 'Escape':
                if (document.activeElement !== chatInput) roomView();
                canvas.focus();
                break;
            default:
                if (document.activeElement == chatInput) return;
                gameKeysHandler.pressKey(e.code);
        }
    };

    const handleKeyUp = (e) => {
        gameKeysHandler.releaseKey(e.code);
    };

    const handleBlur = () => {
        gameKeysHandler.reset();
    };

    const handleWheel = (event) => {
        room._onWheel(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("blur", handleBlur);
    canvas.addEventListener("wheel", handleWheel);
    setTimeout(()=>canvas.focus())
    return {
        kill: () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            canvas.removeEventListener("blur", handleBlur);
            canvas.removeEventListener("wheel", handleWheel);
            gameKeysHandler.reset();
        }
    };
}
