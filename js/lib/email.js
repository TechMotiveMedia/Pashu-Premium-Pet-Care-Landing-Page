/* =========================================================
   PASHU — email transport (EmailJS)
   ------------------------------------------------------------
   Drop-in replacement for the demo transport in booking.js.

   Setup (one time):
   1. Load the SDK. Either add to index.html before js/main.js:
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
      or npm-install it and `import emailjs from '@emailjs/browser'`.
   2. Fill in your three IDs in js/config.js (EMAILJS block).
   3. Set EMAILJS.USE_EMAILJS = true.
   4. In the EmailJS dashboard, define template variables that MATCH
      the form field names below. The payload is built from the
      <input name="..."> values, so they line up 1:1.

   Free tier limit is roughly 200 emails/month — enough for a
   small boarding business, but upgrade if bookings take off.
   ========================================================= */

import { EMAILJS } from '../config.js';

/* Lazily loaded so the SDK is never fetched until it's needed. */
let sdkPromise = null;

async function loadSDK() {
  if (window.emailjs) return window.emailjs;

  if (!sdkPromise) {
    const CDN = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CDN;
      script.async = true;
      script.onload = () => resolve(window.emailjs);
      script.onerror = () => reject(new Error('EmailJS failed to load'));
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/**
 * Send one booking request.
 * Resolves with { ok, reference } or rejects with an Error.
 */
export async function sendBookingEmail(payload) {
  if (!EMAILJS.USE_EMAILJS) {
    throw new Error('EmailJS is not enabled (set EMAILJS.USE_EMAILJS = true)');
  }

  const emailjs = await loadSDK();

  emailjs.init({ publicKey: EMAILJS.PUBLIC_KEY });

  /* Trim the payload down to what a template actually needs.
     Anything not listed here is dropped before hitting EmailJS. */
  const templateParams = {
    // --- what you almost certainly want ---
    petName:    payload.petName || '',
    species:    payload.species || '',
    breed:      payload.breed || '',
    service:    payload.service || '',
    ownerName:  payload.ownerName || '',
    phone:      payload.phone || '',
    notes:      payload.notes || '—',
    reference:  payload.reference || '',

    // --- boarding extras ---
    startDate:  payload.startDate || '',
    nights:     payload.nights || '',
    records:    payload.records ? 'Yes' : 'No',

    // --- rescue-intake extras ---
    condition:  payload.condition || '',
    location:   payload.location || '',

    // --- context ---
    pageUrl:    payload.source || '',
    submitted:  payload.submittedAt || '',
    utm:        formatUTM(payload.utm),
  };

  const result = await emailjs.sendForm(
    EMAILJS.SERVICE_ID,
    EMAILJS.TEMPLATE_ID,
    templateParams,
  );

  // EmailJS resolves with { status: 200 } on success.
  if (result && result.status !== 200) {
    throw new Error(result.text || `HTTP ${result.status}`);
  }

  return { ok: true, reference: payload.reference };
}

/** Optional convenience for a "rescue desk" alias template. */
export async function sendRescueAlert(payload) {
  if (!EMAILJS.USE_EMAILJS) throw new Error('EmailJS is not enabled');
  const emailjs = await loadSDK();
  emailjs.init({ publicKey: EMAILJS.PUBLIC_KEY });
  return emailjs.sendForm(EMAILJS.SERVICE_ID, EMAILJS.TEMPLATE_ID, {
    alert: 'RESCUE INTAKE',
    phone: payload.phone || '',
    location: payload.location || '',
    condition: payload.condition || '',
    notes: payload.notes || '',
  });
}

function formatUTM(utm) {
  if (!utm || typeof utm !== 'object') return 'direct';
  const parts = Object.entries(utm).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join(' · ') : 'direct';
}