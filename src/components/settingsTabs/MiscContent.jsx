import FlagSelector from "./MiscComponents/FlagSelector";
import LanguageSelector from "./MiscComponents/LanguageSelector";
import AuthSetter from "./MiscComponents/AuthSetter";
import AvatarSelector from "./MiscComponents/AvatarSelector";
import { languageLoaders } from "../../utils/languageLoaders";

export default function MiscContent({ player, setPlayerField, roomRef }) {
  const selectedFlag = (flag) => {
    setPlayerField("geo", { ...player.geo, flag});
  };
  const selectedLang = (lang) => {
    switch (lang) {
      case "gb":
        lang = "english";
        break;
      case "pt":
        lang = "portuguese";
        break;
      case "es":
        lang = "spanish";
        break;
      case "tr":
        lang = "turkish";
        break;
      default:
        lang = "english";
    }
    languageLoaders[lang]().then((module) => {
      const language = module.default;
      window.API.Language.current = new language(window.API);
      setPlayerField("language", lang);
    });
  };
  const selectedAvatar = (path) => {
    setPlayerField("renderer", { ...player.renderer, "playerAvatarTexturePath": path });
    if (roomRef?.renderer) roomRef.renderer.playerAvatarTexturePath = path;
    //rendererChanged("playerAvatarTexturePath", path);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <FlagSelector onSelect={selectedFlag} />
      <LanguageSelector onSelect={selectedLang} />
      <AuthSetter></AuthSetter>
      <AvatarSelector onSelect={selectedAvatar} selected={player.renderer.playerAvatarTexturePath||null}/>
    </div>
  );
}
