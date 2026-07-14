class GameKeysHandler {
    constructor(playerKeys, room, chatInput) {
        this.keyState = room.getKeyState?.() ?? 0;
        this.room = room;
        this.keys = new Map();
        this.setKeys(playerKeys);
        this.chatInput = chatInput;

        const keyValue = (key) => {
            switch (this.keys.get(key)) {
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
            if (!value) return false;
            if (document.activeElement == chatInput) return;
            this.queueKeyState(this.keyState | value);
            return true;
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
        this.keyValue = keyValue;
    }
    setKeys(playerKeys) {
        this.keys.clear();
        Object.entries(playerKeys).forEach(([action, keyList]) => {
            keyList.forEach((key) => {
                this.keys.set(key, action.charAt(0).toUpperCase() + action.slice(1));
            });
        });
    }
};

export default function setGameInputs(room, roomView, chatApi, keys, canvas, chatInput, setPlayerField, getPlayerField, rendererObj) {
    room._pendingKeyState = room.getKeyState?.() ?? 0;
    room._hasPendingKeyState = false;
    room._queuePendingKeyState = (state) => {
        room._pendingKeyState = state;
        room._hasPendingKeyState = true;
        //room.renderer?.requestImmediateRender?.();
    };
    room._flushPendingKeyState = () => {
        if (!room._hasPendingKeyState) return false;
        room.setKeyState(room._pendingKeyState, true);
        room._hasPendingKeyState = false;
        return true;
    };

    const zoomValues = {
        1: 1.0,
        2: 1.25,
        3: 1.5,
        4: 1.75,
        5: 2,
        6: 2.25,
        7: 2.50
    }

    const gameKeysHandler = new GameKeysHandler(keys, room, chatInput);

    const handleKeyDown = (e) => {
        room._lastInputTime = performance.now();
        if (gameKeysHandler.pressKey(e.code)) return;
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
            case "Digit1":
            case "Digit2":
            case "Digit3":
            case "Digit4":
            case "Digit5":
            case "Digit6":
            case "Digit7":
                if (document.activeElement == chatInput) return;
                var zoomCoeff = room.renderer.setZoom(
                    canvas.width / 2,
                    canvas.height / 2,
                    zoomValues[Number(e.code.at(-1))]
                );
                var playerRenderer = getPlayerField("renderer")
                setPlayerField("renderer", { ...playerRenderer, ["zoomCoeff"]: zoomCoeff });
                break;
        }
    };

    const handleKeyUp = (e) => {
        room._lastInputTime = performance.now();
        gameKeysHandler.releaseKey(e.code);
    };

    const handleMouseDown = (e) => {
        room._lastInputTime = performance.now();
        if (document.activeElement === chatInput) return;
        gameKeysHandler.pressKey(`Mouse${e.button}`);
    };

    const handleMouseUp = (e) => {
        room._lastInputTime = performance.now();
        gameKeysHandler.releaseKey(`Mouse${e.button}`);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    const handleBlur = () => {
        gameKeysHandler.reset();
    };

    const handleWheel = (event) => {
        const zoomCoeff = rendererObj.onWheel(event);
        const playerRenderer = getPlayerField("renderer")
        setPlayerField("renderer", { ...playerRenderer, "zoomCoeff": zoomCoeff });
        canvas.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);
    canvas.addEventListener("blur", handleBlur);
    canvas.addEventListener("wheel", handleWheel);
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setTimeout(()=>canvas.focus());
    }
    return {
        kill: () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("contextmenu", handleContextMenu);
            canvas.removeEventListener("blur", handleBlur);
            canvas.removeEventListener("wheel", handleWheel);
            gameKeysHandler.reset();
            room._flushPendingKeyState?.();
            delete room._pendingKeyState;
            delete room._hasPendingKeyState;
            delete room._queuePendingKeyState;
            delete room._flushPendingKeyState;
        },
        setKeys: (newKeys) => gameKeysHandler.setKeys(newKeys),
    };
}
