import { Resizable } from "re-resizable";
import React from 'react'
export default React.memo(function ChatBox({
  chatRows,
  inputValue,
  setInputValue,
  inputKeyDown,
  chatInputRef,
  height,
  setPlayerField,
  roomRef,
  player
}) {
  const resizeStop = (event, from, element) => {
    setPlayerField("chat", {...player.chat, height: parseInt(element.style.height, 10) });
  };
  return (
    <Resizable
      defaultSize={{
        height: height,
      }}
      minHeight={"33px"}
      maxHeight={"400px"}
      enable={{
        top: true,
      }}
      handleComponent={{
        top: <div data-hook="drag" className="drag"></div>,
      }}
      className="chatbox-view"
      onResizeStop={resizeStop}
    >
      <div tabIndex={-1} className="chatbox-view-contents">
        <div data-hook="log" className="log subtle-thin-scrollbar">
          <div className="log-contents">
            {chatRows.map(({ type, className, content, color, font }, i) => {
              let e = {};
              if (type == 0 && className != null) e.className = className;
              else if (type == 1) {
                e.className = "announcement";
                if (color >= 0)
                  e.style = {
                    ...(e.style || {}),
                    color: window.API.Utils.numberToColor(color),
                  };
                switch (font) {
                  case 1:
                    e.style = { ...(e.style || {}), fontWeight: "bold" };
                    break;
                  case 2:
                    e.style = { ...(e.style || {}), fontStyle: "italic" };
                    break;
                  case 3:
                    e.style = { ...(e.style || {}), fontSize: "12px" };
                    break;
                  case 4:
                    e.style = {
                      ...(e.style || {}),
                      fontWeight: "bold",
                      fontSize: "12px",
                    };
                    break;
                  case 5:
                    e.style = {
                      ...(e.style || {}),
                      fontStyle: "italic",
                      fontSize: "12px",
                    };
                    break;
                }
              }
              return (
                <p key={i} className={e.className} style={e.style}>
                  {content}
                </p>
              );
            })}
          </div>
        </div>
        <div className="input">
          <input
            ref={chatInputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={inputKeyDown}
            data-hook="input"
            type="text"
            maxLength={140}
            onFocus={()=>roomRef.current.setChatIndicatorActive(true)}
            onBlur={()=>roomRef.current.setChatIndicatorActive(false)}
          />
        </div>
      </div>
    </Resizable>
  );
});
