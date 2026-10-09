/* =========================================================
   PASHU — shared rAF scroll ticker
   ------------------------------------------------------------
   One listener for the whole page. Cached layout metrics so we
   never read scrollHeight inside the loop (which would force a
   synchronous reflow on every frame).
   ========================================================= */

import { clamp } from './dom.js';

const subscribers = new Set();
let queued = false;

/* Cached geometry — invalidated on resize / content mutation */
let metrics = { scrollable: 0, progress: 0, height: 0, width: 0 };

function measure() {
  const de = document.documentElement;
  metrics.height = de.scrollHeight;
  metrics.width = de.scrollWidth;
  metrics.scrollable = Math.max(0, de.scrollHeight - window.innerHeight);
}

function tick() {
  queued = false;
  const y = window.scrollY;
  metrics.progress = metrics.scrollable > 0 ? clamp(y / metrics.scrollable, 0, 1) : 0;
  subscribers.forEach((fn) => fn(y, metrics.progress, metrics));
}

/** Subscribe to scroll. Returns an unsubscribe function. */
export function onScroll(fn) {
  subscribers.add(fn);
  fn(window.scrollY, metrics.progress, metrics);
  return () => subscribers.delete(fn);
}

/** Force a re-measure of cached layout metrics. */
export function remeasure() {
  measure();
  tick();
}

/* Boot */
measure();

window.addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(tick);
}, { passive: true });

window.addEventListener('resize', () => {
  measure();
  tick();
}, { passive: true });

/* Images and fonts change layout after load. */
window.addEventListener('load', remeasure);
window.addEventListener('resize', debounceGuard(remeasure));

function debounceGuard(fn) {
  let t;
  return () => { clearTimeout(t); t = setTimeout(fn, 200); };
}

/* Content-visibility sections report their real size lazily. */
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(() => remeasure());
  ro.observe(document.body);
}

/* UTM capture — first-touch + last-touch, persisted for the form payload. */
try {
  const params = new URLSearchParams(location.search);
  const utm = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid']) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  if (Object.keys(utm).length) {
    sessionStorage.setItem('pashu_utm', JSON.stringify(utm));
  }
} catch { /* ignore */ }