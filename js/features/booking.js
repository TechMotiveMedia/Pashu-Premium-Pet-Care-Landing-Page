/* =========================================================
   PASHU — booking form
   ------------------------------------------------------------
   Validation, conditional fields, anti-spam, async submit,
   draft persistence and analytics. No dependencies.

   Wire `submitBooking()` to your real endpoint, or leave
   ENDPOINT null for demo mode (resolves locally).
   ========================================================= */

import { qs, qsa, on, store, scrollIntoViewSafe, focusSafe } from '../core/dom.js';
import { track } from '../lib/analytics.js';
import { EMAILJS } from '../config.js';
import { sendBookingEmail } from '../lib/email.js';

/* Set this to your API route to go live, e.g. '/api/bookings'.
   Leave null and the transport below picks EmailJS or demo mode. */
const ENDPOINT = null;
const TIMEOUT_MS = 10000;
const DRAFT_KEY = 'pashu_booking_draft';

export function initBooking() {
  const form = qs('#bookingForm');
  if (!form) return;

  const statusEl = qs('#bookingStatus');
  const submitBtn = qs('#bookingSubmit');
  const alertBox = qs('#formAlert');
  const alertList = qs('#formAlertList');
  const dateInput = qs('#startDate');

  const openedAt = performance.now();
  let started = false;

  /* ---------- set the date floor to today ---------- */
  if (dateInput) {
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    dateInput.min = local;
  }

  /* ---------- conditional fields ---------- */
  const conditional = qsa('[data-when-service]', form);
  const serviceInputs = qsa('input[name="service"]', form);

  const syncConditionals = () => {
    const chosen = serviceInputs.find((i) => i.checked)?.value;
    conditional.forEach((block) => {
      const match = block.dataset.whenService === chosen;
      block.hidden = !match;
      // Unhide shouldn't leave stale required values in the payload.
      qsa('input, select, textarea', block).forEach((input) => {
        if (!match && input.dataset.wasRequired !== undefined) {
          input.dataset.wasRequired = input.required ? '1' : '';
          input.required = false;
        }
        if (!match) input.dataset.wasRequired = input.required ? '1' : '';
      });
    });
  };
  serviceInputs.forEach((input) => on(input, 'change', syncConditionals));
  syncConditionals();

  /* ---------- validation ---------- */
  const rules = {
    petName: (v) => {
      if (!v.trim()) return "Tell us your pet's name.";
      if (v.trim().length > 60) return 'That name is a bit long — 60 characters max.';
      return '';
    },
    species: (v) => (v ? '' : 'Pick a species so we can prepare properly.'),
    ownerName: (v) => {
      if (!v.trim()) return 'We need a name to call you back.';
      if (v.trim().length < 2) return 'Please enter your full name.';
      return '';
    },
    phone: (v) => {
      const digits = v.replace(/\D/g, '');
      if (!digits) return 'A phone number is required — it is how we confirm.';
      if (digits.length < 8) return 'That number looks too short.';
      if (digits.length > 15) return 'That number looks too long.';
      return '';
    },
    startDate: (v) => {
      if (!v) return 'Pick a start date.';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(`${v}T00:00:00`) < today) return 'Pick today or later.';
      return '';
    },
  };

  const fields = Object.keys(rules);

  const fieldOf = (name) => form.elements[name]?.closest('.field, .field--service');
  const errorOf = (name) => qs(`#err-${name}`);

  const showError = (name, message) => {
    const input = form.elements[name];
    const wrap = fieldOf(name);
    const err = errorOf(name);
    if (!input || !wrap || !err) return;
    err.textContent = message;
    wrap.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) input.setAttribute('aria-describedby', `err-${name}`);
  };

  const validateField = (name) => {
    const input = form.elements[name];
    if (!input || input.closest('[hidden]')) return true;
    const message = rules[name](input.value || '');
    showError(name, message);
    return !message;
  };

  const validateAll = () => {
    const failed = [];
    fields.forEach((name) => { if (!validateField(name)) failed.push(name); });

    // Alert summary, focused so screen readers announce it.
    alertList.innerHTML = '';
    if (failed.length) {
      failed.forEach((name) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#err-${name}`;
        a.textContent = errorOf(name)?.textContent || 'This field needs attention.';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          form.elements[name]?.focus();
        });
        li.appendChild(a);
        alertList.appendChild(li);
      });
      alertBox.hidden = false;
      scrollIntoViewSafe(alertBox, { block: 'nearest' });
      focusSafe(alertBox);
      track('booking_error', { field: failed[0], count: failed.length });
    } else {
      alertBox.hidden = true;
    }
    return failed.length === 0;
  };

  // Validate on blur; re-validate live once a field is in error.
  fields.forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    on(input, 'blur', () => validateField(name));
    on(input, 'input', () => {
      if (fieldOf(name)?.classList.contains('has-error')) validateField(name);
      persistDraft();
    });
  });

  /* ---------- funnel analytics ---------- */
  form.addEventListener('focusin', () => {
    if (started) return;
    started = true;
    track('booking_start');
  });

  on(form, 'blur', () => {
    // Abandonment: left with partial data and nothing submitted.
    setTimeout(() => {
      if (document.activeElement && form.contains(document.activeElement)) return;
      if (form.dataset.submitted === '1') return;
      const data = new FormData(form);
      const touched = ['petName', 'ownerName', 'phone'].filter((k) => data.get(k));
      if (touched.length >= 2) track('booking_abandon', { fields: touched.length });
    }, 800);
  });

  /* ---------- draft persistence ---------- */
  let persistTimer;
  function persistDraft() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      const data = Object.fromEntries(new FormData(form).entries());
      store.set(DRAFT_KEY, data);
    }, 400);
  }

  const draft = store.get(DRAFT_KEY);
  if (draft) {
    Object.entries(draft).forEach(([key, value]) => {
      const input = form.elements[key];
      if (!input || value === null || value === undefined) return;
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value;
    });
    // Date drafts may now be in the past — clear rather than fail validation.
    if (form.elements.startDate && dateInput?.min && form.elements.startDate.value < dateInput.min) {
      form.elements.startDate.value = '';
    }
    syncConditionals();
  }

  /* ---------- status helper ---------- */
  const setStatus = (message, kind = '') => {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-success', kind === 'success');
    statusEl.classList.toggle('is-error', kind === 'error');
  };

  /* ---------- submit ---------- */
  on(form, 'submit', async (e) => {
    e.preventDefault();

    if (!validateAll()) return;

    // Anti-spam: honeypot + minimum time-on-form.
    const honey = form.elements.website?.value;
    const elapsed = performance.now() - openedAt;
    if (honey || elapsed < 2000) {
      track('booking_spam_blocked');
      setStatus('Thanks — we have your request.', 'success');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.source = window.location.href;
    data.submittedAt = new Date().toISOString();
    try {
      data.utm = JSON.parse(sessionStorage.getItem('pashu_utm') || '{}');
    } catch { data.utm = {}; }

    setBusy(true);
    setStatus('Sending…');

    try {
      const result = await submitBooking(data);
      const ref = result?.reference || makeReference();
      form.dataset.submitted = '1';

      setStatus(
        `Thanks ${data.petName || '—'}! Reference ${ref}. We'll confirm your ${String(data.service || 'request').toLowerCase()} within 3 hours.`,
        'success',
      );
      track('booking_submit', { service: data.service, species: data.species });
      track('booking_success', { reference: ref });

      submitBtn.classList.add('is-success');
      submitBtn.querySelector('.btn__label').textContent = 'Request received';

      store.remove(DRAFT_KEY);
      // Delay reset so the user can still read what they typed if needed.
      setTimeout(() => {
        form.reset();
        syncConditionals();
        submitBtn.classList.remove('is-success');
        submitBtn.querySelector('.btn__label').textContent = 'Send reservation request';
        form.dataset.submitted = '';
        setStatus('');
      }, 6000);
    } catch (err) {
      setStatus(
        `We couldn't send that just now (${err.message || 'network error'}). Your details are still here — please try again or call +91 12345 67890.`,
        'error',
      );
      track('booking_failed', { reason: err.message || 'unknown' });
    } finally {
      setBusy(false);
    }
  });

  function setBusy(busy) {
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.disabled = busy;
  }
}

/* ---------- transport ---------- */

async function submitBooking(payload) {
  const reference = makeReference();

  /* --- 1. EmailJS, if enabled in config --- */
  if (EMAILJS.USE_EMAILJS) {
    await sendBookingEmail({ ...payload, reference });
    return { ok: true, reference };
  }

  /* --- 2. A real HTTP endpoint, if one is set --- */
  if (ENDPOINT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, reference }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { ...json, reference: json.reference || reference };
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('timed out');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /* --- 3. Demo mode: nothing is sent --- */
  await new Promise((r) => setTimeout(r, 900));
  console.info('[Pashu] Booking payload (demo mode — nothing was sent):', payload);
  return { ok: true, reference, demo: true };
}

function makeReference() {
  return `PSH-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}