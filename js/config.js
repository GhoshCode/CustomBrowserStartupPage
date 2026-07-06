const CONFIG = {
  /**
   * The category, name, key, url, search path, color, icon, and quicklaunch properties for your commands.
   * Icons must be added to "icons" folder and their values/names must be updated.
   * If none of the specified keys are matched, the '*' key is used.
   * Commands without a category don't show up in the help menu.
   * Update line 11 and 13 if you prefer using Google.
   */
  commands: [{
      name: 'google',
      key: '*',
      url: 'https://google.com',
      search: '/search?q={}'
    },
    {
      category: 'General',
      name: 'Mail',
      key: 'm',
      url: 'https://gmail.com',
      search: '/#search/text={}',
      color: 'linear-gradient(135deg, #dd5145, #dd5145)',
      icon: 'mail',
      quickLaunch: true,
    },
    {
      category: 'General',
      name: 'Drive',
      key: 'd',
      url: 'https://drive.google.com',
      search: '/drive/search?q={}',
      color: 'linear-gradient(135deg, #FFD04B, #1EA362, #4688F3)',
      icon: 'drive',
      quickLaunch: false,
    },
    {
      category: 'General',
      name: 'Telegram',
      key: 'tg',
      url: 'https://web.telegram.org',
      color: '#5682a3',
      icon: 'telegram',
      quickLaunch: false,
    },
    {
      category: 'General',
      name: 'LinkedIn',
      key: 'l',
      url: 'https://linkedin.com',
      search: '/search/results/all/?keywords={}',
      color: 'linear-gradient(135deg, #006CA4, #0077B5)',
      icon: 'linkedin',
      quickLaunch: true,
    },


    {
      category: 'Programming',
      name: 'GitHub',
      key: 'g',
      url: 'https://github.com',
      search: '/search?q={}',
      color: 'linear-gradient(135deg, #2b2b2b, #3b3b3b)',
      icon: 'github',
      quickLaunch: true,
    },
    {
      category: 'Programming',
      name: 'StackOverflow',
      key: 'st',
      url: 'https://stackoverflow.com',
      search: '/search?q={}',
      color: 'linear-gradient(135deg, #53341C, #F48024)',
      icon: 'stackoverflow',
      quickLaunch: true,
    },
    {
      category: 'Programming',
      name: 'HackerNews',
      key: 'h',
      url: 'https://news.ycombinator.com/',
      search: '/search?stories[query]={}',
      color: 'linear-gradient(135deg, #FF6600, #DC5901)',
      icon: 'hackernews',
      quickLaunch: true,
    },
    {
      category: 'Programming',
      name: 'MDN',
      key: 'md',
      url: 'https://developer.mozilla.org/en-US',
      search: '/search?q={}',
      color: '#212121',
      icon: 'mdn',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'DevDocs',
      key: 'dd',
      url: 'https://devdocs.io',
      color: 'linear-gradient(135deg, #33373A, #484949)',
      icon: 'devdocs',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'LeetCode',
      key: 'lc',
      url: 'https://leetcode.com',
      color: 'linear-gradient(135deg, #ffa116, #ffa116)',
      icon: 'leetcode.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Vercel',
      key: 'v',
      url: 'https://vercel.com',
      color: 'linear-gradient(135deg, #000000, #333333)',
      icon: 'vercel.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'AWS',
      key: 'aws',
      url: 'https://aws.amazon.com',
      color: 'linear-gradient(135deg, #FF9900, #FF9900)',
      icon: 'aws.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'ChatGPT',
      key: 'c',
      url: 'https://chatgpt.com',
      color: 'linear-gradient(135deg, #10a37f, #10a37f)',
      icon: 'chatgpt.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Angular',
      key: 'an',
      url: 'https://angular.io',
      search: '/search?q={}',
      color: 'linear-gradient(135deg, #DD0031, #C3002F)',
      icon: 'angular.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Java',
      key: 'ja',
      url: 'https://dev.java',
      color: 'linear-gradient(135deg, #5382A1, #F8981D)',
      icon: 'java.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'React',
      key: 're',
      url: 'https://react.dev',
      search: '/search?q={}',
      color: 'linear-gradient(135deg, #61DAFB, #282C34)',
      icon: 'react.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Next.js',
      key: 'nx',
      url: 'https://nextjs.org',
      search: '/docs/search?q={}',
      color: '#000000',
      icon: 'nextjs.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'PostgreSQL',
      key: 'pg',
      url: 'https://www.postgresql.org/docs/',
      color: 'linear-gradient(135deg, #336791, #336791)',
      icon: 'postgresql.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Python',
      key: 'py',
      url: 'https://docs.python.org/3/',
      search: '/search.html?q={}',
      color: 'linear-gradient(135deg, #3776AB, #FFD43B)',
      icon: 'python.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Kaggle',
      key: 'kg',
      url: 'https://www.kaggle.com',
      search: '/search?q={}',
      color: 'linear-gradient(135deg, #20BEFF, #20BEFF)',
      icon: 'kaggle.svg',
      quickLaunch: false,
    },
    {
      category: 'Programming',
      name: 'Jupyter',
      key: 'jp',
      url: 'https://jupyter.org',
      color: 'linear-gradient(135deg, #F37626, #F37626)',
      icon: 'jupyter.svg',
      quickLaunch: false,
    },
  ],

  /**
   * Get suggestions as you type.
   */
  suggestions: true,
  suggestionsLimit: 4,

  /**
   * The order and limit for each suggestion influencer. An "influencer" is
   * just a suggestion source. The following influencers are available:
   *
   * - "Commands" suggestions come from CONFIG.commands
   * - "Default" suggestions come from CONFIG.defaultSuggestions
   * - "DuckDuckGo" suggestions come from the duck duck go search api
   * - "History" suggestions come from your previously entered queries
   */
  influencers: [{
      name: 'Commands',
      limit: 2
    },
    {
      name: 'Default',
      limit: 4
    },
    {
      name: 'History',
      limit: 1
    },
    {
      name: 'DuckDuckGo',
      limit: 4
    },
  ],

  /**
   * Default search suggestions for the specified queries.
   */
  defaultSuggestions: {
    g: ['g/issues', 'g/pulls', 'gist.github.com'],
  },

  /**
   * Instantly redirect when a key is matched. Put a space before any other
   * queries to prevent unwanted redirects.
   */
  instantRedirect: false,

  /**
   * Open triggered queries in a new tab.
   */
  newTab: false,

  /**
   * Dynamic overlay background colors when command domains are matched.
   */
  colors: true,

  /**
   * Invert color theme
   */
  invertedColors: false,

  /**
   * Show keys instead of icons
   */
  showKeys: false,

  /**
   * The delimiter between a command key and your search query. For example,
   * to search GitHub for potatoes, you'd type "g:potatoes".
   */
  searchDelimiter: ':',

  /**
   * The delimiter between a command key and a path. For example, you'd type
   * "r/r/unixporn" to go to "https://reddit.com/r/unixporn".
   */
  pathDelimiter: '/',

  /**
   * The delimiter between the hours and minutes on the clock.
   */
  clockDelimiter: ' ',

  /**
   * Show a twenty-four-hour clock instead of a twelve-hour clock with AM/PM.
   */
  twentyFourHourClock: true,

  /**
   * File extension for icon images
   */
  iconExtension: 'png'
};
