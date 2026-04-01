import { useState, useEffect, useCallback } from "react";
import Toggle from "../Toggle";
import SliderOption from "../SliderOption";
import NumericInput from "../NumericInput";
import SelectOption from "../SelectOption";
import playerDefaultValues from "../../hooks/PlayerDataDefaultValues";

import { getSupportedResolutions } from "../../utils/screenResolution";

export default function VideoContent({ player, setPlayerField, roomRef }) {
  const [playerCopy, setPlayerCopy] = useState(player);
  const [commonResolutions, setCommonResolutions] = useState([
    { label: "Native", value: "native" },
  ]);
  const [resNotification, setResNotification] = useState(null);

  // Listen for resolution change results from useWindowSettings
  useEffect(() => {
    const handler = (e) => {
      const { success, message } = e.detail;
      setResNotification({ success, message });
      // Auto-clear after 4 seconds
      setTimeout(() => setResNotification(null), 4000);
    };
    window.addEventListener('resolution-result', handler);
    return () => window.removeEventListener('resolution-result', handler);
  }, []);

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const fs = window.require("fs");
        const path = window.require("path");
        
        let isDev = false;
        try { isDev = window.nw.App.argv.includes("development"); } catch(e){}
        let processPath = "";
        try { processPath = window.process.cwd(); } catch(e){}
        
        if (!isDev) {
          try { processPath = path.dirname(window.process.execPath); } catch(e){}
        }
        
        const resPath = path.join(processPath, "resolutions.json");

        // Replace hardcoded logic with native discovery
        let nativeDetected = [];
        try {
            const detected = await getSupportedResolutions();
            if (detected && detected.length > 0) {
                // Sort by resolution (Width)
                detected.sort((a,b) => parseInt(a.split('x')[0]) - parseInt(b.split('x')[0]));
                nativeDetected = detected.map(res => ({ label: `${res} (System)`, value: res }));
            }
        } catch(e) {}

        let fileResolutions = [];
        if (fs.existsSync(resPath)) {
          const data = fs.readFileSync(resPath, "utf8");
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
               // If the old file has resolutions like 4K, we clear it if we have already detected official resolutions
               if (nativeDetected.length > 0 && parsed[0].label === "Native" && parsed.length > 2) {
                   fs.writeFileSync(resPath, JSON.stringify([], null, 2), "utf8");
               } else {
                   fileResolutions = parsed;
               }
            }
          } catch(err) {
            fs.writeFileSync(resPath, JSON.stringify([], null, 2), "utf8");
          }
        } else {
          fs.writeFileSync(resPath, JSON.stringify([], null, 2), "utf8");
        }

        const merged = [{ label: "Native", value: "native" }, ...nativeDetected];
        const mergedVals = new Set(merged.map(x=>x.value));
        fileResolutions.forEach(r => {
            if (!mergedVals.has(r.value) && r.value !== "native") merged.push(r);
        });
        setCommonResolutions(merged);
      } catch (e) {
        console.error("Failed to load generic resolutions:", e);
        setCommonResolutions([
          { label: "Native", value: "native" },
          { label: "800x600 (Fallback)", value: "800x600" },
          { label: "1920x1080 (Fallback)", value: "1920x1080" },
        ]);
      }
    };
    fetchRes();
  }, []);

  const rendererChanged = (field, value) => {
    setPlayerField("renderer", { ...player.renderer, [field]: value });
    setPlayerCopy((prev) => ({
      ...prev,
      renderer: { ...prev.renderer, [field]: value },
    }));
    if (roomRef?.renderer) roomRef.renderer[field] = value;
  };

  const chatChanged = (field, value) => {
    setPlayerField("chat", { ...player.chat, [field]: value });
    setPlayerCopy((prev) => ({
      ...prev,
      chat: { ...prev.chat, [field]: value },
    }));
  };

  const currentResolutionValue = playerCopy.renderer.resolution || "native";

  const isWindows = typeof window.process !== 'undefined' && window.process.platform === 'win32';
  const isLinux = typeof window.process !== 'undefined' && window.process.platform === 'linux';
  const isX11 = isLinux && (window.process.env.XDG_SESSION_TYPE === 'x11' || !!window.process.env.DISPLAY);
  
  const displayModeOptions = [
    { label: "Windowed", value: "windowed" },
    { label: "Fullscreen Windowed (Borderless)", value: "borderless" },
  ];

  if (isWindows || isX11) {
    displayModeOptions.push({ label: "Fullscreen (Exclusive)", value: "exclusive" });
  }

  return (
    <div className="section selected">
      {resNotification && (
        <div style={{
          padding: '8px 12px',
          marginBottom: 8,
          borderRadius: 4,
          fontSize: 13,
          backgroundColor: resNotification.success ? 'rgba(58, 153, 51, 0.3)' : 'rgba(193, 53, 53, 0.3)',
          border: `1px solid ${resNotification.success ? '#3a9933' : '#c13535'}`,
          color: resNotification.success ? '#8ed2ab' : '#ff8686',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{resNotification.message}</span>
          <span
            onClick={() => setResNotification(null)}
            style={{ cursor: 'pointer', marginLeft: 10, opacity: 0.7, fontSize: 16 }}
          >✕</span>
        </div>
      )}
      <SelectOption
        title={"Display Mode"}
        value={playerCopy.renderer.displayMode || "windowed"}
        options={displayModeOptions}
        defaultValue={playerDefaultValues.renderer.displayMode}
        onChange={(value) => rendererChanged("displayMode", value)}
      />
      <SelectOption
        title={"Resolution"}
        value={currentResolutionValue}
        options={commonResolutions}
        defaultValue={playerDefaultValues.renderer.resolution}
        onChange={(value) => rendererChanged("resolution", value)}
      />
      <Toggle
        title={"Use web gpu"}
        value={playerCopy.renderer.webgpu}
        defaultValue={playerDefaultValues.renderer.webgpu}
        onChange={(value) => rendererChanged("webgpu", value)}
      />
      <Toggle
        title={"Custom team colors enabled"}
        value={playerCopy.renderer.showTeamColors}
        defaultValue={playerDefaultValues.renderer.showTeamColors}
        onChange={(value) => rendererChanged("showTeamColors", value)}
      />
      <Toggle
        title={"Show chat indicators"}
        value={playerCopy.renderer.showChatIndicators}
        defaultValue={playerDefaultValues.renderer.showChatIndicators}
        onChange={(value) => rendererChanged("showChatIndicators", value)}
      />
      <Toggle
        title={"Show FPS counter"}
        value={playerCopy.renderer.showFPS ?? playerDefaultValues.renderer.showFPS}
        defaultValue={playerDefaultValues.renderer.showFPS}
        onChange={(value) => rendererChanged("showFPS", value)}
      />
      <Toggle
        title={"Show Input Lag"}
        value={playerCopy.renderer.showInputLag ?? playerDefaultValues.renderer.showInputLag}
        defaultValue={playerDefaultValues.renderer.showInputLag}
        onChange={(value) => rendererChanged("showInputLag", value)}
      />

      <NumericInput
        title={"FPS Limit (0 = unlimited)"}
        min={0}
        max={1000}
        value={playerCopy.renderer.targetFPS ?? playerDefaultValues.renderer.targetFPS}
        defaultValue={playerDefaultValues.renderer.targetFPS}
        onChange={(value) => rendererChanged("targetFPS", value)}
      />
      <Toggle
        title={"Show player avatars"}
        value={playerCopy.renderer.showAvatars}
        defaultValue={playerDefaultValues.renderer.showAvatars}
        onChange={(value) => rendererChanged("showAvatars", value)}
      />
      <SliderOption
        title={"Resolution scale"}
        min={0.1}
        max={1}
        step={0.1}
        value={playerCopy.renderer.resolutionScale}
        defaultValue={playerDefaultValues.renderer.resolutionScale}
        onChange={(value) => rendererChanged("resolutionScale", value)}
      />
      <SliderOption
        title={"Chat opacity"}
        min={0.5}
        max={1}
        step={0.01}
        value={playerCopy.chat.opacity}
        defaultValue={playerDefaultValues.chat.opacity}
        onChange={(value) => chatChanged("opacity", value)}
      />
      <SliderOption
        title={"Chat height"}
        min={0}
        max={400}
        step={1}
        value={playerCopy.chat.height}
        defaultValue={playerDefaultValues.chat.height}
        onChange={(value) => chatChanged("height", value)}
      />
      <SliderOption
        title={"Disc line width"}
        min={0}
        max={100}
        step={1}
        value={playerCopy.renderer.discLineWidth}
        defaultValue={playerDefaultValues.renderer.discLineWidth}
        onChange={(value) => rendererChanged("discLineWidth", value)}
      />
      <SliderOption
        title={"General line width"}
        min={0}
        max={100}
        step={1}
        value={playerCopy.renderer.generalLineWidth}
        defaultValue={playerDefaultValues.renderer.generalLineWidth}
        onChange={(value) => rendererChanged("generalLineWidth", value)}
      />
    </div>
  );
}
