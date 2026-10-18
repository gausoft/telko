import { bindChoiceList } from './choice-list';
import { isOfflineReady } from './offline-sync';
import { currentSelection, isInstalled, pendingInstall, syncChosen } from './pwa';
import { readPref, writePref } from './prefs';
import { clearRecipients, readRecipients } from './recipients';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

/** Settings page: country and operators sheets, offline status, install, theme, recent numbers. */
export function startSettings(): void {
  const country = window.location.pathname.split('/')[1] ?? '';

  wireCountry(country);
  wireOperators();
  wireOfflineStatus();
  wireInstall();
  wireTheme();
  wireRecipients();
}

/** Another country lives on other pages: save it and reopen the settings there. */
function wireCountry(current: string): void {
  const list = document.querySelector<HTMLElement>('[data-choice-list="country"]');
  if (!list) return;

  bindChoiceList(list, ([code]) => {
    if (!code || code === current) {
      document.querySelector<HTMLDialogElement>('#country-sheet')?.close();
      return;
    }
    writePref('country', code);
    window.location.href = `/${code}/reglages`;
  });
}

function wireOperators(): void {
  const list = document.querySelector<HTMLElement>('[data-choice-list="operators"]');
  const operators = list ? bindChoiceList(list) : null;
  const mine = (readPref('operators') ?? '').split(',').filter((id) => id.length > 0);
  if (mine.length > 0) {
    showMine(mine);
    operators?.set(mine);
  }

  document.querySelector('[data-save-operators]')?.addEventListener('click', () => {
    const ids = operators?.selected() ?? [];
    if (ids.length === 0) return;

    writePref('operators', ids.join(','));
    if (!ids.includes(readPref('operator') ?? '')) writePref('operator', ids[0] ?? '');
    showMine(ids);
    document.querySelector<HTMLDialogElement>('#operators-sheet')?.close();
    setOfflineStatus('…');
    void syncChosen();
  });
}

function showMine(ids: string[]): void {
  document.querySelectorAll<HTMLElement>('[data-my-operator]').forEach((el) => {
    el.hidden = !ids.includes(el.dataset['myOperator'] ?? '');
  });
}

function wireOfflineStatus(): void {
  const refresh = async (): Promise<void> => {
    const selection = currentSelection();
    const ready = selection ? await isOfflineReady(selection) : false;
    setOfflineStatus(ready ? 'Prêt' : navigator.onLine ? '…' : 'Pas encore');
  };

  document.addEventListener('telko:offline-sync', () => void refresh());
  void refresh();
}

function setOfflineStatus(text: string): void {
  const status = document.querySelector<HTMLElement>('[data-offline-status]');
  if (status) status.textContent = text;
}

function wireInstall(): void {
  const install = document.querySelector<HTMLButtonElement>('[data-install]');
  const show = (): void => {
    if (install && pendingInstall() && !isInstalled()) install.hidden = false;
  };
  document.addEventListener('telko:installable', show);
  show();

  install?.addEventListener('click', () => {
    const prompt = pendingInstall() as InstallPromptEvent | null;
    if (!prompt || install.disabled) return;
    install.disabled = true;
    void prompt
      .prompt()
      .then(() => (install.hidden = true))
      .catch(() => undefined)
      .finally(() => (install.disabled = false));
  });

  const iosHint = document.querySelector<HTMLElement>('[data-install-ios]');
  if (iosHint && /iPhone|iPad|iPod/.test(navigator.userAgent) && !isInstalled()) iosHint.hidden = false;
}

function wireTheme(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]'));
  const apply = (theme: string): void => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset['themeChoice'] === theme)));
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset['theme'] = theme;
    else delete document.documentElement.dataset['theme'];
  };

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const theme = b.dataset['themeChoice'] ?? 'auto';
      writePref('theme', theme);
      apply(theme);
    }),
  );
  apply(readPref('theme') ?? 'auto');
}

/** "Effacés" is shown only once the numbers are really gone; a failure leaves the button usable. */
function wireRecipients(): void {
  const clear = document.querySelector<HTMLButtonElement>('[data-clear-recipients]');
  if (!clear) return;
  const status = clear.querySelector<HTMLElement>('[data-clear-status]');

  void readRecipients().then((list) => (clear.hidden = list.length === 0));
  clear.addEventListener('click', () => {
    clear.disabled = true;
    clearRecipients()
      .then(() => {
        if (status) status.textContent = 'Effacés';
      })
      .catch(() => {
        if (status) status.textContent = 'Échec, réessayez';
        clear.disabled = false;
      });
  });
}
