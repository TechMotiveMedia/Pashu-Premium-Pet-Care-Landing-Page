/* =========================================================
   PASHU — core utilities
   ========================================================= */

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Attach a listener and return an unsubscribe function. */
export function on(target, type, handler, opts) {
  target.addEventListener(type, handler, opts);
  return () => target.removeEventListener(type, handler, opts);
}

/** Event delegation — survives DOM changes in the container. */
export function delegate(root, type, selector, handler) {
  return on(root, type, (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  });
}

/** Scroll an element into view, tolerating environments without the API. */
export function scrollIntoViewSafe(el, options = {}) {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    ...options,
  });
}

/** Move keyboard focus to an element without triggering a scroll jump. */
export function focusSafe(el) {
  if (!el || typeof el.focus !== 'function') return;
  if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
    el.setAttribute('tabindex', '-1');
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
  }
  try { el.focus({ preventScroll: true }); } catch { el.focus(); }
}

/** Reveal a target when it enters the viewport. */
export function scrollToTarget(target, { focus = false } = {}) {
  if (!target) return;
  scrollIntoViewSafe(target, { block: 'start' });
  if (focus) focusSafe(target);
}

/* ---------- Environment ---------- */

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => mqReduce.matches;

export const onMotionPreferenceChange = (fn) => {
  const handler = () => fn(mqReduce.matches);
  mqReduce.addEventListener('change', handler);
  return () => mqReduce.removeEventListener('change', handler);
};

/* ---------- Storage (never throws — private mode / disabled) ---------- */

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
  session: {
    get(key, fallback = null) {
      try {
        const raw = sessionStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); return true; }
      catch { return false; }
    },
  },
};

/* ---------- Small helpers ---------- */

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const formatNumber = (n) => n.toLocaleString('en-IN');

export const debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

/** Focusable descendants, for focus traps. */
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export const getFocusable = (root) =>
  qsa(FOCUSABLE, root).filter((el) => el.offsetParent !== null || el === document.activeElement);