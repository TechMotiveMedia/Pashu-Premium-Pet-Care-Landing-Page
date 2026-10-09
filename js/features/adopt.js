/* =========================================================
   PASHU — adoption grid filters
   ========================================================= */

import { qs, qsa, on, delegate } from '../core/dom.js';
import { track } from '../lib/analytics.js';

export function initAdoptFilters() {
  const grid = qs('#adoptGrid');
  const filters = qs('.adopt__filters');
  if (!grid || !filters) return;

  const chips = qsa('[data-filter]', filters);
  const empty = qs('#adoptEmpty');
  const pets = qsa('.pet', grid);

  /* Count what's actually in the markup, so the chip numbers can't lie. */
  chips.forEach((chip) => {
    const kind = chip.dataset.filter;
    const count = kind === 'all'
      ? pets.length
      : pets.filter((p) => matches(p, kind)).length;
    const badge = chip.querySelector('[data-role="count"]');
    if (badge) badge.textContent = count;
    chip.hidden = count === 0 && kind !== 'all';
  });

  const apply = (kind) => {
    let shown = 0;
    pets.forEach((pet) => {
      const visible = kind === 'all' || matches(pet, kind);
      pet.hidden = !visible;
      if (visible) shown += 1;
    });

    chips.forEach((chip) => {
      const active = chip.dataset.filter === kind;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });

    if (empty) empty.hidden = shown > 0;
    track('adopt_filter', { filter: kind, results: shown });
  };

  delegate(filters, 'click', '[data-filter]', (e, chip) => {
    e.preventDefault();
    apply(chip.dataset.filter);
  });

  // Expose for any future deep-linking (?type=dog).
  on(window, 'pashu:filter', (e) => apply(e.detail));
}

function matches(pet, kind) {
  if (kind === 'small') return pet.dataset.size === 'small';
  return pet.dataset.kind === kind;
}