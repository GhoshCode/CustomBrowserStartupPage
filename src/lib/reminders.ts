// Shared reminder plumbing for Currently Processing (plan Phase 4).
//   • Extension: the page mirrors items into chrome.storage.local; the service
//     worker (src/background.ts) owns chrome.alarms + chrome.notifications.
//   • Web: useWebReminders fires Notification API reminders while a DevDeck
//     tab is open.

import { useEffect } from 'react';
import type { ProcessingItem } from '../types';
import { isExtension } from './env';
import { REMINDERS_STORAGE_KEY, nextDue, toReminderItems } from './reminders-shared';

interface ChromeStorageLike {
  storage?: { local?: { set: (v: Record<string, unknown>) => Promise<void> | void } };
}

// Extension only: keep the service worker's copy of the schedule current.
export function useReminderMirror(items: readonly ProcessingItem[]): void {
  useEffect(() => {
    if (!isExtension()) return;
    const chrome = (globalThis as { chrome?: ChromeStorageLike }).chrome;
    void chrome?.storage?.local?.set({ [REMINDERS_STORAGE_KEY]: toReminderItems(items) });
  }, [items]);
}

// Re-plan at least hourly so a sleeping laptop or clock change cannot leave a
// stale multi-day timeout behind.
const MAX_WAIT_MS = 60 * 60 * 1000;

// Web only: in-tab Notification API reminders. The tag de-duplicates the same
// reminder across several open DevDeck tabs.
export function useWebReminders(items: readonly ProcessingItem[]): void {
  useEffect(() => {
    if (isExtension() || typeof Notification === 'undefined') return;
    const reminders = toReminderItems(items);
    let timer: ReturnType<typeof setTimeout>;

    const plan = () => {
      const due = nextDue(reminders, new Date());
      if (!due) return;
      const wait = due.at - Date.now();
      if (wait > MAX_WAIT_MS) {
        timer = setTimeout(plan, MAX_WAIT_MS);
        return;
      }
      timer = setTimeout(() => {
        if (Notification.permission === 'granted') {
          for (const item of due.items) {
            const n = new Notification(`Time to work on ${item.name}`, {
              body: item.url.replace(/^https?:\/\//, ''),
              tag: `devdeck:${item.id}:${due.at}`,
              icon: 'icons/icon-128.png',
            });
            n.onclick = () => {
              window.focus();
              window.open(item.url, '_blank', 'noopener');
              n.close();
            };
          }
        }
        plan();
      }, Math.max(0, wait));
    };

    plan();
    return () => clearTimeout(timer);
  }, [items]);
}
