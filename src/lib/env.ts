// The same dist/ runs as a website and as an MV3 new-tab extension (plan §1).
// Features that need extension APIs (alarms, notifications, CORS-free fetches)
// check this and degrade gracefully on the web.

interface ChromeLike {
  runtime?: { id?: string };
}

export function isExtension(): boolean {
  const chrome = (globalThis as { chrome?: ChromeLike }).chrome;
  return typeof chrome?.runtime?.id === 'string';
}
