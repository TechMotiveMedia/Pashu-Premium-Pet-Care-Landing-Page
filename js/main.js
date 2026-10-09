/* =========================================================
   PASHU — bootstrap
   ========================================================= */

import { qs, qsa, on, prefersReducedMotion } from './core/dom.js';
import { onScroll, remeasure } from './core/raf.js';
import { initReveals, countUp, magnetic, tilt, parallax } from './core/motion.js';

import { initNav } from './features/nav.js';
import { initTheme } from './features/theme.js';
import { initPawTrail } from './features/pawTrail.js';
import { initCarousel } from './features/carousel.js';
import { initBooking } from './features/booking.js';
import { initAdoptFilters } from './features/adopt.js';
import { initLightbox } from './features/lightbox.js';
import { initMisc } from './features/misc.js';
import { initAnalytics } from './lib/analytics.js';

function boot() {
  initTheme();
  initNav();
  initMisc();
  initAnalytics();

  initReveals();

  initPawTrail();
  initCarousel();
  initBooking();
  initAdoptFilters();
  initLightbox();

  initCounters();
  initMicroInteractions();
  initFaq();

  // Layout settles after images and fonts land.
  window.addEventListener('load', remeasure);
  document.fonts?.ready.then(remeasure);

  // Smooth-scroll offset depends on the live nav height.
  const setNavVar = () => {
    const nav = qs('#nav');
    if (!nav) return;
    const h = Math.round(nav.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--nav-h', `${h}px`);
  };
  setNavVar();
  on(window, 'resize', setNavVar);

  document.documentElement.classList.add('is-ready');
}

function initCounters() {
  const wrap = qs('#heroTrust');
  if (!wrap) return;

  const nums = qsa('[data-count]', wrap);
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    nums.forEach((el) => { el.textContent = formatStatic(el); });
    return;
  }

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    nums.forEach((el, i) => {
      // Stagger the counters so they tick in sequence.
      setTimeout(() => countUp(el), i * 120);
    });
  }, { threshold: 0.4 });

  io.observe(wrap);
}

function formatStatic(el) {
  const n = Number(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  return prefix + n.toLocaleString('en-IN') + suffix;
}

/* ---------- micro-interactions ---------- */

function initMicroInteractions() {
  qsa('.btn--primary').forEach((btn) => magnetic(btn));

  qsa('.benefit').forEach((card) => tilt(card, { max: 2.5 }));

  qsa('.service__media').forEach((media) => {
    const img = media.querySelector('img');
    if (img) parallax(media, img, { travel: 0.05 });
  });
}

/* ---------- FAQ: one open at a time ---------- */

function initFaq() {
  const items = qsa('.faq__item');
  if (!items.length) return;

  items.forEach((item) => {
    on(item, 'toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export { onScroll };