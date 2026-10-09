# Image slots

Every image the site uses is here. **Drop a real photo over the top of any file
with the same name — no code changes needed.**

The current files are generated placeholders (a branded paw on pine, labelled
with what belongs there). They exist so nothing 404s and so you can see exactly
which slot needs which photo.

Regenerate the placeholders at any time:

```bash
python tools/make-placeholders.py
```

## Naming

Keep the **exact filenames and extensions**. `index.html` references these
paths directly.

| Slot | File | Size | Used for |
|---|---|---|---|
| Hero primary | `hero-dog.jpg` | 900×900 | Main hero image. Most visible image on the site. |
| Hero secondary | `hero-cat.jpg` | 700×700 | Overlapping hero image with the white border. |
| Service 01 | `service-food.jpg` | 1000×800 | Fresh food section. |
| Service 02 | `service-boarding.jpg` | 1000×800 | Boarding section. |
| Service 03 | `service-walking.jpg` | 1000×800 | Walking section. |
| Adoption | `pet-bruno.jpg` | 800×800 | Bruno — dog, available |
| Adoption | `pet-momo.jpg` | 800×800 | Momo — dog, in foster |
| Adoption | `pet-simba.jpg` | 800×800 | Simba — cat, available |
| Adoption | `pet-guddu.jpg` | 800×800 | Guddu — senior dog |
| Adoption | `pet-mishti.jpg` | 800×800 | Mishti — cat, in recovery |
| Adoption | `pet-coco.jpg` | 800×800 | Coco — adopted |
| Gallery 1 | `gallery-1.jpg` | 800×800 | Morning zoomies, Suite Yard B |
| Gallery 2 | `gallery-2.jpg` | 800×800 | Weekly wellness check |
| Gallery 3 | `gallery-3.jpg` | 800×800 | Afternoon sunbathing, Suite 9 |
| Gallery 4 | `gallery-4.jpg` | 800×800 | Evening pack walk, riverside route |
| Gallery 5 | `gallery-5.jpg` | 800×800 | Dinner service, 6:30pm |
| Gallery 6 | `gallery-6.jpg` | 800×800 | Lights out, all suites quiet |
| Social share | `og-image.png` | 1200×630 | Facebook / WhatsApp / X link previews |
| iOS icon | `apple-touch-icon.png` | 180×180 | Home-screen icon on iOS |
| PWA icon | `icon-192.png` | 192×192 | PWA manifest |
| PWA icon | `icon-512.png` | 512×512 | PWA manifest / splash screens |
| Favicon | `../favicon.svg` | — | Browser tab (vector, scales cleanly) |

## Guidelines

**Aspect ratio is fixed by CSS** — the site crops with `object-fit: cover`, so
you can supply a wider or taller original and it will still fill the frame
correctly. Compose your subject centred, though, since edges get trimmed.

**Shoot for these targets:**

| Concern | Target |
|---|---|
| Format | `.jpg` (already correct) or `.webp`/`.avif` if you change the extension in `index.html` too |
| Quality | 80–85% JPEG. Below 75 looks muddy on the pine background. |
| Hero images | Keep under 180 KB — this is the LCP element |
| Colour | Warm, natural light. The palette is warm cream/pine; cool or clinical photos clash. |
| Aspect | 1:1 for hero + pets + gallery, 5:4 for services |

**For the adoption cards specifically:** a clear, well-lit photo of the
individual animal's face. These drive emotional decisions — a portrait beats a
wide shot every time.

**For `og-image.png`:** this one is not a photo. It's a designed card with the
brand name, logo, tagline and your phone number — it appears when someone shares
your link on WhatsApp or Facebook. Design it separately and export at exactly
1200×630.

## Changing a filename

If you'd rather use different names (e.g. `.webp` for better compression):

1. Rename the files here.
2. Update the `src` / `data-full` attributes in `index.html`.
3. Update the `IMAGES` map in `js/config.js` (used as documentation and by the
   manifest tooling).

`favicon.svg` sits in the project root, not in this folder — keep it there, or
update the `<link rel="icon">` in `index.html`.