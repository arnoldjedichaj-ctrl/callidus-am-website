from pathlib import Path
root = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion')
video_path = root / 'src' / 'spermidin-deepdive-video.tsx'
text = video_path.read_text(encoding='utf-8')
text = text.replace('Math.cos(angle) * 214', 'Math.cos(angle) * 270')
text = text.replace('Math.sin(angle) * 134', 'Math.sin(angle) * 158')
video_path.write_text(text, encoding='utf-8')
css_path = root / 'src' / 'styles.css'
css = css_path.read_text(encoding='utf-8')
insert = '''
.sdeep-summary-ring strong {
  width: 282px;
  font-size: 35px;
  line-height: 1.04;
}
'''
anchor = '.sdeep-summary-ring span {\n  position: absolute;'
if insert.strip() not in css:
    css = css.replace(anchor, insert + '\n' + anchor)
css_path.write_text(css, encoding='utf-8')
print('adjusted summary ring spacing')
