import { useEffect, useRef } from "react";

export default function Recaptcha({ onSuccess, roomData }) {
  //const wvRef = useRef(null);
  const ifRef = useRef(null), cbRef = useRef(null);
  /*const webviewScriptJS = () => `
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
  */
  useEffect(()=>{
    var observerInterval;
    function observeChanges(){
      observerInterval = setInterval(()=>{
        if (!ifRef.current.contentWindow.document.body.getElementsByTagName("form")[0]){
          clearInterval(observerInterval);
          try{
            var x = ifRef.current.contentWindow.document.body.children[0], a = x.innerText/*, t*/;
            try{
              a = JSON.parse(a).data.token;
              //t = "Client"
            }
            catch(ex){
              a = a.substring(a.indexOf('"')+1, a.lastIndexOf('"'));
              //t = "Host"
            }
            //x.innerHTML = "<div><label>" + t + " Token:</label><input type='text' value='" + a + "' size='"+(a.length+3)+"'/></div>";
            chrome.webRequest.onCompleted.removeListener(fOnCompleted, {urls: ["https://www.haxball.com/rs/api/*"]});
            chrome.webRequest.handlerBehaviorChanged();
            onSuccess(a); // success
          }
          catch(ex2){
            chrome.webRequest.onCompleted.removeListener(fOnCompleted, {urls: ["https://www.haxball.com/rs/api/*"]});
            chrome.webRequest.handlerBehaviorChanged();
            //reset();
          }
        }
      }, 5);
    }
    function fOnCompleted(details) {
      if (details.statusCode!=200){
        //reset();
        return;
      }
      //bToggleMode.setAttribute("disabled", true);
      observeChanges();
    };
    chrome.webRequest.onCompleted.addListener(fOnCompleted, {urls: ["https://www.haxball.com/rs/api/*"]});
    chrome.webRequest.handlerBehaviorChanged();
    return ()=>{
      chrome.webRequest.onCompleted.removeListener(fOnCompleted);
      chrome.webRequest.handlerBehaviorChanged();
      clearInterval(observerInterval);
    };
  }, []);
  useEffect(()=>{
    ifRef.current.setAttribute("nwdisable", true);
    ifRef.current.setAttribute("nwfaketop", true);
  }, []);
  return (
      <iframe style={{visibility: 'hidden', width: '100%', height: '100%'}} ref={ifRef} src="https://www.haxball.com/headlesstoken" /*nwdisable nwfaketop*/ onLoad={()=>{
        try{
          const doc = ifRef.current.contentDocument;
          const win = ifRef.current.contentWindow;

          const response = doc.querySelector('input[name="cf-turnstile-response"]');
          const form = doc.querySelector("form");

          if (roomData) {
            form.action = "https://www.haxball.com/rs/api/client";
            response.name = "rcr";
            let input = form.querySelector('input[name="room"]');

            if (!input) {
              input = document.createElement("input");
              input.type = "hidden";
              input.name = "room";
              form.appendChild(input);
            }
            input.value = roomData.roomId;
          }

          doc.body.style.margin = 0;
          doc.documentElement.style.overflow = 'hidden';

          const br = form.querySelector("br");
          if (br) br.remove();

          const submitButton = doc.getElementById("submit");
          submitButton.style.visibility = "hidden";

          const h1 = doc.querySelector("h1");
          if (h1) h1.remove();

          form.style.position = 'relative';
          form.style.height = '100%';

          const turnstileWidget = doc.querySelector('.cf-turnstile');
          /*turnstileWidget.style.position = 'absolute';
          turnstileWidget.style.left = '50%';
          turnstileWidget.style.top = '50%';
          turnstileWidget.style.transform = 'translate(-50%, -50%)';*/

          ifRef.current.style.overflow = 'hidden';
          ifRef.current.style.visibility = "visible";

          const originalOnSuccess = win.onSuccess;
          win.onSuccess = (token) => {
            if (typeof originalOnSuccess === "function") {
              try { originalOnSuccess(token); } catch (e) {}
            }
            setTimeout(() => {
              submitButton.click();
            }, 100);
          };

          var int;
          int = setInterval(()=>{
            if (response && response.value && response.value.length > 0){
              clearInterval(int);
              setTimeout(()=>{
                submitButton.click();
              }, 100)
            }
          }, 100);
        }catch(e){}
      }}></iframe>
  );
}
