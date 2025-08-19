import { useEffect, useRef } from "react";

export default function Recaptcha({ onSuccess }) {
  const wvRef = useRef(null);
  const webviewScriptJS = () => `
  function receiveMessage(event) {
    // handshake is going to be fired when content loads, so we use that to send the token back again to the main world
    appWindow = event.source;
    appOrigin = event.origin;
    const pre = document.querySelector("pre");
    if (!pre) return;
    const token = pre.innerText.slice(17, -1);
    sendMessage(token);
  };
  function sendMessage (message) {
    if (appWindow && appOrigin) {
      appWindow.postMessage(message, appOrigin);
    }
  }
  window.addEventListener("message", receiveMessage);
  `;

  useEffect(() => {
    const webview = wvRef.current || document.querySelector("webview");
    if (!webview) {
      console.warn("webview element not found on mount");
      return;
    }

    webview.addEventListener("contentload", () => {
      webview.executeScript({
        code: webviewScriptJS()
      });
      webview.contentWindow.postMessage('handshake', '*');
      window.addEventListener("message", function (event) {
        if (event.data) {
          // receiving token from webview message
          const token = event.data;
          onSuccess(token)
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <webview
        ref={wvRef}
        src="https://www.haxball.com/headlesstoken"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
