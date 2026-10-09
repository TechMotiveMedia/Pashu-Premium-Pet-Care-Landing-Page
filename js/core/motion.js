/* =========================================================
   PASHU — motion helpers
   ========================================================= */

import { qsa, prefersReducedMotion, formatNumber } from './dom.js';

/**
 * Add `is-visible` when the element scrolls into view.
 * Under reduced motion the element is shown immediately.
 */
export function inView(el, { threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = {}) {
  if (!el) return () => {};

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    el.classList.add('is-visible');
    return () => {};
  }

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    if (once) io.unobserve(entry.target);
  }, { threshold, rootMargin });

  io.observe(el);
  return () => io.disconnect();
}

/**
 * Stagger a group of elements. Capped so long lists don't feel sluggish.
 */
export function stagger(elements, { selector = '.reveal', step = 70, cap = 6 } = {}) {
  qsa(selector, elements).forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, cap) * step}ms`;
    inView(el);
  });
}

/** Observe every `.reveal` on the page. */
export function initReveals(root = document) {
  qsa('.reveal', root).forEach((el) => inView(el));
}

/**
 * Count a number up once on view. Reads data-count / data-prefix / data-suffix.
 */
export function countUp(el, { duration = 1400 } = {}) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;

  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const decimals = (el.dataset.count.split('.')[1] || '').length;

  const write = (value) => {
    el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
  };

  if (prefersReducedMotion()) { write(target); return; }

  let frame = 0;
  let start = 0;

  const step = (now) => {
    if (!start) start = now;
    const t = clamp01((now - start) / duration);
    // easeOutExpo
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    write(target * eased);
    if (t < 1) frame = requestAnimationFrame(step);
    else write(target);
  };

  write(0);
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

/**
 * Magnetic hover on an element. Pointer-follow with spring easing,
 * clamped to a small radius so it reads as responsive, not gimmicky.
 */
export function magnetic(el, { strength = 0.28 } = {}) {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let raf = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0, active = false;

  const loop = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    el.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
    if (active || Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      el.style.translate = '';
      raf = 0;
    }
  };

  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  el.style.transition = 'transform var(--dur-base) var(--ease-out)';

  el.addEventListener('pointerenter', () => { active = true; start(); });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width / 2)) * strength;
    ty = (e.clientY - (r.top + r.height / 2)) * strength;
    start();
  });
  el.addEventListener('pointerleave', () => {
    active = false; tx = 0; ty = 0; start();
  });
}

/**
 * 3D tilt on a card. Perspective is set on the element itself.
 */
export function tilt(el, { max = 4, perspective = 900 } = {}) {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  el.style.perspective = `${perspective}px`;
  const inner = el.firstElementChild || el;

  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg)`;
  });

  el.addEventListener('pointerleave', () => { inner.style.transform = ''; });
}

/**
 * Subtle parallax on a media image inside a clipping container.
 * Travel is deliberately small (~6%) so it reads as depth, not motion.
 */
export function parallax(container, img, { travel = 0.06 } = {}) {
  if (prefersReducedMotion()) return;
  if (!('IntersectionObserver' in window)) return;

  let visible = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(container);
  if (!visible) return;

  let raf = 0;
  const update = () => {
    raf = 0;
    if (!visible) return;
    const r = container.getBoundingClientRect();
    const centre = r.top + r.height / 2;
    const offset = (window.innerHeight / 2 - centre) / window.innerHeight;
    img.style.transform = `translate3d(0, ${(offset * r.height * travel).toFixed(1)}px, 0) scale(1.08)`;
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    io.disconnect();
  };
}

export { formatNumber };