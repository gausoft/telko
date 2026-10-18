/**
 * Page transitions. These functions are also written into each page's <head> as plain script
 * (see AppLayout), so they must stay self-contained: no imports, no outer variables.
 */

export type MotionKind = 'forward' | 'back' | 'same';

/** "/tg" is 1, "/tg/recherche" 2, "/tg/yas/internet" 3; the "/en" prefix does not count. */
export function depthOf(pathname: string): number {
  return pathname
    .replace(/^\/en(?=\/|$)/, '')
    .split('/')
    .filter((part) => part.length > 0).length;
}

/** Deeper pages slide in, shallower ones slide back, pages of the same level fade. */
export function motionKind(from: number | null, to: number): MotionKind {
  if (from === null || from === to) return 'same';

  return to > from ? 'forward' : 'back';
}

/**
 * Remembers the depth of the page being left and tells the arriving page which way to move.
 * The kind is set on <html data-motion>, read by the transition styles, then removed.
 */
export function installPageMotion(): void {
  const KEY = 'telko.motion.from';

  window.addEventListener('pageswap', () => {
    try {
      sessionStorage.setItem(KEY, String(depthOf(location.pathname)));
    } catch {
      // Without storage every transition is a fade.
    }
  });

  window.addEventListener('pagereveal', (event) => {
    const transition = (event as Event & { viewTransition?: { finished: Promise<void> } | null }).viewTransition;
    if (!transition) return;

    let from: number | null = null;
    try {
      const saved = sessionStorage.getItem(KEY);
      from = saved === null ? null : Number(saved);
    } catch {
      from = null;
    }
    document.documentElement.dataset['motion'] = motionKind(from, depthOf(location.pathname));
    void transition.finished.finally(() => delete document.documentElement.dataset['motion']);
  });
}
