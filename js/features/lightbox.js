/* =========================================================
   PASHU — gallery lightbox
   Uses <dialog> for free focus management, Esc and backdrop.
   ========================================================= */

import { qs, qsa, on } from '../core/dom.js';

export function initLightbox() {
  const dialog = qs('#lightbox');
  if (!dialog) return;

  const img = qs('#lightboxImg');
  const caption = qs('#lightboxCaption');
  const closeBtn = qs('.lightbox__close');
  const prevBtn = qs('.lightbox__arrow--prev');
  const nextBtn = qs('.lightbox__arrow--next');

  const triggers = qsa('.gallery__btn');
  if (!triggers.length) return;

  let index = 0;

  const show = (i) => {
    index = (i + triggers.length) % triggers.length;
    const btn = triggers[index];
    img.src = btn.dataset.full || btn.querySelector('img')?.src || '';
    img.alt = btn.querySelector('img')?.alt || '';
    caption.textContent = btn.dataset.caption || '';
  };

  triggers.forEach((btn, i) => {
    on(btn, 'click', () => {
      show(i);
      dialog.showModal();
    });
  });

  closeBtn?.addEventListener('click', () => dialog.close());
  prevBtn?.addEventListener('click', () => show(index - 1));
  nextBtn?.addEventListener('click', () => show(index + 1));

  // Click the backdrop (i.e. the dialog element itself) to close.
  on(dialog, 'click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  on(dialog, 'keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(index - 1); }
  });

  // Restore focus to the trigger that opened the dialog.
  on(dialog, 'close', () => {
    triggers[index]?.focus();
  });
}