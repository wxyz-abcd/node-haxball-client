export const languageLoaders = {
  english: () => import('node-haxball/examples/languages/englishLanguage.js'),
  portuguese:  () => import('node-haxball/examples/languages/portugueseLanguage.js'),
  spanish:  () => import('node-haxball/examples/languages/spanishLanguage.js'),
  turkish:  () => import('node-haxball/examples/languages/turkishLanguage.js'),
};