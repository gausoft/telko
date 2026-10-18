const VISIBLE = 0.6;

/**
 * Featured carousel: the cards scroll natively under the finger and snap; this script only keeps
 * the dots, the screen reader state and the automatic advance in step with the scroll position.
 */
export function startCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('.track');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dot]'));
  if (!track || slides.length === 0) return;

  const state = { index: 0, paused: false };
  watchVisibleSlide(track, slides, (index) => {
    state.index = index;
    markCurrent(slides, dots, index);
  });

  const first = slides[0];
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const goTo = (index: number): void => track.scrollTo({ left: (slides[index]?.offsetLeft ?? 0) - (first?.offsetLeft ?? 0), behavior });
  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => {
      state.paused = true;
      goTo(i);
    }),
  );

  const pause = (): void => void (state.paused = true);
  track.addEventListener('pointerdown', pause);
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('wheel', pause, { passive: true });
  root.addEventListener('focusin', pause);
  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') pause();
  });

  autoAdvance(root, slides.length, state, goTo);
}

/** The card mostly in view becomes the current one, however it got there (finger, dot or timer). */
function watchVisibleSlide(track: HTMLElement, slides: HTMLElement[], onChange: (index: number) => void): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // A card leaving the view still "intersects" for a moment: only a card mostly in view counts.
        if (entry.intersectionRatio >= VISIBLE) onChange(slides.indexOf(entry.target as HTMLElement));
      }
    },
    { root: track, threshold: VISIBLE },
  );
  slides.forEach((s) => observer.observe(s));
}

/** Cards out of view are skipped by screen readers and the keyboard, like the dots say. */
function markCurrent(slides: HTMLElement[], dots: HTMLButtonElement[], index: number): void {
  slides.forEach((s, i) => {
    if (i === index) {
      s.removeAttribute('aria-hidden');
      s.removeAttribute('tabindex');
    } else {
      s.setAttribute('aria-hidden', 'true');
      s.tabIndex = -1;
    }
  });
  dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
}

function autoAdvance(root: HTMLElement, count: number, state: { index: number; paused: boolean }, goTo: (index: number) => void): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || count < 2) return;

  const interval = Number(root.dataset['interval'] ?? 4000);
  window.setInterval(() => {
    if (!state.paused && root.offsetParent !== null && !document.hidden) goTo((state.index + 1) % count);
  }, interval);
}
