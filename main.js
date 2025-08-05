const API = require("node-haxball")();
nw.Window.open('dist/index.html', {}, function(win) {
    win.window.API = API;
});