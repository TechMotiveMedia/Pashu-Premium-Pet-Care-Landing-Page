"""Generate branded placeholder images for the Pashu site.

Run:  python tools/make-placeholders.py
Each file is written to the path the site already references, so
dropping a real photo over the top is all that's needed later.
"""

import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")
os.makedirs(ROOT, exist_ok=True)

PINE = (22, 48, 42)
PINE_SOFT = (30, 64, 56)
CREAM = (250, 243, 228)
AMBER = (227, 167, 60)
RUST = (193, 80, 46)

FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
FONT_BOLD_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def paw(draw, cx, cy, scale, colour):
    """A paw silhouette centred on (cx, cy). Toes overlap the pad so the
    whole shape reads as one solid mark."""
    s = scale

    # Four toes, arranged in an arc above the pad, overlapping its top edge.
    toes = [
        (-1.30, -1.05, 0.52, 0.72),   # left outer
        (-0.46, -1.62, 0.56, 0.78),   # left inner (tallest)
        (0.46, -1.62, 0.56, 0.78),    # right inner
        (1.30, -1.05, 0.52, 0.72),    # right outer
    ]
    for dx, dy, rx, ry in toes:
        draw.ellipse(
            [cx + (dx - rx) * s, cy + (dy - ry) * s, cx + (dx + rx) * s, cy + (dy + ry) * s],
            fill=colour,
        )

    # Main pad — wide, sitting low, its top edge tucked under the toes.
    draw.ellipse([cx - 1.55 * s, cy - 0.55 * s, cx + 1.55 * s, cy + 1.15 * s], fill=colour)


def make(name, w, h, label, tint, icon="paw", ratio_hint=None, bare=False):
    """bare=True renders just the paw (used for app icons, where text is illegible)."""
    path = os.path.join(ROOT, name)

    img = Image.new("RGB", (w, h), tint)
    draw = ImageDraw.Draw(img)

    # gentle vignette: darken the edges with a soft radial alpha mask
    steps = 60
    shade = Image.new("L", (w, h), 0)          # alpha of the dark layer
    sdraw = ImageDraw.Draw(shade)
    for i in range(steps):
        frac = i / steps                          # 0 = outer edge, 1 = centre
        inset_x = int(w * 0.5 * (1 - frac))
        inset_y = int(h * 0.5 * (1 - frac))
        sdraw.ellipse([inset_x, inset_y, w - inset_x, h - inset_y],
                      fill=int(70 * (1 - frac)))
    dark = Image.new("RGB", (w, h), tuple(max(0, c - 26) for c in tint))
    img = Image.composite(img, dark, shade)      # keep img where mask is opaque
    draw = ImageDraw.Draw(img)

    cx, cy = w / 2, h * 0.40
    scale = min(w, h) / 11

    if bare:
        # App icons: centred paw only, amber on pine, generous safe-area padding.
        paw(draw, cx, cy, min(w, h) / 8, AMBER)
        img.save(path, "PNG", optimize=True)
        print("wrote", os.path.relpath(path, os.path.dirname(ROOT)), f"({w}x{h}) [icon]")
        return

    paw(draw, cx, cy, scale, PINE_SOFT if tint != PINE_SOFT else PINE)

    # labels
    f_title = load_font(FONT_BOLD_CANDIDATES, max(15, int(min(w, h) / 15)))
    f_meta = load_font(FONT_CANDIDATES, max(11, int(min(w, h) / 22)))

    lines = textwrap.wrap(label, width=26)[:3]
    line_h = int(min(w, h) * 0.075)
    ty = cy + scale * 1.9

    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=f_title)
        draw.text(((w - (bbox[2] - bbox[0])) / 2, ty), line, font=f_title, fill=CREAM)
        ty += line_h

    ty += int(line_h * 0.35)
    meta = ratio_hint or f"{w} × {h}"
    bbox = draw.textbbox((0, 0), meta, font=f_meta)
    draw.text(((w - (bbox[2] - bbox[0])) / 2, ty), meta, font=f_meta, fill=AMBER)

    ty += (bbox[3] - bbox[1]) + 10
    note = "placeholder"
    bbox = draw.textbbox((0, 0), note, font=f_meta)
    draw.text(((w - (bbox[2] - bbox[0])) / 2, ty), note, font=f_meta, fill=CREAM)

    if name.lower().endswith((".jpg", ".jpeg")):
        img.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    else:
        img.save(path, "PNG", optimize=True)
    print("wrote", os.path.relpath(path, os.path.dirname(ROOT)), f"({w}x{h})")


SLOTS = [
    # hero
    ("hero-dog.jpg", 900, 900, "Hero — retriever", PINE, "1:1 · hero, primary"),
    ("hero-cat.jpg", 700, 700, "Hero — cat in suite", PINE_SOFT, "1:1 · hero, secondary"),
    # services
    ("service-food.jpg", 1000, 800, "Service 01 — fresh food", PINE_SOFT, "5:4 · service"),
    ("service-boarding.jpg", 1000, 800, "Service 02 — boarding suite", PINE, "5:4 · service"),
    ("service-walking.jpg", 1000, 800, "Service 03 — walking", PINE_SOFT, "5:4 · service"),
    # adoption
    ("pet-bruno.jpg", 800, 800, "Bruno — dog, available", PINE, "1:1 · adoption card"),
    ("pet-momo.jpg", 800, 800, "Momo — dog, in foster", PINE_SOFT, "1:1 · adoption card"),
    ("pet-simba.jpg", 800, 800, "Simba — cat, available", PINE, "1:1 · adoption card"),
    ("pet-guddu.jpg", 800, 800, "Guddu — senior dog", PINE_SOFT, "1:1 · adoption card"),
    ("pet-mishti.jpg", 800, 800, "Mishti — cat, recovery", PINE, "1:1 · adoption card"),
    ("pet-coco.jpg", 800, 800, "Coco — adopted", PINE_SOFT, "1:1 · adoption card"),
    # gallery
    ("gallery-1.jpg", 800, 800, "Gallery 1 — morning yard", PINE, "1:1 · gallery tile"),
    ("gallery-2.jpg", 800, 800, "Gallery 2 — wellness check", PINE_SOFT, "1:1 · gallery tile"),
    ("gallery-3.jpg", 800, 800, "Gallery 3 — sunbathing", PINE, "1:1 · gallery tile"),
    ("gallery-4.jpg", 800, 800, "Gallery 4 — pack walk", PINE_SOFT, "1:1 · gallery tile"),
    ("gallery-5.jpg", 800, 800, "Gallery 5 — dinner service", PINE, "1:1 · gallery tile"),
    ("gallery-6.jpg", 800, 800, "Gallery 6 — lights out", PINE_SOFT, "1:1 · gallery tile"),
]

SOCIAL = [
    # Open Graph / Twitter share card
    ("og-image.png", 1200, 630, "Pashu — Pet Care & Rescue", PINE, "1200 × 630 · social share card"),
    # iOS home-screen icon
    ("apple-touch-icon.png", 180, 180, "", PINE, "", True),
    # PWA manifest icons
    ("icon-192.png", 192, 192, "", PINE, "", True),
    ("icon-512.png", 512, 512, "", PINE, "", True),
]

if __name__ == "__main__":
    for slot in SLOTS:
        make(*slot)
    for entry in SOCIAL:
        if len(entry) == 6:
            make(*entry)
        else:
            name, w, h, label, tint, hint, bare = entry
            make(name, w, h, label, tint, ratio_hint=hint, bare=bare)
    print(f"\n{len(SLOTS) + len(SOCIAL)} placeholder images written to assets/img/")