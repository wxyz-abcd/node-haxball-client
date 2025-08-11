function GameKeysHandler() {
    this.keyState = 0;
    this.room = null;

    var keys = new Map();
    keys.set("ArrowUp", "Up");
    keys.set("KeyW", "Up");
    keys.set("ArrowDown", "Down");
    keys.set("KeyS", "Down");
    keys.set("ArrowLeft", "Left");
    keys.set("KeyA", "Left");
    keys.set("ArrowRight", "Right");
    keys.set("KeyD", "Right");
    keys.set("KeyX", "Kick");
    keys.set("Space", "Kick");
    keys.set("ControlLeft", "Kick");
    keys.set("ControlRight", "Kick");
    keys.set("ShiftLeft", "Kick");
    keys.set("ShiftRight", "Kick");
    keys.set("Numpad0", "Kick");

    var keyValue = function (key) {
        switch (keys.get(key)) {
            case "Down":
                return 2;
            case "Kick":
                return 16;
            case "Left":
                return 4;
            case "Right":
                return 8;
            case "Up":
                return 1;
            default:
                return 0;
        }
    };
    this.pressKey = (key) => {
        this.keyState |= keyValue(key);
        this.room.setKeyState(this.keyState);
    };
    this.releaseKey = (key) => {
        this.keyState &= ~keyValue(key);
        this.room.setKeyState(this.keyState);
    };
    this.reset = () => {
        if (this.keyState == 0)
            return;
        this.keyState = 0;
        this.room.setKeyState(0);
    }
};

export default function setGameInputs(room, roomView) {
    const gameKeysHandler = new GameKeysHandler();
    gameKeysHandler.room = room;
    window.addEventListener("keydown", (e) => {
        switch (e.code) {
            case 'Escape':
                roomView()
                break;
            default:
                gameKeysHandler.pressKey(e.code);
        }
    });
    window.addEventListener("keyup", (e) => {
            gameKeysHandler.releaseKey(e.code);
    });
    window.addEventListener("blur", () => {
        gameKeysHandler.reset();
    });
}