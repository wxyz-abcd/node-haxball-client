import { useState } from "react";
import Toggle from "../Toggle";
import SliderOption from "../SliderOption";
import playerDefaultValues from "../../hooks/PlayerDataDefaultValues";

export default function VideoContent({ player, setPlayerField, roomRef }) {
  const [playerCopy, setPlayerCopy] = useState(player);
  const rendererChanged = (field, value) => {
    setPlayerField("renderer", { ...player.renderer, [field]: value });
    setPlayerCopy((prev) => ({
      ...prev,
      renderer: { ...prev.renderer, [field]: value },
    }));
    roomRef.renderer[field] = value;
  };
  const chatChanged = (field, value) => {
    setPlayerField("chat", { ...player.chat, [field]: value });
    setPlayerCopy((prev) => ({
      ...prev,
      chat: { ...prev.chat, [field]: value },
    }));
  };

  return (
    <div className="section selected">
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
        title={"Show player avatars"}
        value={playerCopy.renderer.showAvatars}
        defaultValue={playerDefaultValues.renderer.showAvatars}
        onChange={(value) => rendererChanged("showAvatars", value)}
      />
      <SliderOption
        title={"Resolution scale"}
        min={0}
        max={10}
        step={1}
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
