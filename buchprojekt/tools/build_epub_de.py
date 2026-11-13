"""Kindle-EPUB 3 (umfliessend) aus dem deutschen KDP-Druck-HTML eines Calli-Bands bauen.

Aufruf: python -I build_epub_de.py BAND
Liest   kinderbuch-bandN/bandN-kdp-print.html + public/assets/media/.../print/*.jpg
Schreibt kinderbuch-bandN/Callis-Kompass-BandN-Kindle.epub

Abgeleitet von english-edition/tools/build_epub.py. Bilder werden auf 700 px Breite
verkleinert (KDP-Liefergebuehr 0,12 EUR/MB in DE), Cover als JPEG 1600x2560.
"""
import re, sys, uuid, zipfile, os, io, html as H
from datetime import datetime, timezone
from PIL import Image

BAND = int(sys.argv[1])
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # buchprojekt/
BDIR = os.path.join(ROOT, f'kinderbuch-band{BAND}')
SRC = os.path.join(BDIR, f'band{BAND}-kdp-print.html')
COVER = os.path.join(BDIR, f'cover-band{BAND}-ebook.png')
OUT = os.path.join(BDIR, f'Callis-Kompass-Band{BAND}-Kindle.epub')
IMG_W = 700

doc = open(SRC, encoding='utf-8').read()
SUB = {1: 'Hör auf deinen Körper', 2: 'Das Zucker-Monster', 3: 'Der Zappelmotor',
       4: 'Die Schlaf-Werkstatt', 5: 'Das Gefühls-Wetter', 6: 'Die Abwehr-Polizei'}
title = f'Callis Gesundheits-Kompass – Band {BAND}: {SUB[BAND]}'
secs = re.findall(r'<section class="([^"]*)">(.*?)</section>', doc, re.S)


def clean(s):
    s = re.sub(r'<svg.*?</svg>', '', s, flags=re.S)
    s = re.sub(r'<div class="(wash|ornament|divi|g-line|dline)[^"]*"[^>]*>(</div>)?', '', s)
    s = re.sub(r'<span class="dline"></span>', '', s)
    s = re.sub(r'<footer.*?</footer>', '', s, flags=re.S)
    s = re.sub(r'<div class="(medaillon|e-banner)"[^>]*>.*?</div>', '', s, flags=re.S)
    s = re.sub(r'<div class="step"><div class="step-num">\d+</div><p>(.*?)</p></div>', r'<li>\1</li>', s, flags=re.S)
    s = re.sub(r'<div class="fact"><span class="ndl"></span><p>(.*?)</p></div>', r'<li>\1</li>', s, flags=re.S)
    s = s.replace('<div class="d-steps">', '<ol>').replace('<div class="c-facts">', '<ul>')
    s = re.sub(r'<div class="e-ribbon">(.*?)</div>', r'<p class="kicker">\1</p>', s, flags=re.S)
    s = re.sub(r'<div class="calli-satz">', '<div class="satz">', s)
    s = re.sub(r'<div class="d-dialog">', '<div class="dialog">', s)
    s = re.sub(r'(</li>)\s*</div>', lambda m: m.group(1) + '</LISTEND>', s)
    s = re.sub(r'(<ol>.*?)</LISTEND>', r'\1</ol>', s, flags=re.S)
    s = re.sub(r'(<ul>.*?)</LISTEND>', r'\1</ul>', s, flags=re.S)
    s = re.sub(r'\sstyle="[^"]*"', '', s)
    s = re.sub(r'<p class="g-p ded">', '<p class="ded">', s)
    s = re.sub(r'<p class="g-p"[^>]*>', '<p>', s)
    s = re.sub(r'<div class="(c-body|c-head|a-copy|e-body|g-body)[^"]*">', '<div>', s)
    s = re.sub(r'<div class="a-art"><img ', '<div class="art"><img ', s)
    for _ in range(4):
        s = re.sub(r'<div>(.*?)</div>', r'\1', s, flags=re.S)
    s = re.sub(r'<p[^>]*>\s*</p>', '', s)
    s = re.sub(r'<strong>\s*</strong>', '', s)
    s = re.sub(r'<br>', '<br/>', s)
    s = re.sub(r'(<img [^>]*?)\s*/?>', r'\1/>', s)
    s = s.replace('&nbsp;', '&#160;').replace('&middot;', '&#183;')
    s = re.sub(r'&(?!#?\w+;)', '&amp;', s)  # nacktes & ist in XHTML ungueltig
    s = re.sub(r'„([^"„“<]*)"', '„\\1“', s)  # deutsches Schlusszeichen statt geradem "
    s = re.sub(r'\n\s*\n', '\n', s)
    out, depth = [], 0
    for tok in re.split(r'(<div[^>]*>|</div>)', s):
        if tok.startswith('<div'):
            depth += 1
        elif tok == '</div>':
            if depth == 0:
                continue
            depth -= 1
        out.append(tok)
    return ''.join(out).strip()


def jpeg(path, width=None):
    im = Image.open(path).convert('RGB')
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=82, optimize=True, progressive=True)
    return b.getvalue()


pages, images, toc = [], {}, []
for cls, body in secs:
    if 'p-cover' in cls or not body.strip():
        continue
    if 'p-cert' in cls:  # Urkunde: Text behalten, Ausschneide-Hinweis und Unterschriftzeile weg
        body = re.sub(r'<p style="font-size:12px.*?</p>', '', body, flags=re.S)
        body = re.sub(r'<div style="display:flex.*?</div>\s*</div>', '', body, flags=re.S)
        body = body.replace('(Dein Name)', '____________________')
    x = clean(body)

    def fix_img(m):
        p = os.path.normpath(os.path.join(BDIR, m.group(1)))
        name = os.path.splitext(os.path.basename(p))[0] + '.jpg'
        images[name] = p
        return f'<img src="images/{name}"'
    x = re.sub(r'<img src="([^"]+)"', fix_img, x)
    x = re.sub(r'alt=""', 'alt="Illustration"', x)
    n = len(pages) + 1
    h = re.search(r'<h2>(.*?)</h2>', x)
    if h:
        t = re.sub('<[^>]+>', '', h.group(1))
        if (t.startswith('Kapitel') or n <= 2 or t.startswith('Elternseite') or 'Check' in t
                or t in ('Urkunde', 'Quellen für Erwachsene', 'Die ganze Reihe im Überblick', 'Impressum und Rechte')):
            if not any(t == old for _, old in toc):
                toc.append((f'p{n:03d}.xhtml', t))
    pages.append(x)

ident = 'urn:uuid:' + str(uuid.uuid5(uuid.NAMESPACE_URL, f'callidus-kids-de-band{BAND}-kindle'))
mod = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
css = """body{font-family:serif;line-height:1.5;margin:0 4%;color:#233026;}
h2{font-family:sans-serif;color:#2c5940;font-size:1.3em;margin:.6em 0 .4em;line-height:1.2;}
.kicker{font-family:sans-serif;font-size:.75em;letter-spacing:.08em;text-transform:uppercase;color:#8a7a3e;font-weight:bold;margin:.8em 0 0;}
.art{text-align:center;margin:0 0 .6em;} .art img{width:100%;max-width:100%;height:auto;}
.ded{font-style:italic;text-align:center;margin:2em 0;color:#5e6757;}
.satz{border:2px dashed #7a9a85;border-radius:8px;padding:.6em .9em;margin:1em 0;text-align:center;}
.satz p{font-style:italic;margin:.2em 0;} .dialog{background:#f5f0e0;padding:.5em .8em;border-radius:8px;margin:1em 0;}
ol,ul{padding-left:1.4em;} li{margin:.35em 0;}
.cover{text-align:center;margin:0;} .cover img{max-width:100%;height:auto;}"""


def xhtml(t, body):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" '
            'xmlns:epub="http://www.idpf.org/2007/ops" lang="de" xml:lang="de">\n<head><meta charset="utf-8"/>'
            f'<title>{H.escape(t)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>\n<body>\n{body}\n</body>\n</html>\n')


D = zipfile.ZIP_DEFLATED
with zipfile.ZipFile(OUT, 'w') as z:
    z.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
    z.writestr('META-INF/container.xml', '<?xml version="1.0"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>', compress_type=D)
    z.writestr('OEBPS/style.css', css, compress_type=D)
    z.writestr('OEBPS/images/cover.jpg', jpeg(COVER), compress_type=D)
    z.writestr('OEBPS/cover.xhtml', xhtml(title, f'<div class="cover"><img src="images/cover.jpg" alt="Cover: {H.escape(title)}"/></div>'), compress_type=D)
    for i, p in enumerate(pages, 1):
        z.writestr(f'OEBPS/p{i:03d}.xhtml', xhtml(title, p), compress_type=D)
    for name, path in images.items():
        z.writestr(f'OEBPS/images/{name}', jpeg(path, IMG_W), compress_type=D)
    nav = '<nav epub:type="toc" id="toc"><h2>Inhalt</h2><ol>' + ''.join(f'<li><a href="{f}">{H.escape(t)}</a></li>' for f, t in toc) + '</ol></nav>'
    nav += '<nav epub:type="landmarks" hidden="hidden"><ol><li><a epub:type="cover" href="cover.xhtml">Cover</a></li><li><a epub:type="bodymatter" href="p001.xhtml">Start</a></li></ol></nav>'
    z.writestr('OEBPS/nav.xhtml', xhtml('Inhalt', nav), compress_type=D)
    man = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
           '<item id="css" href="style.css" media-type="text/css"/>',
           '<item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
           '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>']
    man += [f'<item id="x{i:03d}" href="p{i:03d}.xhtml" media-type="application/xhtml+xml"/>' for i in range(1, len(pages) + 1)]
    man += [f'<item id="img{k}" href="images/{n}" media-type="image/jpeg"/>' for k, n in enumerate(images)]
    spine = '<itemref idref="cover"/>' + ''.join(f'<itemref idref="x{i:03d}"/>' for i in range(1, len(pages) + 1))
    opf = f'''<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="de">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">{ident}</dc:identifier>
<dc:title>{H.escape(title)}</dc:title>
<dc:creator>Arnold Jedich</dc:creator>
<dc:language>de</dc:language>
<dc:publisher>Arnold Jedich</dc:publisher>
<meta property="dcterms:modified">{mod}</meta>
<meta name="cover" content="cover-img"/>
<meta property="schema:accessMode">textual</meta>
<meta property="schema:accessMode">visual</meta>
<meta property="schema:accessibilityFeature">alternativeText</meta>
<meta property="schema:accessibilityFeature">tableOfContents</meta>
<meta property="schema:accessibilityHazard">none</meta>
<meta property="schema:accessibilitySummary">Umfliessender Text mit Alternativtext fuer jede Illustration.</meta>
</metadata>
<manifest>
{chr(10).join(man)}
</manifest>
<spine>{spine}</spine>
</package>'''
    z.writestr('OEBPS/content.opf', opf, compress_type=D)
print(f'Band {BAND}: {title} | {len(pages)} Seiten, {len(images)} Bilder, Inhalt {len(toc)} -> {os.path.basename(OUT)} {os.path.getsize(OUT)//1024} KB')
