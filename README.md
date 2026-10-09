# Pashu — deployment & integration guide

Static site. No build step, no framework, no bundler. Upload the folder and it works.

---

## 1. Where things are

```
index.html              Single page. All content lives here.
styles.css              Design system + every style.
favicon.svg             Browser tab icon

js/
  config.js             ← CONTACT DETAILS, EMAILJS KEYS, IMAGE PATHS
  main.js               Entry point. Boots all features.
  core/
    dom.js              Query/event/scroll/focus helpers
    raf.js              Shared rAF scroll ticker (one listener for the page)
    motion.js           Reveal, count-up, magnetic buttons, tilt, parallax
  features/
    nav.js              Sticky nav, mobile drawer, scrollspy, smooth anchors
    carousel.js         Testimonials
    booking.js          Form validation + submit
    adopt.js            Adoption grid filters
    lightbox.js         Gallery image viewer
    pawTrail.js         Scroll progress paw marks
    theme.js            Dark mode
    misc.js             Year, emergency band, back-to-top, newsletter
  lib/
    analytics.js        Event tracking (no provider loaded by default)
    email.js            EmailJS adapter

assets/img/             ← ALL IMAGE SLOTS (see assets/img/README.md)
tools/make-placeholders.py   Regenerates placeholder images

site.webmanifest        PWA manifest
robots.txt, sitemap.xml Search engine files
```

---

## 2. Before you launch — content to replace

Everything below is a placeholder. The JS pulls contact details from
`js/config.js`, but the same values are **hardcoded in `index.html`** in several
places, so update both.

| What | Where | Currently |
|---|---|---|
| Phone number | `index.html` (emergency band, rescue card, footer, contact), `js/config.js` | `+91 12345 67890` |
| Email | `index.html` (footer, contact, privacy note), `js/config.js` | `hello@pashupets.com` |
| WhatsApp | `index.html` contact card, `js/config.js` | `wa.me/911234567890` |
| Address | `index.html` contact card, JSON-LD, `js/config.js` | `Survey No. 14, Kanchan Road, Kothrud` |
| Geo coords | JSON-LD, `js/config.js` | `18.5074, 73.8077` |
| Opening hours | `index.html` contact card, JSON-LD, `js/config.js` | Mon–Fri 08–20, Sat 08–20, Sun 09–14 |
| Licence no. | Footer, FAQ answer | `PMC/PB/2019/04417` |
| Vet name/licence | FAQ answer, `js/config.js` | `Dr. Anjali Menon`, `VC-4821` |
| Domain | `<link rel="canonical">`, OG tags, JSON-LD, `robots.txt`, `sitemap.xml`, `js/config.js` | `https://pashupets.com` |
| Stats | Hero, JSON-LD `aggregateRating`, `js/config.js` | 1,240 pets / 340 rescued / 4.9★ |
| Adoption pets | `#adopt` in `index.html` — names, ages, notes, **and photos** | 6 invented animals |

Find and replace fast:

```bash
# preview everything that needs changing
grep -rn "1234567890\|hello@pashupets\|PMC/PB\|18.5074\|pashupets.com" index.html js/config.js
```

### About the stats and reviews

`"aggregateRating": "4.9 / 318 reviews"` in the JSON-LD is **fake placeholder
data**. Google penalises structured data that doesn't match visible content, and
fake review markup can get you manually actioned. Either wire it to genuine
Google reviews, or delete the `aggregateRating` block before launch. Same applies
to the "340 animals rescued since 2019" claim — make sure it's true, or adjust it.

---

## 3. EmailJS setup

The form works right now in **demo mode** — it validates everything, shows a
success state and a reference number, but sends nothing.

### 3.1 Get your three IDs

1. Create a free account at [dashboard.emailjs.com](https://dashboard.emailjs.com)
2. **Account** → copy the **Public Key**
3. **Email Services** → connect your Gmail/Outlook → copy the **Service ID**
4. **Email Templates** → create a template → copy the **Template ID**

### 3.2 Create the template

In the template body, reference these variables (they match the form field
names exactly):

```
New {{service}} request

Pet:      {{petName}} ({{species}}{{breed}})
Owner:    {{ownerName}}
Phone:    {{phone}}

Start date: {{startDate}}   Nights: {{nights}}
Records on file: {{records}}

Condition: {{condition}}
Location:  {{location}}

Notes: {{notes}}

Ref: {{reference}}
Submitted: {{submitted}}
Via: {{utm}}
```

### 3.3 Fill in the keys

Edit `js/config.js`:

```js
export const EMAILJS = {
  USE_EMAILJS: true,              // ← flip this on
  PUBLIC_KEY: 'AbCdEf123',
  SERVICE_ID: 'service_abc123',
  TEMPLATE_ID: 'template_xyz789',
  RATE_LIMIT_MS: 1500,
};
```

That's it — no other file needs to change. `booking.js` automatically switches
from demo mode to sending via EmailJS.

### 3.4 Notes

- **Free tier is ~200 emails/month.** Enough for a small boarding business; upgrade if bookings grow.
- The SDK loads from a CDN **on first submit only** — no cost to page speed.
- Prefer a serverless function (Cloudflare Worker / Vercel function) instead if
  you need reliability. There's a clean seam for it: set `ENDPOINT` in
  `js/features/booking.js` to your route and it takes priority over EmailJS.

### 3.5 Newsletter

The footer newsletter form stores the address in `localStorage` only — it's a
placeholder. Wire it to Mailchimp/Buttondown, or point it at a second EmailJS
template.

---

## 4. Analytics

`js/lib/analytics.js` already emits events; nothing is sent anywhere yet
(`ANALYTICS.provider = 'none'` in `config.js`).

**Events tracked:** `booking_start`, `booking_error`, `booking_submit`,
`booking_success`, `booking_failed`, `booking_abandon`, `booking_spam_blocked`,
`adopt_filter`, `urgent_banner_dismissed`, `newsletter_signup`

**To enable Plausible** — add before `js/main.js`:

```html
<script defer data-domain="pashupets.com" src="https://plausible.io/js/script.js"></script>
```

then set `ANALYTICS.provider = 'plausible'`. Plausible is cookie-less and
privacy-friendly; for India that's the simplest option with no consent banner.

---

## 5. Deploying

Any static host works. Drag-and-drop in minutes:

| Host | How |
|---|---|
| **Netlify** | [app.netlify.com/drop](https://app.netlify.com/drop) — drag the folder |
| **Cloudflare Pages** | Connect repo → build command *leave blank* → output dir `/` |
| **Vercel** | `npx vercel --prod` |
| **GitHub Pages** | Push to `main`, enable Pages on the repo |

No build command. No output directory config beyond the repo root.

### After deploying

- [ ] Update the canonical URL in `index.html` + `js/config.js`
- [ ] Update `robots.txt` and `sitemap.xml` with the real domain
- [ ] Add a `netlify.toml` / `_headers` for caching:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] Set up a custom 404 that routes to `#book`
- [ ] Verify in Google Search Console + submit the sitemap
- [ ] Claim the Google Business Profile (biggest single driver of local search)
- [ ] List on Justdial / Sulekha / Practo for Indian pet-care search traffic

---

## 6. Testing checklist

```bash
python -m http.server 8000
# open http://localhost:8000
```

- [ ] Keyboard only: tab through the entire page, open the menu, change the
      service radio, submit the form, operate the gallery
- [ ] Narrow to 375px — drawer opens, no horizontal scroll
- [ ] Toggle dark mode; reload and confirm it persists
- [ ] OS "reduce motion" on — nothing animates, content is still visible
- [ ] JS disabled — content is readable (that's what the `no-js` class is for)
- [ ] Submit the form empty → error summary appears and takes focus
- [ ] Submit valid → spinner, success message, reference number
- [ ] Lighthouse: Performance / Accessibility / Best Practices / SEO

---

## 7. Browser support

Modern evergreen browsers. Uses ES modules, `:has()`, container queries,
`aspect-ratio`, `color-mix()`, IntersectionObserver and `<dialog>`.

Roughly: Chrome/Edge 111+, Firefox 121+, Safari 16.4+ (March 2023).

Every modern feature degrades gracefully — filters, lightbox and carousel all
work in older browsers via JS fallbacks; `:has()` only affects cosmetic
radio styling.