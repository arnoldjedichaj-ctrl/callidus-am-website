#!/usr/bin/env python
"""Setzt ein Line-Art-Bild auf ein druckfertiges A4-Ausmalblatt (300 dpi)
mit Titel oben und Name/Datum-Fusszeile unten.

Aufruf:
    python scripts/build-ausmalblatt.py <bild.png> "<Titel>" "<Untertitel>" [ausgabe.png]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# --- A4 @ 300 dpi ---
A4_W, A4_H = 2480, 3508
MARGIN = 150            # Aussenrand
FONT_DIR = Path("C:/Windows/Fonts")

def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)

def center_text(draw, cx, y, text, fnt, fill=(20, 20, 20)):
    l, t, r, b = draw.textbbox((0, 0), text, font=fnt)
    draw.text((cx - (r - l) / 2, y), text, font=fnt, fill=fill)
    return b - t

def build(src, titel, untertitel, out):
    art = Image.open(src).convert("RGBA")
    # Weisser Hintergrund unterlegen (falls Transparenz)
    bg = Image.new("RGBA", art.size, (255, 255, 255, 255))
    art = Image.alpha_composite(bg, art).convert("RGB")

    sheet = Image.new("RGB", (A4_W, A4_H), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    f_title = font("comicbd.ttf", 118)
    f_sub   = font("comic.ttf", 60)
    f_foot  = font("comicbd.ttf", 66)
    f_brand = font("comic.ttf", 44)

    # --- Titel ---
    y = MARGIN
    h = center_text(draw, A4_W / 2, y, titel, f_title)
    y += h + 55
    if untertitel:
        h2 = center_text(draw, A4_W / 2, y, untertitel, f_sub, fill=(90, 90, 90))
        y += h2 + 70
    else:
        y += 30

    # --- Bild einpassen ---
    foot_h = 320  # Platz fuer Fusszeile reservieren
    avail_w = A4_W - 2 * MARGIN
    avail_h = A4_H - y - foot_h - MARGIN
    scale = min(avail_w / art.width, avail_h / art.height)
    new_w, new_h = int(art.width * scale), int(art.height * scale)
    art_r = art.resize((new_w, new_h), Image.LANCZOS)
    px = int((A4_W - new_w) / 2)
    py = int(y + (avail_h - new_h) / 2)
    sheet.paste(art_r, (px, py))

    # --- Fusszeile: Name / Datum ---
    fy = A4_H - MARGIN - 180
    line_y = fy + 78
    label_name = "Name:"
    label_date = "Datum:"
    draw.text((MARGIN, fy), label_name, font=f_foot, fill=(20, 20, 20))
    lname_w = draw.textbbox((0, 0), label_name, font=f_foot)[2]
    name_line_start = MARGIN + lname_w + 40
    name_line_end = A4_W / 2 - 120
    draw.line([(name_line_start, line_y), (name_line_end, line_y)], fill=(20, 20, 20), width=5)

    date_x = A4_W / 2 + 140
    draw.text((date_x, fy), label_date, font=f_foot, fill=(20, 20, 20))
    ldate_w = draw.textbbox((0, 0), label_date, font=f_foot)[2]
    date_line_start = date_x + ldate_w + 40
    draw.line([(date_line_start, line_y), (A4_W - MARGIN, line_y)], fill=(20, 20, 20), width=5)

    # --- Branding ---
    center_text(draw, A4_W / 2, A4_H - MARGIN - 50,
                "callidus KIDS  ·  Callis Gesundheits-Kompass",
                f_brand, fill=(120, 120, 120))

    sheet.save(out, "PNG")
    print(f"OK -> {out}  ({sheet.width}x{sheet.height})")

if __name__ == "__main__":
    src = sys.argv[1]
    titel = sys.argv[2]
    untertitel = sys.argv[3] if len(sys.argv) > 3 else ""
    out = sys.argv[4] if len(sys.argv) > 4 else str(Path(src).with_name(Path(src).stem + "-a4.png"))
    build(src, titel, untertitel, out)
