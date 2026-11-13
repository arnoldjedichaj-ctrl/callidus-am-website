"""Leseproben der Calli-Baende auf KDP-Select-Mass kuerzen (hoechstens 10 % des Buchs).

Behalten: Cover, Widmung, "Fuer dich/Kinder", die ersten zwei Story-Seiten von Kapitel 1
und die Schlussseite "Neugierig, wie es weitergeht?" (mit Amazon- statt Website-Hinweis).

Schreibt NICHT nach public/, sondern nach buchprojekt/select-umstellung/leseproben/.
Dateinamen bleiben identisch, damit sie beim Livegang 1:1 ueber die alten kopiert werden
koennen (Download-Pfade unter public/ duerfen sich nicht aendern).

Aufruf: python -I kuerze_leseproben.py
"""
import re, subprocess, tempfile, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/assets/kinderbuch"
OUT = ROOT / "buchprojekt/select-umstellung/leseproben"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUT.mkdir(parents=True, exist_ok=True)


def worte(s):
    s = re.sub(r'<(style|script|svg)\b.*?</\1>', '', s, flags=re.S)
    return len(re.sub(r'<[^>]+>', ' ', s).split())


for b in range(1, 7):
    name = f"callis-kompass-band{b}-leseprobe.html"
    d = (SRC / name).read_text(encoding="utf-8")
    secs = re.findall(r'<section\b[^>]*>.*?</section>', d, re.S)
    kopf, fuss = d[:d.index(secs[0])], d[d.index(secs[-1]) + len(secs[-1]):]
    # 0 Cover, 1 Widmung, 2 Fuer dich, 3 Eltern, 4 Kapitel 1, 5 zweite Story-Seite, ..., -1 Teaser
    behalten = [secs[0], secs[1], secs[2], secs[4], secs[5], secs[-1]]
    assert 'Kapitel 1' in secs[4] and 'Neugierig' in secs[-1], f"Band {b}: unerwartete Struktur"
    teaser = behalten[-1]
    teaser = teaser.replace('Das war die Leseprobe.', 'Das war ein kleiner Blick ins Buch.')
    teaser = re.sub(r'Jetzt erh(ä|&auml;)ltlich auf callidus-am\.de',
                    'Als Taschenbuch und Kindle-E-Book bei Amazon, im Kindle Unlimited-Abo zum Mitlesen', teaser)
    assert 'Amazon' in teaser, f"Band {b}: Teaser-Satz nicht gefunden"
    behalten[-1] = teaser
    neu = kopf + '\n'.join(behalten) + fuss
    neu = re.sub(r'<footer class="pageno[^"]*">\d+</footer>', '', neu)  # alte Seitenzahlen passen nicht mehr
    (OUT / name).write_text(neu, encoding="utf-8")

    # PDF (gibt es fuer Band 1-4) mit absoluten Bildpfaden rendern
    pdf_name = name.replace('.html', '.pdf')
    if (SRC / pdf_name).exists():
        lokal = neu.replace('src="/assets/', f'src="{(ROOT / "public/assets").as_uri()}/')
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "lp.html"
            p.write_text(lokal.replace('</style>', '@page{size:828px 1080px;margin:0} .page{margin:0;box-shadow:none;page-break-after:always} body{background:#fffaf0}</style>', 1), encoding="utf-8")
            subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                            f"--print-to-pdf={OUT / pdf_name}", p.as_uri()], check=True, capture_output=True)
    gesamt = worte(d); jetzt = worte(neu)
    print(f"Band {b}: {len(secs)} -> {len(behalten)} Seiten, {gesamt} -> {jetzt} Woerter"
          + (" + PDF" if (OUT / pdf_name).exists() else ""))
