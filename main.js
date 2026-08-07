/* eslint-disable no-undef */
const WebSocket = require("ws");
const initAPI = require("node-haxball");
const Updater = require("./updater/updater.js").default || require("./updater/updater.js");

const isDev = nw.App.argv.includes("development");
const openPath = isDev ? "http://localhost:5173" : "dist/index.html";

const UPDATE_INSTALL_FLAG = "--update-install=";
const updateInstallArg = nw.App.argv.find((a) => a.startsWith(UPDATE_INSTALL_FLAG));

if (isDev) {
  const e = document.createElement('script');
  e.src = 'http://localhost:8097';
  document.head.appendChild(e);
}

function openMainWindow() {
  nw.Window.open(openPath, {}, function(win) {
    const w = win.window;
    const API = initAPI({
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
    API.Impl.Core.Team.blue.name = "Blue";
    API.Impl.Core.Team.red.name = "Red";
    API.Impl.Core.Team.spec.name = "Spectators";
  });
}

function showUpdatePrompt(remoteManifest) {
  nw.Window.open("updater/update-prompt.html", {
    width: 440,
    height: 200,
    resizable: false,
    show: true,
    position: 'center'
  }, function (promptWin) {
    promptWin.on('loaded', () => {
      promptWin.window.onAccept = function () {
        showUpdateProgress(remoteManifest);
        promptWin.close();
      };
      promptWin.window.onDecline = function () {
        openMainWindow();
        promptWin.close();
      };
      promptWin.window.setVersionInfo(nw.App.manifest.version, remoteManifest.version);
    })
  });
}

function showUpdateProgress(remoteManifest) {
  nw.Window.open("updater/update-progress.html", {
    width: 440,
    height: 170,
    resizable: false,
    frame: true,
    position: 'center'
  }, async function (progressWin) {
    progressWin.on('loaded', async function () {
      const w = progressWin.window;
      let downloading = true;
      try {
        w.setStatus("Downloading update...");
        const filePath = await updater.download(remoteManifest, (percent) => {
          if (downloading) w.setProgress(percent);
        });

        downloading = false;
        w.setStatus("Extracting update...");
        const newExecPath = await new Promise((resolve, reject) => {
          updater.unpack(filePath, (err, execPath) => err ? reject(err) : resolve(execPath), remoteManifest);
        });

        w.setStatus("Installing update...");

        const installTargetPath = updater.getAppPath();
        updater.run(newExecPath, [`--update-install=${installTargetPath}`], {}, (runErr) => {
          if (runErr) {
            w.setError(`Could not launch update: ${runErr.message}`);
            return;
          }
          nw.App.quit();
        });

      } catch (err) {
        w.setError(`Update failed: ${err.message}`);
      }
    })
  });
}

const updater = new Updater(nw.App.manifest);

if (updateInstallArg) {
  const targetPath = updateInstallArg.slice(UPDATE_INSTALL_FLAG.length);

  updater.install(targetPath, (installErr) => {
    if (installErr) {
      console.error("Error installing update:", installErr.message);
      openMainWindow();
      return;
    }

    const installedExecPath = updater.getAppExecAt(targetPath);
    updater.run(installedExecPath, [], {}, (runErr) => {
      if (runErr) {
        console.error("Could not relaunch installed app:", runErr.message);
        openMainWindow();
        return;
      }
      nw.App.quit();
    });
  });
} else {
  updater.checkNewVersion((err, newerVersionExists, remoteManifest) => {
    if (err) {
      console.error("Error checking for updates:", err.message);
      openMainWindow();
      return;
    }
    if (newerVersionExists) {
      console.log(remoteManifest);
      showUpdatePrompt(remoteManifest);
    } else {
      openMainWindow();
    }
  });
}