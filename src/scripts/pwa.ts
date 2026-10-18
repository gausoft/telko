import { syncOffline } from './offline-sync';
import { readPref } from './prefs';

/** Install prompt kept for the Settings page (Android, desktop Chrome). */
let installPrompt: Event | null = null;

/** Runs on every page: service worker, offline indicator, and keeping the chosen country available offline. */
export function startPwa(): void {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    // A new version was installed: refresh the saved pages so they match the new files.
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === 'telko:updated') void syncChosen();
    });
  }

  showConnection();
  window.addEventListener('online', () => {
    showConnection();
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

export async function syncChosen(): Promise<string> {
  const country = readPref('country');
  if (!readPref('onboarded') || !country) return 'skipped';

  const operators = (readPref('operators') ?? readPref('operator') ?? '').split(',').filter((o) => o.length > 0);
  const result = await syncOffline(country, operators).catch(() => 'skipped' as const);
  document.dispatchEvent(new CustomEvent('telko:offline-sync', { detail: result }));

  return result;
}

function showConnection(): void {
  document.documentElement.toggleAttribute('data-offline', !navigator.onLine);
}
