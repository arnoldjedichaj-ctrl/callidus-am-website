from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "momus-play-store"
BACKGROUND = OUT / "background-phone.png"
REFERENCE = ROOT / "tmp-momus-play-reference.png"

W, H = 1080, 1920
PHONE = (365, 850, 727, 1665)
SCREEN = (384, 910, 708, 1636)

GOLD = "#E7B85E"
GOLD_LIGHT = "#FFE8AC"
INK = "#102329"
APP_BG = "#F4F8F7"
APP_TOP = "#627E87"
MINT = "#DCEFE9"
GREEN = "#3C9A72"
RED = "#D36366"


def font(size, bold=False, serif=False):
    candidates = []
    if serif:
        candidates += ["C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf"]
    candidates += [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for item in candidates:
        if Path(item).exists():
            return ImageFont.truetype(item, size)
    return ImageFont.load_default()


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def app_header(draw, title):
    x1, y1, x2, y2 = SCREEN
    draw.rounded_rectangle(SCREEN, radius=18, fill=APP_BG)
    draw.rectangle((x1, y1, x2, y1 + 67), fill=APP_TOP)
    draw.text((x1 + 16, y1 + 20), "MOMUS", font=font(14, True), fill="#FFFFFF")
    draw.text((x1 + 16, y1 + 45), title, font=font(10), fill="#E9F2F2")


def cockpit(draw):
    app_header(draw, "Cockpit")
    x1, y1, _, _ = SCREEN
    draw.text((x1 + 18, y1 + 91), "Deine Energie heute", font=font(15, True), fill=INK)
    rounded(draw, (x1 + 18, y1 + 124, x1 + 306, y1 + 282), 18, MINT)
    draw.text((x1 + 116, y1 + 143), "79", font=font(62, True), fill=GREEN)
    draw.text((x1 + 112, y1 + 214), "Energie-Score", font=font(13, True), fill=INK)
    bars = [("Schlaf", 84), ("Bewegung", 66), ("Balance", 77)]
    y = y1 + 310
    for label, value in bars:
        draw.text((x1 + 18, y), label, font=font(13, True), fill=INK)
        rounded(draw, (x1 + 18, y + 25, x1 + 286, y + 41), 8, "#DCE6E4")
        rounded(draw, (x1 + 18, y + 25, x1 + 18 + int(2.68 * value), y + 41), 8, GREEN)
        draw.text((x1 + 265, y), f"{value}%", font=font(12, True), fill=INK)
        y += 77
    draw.text((x1 + 18, y + 8), "Heute bewusst handeln.", font=font(14, True), fill=APP_TOP)


def analytics(draw):
    app_header(draw, "Analysen")
    x1, y1, _, _ = SCREEN
    draw.text((x1 + 18, y1 + 91), "Muster erkennen", font=font(16, True), fill=INK)
    rounded(draw, (x1 + 18, y1 + 122, x1 + 306, y1 + 320), 18, "#ECF3F4")
    for r, color in [(72, "#CDE6DD"), (55, "#89C9B3"), (38, GREEN)]:
        draw.ellipse((x1 + 90 - r, y1 + 220 - r, x1 + 90 + r, y1 + 220 + r), outline=color, width=12)
    draw.text((x1 + 68, y1 + 209), "72", font=font(28, True), fill=INK)
    draw.text((x1 + 172, y1 + 180), "Dein Rhythmus", font=font(13, True), fill=INK)
    draw.text((x1 + 172, y1 + 204), "stabilisiert sich", font=font(12), fill=APP_TOP)
    draw.text((x1 + 18, y1 + 352), "Energie im Verlauf", font=font(14, True), fill=INK)
    points = [(26, 500), (65, 470), (105, 490), (145, 423), (185, 442), (225, 387), (275, 402)]
    p = [(x1 + a, y1 + b) for a, b in points]
    draw.line(p, fill=GREEN, width=7, joint="curve")
    for px, py in p:
        draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill=GOLD)
    draw.text((x1 + 18, y1 + 548), "Klarheit für deinen nächsten Schritt.", font=font(13, True), fill=APP_TOP)


def documents(draw):
    app_header(draw, "Dokumente")
    x1, y1, _, _ = SCREEN
    draw.text((x1 + 18, y1 + 91), "Alles an einem Ort", font=font(16, True), fill=INK)
    cards = [("Meine Notizen", "Gedanken, die bleiben."), ("Gesundheitsdaten", "Sicher organisiert."), ("Wichtige Dokumente", "Schnell wiederfinden.")]
    y = y1 + 125
    colors = ["#E0F0EB", "#EDF2F4", "#FFF0D2"]
    for (heading, sub), color in zip(cards, colors):
        rounded(draw, (x1 + 18, y, x1 + 306, y + 115), 16, color)
        rounded(draw, (x1 + 34, y + 22, x1 + 80, y + 78), 9, "#FFFFFF")
        draw.rectangle((x1 + 45, y + 36, x1 + 68, y + 39), fill=APP_TOP)
        draw.rectangle((x1 + 45, y + 47, x1 + 70, y + 50), fill="#C3D4D5")
        draw.text((x1 + 98, y + 25), heading, font=font(13, True), fill=INK)
        draw.text((x1 + 98, y + 51), sub, font=font(11), fill=APP_TOP)
        y += 137
    rounded(draw, (x1 + 18, y + 8, x1 + 306, y + 64), 15, APP_TOP)
    draw.text((x1 + 99, y + 27), "+ Dokument hinzufügen", font=font(12, True), fill="#FFFFFF")


def games(draw):
    app_header(draw, "Spiele")
    x1, y1, _, _ = SCREEN
    draw.text((x1 + 18, y1 + 91), "Kopftraining", font=font(16, True), fill=INK)
    draw.text((x1 + 18, y1 + 116), "Fokus. Erinnerung. Reaktion.", font=font(12), fill=APP_TOP)
    tiles = [("MERKEN", "Gedächtnis"), ("FOKUS", "Konzentration"), ("REAKTION", "Schnelligkeit"), ("LOGIK", "Klar denken")]
    colors = ["#DDF0EA", "#E6EFF3", "#FFF0D2", "#EAE2F3"]
    y = y1 + 154
    for idx, ((big, small), color) in enumerate(zip(tiles, colors)):
        col = idx % 2
        if idx == 2:
            y += 152
        x = x1 + 18 + col * 145
        rounded(draw, (x, y, x + 127, y + 128), 17, color)
        draw.text((x + 15, y + 26), big, font=font(13, True), fill=INK)
        draw.text((x + 15, y + 52), small, font=font(10), fill=APP_TOP)
        draw.ellipse((x + 79, y + 78, x + 108, y + 107), outline=GREEN if col == 0 else GOLD, width=5)
    draw.text((x1 + 18, y + 162), "Dein Kopf kann mehr.", font=font(14, True), fill=APP_TOP)


def draw_screen(draw, mode):
    {"cockpit": cockpit, "analysen": analytics, "dokumente": documents, "spiele": games}[mode](draw)


def build(index, mode, title, subtitle):
    bg = Image.open(BACKGROUND).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    # Give each panel its own restrained color character while retaining a single series look.
    tints = [(0, 0, 0), (0, 16, 18), (13, 4, 0), (10, 0, 18)]
    tint = Image.new("RGB", (W, H), tints[index - 1])
    bg = Image.blend(bg, tint, 0.12)
    draw = ImageDraw.Draw(bg)

    draw.text((75, 88), "MOMUS", font=font(40, True, serif=True), fill=GOLD_LIGHT)
    draw.line((75, 150, 230, 150), fill=GOLD, width=3)
    draw.text((75, 205), title, font=font(48, True), fill="#FFFFFF")
    draw.multiline_text((75, 272), subtitle, font=font(28), fill="#DCE6E2", spacing=9)
    draw.text((75, 384), f"0{index}", font=font(18, True), fill=GOLD)
    draw.text((114, 384), "MOMUS FÜR DEINEN ALLTAG", font=font(16, True), fill="#CEB37C")

    # Replace the generated empty phone screen with an exact, legible MOMUS feature view.
    draw_screen(draw, mode)
    rounded(draw, (75, 1735, 1005, 1815), 24, "#1F2B2D")
    draw.text((108, 1758), "Einfach verstehen. Bewusst handeln.", font=font(22, True), fill=GOLD_LIGHT)
    draw.text((823, 1760), "callidus A&M", font=font(14, True), fill="#B9CCC7")
    bg.save(OUT / f"momus-play-{index:02d}-{mode}.png", quality=95)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    features = [
        ("cockpit", "DEIN ENERGIE-COCKPIT", "Sieh, was dir Energie gibt."),
        ("analysen", "MUSTER ERKENNEN", "Analysen, die Klarheit schaffen."),
        ("dokumente", "ALLES AN EINEM ORT", "Notizen und Dokumente im Blick."),
        ("spiele", "TRAINIERE DEINEN KOPF", "Kleine Spiele. Neue Impulse."),
    ]
    for index, (mode, title, subtitle) in enumerate(features, start=1):
        build(index, mode, title, subtitle)


if __name__ == "__main__":
    main()
