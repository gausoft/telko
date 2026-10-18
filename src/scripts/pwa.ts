import { syncOffline } from './offline-sync';
import type { Selection, SyncResult } from './offline-sync-types';
import { isLang } from '../i18n/detect';
import { t } from './i18n-client';
import { readPref, writePref } from './prefs';

/** Install prompt kept for the Settings page (Android, desktop Chrome). */
let installPrompt: Event | null = null;

/** Runs on every page: service worker, offline indicator, and keeping the chosen country available offline. */
export function startPwa(): void {
  ensureLangPref();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    // A new version was installed: refresh the saved pages so they match the new files.
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === 'telko:updated') void syncChosen();
    });
  }

  showConnection();
  window.addEventListener('online', (event) => {
    showConnection(event);
    void syncChosen();
  });
  window.addEventListener('offline', showConnection);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    document.dispatchEvent(new CustomEvent('telko:installable'));
  });

  void syncChosen();
}

export function pendingInstall(): Event | null {
  return installPrompt;
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export async function syncChosen(): Promise<SyncResult> {
  const result = await syncOffline(currentSelection);
  document.dispatchEvent(new CustomEvent('telko:offline-sync', { detail: result }));

  return result;
}

export function currentSelection(): Selection | null {
  const country = readPref('country');
  if (!readPref('onboarded') || !country) return null;

  const operators = (readPref('operators') ?? readPref('operator') ?? '').split(',').filter((o) => o.length > 0);

  const pref = readPref('lang');

  return { country, operators, lang: isLang(pref) ? pref : 'fr' };
}

/** Visitors onboarded before languages existed did it in French: their choice is written down once. */
function ensureLangPref(): void {
  if (readPref('onboarded') && !isLang(readPref('lang'))) writePref('lang', 'fr');
}

/** The dot on the logo is visual; the status line tells screen reader users when the connection changes. */
function showConnection(event?: Event): void {
  document.documentElement.toggleAttribute('data-offline', !navigator.onLine);
  const status = document.querySelector<HTMLElement>('[data-app-status]');
  if (status && event) status.textContent = navigator.onLine ? t().pwa.online : t().pwa.offline;
}
