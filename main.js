/* eslint-disable no-undef */
const { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } = require("@koush/wrtc");
const path = require("path");

const API = require("node-haxball")({
      RTCPeerConnection: RTCPeerConnection, 
      RTCIceCandidate: RTCIceCandidate, 
      RTCSessionDescription: RTCSessionDescription, 
});

const isDev = nw.App.argv[0] === "development";
const openPath = isDev
  ? "http://localhost:5173"
  : path.join("file:///",__dirname, "dist/index.html");
nw.Window.open(openPath, {}, function(win) {
    win.window.API = API;
});