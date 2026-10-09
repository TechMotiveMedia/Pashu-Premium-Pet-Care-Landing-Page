/* =========================================================
   PASHU — navigation
   Sticky state, scroll progress, scrollspy, services menu,
   mobile drawer with focus trap.
   ========================================================= */

import { qs, qsa, on, delegate, scrollIntoViewSafe, focusSafe } from '../core/dom.js';
import { onScroll } from '../core/raf.js';

export function initNav() {
  const nav = qs('#nav');
  const progress = qs('#navProgress');
  if (!nav) return;

  /* ---- sticky shrink + progress bar ---- */
  onScroll((y, progressRatio) => {
    nav.classList.toggle('is-scrolled', y > 24);
    if (progress) progress.style.width = `${(progressRatio * 100).toFixed(2)}%`;
  });

  /* ---- services dropdown ---- */
  const group = qs('.nav__group');
  const parent = qs('.nav__link--parent');
  const menu = qs('#servicesMenu');
  if (group && parent && menu) {
    const setOpen = (open) => {
      parent.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    };

    parent.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(parent.getAttribute('aria-expanded') !== 'true');
    });

    // Close on outside click / Escape
    on(document, 'click', (e) => {
      if (!group.contains(e.target)) setOpen(false);
    });
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && parent.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        parent.focus();
      }
    });
    // Close when focus leaves the group entirely (keyboard tabbing out)
    on(group, 'focusout', (e) => {
      if (!group.contains(e.relatedTarget)) setOpen(false);
    });
  }

  /* ---- mobile drawer ---- */
  const burger = qs('#navBurger');
  const drawer = qs('#mobileNav');
  const closeDrawer = burger && drawer ? initDrawer(burger, drawer, nav) : () => {};

  /* ---- smooth in-page anchors with sticky-nav offset ---- */
  delegate(document, 'click', 'a[data-scroll]', (e, link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#') || href.length < 2) return;

    let target;
    try { target = document.getElementById(href.slice(1)); }
    catch { return; }   // malformed selector in href
    if (!target) return;

    e.preventDefault();

    // Close the drawer first so focus lands on a visible element.
    if (drawer?.classList.contains('is-open')) closeDrawer();

    scrollIntoViewSafe(target, { block: 'start' });

    // Move keyboard focus to the destination so keyboard users follow along.
    focusSafe(target);

    // Keep the URL shareable — but don't add a history entry per scroll.
    history.replaceState(null, '', href);
  });

  /* ---- scrollspy ---- */
  initScrollSpy();
}

/* ------------------------------------------------------------ */

function initDrawer(burger, drawer, nav) {
  let lastFocus = null;

  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    // Next frame so the transition actually runs.
    requestAnimationFrame(() => drawer.classList.add('is-open'));

    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.add('is-menu-open');

    // Lock scroll on <html>, not <body> — locking body breaks position:sticky.
    document.documentElement.style.overflow = 'hidden';

    const first = drawer.querySelector('a, button');
    first?.focus();
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('is-menu-open');
    document.documentElement.style.overflow = '';

    const done = () => { drawer.hidden = true; };
    if (prefersReducedMotion()) done();
    else setTimeout(done, 400);

    lastFocus?.focus();
  };

  burger.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });

  // Scrim + any link inside the panel
  qsa('[data-drawer-close]', drawer).forEach((el) => el.addEventListener('click', closeDrawer));
  delegate(drawer, 'click', 'a', () => closeDrawer());

  on(document, 'keydown', (e) => {
    if (!drawer.classList.contains('is-open')) return;

    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }

    // Focus trap
    if (e.key !== 'Tab') return;
    const focusables = [...drawer.querySelectorAll('a[href], button:not([disabled])')]
      .filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Close if the viewport grows past the mobile breakpoint.
  matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
    if (e.matches && drawer.classList.contains('is-open')) closeDrawer();
  });

  return closeDrawer;
}

/* ------------------------------------------------------------ */

function initScrollSpy() {
  const links = qsa('.nav__links a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (!sections.length) return;

  const visible = new Map();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
      else visible.delete(entry.target.id);
    });

    // Highlight the topmost section still on screen.
    let current = null;
    for (const section of sections) {
      if (visible.has(section.id)) { current = section.id; break; }
    }

    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${current}`;
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, {
    // Bias the "active" band toward the top of the viewport.
    rootMargin: '-20% 0px -70% 0px',
    threshold: [0, 0.25, 0.5],
  });

  sections.forEach((section) => io.observe(section));
}