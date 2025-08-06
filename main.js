const API = require("node-haxball")();

const isDev = nw.App.argv[0] === "development";
const openPath = isDev ? 'http://localhost:5173' : 'dist/index.html';

nw.Window.open(openPath, {}, function(win) {
    win.window.API = API;
});