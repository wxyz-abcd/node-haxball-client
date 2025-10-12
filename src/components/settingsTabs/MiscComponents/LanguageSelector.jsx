import "../../../assets/css/flags.css";
import languages from "./languages.json";
import DropDown from "./DropDown";
import {usePlayerData} from "../../../hooks/usePlayerData";

export default function LanguageSelector({ onSelect }) {
  const {player} = usePlayerData();
  let language = 'gb';
  if(player && player.language) {
    switch (player.language) {
      case "english":
        language = "gb";
        break;
      case "portuguese":
        language = "pt";
        break;
      case "spanish":
        language = "es";
        break;
      case "turkish":
        language = "tr";
        break;
      default:
        language = "gb";
    }
  }

  return (
    <DropDown
      title={"Language"}
      onSelect={onSelect}
      content={languages}
      defaultValue={language}
      class1={"flagico"}
      class2={"f"}
    ></DropDown>
  );
}
