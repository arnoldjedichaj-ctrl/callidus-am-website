from pathlib import Path
import json

root = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion')

video_tsx = r'''import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  spermidinDeepDiveDurationInFrames,
  spermidinDeepDiveScenes,
  spermidinDeepDiveSources,
  spermidinDeepDiveVoicePlaybackRate,
} from './spermidin-deepdive-copy';
import './styles.css';

type SceneData = (typeof spermidinDeepDiveScenes)[number];

const ease = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const linear = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const BulletList: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="sdeep-bullets">
    {items.map((item, index) => {
      const appear = ease(local, [10 + index * 8, 38 + index * 8], [0, 1]);
      return (
        <div className="sdeep-bullet" key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
          <span />
          <strong>{item}</strong>
        </div>
      );
    })}
  </div>
);

const BackgroundMotion: React.FC<{scene: SceneData; index: number; local: number; progress: number}> = ({
  scene,
  index,
  local,
  progress,
}) => {
  const primaryScale = linear(local, [0, scene.duration], [1.04, 1.16]);
  const secondaryScale = linear(local, [0, scene.duration], [1.16, 1.06]);
  const pan = linear(local, [0, scene.duration], [index % 2 === 0 ? -54 : 44, index % 2 === 0 ? 36 : -34]);
  const panelDrift = Math.sin(progress * Math.PI * 2) * 18;

  return (
    <>
      <Img
        className="sdeep-bg primary"
        src={staticFile(scene.image)}
        style={{transform: `translate3d(${pan}px, 0, 0) scale(${primaryScale})`}}
      />
      <Img
        className="sdeep-bg secondary"
        src={staticFile(scene.secondaryImage)}
        style={{
          opacity: 0.22 + Math.sin(progress * Math.PI) * 0.16,
          transform: `translate3d(${panelDrift}px, ${-panelDrift * 0.5}px, 0) scale(${secondaryScale})`,
        }}
      />
      <div className="sdeep-photo-slice" style={{transform: `translateX(${linear(local, [0, scene.duration], [26, -22])}px)`}}>
        <Img src={staticFile(scene.secondaryImage)} />
      </div>
      <div className="sdeep-grid" style={{opacity: 0.2 + Math.sin(progress * Math.PI) * 0.12}} />
      <ParticleField local={local} />
      <div className="sdeep-scrim" />
    </>
  );
};

const ParticleField: React.FC<{local: number}> = ({local}) => (
  <div className="sdeep-particles">
    {Array.from({length: 26}).map((_, index) => {
      const x = 8 + ((index * 37) % 88);
      const y = 10 + ((index * 53) % 78);
      const drift = Math.sin(local / 38 + index * 0.7) * 18;
      const opacity = 0.22 + Math.sin(local / 28 + index) * 0.16;
      return (
        <span
          key={index}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity,
            transform: `translate3d(${drift}px, ${drift * -0.45}px, 0)`,
          }}
        />
      );
    })}
  </div>
);

const Molecule: React.FC<{local: number; progress: number}> = ({local, progress}) => {
  const atoms = [
    {label: 'Zelle', x: -116, y: -76},
    {label: 'Polyamin', x: 120, y: -24},
    {label: 'Signal', x: -8, y: 116},
  ];
  return (
    <div className="sdeep-molecule">
      <div className="sdeep-orbit" style={{transform: `rotate(${progress * 34}deg)`}} />
      {atoms.map((atom, index) => {
        const pulse = Math.sin(local / 18 + index) * 8;
        return (
          <span
            key={atom.label}
            style={{transform: `translate(${atom.x + pulse}px, ${atom.y - pulse * 0.4}px) scale(${1 + Math.sin(local / 24 + index) * 0.04})`}}
          >
            {atom.label}
          </span>
        );
      })}
      <strong>natürliches Polyamin</strong>
    </div>
  );
};

const AutophagyDiagram: React.FC<{local: number; progress: number}> = ({local, progress}) => {
  const recycle = ease(local, [38, 145], [0, 1]);
  return (
    <div className="sdeep-autophagy">
      <div className="sdeep-cell-core" style={{transform: `scale(${1 + Math.sin(local / 24) * 0.03})`}}>
        <i style={{transform: `translate(${recycle * 88}px, ${recycle * 18}px) scale(${1 - recycle * 0.22})`}} />
        <b style={{transform: `translate(${recycle * -72}px, ${recycle * -22}px) scale(${1 - recycle * 0.18})`}} />
        <em style={{transform: `translate(${recycle * 30}px, ${recycle * -74}px) scale(${1 + recycle * 0.1})`}} />
        <div className="sdeep-recycle-ring" style={{transform: `rotate(${progress * 130}deg) scale(${0.88 + recycle * 0.12})`}} />
      </div>
      <div className="sdeep-flow">
        <span>erkennen</span>
        <span>zerlegen</span>
        <span>wiederverwenden</span>
      </div>
    </div>
  );
};

const FoodWheel: React.FC<{local: number; progress: number}> = ({local, progress}) => {
  const foods = ['Weizenkeime', 'Soja', 'Pilze', 'Hülsenfrüchte', 'Käse'];
  return (
    <div className="sdeep-food-wheel">
      <div className="sdeep-food-plate" style={{transform: `rotate(${progress * 18}deg)`}} />
      {foods.map((food, index) => {
        const angle = (index / foods.length) * Math.PI * 2 + progress * 0.8;
        const appear = ease(local, [22 + index * 9, 54 + index * 9], [0, 1]);
        const x = Math.cos(angle) * 230;
        const y = Math.sin(angle) * 132;
        return (
          <span key={food} style={{opacity: appear, transform: `translate(${x}px, ${y}px) scale(${0.86 + appear * 0.14})`}}>
            {food}
          </span>
        );
      })}
      <strong>Food first</strong>
    </div>
  );
};

const EvidenceBoard: React.FC<{scene: SceneData; local: number}> = ({scene, local}) => {
  const selectedIndex = typeof scene.sourceIndex === 'number' ? scene.sourceIndex : 0;
  const selected = spermidinDeepDiveSources[selectedIndex];
  return (
    <div className="sdeep-evidence-board">
      <div>
        <span>Nachweis</span>
        <strong>{`${selected.label} ${selected.year}`}</strong>
        <p>{selected.finding}</p>
      </div>
      <div className="sdeep-study-stack">
        {spermidinDeepDiveSources.slice(0, 3).map((source, index) => {
          const fill = ease(local, [28 + index * 16, 112 + index * 18], [14, index === 0 ? 42 : index === 1 ? 30 : 22]);
          return (
            <div className={index === selectedIndex ? 'active' : ''} key={source.label}>
              <span>{source.year}</span>
              <i style={{width: `${fill}%`}} />
              <strong>{source.label}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DosePanel: React.FC<{local: number}> = ({local}) => {
  const label = ease(local, [45, 128], [18, 63]);
  return (
    <div className="sdeep-dose-panel">
      <span>Dosis</span>
      <div className="sdeep-dose-meter">
        <i style={{width: `${label}%`}} />
      </div>
      <strong>mehr ist nicht automatisch besser</strong>
      <p>Polyamine werden eng reguliert. Entscheidend sind belastbare Endpunkte.</p>
    </div>
  );
};

const QualityPanel: React.FC<{local: number}> = ({local}) => {
  const checks = [
    ['mg klar', 'deklariert'],
    ['Quelle', 'nachvollziehbar'],
    ['Qualität', 'geprüft'],
  ];
  return (
    <div className="sdeep-checks">
      {checks.map(([label, sub], index) => {
        const appear = ease(local, [20 + index * 16, 64 + index * 18], [0, 1]);
        return (
          <div key={label} style={{opacity: appear, transform: `translateY(${(1 - appear) * 20}px)`}}>
            <span />
            <strong>{label}</strong>
            <small>{sub}</small>
          </div>
        );
      })}
    </div>
  );
};

const SafetyPanel: React.FC<{local: number}> = ({local}) => {
  const rows = ['Allergie?', 'Schwangerschaft?', 'Medikamente?', 'Erkrankungen?'];
  return (
    <div className="sdeep-safety">
      {rows.map((row, index) => {
        const appear = ease(local, [16 + index * 12, 54 + index * 12], [0, 1]);
        return (
          <span key={row} style={{opacity: appear, transform: `translateX(${(1 - appear) * 22}px)`}}>
            {row}
          </span>
        );
      })}
      <strong>vorher fachlich abklären</strong>
    </div>
  );
};

const SummaryRing: React.FC<{local: number; progress: number}> = ({local, progress}) => {
  const basics = ['Ernährung', 'Bewegung', 'Schlaf', 'Stress'];
  return (
    <div className="sdeep-summary-ring">
      <div className="sdeep-summary-orbit" style={{transform: `rotate(${progress * 52}deg)`}} />
      {basics.map((basic, index) => {
        const angle = (index / basics.length) * Math.PI * 2 + progress * 0.55;
        const appear = ease(local, [18 + index * 10, 58 + index * 10], [0, 1]);
        return (
          <span
            key={basic}
            style={{
              opacity: appear,
              transform: `translate(${Math.cos(angle) * 214}px, ${Math.sin(angle) * 134}px)`,
            }}
          >
            {basic}
          </span>
        );
      })}
      <strong>Spermidin als Zusatz</strong>
    </div>
  );
};

const Visual: React.FC<{scene: SceneData; local: number; progress: number}> = ({scene, local, progress}) => {
  if (scene.mode === 'autophagy') return <AutophagyDiagram local={local} progress={progress} />;
  if (scene.mode === 'foods') return <FoodWheel local={local} progress={progress} />;
  if (scene.mode === 'evidence' || scene.mode === 'studies') return <EvidenceBoard scene={scene} local={local} />;
  if (scene.mode === 'dose') return <DosePanel local={local} />;
  if (scene.mode === 'quality') return <QualityPanel local={local} />;
  if (scene.mode === 'safety') return <SafetyPanel local={local} />;
  if (scene.mode === 'summary') return <SummaryRing local={local} progress={progress} />;
  return <Molecule local={local} progress={progress} />;
};

const Scene: React.FC<{scene: SceneData; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const local = frame - scene.start;
  const active = frame >= scene.start && frame < scene.start + scene.duration;
  const fadeIn = ease(frame, [scene.start, scene.start + 24], [0, 1]);
  const fadeOut = ease(frame, [scene.start + scene.duration - 30, scene.start + scene.duration], [1, 0]);
  const opacity = active ? fadeIn * fadeOut : 0;
  const progress = linear(local, [0, scene.duration], [0, 1]);
  const copyY = ease(local, [0, 36], [38, 0]);
  const visualEnter = ease(local, [18, 58], [0, 1]);

  return (
    <AbsoluteFill className={`sdeep-scene accent-${scene.accent}`} style={{opacity}}>
      <BackgroundMotion scene={scene} index={index} local={local} progress={progress} />
      <div className="sdeep-copy" style={{transform: `translateY(${copyY}px)`}}>
        <span className="sdeep-eyebrow">{scene.eyebrow}</span>
        <h1>{scene.title}</h1>
        <p>{scene.subtitle}</p>
        <BulletList items={scene.bullets} local={local} />
      </div>
      <div
        className="sdeep-visual"
        style={{
          opacity: visualEnter,
          transform: `translate3d(${(1 - visualEnter) * 32}px, ${Math.sin(progress * Math.PI) * -14}px, 0)`,
        }}
      >
        <Visual scene={scene} local={local} progress={progress} />
      </div>
      <div className="sdeep-scene-index">{String(index + 1).padStart(2, '0')}</div>
      <div className="sdeep-data-ribbon" style={{transform: `translateX(${linear(local, [0, scene.duration], [24, -30])}px)`}}>
        {scene.bullets.map((bullet) => (
          <span key={bullet}>{bullet}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = linear(frame, [0, spermidinDeepDiveDurationInFrames], [0, 100]);
  return (
    <div className="sdeep-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const SpermidinEvidenceDeepDive: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill className="sdeep-canvas">
      {spermidinDeepDiveScenes.map((scene, index) => (
        <Scene scene={scene} index={index} key={scene.title} />
      ))}
      <div className="sdeep-topbar">
        <strong>callidus A&amp;M</strong>
        <span>Gesundheits-Wissen · Supplement-Video · wissenschaftlich eingeordnet</span>
      </div>
      <div className="sdeep-source-rail">
        {spermidinDeepDiveSources.map((source) => (
          <div key={source.label}>
            <span>{source.year}</span>
            <strong>{source.label}</strong>
          </div>
        ))}
      </div>
      <div className="sdeep-footer-note">Keine medizinische Beratung. Quellen in der Videobeschreibung.</div>
      <Progress />
      <Audio src={staticFile('audio/background.mp3')} volume={0.02} loop />
      {spermidinDeepDiveScenes.map((scene) => (
        <Sequence from={scene.start} durationInFrames={scene.duration + fps} key={scene.audio}>
          <Audio
            src={staticFile(scene.audio)}
            volume={1}
            playbackRate={spermidinDeepDiveVoicePlaybackRate}
            toneFrequency={1.04}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
'''

css_path = root / 'src' / 'styles.css'
css = css_path.read_text(encoding='utf-8')
marker = '/* Spermidin Evidence Deep Dive 16:9 */'
if marker not in css:
    raise RuntimeError('CSS marker not found')
css = css[:css.index(marker)] + r'''/* Spermidin Evidence Deep Dive 16:9 */
.sdeep-canvas {
  overflow: hidden;
  background: #101611;
  color: #f8f7ef;
  font-family: InterFallback, Arial, sans-serif;
}

.sdeep-scene {
  isolation: isolate;
  overflow: hidden;
}

.sdeep-bg {
  position: absolute;
  inset: -7%;
  width: 114%;
  height: 114%;
  object-fit: cover;
  transform-origin: center;
}

.sdeep-bg.primary {
  filter: saturate(1.03) contrast(1.08) brightness(0.72);
}

.sdeep-bg.secondary {
  inset: 0 auto 0 50%;
  width: 48%;
  height: 100%;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  filter: saturate(1.08) contrast(1.08) brightness(0.86);
  mix-blend-mode: screen;
  clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%);
}

.sdeep-photo-slice {
  position: absolute;
  right: 76px;
  bottom: 158px;
  width: 360px;
  height: 126px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 24px 76px rgba(0, 0, 0, 0.28);
}

.sdeep-photo-slice img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.12) contrast(1.05);
}

.sdeep-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 68px 68px;
  mask-image: linear-gradient(90deg, transparent, black 16%, black 78%, transparent);
}

.sdeep-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sdeep-particles span {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(216, 194, 115, 0.92);
  box-shadow: 0 0 18px rgba(216, 194, 115, 0.62);
}

.sdeep-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(7, 12, 9, 0.9) 0%, rgba(7, 12, 9, 0.68) 42%, rgba(7, 12, 9, 0.34) 72%, rgba(7, 12, 9, 0.7) 100%),
    linear-gradient(180deg, rgba(7, 12, 9, 0.26), rgba(7, 12, 9, 0.18) 48%, rgba(7, 12, 9, 0.88));
}

.sdeep-copy {
  position: absolute;
  left: 96px;
  top: 146px;
  width: 820px;
  display: grid;
  gap: 24px;
  z-index: 3;
}

.sdeep-eyebrow {
  color: #e5cb6c;
  font-size: 27px;
  font-weight: 950;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sdeep-copy h1 {
  margin: 0;
  color: #fffaf0;
  font-size: 78px;
  line-height: 0.99;
  letter-spacing: 0;
  text-wrap: balance;
  text-shadow: 0 18px 64px rgba(0, 0, 0, 0.42);
}

.sdeep-copy p {
  margin: 0;
  width: 720px;
  color: rgba(248, 247, 239, 0.88);
  font-size: 31px;
  line-height: 1.32;
  font-weight: 760;
  text-wrap: balance;
}

.sdeep-bullets {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 800px;
}

.sdeep-bullet {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16);
}

.sdeep-bullet span {
  flex: 0 0 11px;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #7ccf9e;
  box-shadow: 0 0 0 7px rgba(124, 207, 158, 0.15);
}

.sdeep-bullet strong {
  color: #fffaf0;
  font-size: 20px;
  line-height: 1.16;
}

.sdeep-visual {
  position: absolute;
  right: 86px;
  top: 146px;
  width: 680px;
  height: 610px;
  display: grid;
  place-items: center;
  z-index: 4;
}

.sdeep-molecule,
.sdeep-autophagy,
.sdeep-food-wheel,
.sdeep-evidence-board,
.sdeep-dose-panel,
.sdeep-checks,
.sdeep-safety,
.sdeep-summary-ring {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(12, 24, 18, 0.76);
  box-shadow: 0 38px 104px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}

.sdeep-molecule {
  position: relative;
  display: grid;
  place-items: center;
}

.sdeep-orbit,
.sdeep-summary-orbit {
  position: absolute;
  width: 390px;
  height: 390px;
  border-radius: 50%;
  border: 2px dashed rgba(216, 194, 115, 0.36);
}

.sdeep-molecule span {
  position: absolute;
  width: 156px;
  height: 156px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid rgba(124, 207, 158, 0.76);
  background: rgba(124, 207, 158, 0.23);
  color: #fffaf0;
  font-size: 20px;
  font-weight: 950;
  text-align: center;
}

.sdeep-molecule span:nth-of-type(3) {
  border-color: rgba(216, 194, 115, 0.72);
  background: rgba(216, 194, 115, 0.22);
}

.sdeep-molecule span:nth-of-type(4) {
  border-color: rgba(116, 166, 190, 0.72);
  background: rgba(116, 166, 190, 0.2);
}

.sdeep-molecule strong,
.sdeep-food-wheel strong,
.sdeep-summary-ring strong {
  color: #fffaf0;
  font-size: 42px;
  line-height: 1;
  text-align: center;
  text-shadow: 0 14px 40px rgba(0, 0, 0, 0.36);
}

.sdeep-autophagy {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 30px;
  padding: 46px;
}

.sdeep-cell-core {
  position: relative;
  width: 330px;
  height: 330px;
  border-radius: 50%;
  border: 3px solid rgba(124, 207, 158, 0.72);
  background: radial-gradient(circle, rgba(124, 207, 158, 0.28), rgba(13, 24, 18, 0.4));
  box-shadow: inset 0 0 64px rgba(124, 207, 158, 0.16), 0 28px 70px rgba(0, 0, 0, 0.28);
}

.sdeep-cell-core i,
.sdeep-cell-core b,
.sdeep-cell-core em {
  position: absolute;
  display: block;
  border-radius: 50%;
  background: #d8c273;
}

.sdeep-cell-core i { width: 78px; height: 78px; left: 70px; top: 76px; }
.sdeep-cell-core b { width: 98px; height: 98px; right: 58px; top: 146px; background: #7ccf9e; }
.sdeep-cell-core em { width: 58px; height: 58px; left: 138px; bottom: 58px; background: #74a6be; }

.sdeep-recycle-ring {
  position: absolute;
  inset: 74px;
  border-radius: 50%;
  border: 10px solid rgba(216, 194, 115, 0.48);
  border-right-color: rgba(124, 207, 158, 0.88);
}

.sdeep-flow {
  display: flex;
  gap: 12px;
}

.sdeep-flow span,
.sdeep-food-wheel span,
.sdeep-safety span,
.sdeep-summary-ring span {
  border-radius: 999px;
  padding: 13px 18px;
  background: rgba(255, 255, 255, 0.12);
  color: #fffaf0;
  font-size: 21px;
  font-weight: 950;
  white-space: nowrap;
}

.sdeep-food-wheel {
  position: relative;
  display: grid;
  place-items: center;
}

.sdeep-food-plate {
  position: absolute;
  width: 420px;
  height: 260px;
  border-radius: 50%;
  border: 2px solid rgba(216, 194, 115, 0.38);
  background: rgba(216, 194, 115, 0.08);
}

.sdeep-food-wheel span {
  position: absolute;
  left: calc(50% - 94px);
  top: calc(50% - 29px);
  width: 188px;
  text-align: center;
  border: 1px solid rgba(216, 194, 115, 0.45);
  background: rgba(216, 194, 115, 0.18);
}

.sdeep-food-wheel strong,
.sdeep-summary-ring strong {
  color: #e5cb6c;
}

.sdeep-evidence-board {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
  padding: 38px;
}

.sdeep-evidence-board > div:first-child {
  display: grid;
  align-content: center;
  gap: 16px;
}

.sdeep-evidence-board span,
.sdeep-dose-panel span {
  color: #e5cb6c;
  font-size: 23px;
  font-weight: 950;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sdeep-evidence-board strong {
  color: #fffaf0;
  font-size: 43px;
  line-height: 1.08;
}

.sdeep-evidence-board p,
.sdeep-dose-panel p {
  margin: 0;
  color: rgba(248, 247, 239, 0.82);
  font-size: 24px;
  line-height: 1.38;
}

.sdeep-study-stack {
  display: grid;
  align-content: center;
  gap: 14px;
}

.sdeep-study-stack div {
  display: grid;
  gap: 10px;
  border-radius: 10px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.sdeep-study-stack div.active {
  background: rgba(216, 194, 115, 0.14);
  border-color: rgba(216, 194, 115, 0.42);
}

.sdeep-study-stack i,
.sdeep-dose-meter i {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #7ccf9e, #e5cb6c);
}

.sdeep-study-stack strong {
  font-size: 22px;
}

.sdeep-dose-panel {
  display: grid;
  align-content: center;
  gap: 26px;
  padding: 52px;
}

.sdeep-dose-meter {
  height: 24px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
}

.sdeep-dose-panel strong {
  color: #fffaf0;
  font-size: 48px;
  line-height: 1;
}

.sdeep-checks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 44px;
}

.sdeep-checks div {
  display: grid;
  align-content: center;
  gap: 12px;
  border-radius: 12px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.sdeep-checks span {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #7ccf9e;
  box-shadow: inset 0 0 0 11px rgba(12, 24, 18, 0.55);
}

.sdeep-checks strong {
  color: #fffaf0;
  font-size: 33px;
  line-height: 1;
}

.sdeep-checks small {
  color: rgba(248, 247, 239, 0.74);
  font-size: 22px;
  font-weight: 850;
}

.sdeep-safety {
  display: grid;
  align-content: center;
  gap: 15px;
  padding: 58px;
}

.sdeep-safety span {
  display: block;
  width: 100%;
  border-radius: 10px;
  border-left: 5px solid #c99070;
  background: rgba(255, 255, 255, 0.1);
}

.sdeep-safety strong {
  margin-top: 10px;
  color: #e5cb6c;
  text-align: center;
  font-size: 40px;
  line-height: 1;
}

.sdeep-summary-ring {
  position: relative;
  display: grid;
  place-items: center;
}

.sdeep-summary-orbit {
  border-color: rgba(124, 207, 158, 0.4);
}

.sdeep-summary-ring span {
  position: absolute;
  left: calc(50% - 88px);
  top: calc(50% - 28px);
  width: 176px;
  text-align: center;
}

.sdeep-topbar,
.sdeep-source-rail,
.sdeep-footer-note,
.sdeep-scene-index,
.sdeep-data-ribbon {
  position: absolute;
  z-index: 10;
}

.sdeep-topbar {
  left: 64px;
  right: 64px;
  top: 42px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sdeep-topbar strong {
  color: #fffaf0;
  font-size: 30px;
  font-weight: 950;
}

.sdeep-topbar span {
  color: rgba(248, 247, 239, 0.78);
  font-size: 22px;
  font-weight: 760;
}

.sdeep-scene-index {
  left: 96px;
  bottom: 154px;
  color: rgba(248, 247, 239, 0.36);
  font-size: 78px;
  font-weight: 950;
  line-height: 1;
}

.sdeep-data-ribbon {
  left: 220px;
  bottom: 164px;
  display: flex;
  gap: 10px;
}

.sdeep-data-ribbon span {
  min-height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.13);
  color: rgba(248, 247, 239, 0.82);
  font-size: 17px;
  font-weight: 850;
}

.sdeep-source-rail {
  left: 96px;
  right: 96px;
  bottom: 58px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.sdeep-source-rail div {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
}

.sdeep-source-rail span {
  display: block;
  color: #e5cb6c;
  font-size: 16px;
  font-weight: 950;
}

.sdeep-source-rail strong {
  display: block;
  color: #fffaf0;
  font-size: 18px;
  line-height: 1.16;
}

.sdeep-footer-note {
  right: 96px;
  bottom: 24px;
  color: rgba(248, 247, 239, 0.72);
  font-size: 18px;
}

.sdeep-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 12;
}

.sdeep-progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #7ccf9e, #e5cb6c);
}

.accent-gold .sdeep-bullet span,
.accent-gold .sdeep-progress span {
  background: #e5cb6c;
}

.accent-teal .sdeep-bullet span {
  background: #74a6be;
  box-shadow: 0 0 0 7px rgba(116, 166, 190, 0.18);
}

.accent-green .sdeep-bullet span {
  background: #7ccf9e;
  box-shadow: 0 0 0 7px rgba(124, 207, 158, 0.18);
}

.accent-clay .sdeep-bullet span {
  background: #c99070;
  box-shadow: 0 0 0 7px rgba(201, 144, 112, 0.18);
}

.accent-slate .sdeep-bullet span {
  background: #b7c0b0;
  box-shadow: 0 0 0 7px rgba(183, 192, 176, 0.18);
}
'''
css_path.write_text(css, encoding='utf-8')
(root / 'src' / 'spermidin-deepdive-video.tsx').write_text(video_tsx, encoding='utf-8')

package_path = root / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8-sig'))
scripts = package.setdefault('scripts', {})
scripts['render:spermidin-deepdive:dynamisch'] = 'remotion render src/index.ts SpermidinEvidenceDeepDive out/spermidin-evidence-deepdive-dynamisch-final.mp4'
scripts['still:spermidin-deepdive:dynamisch'] = 'remotion still src/index.ts SpermidinEvidenceDeepDive out/spermidin-evidence-deepdive-dynamisch-thumb.png --frame=210 --scale=0.5'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('updated spermidin deepdive video, css, package scripts')
