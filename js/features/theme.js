/* =========================================================
   PASHU — theme toggle
   Persists the choice and respects the OS preference on
   first visit. Applied before paint by an inline script.
   ========================================================= */

import { qs, on, store } from '../core/dom.js';

const KEY = 'pashu_theme';

export function initTheme() {
  const btn = qs('#themeToggle');
  const root = document.documentElement;

  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };

  sync();

  if (!btn) return;

  on(btn, 'click', () => {
    const dark = root.dataset.theme === 'dark';
    const next = dark ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set(KEY, next);
    sync();
  });

  // Follow the OS if the user has never chosen explicitly.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (store.get(KEY)) return;
    root.dataset.theme = e.matches ? 'dark' : 'light';
    sync();
  });
}