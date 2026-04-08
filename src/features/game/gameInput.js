class GameKeysHandler {
    constructor(playerKeys, room) {
        this.keyState = room.getKeyState?.() ?? 0;
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

        this.queueKeyState = (nextKeyState) => {
            if (nextKeyState === this.keyState && !this.room._hasPendingKeyState) return;
            this.keyState = nextKeyState;
            this.room._queuePendingKeyState?.(nextKeyState);
        };

        this.pressKey = (key) => {
            const value = keyValue(key);
            if (!value) return;
            this.queueKeyState(this.keyState | value);
        };

        this.releaseKey = (key) => {
            const value = keyValue(key);
            if (!value) return;
            this.queueKeyState(this.keyState & ~value);
        };

        this.reset = () => {
            if (this.keyState === 0) return;
            this.queueKeyState(0);
        };
    }
};

export default function setGameInputs(room, roomView, chatApi, keys, canvas, chatInput) {
    room._pendingKeyState = room.getKeyState?.() ?? 0;
    room._hasPendingKeyState = false;
    room._queuePendingKeyState = (state) => {
        room._pendingKeyState = state;
        room._hasPendingKeyState = true;
        room.renderer?.requestImmediateRender?.();
    };
    room._flushPendingKeyState = () => {
        if (!room._hasPendingKeyState) return false;
        room.setKeyState(room._pendingKeyState, true);
        room._hasPendingKeyState = false;
        return true;
    };

    const gameKeysHandler = new GameKeysHandler(keys, room);

    const handleKeyDown = (e) => {
        room._lastInputTime = performance.now();
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
        room._lastInputTime = performance.now();
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
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setTimeout(()=>canvas.focus());
    }
    return {
        kill: () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            canvas.removeEventListener("blur", handleBlur);
            canvas.removeEventListener("wheel", handleWheel);
            gameKeysHandler.reset();
            room._flushPendingKeyState?.();
            delete room._pendingKeyState;
            delete room._hasPendingKeyState;
            delete room._queuePendingKeyState;
            delete room._flushPendingKeyState;
        }
    };
}
