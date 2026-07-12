// Get invertedColors preference from cookies
CONFIG.invertedColors = localStorage.getItem('invertColorCookie') ?
  JSON.parse(localStorage.getItem('invertColorCookie')) :
  CONFIG.invertedColors;

// Get showKeys preference from cookies
CONFIG.showKeys = localStorage.getItem('showKeysCookie') ?
  JSON.parse(localStorage.getItem('showKeysCookie')) :
  CONFIG.showKeys;

// Load commands from SettingsStore (localStorage) instead of static CONFIG
const storedCommands = SettingsStore.getCommands();
// Merge: keep the '*' catch-all from CONFIG, plus all stored categorized commands
const allCommands = [
  ...CONFIG.commands.filter(c => !c.category), // the '*' default
  ...storedCommands
];


const queryParser = new QueryParser({
  commands: allCommands,
  pathDelimiter: CONFIG.pathDelimiter,
  searchDelimiter: CONFIG.searchDelimiter,
});

const influencers = CONFIG.influencers.map(influencerConfig => {
  return new {
    Default: DefaultInfluencer,
    Commands: CommandsInfluencer,
    DuckDuckGo: DuckDuckGoInfluencer,
    History: HistoryInfluencer,
  } [influencerConfig.name]({
    defaultSuggestions: CONFIG.defaultSuggestions,
    limit: influencerConfig.limit,
    parseQuery: queryParser.parse,
    commands: allCommands
  });
});

const suggester = new Suggester({
  enabled: CONFIG.suggestions,
  influencers,
  limit: CONFIG.suggestionsLimit,
});

const help = new Help({
  commands: allCommands,
  newTab: CONFIG.newTab,
  suggester,
  invertedColors: CONFIG.invertedColors,
  showKeys: CONFIG.showKeys
});

const form = new Form({
  colors: CONFIG.colors,
  instantRedirect: CONFIG.instantRedirect,
  newTab: CONFIG.newTab,
  parseQuery: queryParser.parse,
  suggester,
  toggleHelp: help.toggle,
  quickLaunch: help.launch,
  categoryLaunch: help.launchCategory,
  invertedColors: CONFIG.invertedColors,
  showKeys: CONFIG.showKeys
});

new Clock({
  delimiter: CONFIG.clockDelimiter,
  toggleHelp: help.toggle,
  twentyFourHourClock: CONFIG.twentyFourHourClock,
});

// Initialize the settings panel (replaces old themeSwitcher)
// This runs on DOMContentLoaded via settingsPanel.js init()