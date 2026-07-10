import React from 'react';
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
    {Array.from({length: 14}).map((_, index) => {
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
    {label: 'H2N', x: -190, y: 0, color: 'green'},
    {label: 'CH2', x: -108, y: -54, color: 'blue'},
    {label: 'CH2', x: -22, y: 0, color: 'gold'},
    {label: 'NH', x: 66, y: 54, color: 'green'},
    {label: 'CH2', x: 150, y: 0, color: 'blue'},
    {label: 'NH2', x: 230, y: -54, color: 'gold'},
  ];
  return (
    <div className="sdeep-molecule">
      <div className="sdeep-orbit" style={{transform: `rotate(${progress * 42}deg)`}} />
      <div className="sdeep-spermidin-id">
        <span>Was ist das?</span>
        <strong>Spermidin</strong>
        <small>C7H19N3</small>
      </div>
      <div className="sdeep-chem-chain">
        {atoms.map((atom, index) => {
          const pulse = Math.sin(local / 16 + index) * 7;
          const appear = ease(local, [12 + index * 5, 44 + index * 6], [0, 1]);
          return (
            <i
              key={atom.label}
              className={`atom-${atom.color}`}
              style={{
                opacity: appear,
                transform: `translate(${atom.x + pulse}px, ${atom.y - pulse * 0.4}px) scale(${0.78 + appear * 0.22})`,
              }}
            >
              {atom.label}
            </i>
          );
        })}
      </div>
      <div className="sdeep-molecule-note">
        <b>Polyamin</b>
        <p>Ein kleiner natürlicher Zellstoff, nicht automatisch ein Anti-Aging-Mittel.</p>
      </div>
    </div>
  );
};

const ProblemSolutionPanel: React.FC<{local: number}> = ({local}) => {
  const problem = ease(local, [10, 42], [0, 1]);
  const solution = ease(local, [48, 86], [0, 1]);
  const arrow = ease(local, [34, 80], [0, 1]);
  return (
    <div className="sdeep-problem-solution">
      <div className="problem" style={{opacity: problem, transform: `translateX(${(1 - problem) * -24}px)`}}>
        <span>Problem</span>
        <strong>Viel Hype</strong>
        <p>Werbung macht aus einem spannenden Zellstoff schnell ein Verjüngungsversprechen.</p>
      </div>
      <div className="bridge" style={{transform: `scaleX(${arrow})`}} />
      <div className="solution" style={{opacity: solution, transform: `translateX(${(1 - solution) * 24}px)`}}>
        <span>Lösung</span>
        <strong>Einordnen</strong>
        <p>Erst Lebensmittel und Basis-Gewohnheiten, dann Supplemente nur mit klarer Prüfung.</p>
      </div>
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
              transform: `translate(${Math.cos(angle) * 246}px, ${Math.sin(angle) * 158}px)`,
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
  if (scene.mode === 'problemSolution') return <ProblemSolutionPanel local={local} />;
  if (scene.mode === 'solution') return <ProblemSolutionPanel local={local} />;
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
        <span>Gesundheits-Wissen · einfach erklärt · wissenschaftlich eingeordnet</span>
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
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

