/* =========================================================
   PASHU — site configuration
   ------------------------------------------------------------
   Single place to change contact details, social handles,
   structured-data values and analytics. Everything else in
   the codebase reads from here (where practical) or hardcodes
   the same values in index.html — keep the two in sync.
   ========================================================= */

export const SITE = {
  name: 'Pashu Premium Pet Care',
  shortName: 'Pashu',
  url: 'https://pashupets.com',
  tagline: 'Premium pet care — boarding, food and walking, one animal at a time.',

  /* ---- contact ---- */
  phone: '+911234567890',
  phoneDisplay: '+91 12345 67890',
  whatsapp: 'https://wa.me/911234567890',
  email: 'hello@pashupets.com',
  pressEmail: 'press@pashupets.com',

  /* ---- address ---- */
  address: {
    street: 'Survey No. 14, Kanchan Road, Kothrud',
    locality: 'Pune',
    region: 'Maharashtra',
    postalCode: '411038',
    country: 'IN',
    geo: { lat: 18.5074, lng: 73.8077 },
  },

  /* ---- credentials (placeholder — replace before launch) ---- */
  licence: 'PMC/PB/2019/04417',
  vetName: 'Dr. Anjali Menon',
  vetLicence: 'VC-4821',
  foundedYear: 2019,

  /* ---- social ---- */
  social: {
    instagram: '',
    facebook: '',
    maps: 'https://maps.google.com/?q=Kothrud+Pune',
  },

  /* ---- opening hours (24h rescue desk is separate) ---- */
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '20:00' },
    { days: ['Saturday'], opens: '08:00', closes: '20:00' },
    { days: ['Sunday'], opens: '09:00', closes: '14:00' },
  ],

  /* ---- stats shown in the hero (animated count-up) ---- */
  stats: {
    petsHosted: 1240,
    animalsRescued: 340,
    rating: 4.9,
    reviewCount: 318,
  },
};

/* =========================================================
   EmailJS — drop your keys in and call sendBookingEmail()
   ------------------------------------------------------------
   1. npm i @emailjs/browser   (or load the CDN script)
   2. Put your three IDs below.
   3. Set USE_EMAILJS = true.
   4. Keep the <input> names in index.html in sync with the
      template variables you define in the EmailJS dashboard —
      the payload is built from the form, so names match 1:1.
   ========================================================= */

export const EMAILJS = {
  /* Flip this on when your keys are live. */
  USE_EMAILJS: false,

  /* From https://dashboard.emailjs.com  →  Account  →  Public Keys */
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',

  /* From  Email Services  →  Add New Service  →  the Service ID */
  SERVICE_ID: 'YOUR_SERVICE_ID',

  /* From  Email Templates  →  your template ID */
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID',

  /* Rate limiting — EmailJS free tier is ~200 emails/month. */
  RATE_LIMIT_MS: 1500,
};

/* =========================================================
   Analytics — add the provider script in index.html, then set one true.
   ========================================================= */

export const ANALYTICS = {
  /* 'none' | 'plausible' | 'ga4' */
  provider: 'none',
  plausibleDomain: 'pashupets.com',
  ga4MeasurementId: '',
};

/* =========================================================
   Assets — every image slot the site uses.
   ------------------------------------------------------------
   Drop your files into assets/img/ using these exact names and
   nothing else needs to change. See assets/img/README.md.
   Recommended: .webp or .avif, plus a .jpg fallback.
   ========================================================= */

export const IMAGES = {
  hero1: 'assets/img/hero-dog.jpg',
  hero2: 'assets/img/hero-cat.jpg',

  serviceFood: 'assets/img/service-food.jpg',
  serviceBoarding: 'assets/img/service-boarding.jpg',
  serviceWalking: 'assets/img/service-walking.jpg',

  petBruno: 'assets/img/pet-bruno.jpg',
  petMomo: 'assets/img/pet-momo.jpg',
  petSimba: 'assets/img/pet-simba.jpg',
  petGuddu: 'assets/img/pet-guddu.jpg',
  petMishti: 'assets/img/pet-mishti.jpg',
  petCoco: 'assets/img/pet-coco.jpg',

  gallery1: 'assets/img/gallery-1.jpg',
  gallery2: 'assets/img/gallery-2.jpg',
  gallery3: 'assets/img/gallery-3.jpg',
  gallery4: 'assets/img/gallery-4.jpg',
  gallery5: 'assets/img/gallery-5.jpg',
  gallery6: 'assets/img/gallery-6.jpg',

  og: 'assets/img/og-image.png',
  appleTouch: 'assets/img/apple-touch-icon.png',
};