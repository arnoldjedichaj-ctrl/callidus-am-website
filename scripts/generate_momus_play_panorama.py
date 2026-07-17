from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "momus-play-store"
SRC = OUT / "original-screenshots"
W, H, PAN_W = 1080, 1920, 4320
GOLD = "#E7B85E"
GOLD_LIGHT = "#FFE6A2"


def font(size, bold=False, serif=False):
    names = []
    if serif:
        names.append("C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf")
    names += [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *size), radius=radius, fill=255)
    return mask


def anonymize_documents(image):
    # The screenshot is real, but the contents of personal medical documents must not be published.
    w, h = image.size
    result = image.copy()
    for box in [(0, int(h * .20), w, int(h * .67))]:
        crop = image.crop(box).filter(ImageFilter.GaussianBlur(22))
        result.paste(crop, box)
    return result


def phone(screenshot_name, angle=0, obscure_documents=False):
    source = Image.open(SRC / screenshot_name).convert("RGB")
    if obscure_documents:
        source = anonymize_documents(source)
    phone_w, phone_h = 640, 1260
    outer = Image.new("RGBA", (phone_w + 42, phone_h + 42), (0, 0, 0, 0))
    shadow = Image.new("RGBA", outer.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((20, 24, phone_w + 21, phone_h + 22), radius=65, fill=(0, 0, 0, 190))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    outer.alpha_composite(shadow)
    draw = ImageDraw.Draw(outer)
    draw.rounded_rectangle((20, 12, phone_w + 20, phone_h + 12), radius=65, fill="#141517", outline="#E2B562", width=4)
    screen = source.resize((phone_w - 30, phone_h - 58), Image.Resampling.LANCZOS).convert("RGBA")
    screen_mask = rounded_mask(screen.size, 42)
    outer.paste(screen, (35, 41), screen_mask)
    # Speaker slot makes the existing screenshot read as a premium device mock-up.
    draw.rounded_rectangle((phone_w // 2 - 52, 26, phone_w // 2 + 52, 35), radius=5, fill="#24282B")
    return outer.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)


def paste_phone(canvas, screenshot, xy, angle, blur=False):
    device = phone(screenshot, angle, blur)
    canvas.alpha_composite(device, xy)


def add_panel_text(draw, panel, title, sub):
    x = panel * W + 66
    draw.text((x, 86), "MOMUS", font=font(36, True, True), fill=GOLD_LIGHT)
    draw.line((x, 143, x + 182, 143), fill=GOLD, width=3)
    draw.multiline_text((x, 185), title, font=font(43, True), fill="#FFFFFF", spacing=5)
    draw.multiline_text((x, 300), sub, font=font(24), fill="#D7DDD8", spacing=5)


def main():
    bg_source = Image.open(OUT / "panorama-background.png").convert("RGB")
    # The source is a generated continuous landscape. This single resize creates one shared backdrop.
    panorama = bg_source.resize((PAN_W, H), Image.Resampling.LANCZOS).convert("RGBA")
    draw = ImageDraw.Draw(panorama)
    features = [
        ("DEIN ENERGIE-\nCOCKPIT", "Energie, Impulse\nund Wissen im Blick."),
        ("NUTZUNG\nVERSTEHEN", "Dein Handyverhalten\nklar analysiert."),
        ("DOKUMENTE\nIM BLICK", "Privat organisiert.\nSchnell wiedergefunden."),
        ("KOPF\nTRAINIEREN", "Kleine Spiele.\nNeue Impulse."),
    ]
    for panel, (title, sub) in enumerate(features):
        add_panel_text(draw, panel, title, sub)
    # Every phone slightly crosses into the next image. On Play's horizontal screenshot rail,
    # the gold landscape and the angled devices appear as a single continuous campaign image.
    paste_phone(panorama, "Screenshot_20260523-205339.jpg", (455, 505), -5)
    paste_phone(panorama, "Screenshot_20260523-205234.jpg", (1390, 505), 5)
    paste_phone(panorama, "Screenshot_20260523-205245.jpg", (2470, 505), -5, blur=True)
    paste_phone(panorama, "Screenshot_20260523-205256.jpg", (3550, 505), 5)
    # One continuous, unobtrusive footer line reinforces that the four files form one panorama.
    draw = ImageDraw.Draw(panorama)
    draw.line((66, 1815, PAN_W - 66, 1815), fill=(208, 163, 82, 170), width=2)
    draw.text((66, 1840), "Klar sehen. Bewusst handeln.", font=font(20, True), fill=GOLD_LIGHT)
    draw.text((PAN_W - 340, 1840), "callidus A&M", font=font(17, True), fill="#C4D0CC")
    for index in range(4):
        crop = panorama.crop((index * W, 0, (index + 1) * W, H)).convert("RGB")
        crop.save(OUT / f"momus-panorama-{index + 1:02d}.png", quality=95)
    panorama.convert("RGB").save(OUT / "momus-panorama-gesamtansicht.png", quality=95)


if __name__ == "__main__":
    main()
