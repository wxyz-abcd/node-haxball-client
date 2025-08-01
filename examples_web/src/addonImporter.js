window.languages = {};
window.roomConfigs = {};
window.libraries = {};
window.plugins = {};
window.renderers = {};

function generateImportFunctions(directoryName, globalVariableName){
  window[globalVariableName] = {};
  var importSingular = function(name, onReady){
    if (window[globalVariableName][name]!=null){
      onReady();
      return;
    }
    window.module = {};
    var s = document.createElement("script");
    s.src = "./"+directoryName+"/"+name+".js";
    document.body.appendChild(s);
    var int = setInterval(()=>{
      if (window.module.exports==null)
        return;
      clearInterval(int);
      window[globalVariableName][name] = window.module.exports;
      window.module = null;
      onReady();
    }, 1);
  };
  var importMultiple = function(names, onReady, n=0){
    if (n>=names.length){
      onReady();
      return;
    }
    importSingular(names[n], ()=>{
      importMultiple(names, onReady, n+1);
    });
  };
  return [importSingular, importMultiple];
}

var [importRoomConfig, importRoomConfigs] = generateImportFunctions("roomConfigs/method2", "roomConfigs");
var [importPlugin, importPlugins] = generateImportFunctions("plugins", "plugins");
var [importLibrary, importLibraries] = generateImportFunctions("libraries", "libraries");
var [importRenderer, importRenderers] = generateImportFunctions("renderers", "renderers");
var [importLanguage, importLanguages] = generateImportFunctions("languages", "languages");

var importAll = function({languages, roomConfigs, libraries, plugins, renderers}, onReady){
  var f0 = ()=>{
    var f1 = ()=>{
      var f2 = ()=>{
        var f3 = ()=>renderers?importRenderers(renderers, onReady):onReady();
        plugins?importPlugins(plugins, f3):f3();
      };
      libraries?importLibraries(libraries, f2):f2();
    };
    roomConfigs?importRoomConfigs(roomConfigs, f1):f1();
  };
  languages?importLanguages(languages, f0):f0();
};