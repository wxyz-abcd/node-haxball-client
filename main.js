/* eslint-disable no-undef */
const WebSocket = require("ws");

const isDev = nw.App.argv.includes("development");
const openPath = isDev
  ? "http://localhost:5173"
  : "dist/index.html";
nw.Window.open(openPath, {}, function(win) {
    const w = win.window;
    const API = require("node-haxball")({
        RTCPeerConnection: w.RTCPeerConnection,
        RTCIceCandidate: w.RTCIceCandidate,
        RTCSessionDescription: w.RTCSessionDescription,
        fetch: w.fetch.bind(w),
        WebSocket: WebSocket,
        crypto: w.crypto,
        setTimeout: w.setTimeout.bind(w),
        clearTimeout: w.clearTimeout.bind(w),
        setInterval: w.setInterval.bind(w),
        clearInterval: w.clearInterval.bind(w),
        requestAnimationFrame: w.requestAnimationFrame.bind(w),
        cancelAnimationFrame: w.cancelAnimationFrame.bind(w),
        performance: w.performance,
        console: w.console,
    });
    w.API = API;
});