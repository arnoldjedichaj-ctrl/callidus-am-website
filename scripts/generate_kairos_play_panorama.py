from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "kairos-play-store"
SRC = OUT / "original-screenshots"
W, H, PAN_W = 1080, 1920, 4320
SILVER = "#DCE6FF"
LILAC = "#B9ABFF"


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


def phone(screenshot_name, angle=0):
    source = Image.open(SRC / screenshot_name).convert("RGB")
    phone_w, phone_h = 640, 1260
    outer = Image.new("RGBA", (phone_w + 42, phone_h + 42), (0, 0, 0, 0))
    shadow = Image.new("RGBA", outer.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((20, 24, phone_w + 21, phone_h + 22), radius=65, fill=(0, 0, 0, 200))
    outer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)))
    draw = ImageDraw.Draw(outer)
    draw.rounded_rectangle((20, 12, phone_w + 20, phone_h + 12), radius=65, fill="#080B12", outline="#AAB8D3", width=4)
    screen = source.resize((phone_w - 30, phone_h - 58), Image.Resampling.LANCZOS).convert("RGBA")
    outer.paste(screen, (35, 41), rounded_mask(screen.size, 42))
    draw.rounded_rectangle((phone_w // 2 - 52, 26, phone_w // 2 + 52, 35), radius=5, fill="#293244")
    return outer.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)


def add_text(draw, panel, title, sub):
    x = panel * W + 66
    draw.text((x, 86), "KAIROS", font=font(36, True, True), fill=SILVER)
    draw.line((x, 143, x + 182, 143), fill=LILAC, width=3)
    draw.multiline_text((x, 185), title, font=font(43, True), fill="#FFFFFF", spacing=5)
    draw.multiline_text((x, 300), sub, font=font(24), fill="#D6DEEF", spacing=5)


def main():
    background = Image.open(OUT / "panorama-background.png").convert("RGB")
    panorama = background.resize((PAN_W, H), Image.Resampling.LANCZOS).convert("RGBA")
    draw = ImageDraw.Draw(panorama)
    features = [
        ("DEIN BEGLEITER\nFÜR DEN ALLTAG", "Ruhig. Aufmerksam.\nBestätigt."),
        ("DEIN DIGITAL\nTWIN", "NEXUS und MOMUS\nverständlich verbunden."),
        ("DEIN TAG.\nDEIN RHYTHMUS.", "Ein Check-in, der\nbei dir bleibt."),
        ("RUHE FÜR\nDEN KOPF", "Reflektieren.\nNeu sortieren."),
    ]
    for panel, (title, sub) in enumerate(features):
        add_text(draw, panel, title, sub)
    devices = [
        ("Screenshot_20260523-211414.jpg", (455, 505), -5),
        ("Screenshot_20260523-211434.jpg", (1390, 505), 5),
        ("Screenshot_20260713-215230.jpg", (2470, 505), -5),
        ("Screenshot_20260713-215240.jpg", (3550, 505), 5),
    ]
    for name, xy, angle in devices:
        panorama.alpha_composite(phone(name, angle), xy)
    draw = ImageDraw.Draw(panorama)
    draw.line((66, 1815, PAN_W - 66, 1815), fill=(173, 184, 222, 170), width=2)
    draw.text((66, 1840), "Dein Alltag. Klarer begleitet.", font=font(20, True), fill=SILVER)
    draw.text((PAN_W - 340, 1840), "callidus A&M", font=font(17, True), fill="#C4D0E5")
    for index in range(4):
        panorama.crop((index * W, 0, (index + 1) * W, H)).convert("RGB").save(OUT / f"kairos-panorama-{index + 1:02d}.png", quality=95)
    panorama.convert("RGB").save(OUT / "kairos-panorama-gesamtansicht.png", quality=95)


if __name__ == "__main__":
    main()
