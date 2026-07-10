from pathlib import Path
import json
root = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion')
video_path = root / 'src' / 'spermidin-deepdive-video.tsx'
video = video_path.read_text(encoding='utf-8')
video = video.replace('Array.from({length: 26})', 'Array.from({length: 14})')
video = video.replace('\n            toneFrequency={1.04}', '')
video_path.write_text(video, encoding='utf-8')
css_path = root / 'src' / 'styles.css'
css = css_path.read_text(encoding='utf-8')
css = css.replace('  mix-blend-mode: screen;\n', '')
css = css.replace('  backdrop-filter: blur(8px);\n', '')
css = css.replace('  backdrop-filter: blur(6px);\n', '')
css_path.write_text(css, encoding='utf-8')
package_path = root / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8-sig'))
package['scripts']['render:spermidin-deepdive:dynamisch'] = 'remotion render src/index.ts SpermidinEvidenceDeepDive out/spermidin-evidence-deepdive-dynamisch-final.mp4 --concurrency=6'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('render optimized')
