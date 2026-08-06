class Clock {
    constructor(options) {
      this._el = $.el('#clock');
      this._delimiter = options.delimiter;
      this._twentyFourHourClock = options.twentyFourHourClock;
      this._setTime = this._setTime.bind(this);
      this._el.addEventListener('click', options.toggleHelp);
      this._start();
    }
  
    _setTime() {
      // FlipClock mounts #landing-clock alongside this element and CSS hides
      // this one, so on the default layout every tick was parsing innerHTML
      // into a display:none node once a second, forever. offsetParent is null
      // while hidden — skip the work, but keep the interval so the clock still
      // comes back if a stylesheet ever reveals it again.
      if (!this._el.offsetParent && document.body.contains(this._el)) return;
      if (document.hidden) return;

      const date = new Date();
      let hours = $.pad(date.getHours());
      let amPm = '';
  
      if (!this._twentyFourHourClock) {
        hours = date.getHours();
        if (hours > 12) hours -= 12;
        else if (hours === 0) hours = 12;
  
        amPm =
          `&nbsp;<span class="am-pm">` +
          `${date.getHours() >= 12 ? 'PM' : 'AM'}</span>`;
      }
  
      const minutes = $.pad(date.getMinutes());
      this._el.innerHTML = `${hours}${this._delimiter}${minutes}${amPm}`;
      this._el.setAttribute('datetime', date.toTimeString());
    }
  
    _start() {
      this._setTime();
      setInterval(this._setTime, 1000);
    }
  }