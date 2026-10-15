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

interface ChromePermissions {
  permissions?: { request(p: { origins: string[] }): Promise<boolean> };
}

// Custom RSS feeds live on arbitrary hosts. In the extension, ask for that one
// origin (declared as an optional host permission) when the feed is added; on
// the web there is nothing to grant — the feed's CORS headers decide.
export async function requestHostAccess(url: string): Promise<boolean> {
  if (!isExtension()) return true;
  const chrome = (globalThis as { chrome?: ChromePermissions }).chrome;
  try {
    const origin = new URL(url).origin;
    return (await chrome?.permissions?.request({ origins: [`${origin}/*`] })) ?? false;
  } catch {
    return false;
  }
}
