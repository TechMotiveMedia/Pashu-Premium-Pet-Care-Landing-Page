/* =========================================================
   PASHU — analytics
   ------------------------------------------------------------
   Queue events until a real provider is loaded, then flush.
   Works with Plausible (`window.plausible`) or GA4 (`gtag`).
   No provider is loaded by default — nothing is sent anywhere
   until you add the script.
   ========================================================= */

const queue = [];
const MAX_QUEUE = 50;

/** Push a custom event. */
export function track(name, props = {}) {
  const event = { name, props: { ...props, path: location.pathname }, at: Date.now() };

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, event.props);
    return;
  }

  // Plausible
  if (typeof window.plausible === 'function') {
    window.plausible(name, { props: event.props });
    return;
  }

  // No provider — buffer so nothing is lost, and stay inspectable in dev.
  queue.push(event);
  if (queue.length > MAX_QUEUE) queue.shift();
  if (import.meta.env?.DEV) console.debug('[analytics]', name, event.props);
}

/** Flush buffered events once a provider appears. */
export function initAnalytics() {
  const flush = () => {
    while (queue.length) {
      const { name, props } = queue.shift();
      track(name, props);
    }
  };

  // Providers load async; poll briefly then stop.
  let tries = 0;
  const timer = setInterval(() => {
    if (typeof window.gtag === 'function' || typeof window.plausible === 'function') {
      clearInterval(timer);
      flush();
    } else if (++tries > 20) {
      clearInterval(timer);
    }
  }, 400);
}

/** Read the UTM parameters captured on first load. */
export function getUTM() {
  try { return JSON.parse(sessionStorage.getItem('pashu_utm') || '{}'); }
  catch { return {}; }
}