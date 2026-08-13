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

/* ---------- Testimonials carousel ---------- */
const testimonials = [
  {
    quote: "The live camera is what sold me, but the fact that the same keeper stayed with Momo the whole week is why I'm never boarding anywhere else.",
    author: "— Aditi R., boarded a Labrador for 6 nights"
  },
  {
    quote: "Switched to Pashu's meal plan after our vet flagged Simba's weight. Three months in and he's back to his sprinting-across-the-hallway self.",
    author: "— Karan M., subscribed for a Persian cat"
  },
  {
    quote: "I get a photo and GPS map after every single walk. It sounds small until you've had a walker who 'forgot' to actually walk your dog before.",
    author: "— Neha S., daily walks for a Beagle"
  }
];

const testimonialEl = document.getElementById('testimonial');
const dotsEl = document.getElementById('testimonialDots');
let activeTestimonial = 0;

testimonials.forEach((_, i) => {
  const dot = document.createElement('span');
  if (i === 0) dot.classList.add('is-active');
  dot.addEventListener('click', () => setTestimonial(i));
  dotsEl.appendChild(dot);
});

function setTestimonial(index) {
  activeTestimonial = index;
  const t = testimonials[index];
  testimonialEl.style.opacity = 0;
  setTimeout(() => {
    testimonialEl.querySelector('.testimonial__quote').textContent = `“${t.quote}”`;
    testimonialEl.querySelector('.testimonial__author').textContent = t.author;
    testimonialEl.style.opacity = 1;
  }, 220);
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('is-active', i === index));
}
testimonialEl.style.transition = 'opacity .22s ease';

setInterval(() => {
  setTestimonial((activeTestimonial + 1) % testimonials.length);
}, 5500);

/* ---------- Booking form (mock — wire this to your API / React state later) ---------- */
const bookingForm = document.getElementById('bookingForm');
const bookingStatus = document.getElementById('bookingStatus');

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());

  // NOTE: this is a front-end mock. When converting to React, replace this
  // block with a real submission (POST /api/bookings) and use `data` as the payload.
  console.log('Booking request payload:', data);

  bookingStatus.textContent = `Thanks! We'll confirm ${data.petName || 'your pet'}'s ${data.service.toLowerCase()} request shortly.`;
  bookingStatus.classList.add('is-success');
  bookingForm.reset();

  setTimeout(() => {
    bookingStatus.textContent = '';
    bookingStatus.classList.remove('is-success');
  }, 6000);
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
