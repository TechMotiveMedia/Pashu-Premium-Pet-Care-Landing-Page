/* =========================================================
   PASHU — small enhancements
   Emergency band, back-to-top, newsletter, year stamp.
   ========================================================= */

import { qs, on, store, focusSafe } from '../core/dom.js';
import { onScroll } from '../core/raf.js';
import { track } from '../lib/analytics.js';

const URGENT_KEY = 'pashu_urgent_dismissed';
const NEWS_KEY = 'pashu_newsletter';

export function initMisc() {
  initYear();
  initUrgentBand();
  initToTop();
  initNewsletterForm();
}

function initYear() {
  const el = qs('#year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- emergency band ---------- */

function initUrgentBand() {
  const band = qs('#urgentBand');
  const close = qs('.urgent__close');
  if (!band || !close) return;

  if (store.get(URGENT_KEY)) band.classList.add('is-dismissed');

  on(close, 'click', () => {
    band.classList.add('is-dismissed');
    store.set(URGENT_KEY, true);
    track('urgent_banner_dismissed');
    // Hand focus somewhere sensible now that the element collapses.
    focusSafe(qs('#nav .nav__brand'));
  });
}

/* ---------- back to top ---------- */

function initToTop() {
  const btn = qs('#toTop');
  if (!btn) return;

  btn.hidden = false;
  let visible = false;

  onScroll((y) => {
    const show = y > window.innerHeight * 0.6;
    if (show === visible) return;
    visible = show;
    btn.classList.toggle('is-visible', show);
    // Keep it out of the tab order while invisible.
    btn.tabIndex = show ? 0 : -1;
    btn.setAttribute('aria-hidden', String(!show));
  });

  on(btn, 'click', () => {
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    focusSafe(qs('.nav__brand'));
  });
}

/* ---------- newsletter ---------- */

function initNewsletterForm() {
  const form = qs('#newsletterForm');
  const status = qs('#newsletterStatus');
  if (!form) return;

  const email = form.elements.email;
  if (store.get(NEWS_KEY)) {
    email.value = '';
    email.placeholder = "You're on the list ✓";
    email.disabled = true;
    form.querySelector('button').disabled = true;
    status.textContent = 'Subscribed. Adoption alerts are on their way.';
    return;
  }

  on(form, 'submit', (e) => {
    e.preventDefault();
    const value = email.value.trim();
    if (!email.checkValidity()) {
      status.textContent = 'Please enter a valid email address.';
      email.focus();
      return;
    }

    // Demo mode — no provider wired up.
    store.set(NEWS_KEY, value);
    email.value = '';
    email.disabled = true;
    form.querySelector('button').disabled = true;
    email.placeholder = "You're on the list ✓";
    status.textContent = 'Subscribed. Adoption alerts are on their way.';
    track('newsletter_signup');
  });
}