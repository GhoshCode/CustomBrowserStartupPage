class Help {
    // Site names, categories and URLs come from stored settings, which
    // SettingsStore.importAll() can load from a file the user was given. This
    // list is built with insertAdjacentHTML, so unescaped values execute.
    // Mirrors esc()/safeUrl() in settingsPanel.js; static so they stay off the
    // global scope, since this file is not wrapped in a module closure.
    static _esc(s) {
      return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
    }

    static _safeUrl(u) {
      const s = String(u === null || u === undefined ? '' : u)
        .split('').filter(c => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127).join('').trim();
      const scheme = s.match(/^([a-z][a-z0-9+.-]*):/i);
      if (!scheme) return s;                  // relative, e.g. assets/icons/x.png
      if (/^(https?|mailto|tel|ftp)$/i.test(scheme[1])) return s;
      if (/^data:image\//i.test(s)) return s;
      return '';
    }

    constructor(options) {
      this._el = $.el('#help');
      this._commands = options.commands;
      this._newTab = options.newTab;
      this._toggled = false;
      this._handleKeydown = this._handleKeydown.bind(this);
      this.toggle = this.toggle.bind(this);
      this.launch = this.launch.bind(this);
      this.launchCategory = this.launchCategory.bind(this);
      this._inputEl = $.el('#search-input');
      this._inputElVal = '';
      this._suggester = options.suggester;
      this._invertColors = options.invertedColors;
      this._buildAndAppendLists();
      this._registerEvents();
      this._invertValue;
    }
  
    toggle(show) {
      this._toggled = typeof show !== 'undefined' ? show : !this._toggled;
      this._toggled ? $.bodyClassAdd('help') : $.bodyClassRemove('help');
    }
  
    hide() {
      $.bodyClassRemove('form');
      this._inputEl.value = '';
      this._inputElVal = '';
      this._suggester.suggest('');
    }
  
    launch() {
      this.hide();
      this.toggle(true);
      $.bodyClassAdd('help');
  
      CONFIG.commands.forEach(command => {
        if(command.quickLaunch) window.open(command.url);
      });
    }
  
    launchCategory(){
      
      const categorySet = new Set();
  
      CONFIG.commands.forEach(command => {
        if(command.category) categorySet.add(command.category);
      });
  
      const targetCategoryIndex = $.el('#search-input').value.replace('!', '');
      const targetCategory = Array.from(categorySet)[targetCategoryIndex - 1];
      
      CONFIG.commands.forEach(command => {
        if(targetCategory && command.category === targetCategory) window.open(command.url);
      });
    }
  
    _buildAndAppendLists() {
      const lists = document.createElement('ul');
      lists.classList.add('categories');
  
      this._getCategories().forEach(category => {
        lists.insertAdjacentHTML(
          'beforeend',
          `<li class="category">
            <h2 class="category-name">${Help._esc(category)}</h2>
            <ul>${this._buildListCommands(category)}</ul>
          </li>`
        );
      });
  
      this._el.appendChild(lists);
    }
  
    _buildListCommands(currentCategory) {
      const commandListWithIcons = this._commands
        .map(({ category, name, key, url, icon }) => {
          if (category !== currentCategory) return '';
          const iconPath = (icon && icon.includes('.'))
            ? `assets/icons/${icon}`
            : `assets/icons/${icon}.${CONFIG.iconExtension}`;
          const iconEl = `<img src='${Help._esc(Help._safeUrl(iconPath))}' height="20px" style="display:block;">`;
          return `
            <li class="command">
              <a href="${Help._esc(Help._safeUrl(url))}" target="${this._newTab ? '_blank' : '_self'}">
                <span class="command-key" style="background-color:transparent;border:2px solid rgba(255, 255, 255, 0.7);color:#F1F1F1;">${iconEl}</span>
                <span class="command-name">${Help._esc(name)}</span>
              </a>
            </li>`;
        })
        .join('');

      const commandListWithKeys = this._commands
        .map(({ category, name, key, url }) => {
          if (category !== currentCategory) return '';
          return `
            <li class="command">
              <a href="${Help._esc(Help._safeUrl(url))}" target="${this._newTab ? '_blank' : '_self'}">
                <span class="command-key" style="color:#F1F1F1;background-color:transparent;border:2px solid rgba(255, 255, 255, 0.7);">${Help._esc(key)}</span>
                <span class="command-name">${Help._esc(name)}</span>
              </a>
            </li>`;
        })
        .join('');

      return CONFIG.showKeys ? commandListWithKeys : commandListWithIcons;
    }

  
    _getCategories() {
      const categories = this._commands
        .map(v => v.category)
        .filter(category => category);
  
      return [...new Set(categories)];
    }
  
    _handleKeydown(e) {
      if ($.key(e) === 'escape') this.toggle(false);
    }
  
    _registerEvents() {
      document.addEventListener('keydown', this._handleKeydown);
    }
  }