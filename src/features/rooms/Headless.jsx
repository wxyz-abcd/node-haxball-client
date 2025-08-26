export default function Headless() {
  function loadJSFiles(event){
    try{
      for (var file of event.target.files){
        var reader = new FileReader();
        reader.onload = function() {
          eval(reader.result);
        };
        reader.readAsText(file);
      }
    } catch(ex){
      console.error(ex);
    } finally{
      document.getElementsByTagName("input")[0].value = null;
    }
  }
  return (
    <>
      <h2>node-haxball Headless Client</h2>
      <p>This is a testing platform for the open source project "node-haxball".</p>
      <p>Documentation <a href="https://github.com/wxyz-abcd/node-haxball">here</a>.</p>
      <p>Use the exposed API object here, like this:</p>
      <code>
        {"const { OperationType, VariableType, ConnectionState, AllowFlags, Direction, CollisionFlags, CameraFollow, BackgroundType, GamePlayState, Callback, Utils, Room, Replay, Query, Library, RoomConfig, Plugin, Renderer, Errors, Language, Impl } = window.API;"}
      </code>
      <p>
        You might select or drag javascript files here to execute:
        <input type="file" accept="application/javascript" multiple name="files[]" onChange={loadJSFiles}></input>
      </p>
    </>
  )
}
