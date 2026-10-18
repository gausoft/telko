import { isLang } from '../i18n/detect';
import { splitLang, switchLang } from '../i18n/paths';
import { t } from './i18n-client';
import { readPref, writePref } from './prefs';

/**
 * Language row of the settings. A change saves the choice and opens the same page in the other
 * language; the pages kept offline follow on the next sync. Offline, the other language's pages
 * cannot be fetched, so the row waits for the connection.
 */
export function wireLanguage(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-lang-choice]'));
  const row = buttons[0]?.closest<HTMLElement>('.row');
  const label = row?.querySelector<HTMLElement>('.label');
  const original = label?.textContent ?? '';

  const follow = (): void => {
    buttons.forEach((b) => (b.disabled = !navigator.onLine));
    if (label) label.textContent = navigator.onLine ? original : `${original} · ${t().settings.needsConnection}`;
  };

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const choice = b.dataset['langChoice'];
      if (!isLang(choice) || !navigator.onLine) return;
      // The page may show a language other than the saved one (a shared link): the tap saves it either way.
      if (readPref('lang') !== choice) writePref('lang', choice);
      if (splitLang(window.location.pathname).lang !== choice) window.location.href = switchLang(window.location.pathname, choice);
    }),
  );
  window.addEventListener('online', follow);
  window.addEventListener('offline', follow);
  follow();
}
