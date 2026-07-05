import React, { useEffect, useRef, useState } from 'react'

const MIN_CHAT_HEIGHT = 33;
const MAX_CHAT_HEIGHT = 400;

export default React.memo(function ChatBox({
  chatRows,
  onChatSubmit,
  chatInputRef,
  height,
  setPlayerField,
  roomRef,
  player
}) {
  const [inputValue, setInputValue] = useState("");
  const [chatHeight, setChatHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const playerRef = useRef(player);
  const setPlayerFieldRef = useRef(setPlayerField);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    setPlayerFieldRef.current = setPlayerField;
  }, [setPlayerField]);

  useEffect(() => {
    setChatHeight(height);
  }, [height]);

  useEffect(() => {
    if (!isResizing) return undefined;

    const handlePointerMove = (event) => {
      const nextHeight = Math.min(
        Math.max(startHeightRef.current + startYRef.current - event.clientY, MIN_CHAT_HEIGHT),
        MAX_CHAT_HEIGHT
      );
      setChatHeight(nextHeight);
    };

    const handlePointerUp = (event) => {
      const nextHeight = Math.min(
        Math.max(startHeightRef.current + startYRef.current - event.clientY, MIN_CHAT_HEIGHT),
        MAX_CHAT_HEIGHT
      );
      setChatHeight(nextHeight);
      setPlayerFieldRef.current("chat", { ...playerRef.current.chat, height: nextHeight });
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const inputKeyDown = (e) => {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      onChatSubmit(inputValue);
      setInputValue("");
    }
  };

  const resizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const currentHeight = typeof chatHeight === "number"
      ? chatHeight
      : parseInt(chatHeight, 10) || MIN_CHAT_HEIGHT;

    startYRef.current = event.clientY;
    startHeightRef.current = currentHeight;
    setIsResizing(true);
    document.body.style.cursor = "n-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className={`chatbox-view${isResizing ? " dragging" : ""}`} style={{ height: `${chatHeight}px` }}>
      <div tabIndex={-1} className="chatbox-view-contents">
        <div data-hook="drag" className="drag" onPointerDown={resizeStart}></div>
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
    </div>
  );
});
