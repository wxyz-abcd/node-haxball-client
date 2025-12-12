import "../../../assets/css/flags.css";
import countries from "./countries.json";
import DropDown from "./DropDown";
import { usePlayerData } from "../../../hooks/usePlayerData";

export default function FlagSelector({ onSelect }) {
  const { player } = usePlayerData();

  return (
    <DropDown
      title={"Country"}
      onSelect={onSelect}
      content={countries}
      defaultValue={player?.geo?.flag || "gb"}
      class1={"flagico"}
      class2={"f"}
    ></DropDown>
  );
}
