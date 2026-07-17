/**
 * DevTab background service worker.
 * Fetches dashboard data every N minutes (chrome.alarms), caches it in
 * chrome.storage.local, and the new-tab UI reads the cache instantly.
 * Config (repo, tokens, username) is mirrored here by the UI via 'cfg'.
 */
const ALARM = 'devtab-refresh';
const PERIOD_MIN = 10;

function schedule() {
  chrome.alarms.create(ALARM, { periodInMinutes: PERIOD_MIN });
  refreshAll();
}

chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) refreshAll();
});

// UI can request an immediate refresh (e.g. after settings change)
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg && msg.type === 'devtab-refresh') {
    refreshAll().then(() => respond({ ok: true })).catch(() => respond({ ok: false }));
    return true; // async response
  }
});

async function getJSON(url, headers) {
  const r = await fetch(url, headers ? { headers } : undefined);
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  return r.json();
}

async function refreshAll() {
  const { cfg } = await chrome.storage.local.get('cfg');
  const c = cfg || {};
  const out = { fetchedAt: Date.now() };
  const gh = c.pat ? { Authorization: 'Bearer ' + c.pat } : undefined;

  const jobs = [];

  // CVE: latest critical advisories
  jobs.push(
    getJSON('https://api.github.com/advisories?severity=critical&per_page=5')
      .then(list => { out.cve = list; })
      .catch(() => {})
  );

  // Repo status (+ open PR count — works unauthenticated, better with PAT)
  if (c.repo && c.repo.includes('/')) {
    jobs.push(
      getJSON('https://api.github.com/repos/' + c.repo, gh)
        .then(d => { out.repo = d; })
        .catch(() => {})
    );
    jobs.push(
      getJSON(`https://api.github.com/search/issues?q=repo:${encodeURIComponent(c.repo)}+type:pr+state:open&per_page=1`, gh)
        .then(d => { out.openPRs = d.total_count; })
        .catch(() => {})
    );
  }

  // Contribution graph
  if (c.githubUser) {
    jobs.push(
      getJSON(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(c.githubUser)}?y=last`)
        .then(d => { out.contrib = d; out.contribUser = c.githubUser; })
        .catch(() => {})
    );
  }

  // Hacker News top 5
  jobs.push(
    getJSON('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(ids => Promise.all(
        ids.slice(0, 5).map(id => getJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
      ))
      .then(stories => { out.hn = stories.filter(Boolean); })
      .catch(() => {})
  );

  await Promise.all(jobs);
  await chrome.storage.local.set({ devtabCache: out });
}
