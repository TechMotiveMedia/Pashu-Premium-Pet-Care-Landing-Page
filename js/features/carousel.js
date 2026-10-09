/* =========================================================
   PASHU — testimonial carousel
   ------------------------------------------------------------
   Fixes the original three defects:
     · timeout race when changing slide rapidly
     · autoplay that never paused (hover / focus / hidden / offscreen)
     · dots that were <span> and unreachable by keyboard

   Now also supports arrows, swipe, arrow keys and a progress bar.
   ========================================================= */

import { qs, qsa, on, clamp, prefersReducedMotion } from '../core/dom.js';

const AUTO_MS = 6000;
const FADE_MS = 280;

export function initCarousel() {
  const root = qs('#testimonial');
  if (!root) return;

  const slides = qsa('.testimonial__slide', root);
  const dotsWrap = qs('#testimonialDots');
  const prevBtn = qs('#tPrev');
  const nextBtn = qs('#tNext');
  const bar = qs('#tProgress');
  if (slides.length < 2) return;

  const len = slides.length;
  let index = 0;
  let timer = null;
  let pending = null;      // the in-flight fade timer
  let barRaf = 0;
  let paused = false;
  let onScreen = false;

  const reduced = () => prefersReducedMotion();

  /* ---------- build dots ---------- */
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Testimonial ${i + 1} of ${len}`);
    dot.appendChild(document.createElement('i'));
    dot.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  /* ---------- progress bar ---------- */
  function runBar() {
    if (!bar || reduced()) return;
    cancelAnimationFrame(barRaf);
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / AUTO_MS, 0, 1);
      bar.style.width = `${(t * 100).toFixed(1)}%`;
      if (t < 1) barRaf = requestAnimationFrame(step);
    };
    barRaf = requestAnimationFrame(step);
  }

  function resetBar() {
    if (!bar) return;
    cancelAnimationFrame(barRaf);
    bar.style.width = '0%';
  }

  /* ---------- rendering ---------- */
  function paint(next) {
    slides.forEach((slide, i) => {
      const active = i === next;
      slide.hidden = !active;
      slide.classList.toggle('is-active', active);
    });
    dots.forEach((dot, i) => {
      const active = i === next;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
      dot.tabIndex = active ? 0 : -1;
    });
  }

  function go(next) {
    const target = ((next % len) + len) % len;
    if (target === index) return;

    // Kill any in-flight swap — this was the original race.
    clearTimeout(pending);

    if (reduced()) {
      index = target;
      paint(index);
      return;
    }

    root.classList.add('is-swapping');

    const commit = () => {
      index = target;
      paint(index);
      root.classList.remove('is-swapping');
      pending = null;
      resetBar();
      if (!paused && onScreen) runBar();
    };

    // Double rAF guarantees the browser has painted the fade-out
    // before the content changes underneath it.
    requestAnimationFrame(() => {
      pending = setTimeout(commit, FADE_MS);
    });
  }

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  /* ---------- autoplay ---------- */
  function stop() {
    clearInterval(timer);
    timer = null;
    cancelAnimationFrame(barRaf);
    resetBar();
  }

  function start() {
    stop();
    if (reduced() || paused || !onScreen) return;
    timer = setInterval(next, AUTO_MS);
    runBar();
  }

  /** Restart the full interval — no burst-catch-up after interaction. */
  function restart() { start(); }

  function updatePause() {
    if (paused || reduced() || !onScreen || document.hidden) stop();
    else start();
  }

  /* ---------- pause triggers ---------- */
  on(root.parentElement || root, 'pointerenter', () => { paused = true;  stop(); });
  on(root.parentElement || root, 'pointerleave', () => { paused = false; updatePause(); });
  on(root, 'focusin',  () => { paused = true;  stop(); });
  on(root, 'focusout', () => { paused = false; updatePause(); });
  on(document, 'visibilitychange', updatePause);

  // Only autoplay while the carousel is actually visible.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updatePause();
    }, { threshold: 0.25 }).observe(root);
  } else {
    onScreen = true;
  }

  /* ---------- controls ---------- */
  prevBtn?.addEventListener('click', () => { prev(); restart(); });
  nextBtn?.addEventListener('click', () => { next(); restart(); });

  on(root, 'keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); restart(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); restart(); }
  });

  /* ---------- swipe ---------- */
  let startX = 0, startY = 0, tracking = false;

  on(root, 'pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    tracking = true;
    startX = e.clientX; startY = e.clientY;
  });

  on(root, 'pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    // Ignore mostly-vertical gestures (scrolling).
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    dx < 0 ? next() : prev();
    restart();
  });

  on(root, 'pointercancel', () => { tracking = false; });

  /* ---------- init ---------- */
  paint(0);
  start();
}