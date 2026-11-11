const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (target: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string;
  reset: (id: string) => void;
}

export interface TurnstileHandle {
  value: () => string;
  reset: () => void;
}

/** Shows the anti-bot check when a site key is configured. Without one, the handle is inert and the token is empty. */
export function mountTurnstile(target: HTMLElement | null, siteKey: string): TurnstileHandle {
  let token = '';
  let widget: string | null = null;
  const api = (): TurnstileApi | undefined => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

  if (target && siteKey !== '') {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.addEventListener('load', () => {
      widget = api()?.render(target, { sitekey: siteKey, callback: (value) => (token = value), 'expired-callback': () => (token = '') }) ?? null;
    });
    document.head.append(script);
  }

  return {
    value: () => token,
    reset: () => {
      token = '';
      const turnstile = api();
      if (turnstile && widget !== null) turnstile.reset(widget);
    },
  };
}
