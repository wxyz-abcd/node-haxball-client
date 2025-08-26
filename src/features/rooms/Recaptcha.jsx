import { useEffect, useRef } from "react";

export default function Recaptcha({ onSuccess }) {
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
        console.log("interval");
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
            console.log("error:", ex2);
            //reset();
          }
        }
      }, 5);
    }
    function fOnCompleted(details) {
      if (details.statusCode!=200){
        console.log("error:", details);
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
    <div style={{ width: "100%", height: "calc(98vh - 40px)" }}>
      <iframe ref={ifRef} src="https://www.haxball.com/headlesstoken" /*nwdisable nwfaketop*/ style={{width: "100%", height: "100%", top: "-4em", visibility: "hidden", position: "absolute"}} onLoad={()=>{
        try{
          ifRef.current.contentDocument.body.children[1].children[1].remove() // <br/>
          ifRef.current.contentDocument.body.children[1].children[1].style.visibility = "hidden"; // submit button
          ifRef.current.style.visibility = "visible";
          cbRef.current = ifRef.current.contentDocument.getElementsByClassName("g-recaptcha")[0].getElementsByTagName("iframe")[0].contentDocument.getElementsByClassName("recaptcha-checkbox")[0];
          var int;
          int = setInterval(()=>{
            if (cbRef.current.classList.contains("recaptcha-checkbox-checked")){
              clearInterval(int);
              setTimeout(()=>{
                ifRef.current.contentDocument.body.children[1].children[1].click();
              }, 100)
            }
          }, 100);
        }catch(e){}
      }}></iframe>
      {/*<webview
        ref={wvRef}
        src="https://www.haxball.com/headlesstoken"
        style={{ width: "100%", height: "100%" }}
      />*/}
    </div>
  );
}
