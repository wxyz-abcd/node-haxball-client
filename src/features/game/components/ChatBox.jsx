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

  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTrigger, setMentionTrigger] = useState("@");
  const mentionAtPosRef = useRef(-1);
  const mentionItemRefs = useRef([]);

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

  useEffect(() => {
    if (!mentionOpen) return;
    const el = mentionItemRefs.current[mentionIndex];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [mentionIndex, mentionOpen]);

  const closeMention = () => {
    setMentionOpen(false);
    setMentionQuery("");
    setMentionIndex(0);
    mentionAtPosRef.current = -1;
  };

  const updateMentionState = (value, cursorPos) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const hashIndex = textBeforeCursor.lastIndexOf("#");
    const triggerIndex = Math.max(atIndex, hashIndex);

    if (triggerIndex === -1) {
      closeMention();
      return;
    }

    const trigger = textBeforeCursor[triggerIndex];
    const query = textBeforeCursor.slice(triggerIndex + 1);

    if (/\s/.test(query)) {
      closeMention();
      return;
    }

    mentionAtPosRef.current = triggerIndex;
    setMentionTrigger(trigger);
    setMentionQuery(query);
    setMentionOpen(true);
    setMentionIndex(0);
  };

  const getFilteredPlayers = () => {
    const players = roomRef?.current?.players || [];
    const q = mentionQuery.toLowerCase();

    if (mentionTrigger === "#") {
      return players.filter((p) => p && (p.id != null && String(p.id).toLowerCase().startsWith(q)) || p.name && p.name.toLowerCase().startsWith(q));
    }

    return players.filter((p) => p && p.name && p.name.toLowerCase().startsWith(q));
  };

  const selectMention = (selectedPlayer) => {
    if (!selectedPlayer) return;

    const atPos = mentionAtPosRef.current;
    if (atPos === -1) return;

    const before = inputValue.slice(0, atPos);
    const after = inputValue.slice(atPos + 1 + mentionQuery.length);

    let insertion = '';
    if (mentionTrigger == "#") {
      insertion = `#${selectedPlayer.id} `;
    } else {
      insertion = `@${selectedPlayer.name.replaceAll(' ', '_')} `;
    }

    const newValue = `${before}${insertion}${after}`;
    const newCursorPos = before.length + insertion.length;

    setInputValue(newValue);
    closeMention();

    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    updateMentionState(value, e.target.selectionStart);
  };

  const inputKeyDown = (e) => {
    if (mentionOpen) {
      const filteredPlayers = getFilteredPlayers();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filteredPlayers.length > 0) {
          setMentionIndex((i) => (i + 1) % filteredPlayers.length);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredPlayers.length > 0) {
          setMentionIndex((i) => (i - 1 + filteredPlayers.length) % filteredPlayers.length);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        closeMention();
        return;
      }

      if (e.code === "Tab" || e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        if (filteredPlayers.length > 0) {
          selectMention(filteredPlayers[mentionIndex]);
        } else {
          closeMention();
        }
        return;
      }
    }

    if (e.code === "Enter" || e.code === "NumpadEnter") {
      onChatSubmit(inputValue);
      setInputValue("");
      closeMention();
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

  const filteredPlayers = mentionOpen ? getFilteredPlayers() : [];
  const showMentionBox = mentionOpen && filteredPlayers.length > 0;
  mentionItemRefs.current = [];

  return (
    <div className={`chatbox-view${isResizing ? " dragging" : ""}`} style={{ height: `${chatHeight}px` }}>
      <div tabIndex={-1} className="chatbox-view-contents">
        <div className="autocompletebox" data-hook="autocompletebox" hidden={!showMentionBox}>
          {filteredPlayers.map((p, idx) => (
            <div
              key={p.name}
              ref={(el) => { mentionItemRefs.current[idx] = el; }}
              data-hook="autocomplete-item"
              className={`autocomplete-item${idx === mentionIndex ? " selected" : ""}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setMentionIndex(idx)}
              onClick={() => selectMention(p)}
            >
              {mentionTrigger === "#" ? `(${p.id}) ${p.name}` : p.name}
            </div>
          ))}
        </div>
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
            onChange={handleInputChange}
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
