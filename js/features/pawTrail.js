/* =========================================================
   PASHU — paw trail
   ------------------------------------------------------------
   Paws light up progressively as you scroll the page.
   Uses the shared rAF ticker so there's no forced reflow,
   and the layout height is read once per resize.
   ========================================================= */

import { qs, prefersReducedMotion } from '../core/dom.js';
import { onScroll, remeasure } from '../core/raf.js';

const PAW_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 38c7-4 17-4 24 0 6 3 9 9 9 14 0 6-5 9-11 8-6-1-8-4-14-4s-8 3-14 4c-6 1-11-2-11-8 0-5 3-11 9-14z"/><ellipse cx="14" cy="20" rx="6" ry="8"/><ellipse cx="28" cy="12" rx="6" ry="8.5"/><ellipse cx="44" cy="12" rx="6" ry="8.5"/><ellipse cx="56" cy="22" rx="5.5" ry="7.5"/></svg>`;

const COUNT = 14;

export function initPawTrail() {
  const trail = qs('#pawTrail');
  if (!trail) return;
  if (prefersReducedMotion()) return;

  const paws = [];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < COUNT; i += 1) {
    const print = document.createElement('div');
    print.className = 'paw-trail__print';
    print.innerHTML = PAW_SVG;
    print.style.top = `${(i / COUNT) * 100}%`;
    print.style.left = i % 2 === 0 ? '0px' : '10px';
    frag.appendChild(print);
    paws.push(print);
  }
  trail.appendChild(frag);

  let lastLit = -1;

  onScroll((y, progress) => {
    const lit = Math.round(progress * COUNT);
    if (lit === lastLit) return;      // no DOM writes unless something changed
    lastLit = lit;
    paws.forEach((paw, i) => paw.classList.toggle('is-on', i < lit));
  });

  // Re-measure once late-loading images have settled the page height.
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => remeasure()).observe(document.body);
  }
}