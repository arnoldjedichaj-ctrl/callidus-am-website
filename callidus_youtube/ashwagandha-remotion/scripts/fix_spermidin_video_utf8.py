from pathlib import Path
path = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion\src\spermidin-deepdive-video.tsx')
text = path.read_text(encoding='utf-8')
replacements = {
    'natÃ¼rliches': 'natürliches',
    'HÃ¼lsenfrÃ¼chte': 'Hülsenfrüchte',
    'KÃ¤se': 'Käse',
    'QualitÃ¤t': 'Qualität',
    'geprÃ¼ft': 'geprüft',
    'abklÃ¤ren': 'abklären',
    'ErnÃ¤hrung': 'Ernährung',
    'Â·': '·',
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
print('fixed utf8 strings in spermidin video tsx')
