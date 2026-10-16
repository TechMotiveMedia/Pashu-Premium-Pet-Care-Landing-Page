// ============================================================
// PASHU — interactions
// ============================================================

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Nav shrink on scroll ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 30);
}, { passive: true });

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Paw trail signature: paws "walk" down the page as you scroll ---------- */
const PAW_SVG = `<svg viewBox="0 0 64 64"><path d="M20 38c7-4 17-4 24 0 6 3 9 9 9 14 0 6-5 9-11 8-6-1-8-4-14-4s-8 3-14 4c-6 1-11-2-11-8 0-5 3-11 9-14z"/><ellipse cx="14" cy="20" rx="6" ry="8"/><ellipse cx="28" cy="12" rx="6" ry="8.5"/><ellipse cx="44" cy="12" rx="6" ry="8.5"/><ellipse cx="56" cy="22" rx="5.5" ry="7.5"/></svg>`;

const trail = document.getElementById('pawTrail');
const PAW_COUNT = 14;
const paws = [];
for (let i = 0; i < PAW_COUNT; i++) {
  const p = document.createElement('div');
  p.className = 'paw-trail__print';
  p.innerHTML = PAW_SVG;
  p.style.top = `${(i / PAW_COUNT) * 100}%`;
  p.style.left = i % 2 === 0 ? '0px' : '10px';
  trail.appendChild(p);
  paws.push(p);
}

function updatePawTrail() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  const litCount = Math.round(progress * PAW_COUNT);
  paws.forEach((paw, i) => paw.classList.toggle('is-on', i < litCount));
}
window.addEventListener('scroll', updatePawTrail, { passive: true });
updatePawTrail();

/* ---------- Custom service dropdown (block design) ---------- */
const serviceSelect = document.getElementById('serviceSelect');
let resetServiceSelect = () => {};

if (serviceSelect) {
  const trigger = document.getElementById('serviceTrigger');
  const valueEl = trigger.querySelector('.select__value');
  const menu = document.getElementById('serviceMenu');
  const input = document.getElementById('serviceInput');
  const options = Array.from(menu.querySelectorAll('.select__option'));
  let activeIndex = -1;

  const isOpen = () => serviceSelect.classList.contains('is-open');
  const openMenu = () => { serviceSelect.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); };
  const closeMenu = () => {
    serviceSelect.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    options.forEach(o => o.classList.remove('is-active'));
    activeIndex = -1;
  };
  const setActive = (i) => {
    activeIndex = i;
    options.forEach((o, idx) => o.classList.toggle('is-active', idx === i));
    if (i > -1) options[i].scrollIntoView({ block: 'nearest' });
  };
  const choose = (opt) => {
    input.value = opt.dataset.value;
    valueEl.textContent = opt.dataset.value;
    valueEl.classList.remove('is-placeholder');
    options.forEach(o => o.setAttribute('aria-selected', String(o === opt)));
    serviceSelect.classList.remove('has-error');
    closeMenu();
    trigger.focus();
  };

  trigger.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen()) openMenu(); setActive(Math.min(activeIndex + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen()) openMenu(); setActive(Math.max(activeIndex - 1, 0)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (isOpen() && activeIndex > -1) choose(options[activeIndex]); else openMenu(); }
    else if (e.key === 'Escape') { closeMenu(); }
  });
  options.forEach((opt, i) => {
    opt.addEventListener('click', () => choose(opt));
    opt.addEventListener('mousemove', () => { if (activeIndex !== i) setActive(i); });
  });
  document.addEventListener('click', (e) => { if (!serviceSelect.contains(e.target)) closeMenu(); });

  resetServiceSelect = () => {
    input.value = '';
    valueEl.textContent = 'Select a service';
    valueEl.classList.add('is-placeholder');
    options.forEach(o => o.setAttribute('aria-selected', 'false'));
    serviceSelect.classList.remove('has-error');
    closeMenu();
  };
}

/* ---------- Service cards: clamp the copy and offer "Read more" ---------- */
const svcCards = document.querySelectorAll('.svc');

// Only reveal the toggle on cards whose copy is actually clipped.
const measureSvcCards = () => {
  svcCards.forEach((card) => {
    if (card.classList.contains('is-open') || card.classList.contains('is-hidden')) return;
    const text = card.querySelector('.svc__text');
    const more = card.querySelector('.svc__more');
    if (!text || !more) return;
    more.classList.toggle('is-shown', text.scrollHeight > text.clientHeight + 2);
  });
};

svcCards.forEach((card) => {
  const more = card.querySelector('.svc__more');
  if (!more) return;
  more.addEventListener('click', () => {
    const open = card.classList.toggle('is-open');
    more.textContent = open ? 'Show less' : 'Read more';
    more.setAttribute('aria-expanded', String(open));
  });
});

measureSvcCards();
window.addEventListener('load', measureSvcCards);
window.addEventListener('resize', measureSvcCards);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSvcCards);

/* ---------- Services carousel ---------- */
const servicesViewport = document.getElementById('servicesViewport');
const servicesTrack = document.getElementById('servicesTrack');
const servicesProgressBar = document.getElementById('servicesProgress');

let refreshServicesCarousel = () => {};

if (servicesViewport && servicesTrack) {
  const prevBtn = document.getElementById('svcPrev');
  const nextBtn = document.getElementById('svcNext');

  const visibleCards = () =>
    Array.from(servicesTrack.querySelectorAll('.svc:not(.is-hidden)'));

  // One card per step, including the gap that follows it.
  const stepSize = () => {
    const cards = visibleCards();
    if (!cards.length) return servicesViewport.clientWidth;
    const gap = parseFloat(getComputedStyle(servicesTrack).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  };

  const updateCarousel = () => {
    const maxScroll = servicesViewport.scrollWidth - servicesViewport.clientWidth;
    const atStart = servicesViewport.scrollLeft <= 2;
    const atEnd = servicesViewport.scrollLeft >= maxScroll - 2;

    if (prevBtn) prevBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd || maxScroll <= 2;

    if (servicesProgressBar) {
      const ratio = servicesViewport.scrollWidth > 0
        ? servicesViewport.clientWidth / servicesViewport.scrollWidth
        : 1;
      const w = Math.min(Math.max(ratio, 0.12), 1);
      const p = maxScroll > 0 ? servicesViewport.scrollLeft / maxScroll : 0;
      servicesProgressBar.style.width = `${w * 100}%`;
      servicesProgressBar.style.transform = `translateX(${(p * (1 - w) / w) * 100}%)`;
    }
  };

  const scrollByCard = (dir) => {
    servicesViewport.scrollBy({ left: dir * stepSize(), behavior: 'smooth' });
  };

  if (prevBtn) prevBtn.addEventListener('click', () => scrollByCard(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollByCard(1));

  servicesViewport.addEventListener('scroll', updateCarousel, { passive: true });
  servicesViewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCard(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCard(-1); }
  });

  /* Drag with the mouse to browse the row (touch scrolls natively). */
  let isDown = false, dragMoved = false, startX = 0, startScroll = 0;
  servicesViewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    isDown = true; dragMoved = false;
    startX = e.clientX; startScroll = servicesViewport.scrollLeft;
    servicesViewport.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragMoved = true;
    servicesViewport.scrollLeft = startScroll - dx;
  });
  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    servicesViewport.classList.remove('is-dragging');
    // Let the click that ends the drag fire first, then clear the flag.
    setTimeout(() => { dragMoved = false; }, 0);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // Swallow the click that ends a drag so cards don't open by accident.
  servicesViewport.addEventListener('click', (e) => {
    if (!dragMoved) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  window.addEventListener('resize', updateCarousel);
  window.addEventListener('load', updateCarousel);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateCarousel);

  refreshServicesCarousel = () => {
    servicesViewport.scrollTo({ left: 0, behavior: 'auto' });
    updateCarousel();
  };

  updateCarousel();
}

/* ---------- Services: reveal the whole row when the section enters view ---------- */
const servicesSection = document.querySelector('.services');
if (servicesSection) {
  const svcReveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      svcCards.forEach((card, i) => {
        // Stagger only the first cards so later ones are ready when scrolled to.
        card.style.transitionDelay = `${Math.min(i, 7) * 50}ms`;
        card.classList.add('is-visible');
      });
      // Drop the stagger afterwards so hover effects stay instant.
      setTimeout(() => {
        svcCards.forEach((card) => { card.style.transitionDelay = ''; });
      }, 1300);
      svcReveal.disconnect();
    });
  }, { threshold: 0.1 });
  svcReveal.observe(servicesSection);
}

/* ---------- Service showcase: filter by category ---------- */
const servicesFilter = document.querySelector('.services__filters');

if (servicesFilter) {
  const chips = Array.from(servicesFilter.querySelectorAll('.chip'));

  chips.forEach((chip, i) =>
    chip.setAttribute('aria-pressed', String(i === 0))
  );

  servicesFilter.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    const filter = chip.dataset.filter;

    chips.forEach((c) => {
      const active = c === chip;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', String(active));
    });

    const revealed = [];
    svcCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
      card.classList.remove('svc-pop');
      if (show) revealed.push(card);
    });

    // restart the entrance animation on the cards that stay visible
    requestAnimationFrame(() => revealed.forEach((c) => c.classList.add('svc-pop')));

    // return the carousel to the start and refresh controls for the new set
    refreshServicesCarousel();

    measureSvcCards();
  });
}

/* ---------- Contact / booking form (EmailJS) ---------- */
const bookingForm = document.getElementById('bookingForm');
const bookingStatus = document.getElementById('bookingStatus');
const bookingSubmit = bookingForm.querySelector('button[type="submit"]');

// --- EmailJS configuration -----------------------------------------------
// Only the PUBLIC key is safe in client-side code. NEVER put the EmailJS
// private key here — it belongs on a server, not in a file browsers download.
const EMAILJS_PUBLIC_KEY = 'qoKF4W0c7JUp1fUOu';
const EMAILJS_SERVICE_ID = 'service_y1fpymd';
const EMAILJS_TEMPLATE_ID = 'template_heojep4';
// -------------------------------------------------------------------------

// --- WhatsApp hand-off ----------------------------------------------------
const PASHU_WHATSAPP = '919403183091';
// How long to show the on-page confirmation before jumping to WhatsApp.
// Set to 0 for an immediate redirect.
const WHATSAPP_REDIRECT_DELAY = 1200;
// -------------------------------------------------------------------------

const setStatus = (message, isSuccess) => {
  bookingStatus.textContent = message;
  bookingStatus.classList.toggle('is-success', Boolean(isSuccess));
};

// Build a wa.me link pre-filled with the enquiry details.
const buildWhatsAppUrl = (data) => {
  const dash = '—';
  const lines = [
    `Hi Pashu! I'd like to enquire about ${data.service}.`,
    '',
    `Pet's name: ${data.petName || dash}`,
    `Species: ${data.species || dash}`,
    `Service needed: ${data.service}`,
    `Preferred start date: ${data.startDate || dash}`,
    `Phone: ${data.phone || dash}`,
  ];
  if (data.notes) lines.push(`Notes: ${data.notes}`);

  return `https://wa.me/${PASHU_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
};

// Send the visitor to WhatsApp with the details pre-filled.
const redirectToWhatsApp = (data, delay = WHATSAPP_REDIRECT_DELAY) => {
  const url = buildWhatsAppUrl(data);
  if (delay > 0) {
    setTimeout(() => { window.location.href = url; }, delay);
  } else {
    window.location.href = url;
  }
  return url;
};

if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());

  if (!data.service) {
    serviceSelect.classList.add('has-error');
    document.getElementById('serviceTrigger').focus();
    setStatus('Please choose a service for your enquiry.', false);
    return;
  }

  const originalLabel = bookingSubmit.textContent;
  bookingSubmit.disabled = true;
  bookingSubmit.textContent = 'Sending…';
  setStatus('Sending your request…', false);

  const payload = {
    petName: data.petName,
    species: data.species,
    service: data.service,
    startDate: data.startDate,
    phone: data.phone,
    notes: data.notes || '—',
    submittedAt: new Date().toLocaleString(),
  };

  try {
    if (!window.emailjs) throw new Error('EmailJS SDK not loaded');

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);

    setStatus(
      `Thanks! We've received your enquiry about ${data.service}${data.petName ? ` for ${data.petName}` : ''}. Opening WhatsApp to confirm…`,
      true
    );
  } catch (err) {
    console.error('EmailJS error:', err);
    setStatus('Email could not be sent — opening WhatsApp so you can message us directly…', false);
  } finally {
    bookingSubmit.disabled = false;
    bookingSubmit.textContent = originalLabel;
  }

  // Always hand the visitor over to WhatsApp with their details pre-filled.
  redirectToWhatsApp(data);
});

/* ---------- Smooth nav active link on click (mobile-friendly anchor scroll handled natively) ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
