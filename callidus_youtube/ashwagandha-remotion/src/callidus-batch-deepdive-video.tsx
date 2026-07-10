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
  callidusBatchTopics,
  callidusBatchTopicIds,
  callidusBatchVoicePlaybackRate,
} from './callidus-batch-deepdive-copy';
import './styles.css';

type TopicId = (typeof callidusBatchTopicIds)[number];
type TopicData = (typeof callidusBatchTopics)[TopicId];
type SceneData = TopicData['scenes'][number];

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

const ParticleField: React.FC<{local: number; color?: string}> = ({local}) => (
  <div className="bdeep-particles">
    {Array.from({length: 18}).map((_, index) => {
      const x = 5 + ((index * 41) % 90);
      const y = 8 + ((index * 57) % 82);
      const drift = Math.sin(local / 34 + index * 0.83) * 20;
      const opacity = 0.16 + Math.sin(local / 31 + index) * 0.12;
      return <span key={index} style={{left: x + '%', top: y + '%', opacity, transform: 'translate3d(' + drift + 'px, ' + drift * -0.38 + 'px, 0)'}} />;
    })}
  </div>
);

const BackgroundMotion: React.FC<{scene: SceneData; index: number; local: number; progress: number}> = ({scene, index, local, progress}) => {
  const primaryScale = linear(local, [0, scene.duration], [1.04, 1.15]);
  const secondaryScale = linear(local, [0, scene.duration], [1.14, 1.05]);
  const pan = linear(local, [0, scene.duration], [index % 2 === 0 ? -42 : 38, index % 2 === 0 ? 32 : -28]);
  const panelDrift = Math.sin(progress * Math.PI * 2) * 16;
  return (
    <>
      <Img className="bdeep-bg primary" src={staticFile(scene.image)} style={{transform: 'translate3d(' + pan + 'px, 0, 0) scale(' + primaryScale + ')'}} />
      <Img
        className="bdeep-bg secondary"
        src={staticFile(scene.secondaryImage)}
        style={{
          opacity: 0.18 + Math.sin(progress * Math.PI) * 0.14,
          transform: 'translate3d(' + panelDrift + 'px, ' + -panelDrift * 0.45 + 'px, 0) scale(' + secondaryScale + ')',
        }}
      />
      <div className="bdeep-photo-slice" style={{transform: 'translateX(' + linear(local, [0, scene.duration], [24, -20]) + 'px)'}}>
        <Img src={staticFile(scene.secondaryImage)} />
      </div>
      <div className="bdeep-grid" />
      <ParticleField local={local} />
      <div className="bdeep-scrim" />
    </>
  );
};

const BulletList: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="bdeep-bullets">
    {items.map((item, index) => {
      const appear = ease(local, [10 + index * 8, 40 + index * 8], [0, 1]);
      return (
        <div className="bdeep-bullet" key={item} style={{opacity: appear, transform: 'translateY(' + (1 - appear) * 18 + 'px)'}}>
          <span />
          <strong>{item}</strong>
        </div>
      );
    })}
  </div>
);

const ProblemSolutionPanel: React.FC<{topic: TopicData; local: number}> = ({topic, local}) => {
  const problem = ease(local, [10, 42], [0, 1]);
  const solution = ease(local, [48, 88], [0, 1]);
  const arrow = ease(local, [34, 82], [0, 1]);
  return (
    <div className="bdeep-problem-solution">
      <div className="problem" style={{opacity: problem, transform: 'translateX(' + (1 - problem) * -24 + 'px)'}}>
        <span>Problem</span>
        <strong>{topic.problem}</strong>
        <p>Ein echter Mechanismus wird schnell größer erzählt, als die Studienlage hergibt.</p>
      </div>
      <div className="bridge" style={{transform: 'scaleX(' + arrow + ')'}} />
      <div className="solution" style={{opacity: solution, transform: 'translateX(' + (1 - solution) * 24 + 'px)'}}>
        <span>Lösung</span>
        <strong>{topic.solution}</strong>
        <p>Alltag, Zielgruppe, Dosis und Sicherheit zusammen betrachten.</p>
      </div>
    </div>
  );
};

const MoleculePanel: React.FC<{topic: TopicData; local: number; progress: number}> = ({topic, local, progress}) => (
  <div className="bdeep-molecule">
    <div className="bdeep-orbit" style={{transform: 'rotate(' + progress * 70 + 'deg)'}} />
    <div className="bdeep-molecule-id">
      <span>Was ist das?</span>
      <strong>{topic.moleculeTitle}</strong>
      <small>{topic.formula}</small>
    </div>
    <div className={'bdeep-structure ' + topic.id.replace(/[^a-z0-9]/g, '-')}>
      {Array.from({length: 9}).map((_, index) => {
        const appear = ease(local, [16 + index * 5, 46 + index * 5], [0, 1]);
        const angle = (index / 9) * Math.PI * 2 + progress * 1.2;
        const radiusX = 145 + (index % 3) * 32;
        const radiusY = 82 + (index % 2) * 34;
        return (
          <i
            key={index}
            style={{
              opacity: appear,
              transform: 'translate(' + Math.cos(angle) * radiusX + 'px, ' + Math.sin(angle) * radiusY + 'px) scale(' + (0.72 + appear * 0.28) + ')',
            }}
          />
        );
      })}
      <b>{topic.icon}</b>
    </div>
    <div className="bdeep-molecule-note">
      <b>{topic.moleculeSubtitle}</b>
      <p>Einfach erklärt: biologisch wichtig, aber nicht automatisch ein Heilversprechen.</p>
    </div>
  </div>
);

const ProcessPanel: React.FC<{scene: SceneData; local: number; progress: number}> = ({scene, local, progress}) => (
  <div className="bdeep-process">
    {scene.bullets.slice(0, 3).map((item, index) => {
      const appear = ease(local, [16 + index * 18, 56 + index * 18], [0, 1]);
      return (
        <div key={item} style={{opacity: appear, transform: 'translateY(' + (1 - appear) * 26 + 'px)'}}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{item}</strong>
        </div>
      );
    })}
    <i style={{transform: 'scaleX(' + ease(local, [36, 138], [0, 1]) + ')'}} />
    <em style={{transform: 'rotate(' + progress * 120 + 'deg)'}} />
  </div>
);

const FoodWheel: React.FC<{topic: TopicData; local: number; progress: number}> = ({topic, local, progress}) => (
  <div className="bdeep-food-wheel">
    <div className="bdeep-food-plate" style={{transform: 'rotate(' + progress * 24 + 'deg)'}} />
    {topic.foodLabels.map((food, index) => {
      const angle = (index / topic.foodLabels.length) * Math.PI * 2 + progress * 0.8;
      const appear = ease(local, [22 + index * 9, 54 + index * 9], [0, 1]);
      return <span key={food} style={{opacity: appear, transform: 'translate(' + Math.cos(angle) * 226 + 'px, ' + Math.sin(angle) * 132 + 'px) scale(' + (0.86 + appear * 0.14) + ')'}}>{food}</span>;
    })}
    <strong>Basis zuerst</strong>
  </div>
);

const EvidenceBoard: React.FC<{topic: TopicData; scene: SceneData; local: number}> = ({topic, scene, local}) => {
  const selectedIndex = typeof scene.sourceIndex === 'number' ? scene.sourceIndex : 0;
  const selected = topic.sources[selectedIndex];
  return (
    <div className="bdeep-evidence-board">
      <div>
        <span>Nachweis</span>
        <strong>{selected.label + ' ' + selected.year}</strong>
        <p>{selected.finding}</p>
      </div>
      <div className="bdeep-study-stack">
        {topic.sources.slice(0, 4).map((source, index) => {
          const fill = ease(local, [28 + index * 16, 112 + index * 18], [14, index === selectedIndex ? 78 : 42 + index * 7]);
          return (
            <div className={index === selectedIndex ? 'active' : ''} key={source.label}>
              <span>{source.year}</span>
              <i style={{width: fill + '%'}} />
              <strong>{source.label}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ComparePanel: React.FC<{scene: SceneData; local: number}> = ({scene, local}) => (
  <div className="bdeep-compare">
    <div style={{opacity: ease(local, [16, 48], [0, 1])}}>
      <span>nicht so einfach</span>
      <strong>{scene.bullets[0]}</strong>
    </div>
    <i style={{transform: 'scaleY(' + ease(local, [30, 76], [0, 1]) + ')'}} />
    <div style={{opacity: ease(local, [54, 92], [0, 1])}}>
      <span>besser fragen</span>
      <strong>{scene.bullets[2] ?? 'Kontext'}</strong>
    </div>
  </div>
);

const TimelinePanel: React.FC<{scene: SceneData; local: number}> = ({scene, local}) => (
  <div className="bdeep-timeline">
    {scene.bullets.slice(0, 3).map((item, index) => {
      const appear = ease(local, [16 + index * 22, 56 + index * 22], [0, 1]);
      return (
        <div key={item} style={{opacity: appear}}>
          <span />
          <strong>{item}</strong>
        </div>
      );
    })}
  </div>
);

const DosePanel: React.FC<{local: number}> = ({local}) => {
  const fill = ease(local, [42, 126], [18, 62]);
  return (
    <div className="bdeep-dose-panel">
      <span>Dosis</span>
      <div className="bdeep-dose-meter"><i style={{width: fill + '%'}} /></div>
      <strong>mehr ist nicht automatisch besser</strong>
      <p>Kontext, Ziel, Verträglichkeit und Medikamente entscheiden mit.</p>
    </div>
  );
};

const QualityPanel: React.FC<{local: number}> = ({local}) => {
  const checks = [['mg klar', 'deklariert'], ['Reinheit', 'geprüft'], ['Grenzen', 'ehrlich']];
  return (
    <div className="bdeep-checks">
      {checks.map(([label, sub], index) => {
        const appear = ease(local, [20 + index * 16, 64 + index * 18], [0, 1]);
        return (
          <div key={label} style={{opacity: appear, transform: 'translateY(' + (1 - appear) * 20 + 'px)'}}>
            <span />
            <strong>{label}</strong>
            <small>{sub}</small>
          </div>
        );
      })}
    </div>
  );
};

const SafetyPanel: React.FC<{topic: TopicData; local: number}> = ({topic, local}) => (
  <div className="bdeep-safety">
    {topic.safetyRows.map((row, index) => {
      const appear = ease(local, [16 + index * 12, 54 + index * 12], [0, 1]);
      return (
        <div key={row} style={{opacity: appear, transform: 'translateX(' + (1 - appear) * 20 + 'px)'}}>
          <span>!</span>
          <strong>{row}</strong>
        </div>
      );
    })}
    <p>Bei Medikamenten, Erkrankungen oder Schwangerschaft fachlich abklären.</p>
  </div>
);

const CellEnergyPanel: React.FC<{local: number; progress: number}> = ({local, progress}) => (
  <div className="bdeep-cell-energy">
    <div className="cell" style={{transform: 'scale(' + (1 + Math.sin(local / 24) * 0.03) + ')'}}>
      <i style={{transform: 'rotate(' + progress * 150 + 'deg)'}} />
      <b style={{transform: 'translateX(' + Math.sin(local / 20) * 26 + 'px)'}} />
      <em style={{transform: 'translateY(' + Math.cos(local / 18) * 18 + 'px)'}} />
    </div>
    <strong>kein An-Aus-Schalter</strong>
    <p>Zellprozesse sind Netzwerke, nicht einzelne Zaubertasten.</p>
  </div>
);

const SummaryPanel: React.FC<{topic: TopicData; local: number}> = ({topic, local}) => (
  <div className="bdeep-summary">
    <div className="badge" style={{transform: 'scale(' + ease(local, [10, 52], [0.86, 1]) + ')'}}>{topic.icon}</div>
    <strong>{topic.moleculeTitle}</strong>
    <p>Spannend verstehen, vorsichtig einordnen, Basis nicht vergessen.</p>
  </div>
);

const VisualPanel: React.FC<{topic: TopicData; scene: SceneData; local: number; progress: number}> = ({topic, scene, local, progress}) => {
  switch (scene.mode) {
    case 'problemSolution':
      return <ProblemSolutionPanel topic={topic} local={local} />;
    case 'molecule':
      return <MoleculePanel topic={topic} local={local} progress={progress} />;
    case 'process':
      return <ProcessPanel scene={scene} local={local} progress={progress} />;
    case 'foods':
      return <FoodWheel topic={topic} local={local} progress={progress} />;
    case 'evidence':
      return <EvidenceBoard topic={topic} scene={scene} local={local} />;
    case 'compare':
      return <ComparePanel scene={scene} local={local} />;
    case 'timeline':
      return <TimelinePanel scene={scene} local={local} />;
    case 'dose':
      return <DosePanel local={local} />;
    case 'quality':
      return <QualityPanel local={local} />;
    case 'safety':
      return <SafetyPanel topic={topic} local={local} />;
    case 'cellEnergy':
      return <CellEnergyPanel local={local} progress={progress} />;
    case 'summary':
    default:
      return <SummaryPanel topic={topic} local={local} />;
  }
};

const SourceRail: React.FC<{topic: TopicData}> = ({topic}) => (
  <div className="bdeep-source-rail">
    {topic.sources.map((source) => (
      <div key={source.label}>
        <span>{source.year}</span>
        <strong>{source.label}</strong>
      </div>
    ))}
  </div>
);

const Scene: React.FC<{topic: TopicData; scene: SceneData; index: number}> = ({topic, scene, index}) => {
  const frame = useCurrentFrame();
  const local = frame - scene.start;
  const progress = Math.max(0, Math.min(1, local / scene.duration));
  const intro = ease(local, [0, 42], [0, 1]);
  const outro = ease(local, [scene.duration - 42, scene.duration], [1, 0]);
  const active = intro * outro;
  return (
    <Sequence from={scene.start} durationInFrames={scene.duration}>
      <AbsoluteFill className={'bdeep bdeep-' + topic.accent} style={{opacity: active}}>
        <BackgroundMotion scene={scene} index={index} local={local} progress={progress} />
        <div className="bdeep-brand">
          <b>callidus A&amp;M</b>
          <span>{topic.title.split(':')[0]}</span>
        </div>
        <div className="bdeep-main">
          <section className="bdeep-copy" style={{transform: 'translateY(' + (1 - intro) * 30 + 'px)'}}>
            <p className="bdeep-eyebrow">{scene.eyebrow}</p>
            <h1>{scene.title}</h1>
            <h2>{scene.subtitle}</h2>
            <BulletList items={scene.bullets} local={local} />
          </section>
          <section className="bdeep-visual" style={{transform: 'translateY(' + (1 - intro) * -22 + 'px) scale(' + (0.97 + intro * 0.03) + ')'}}>
            <VisualPanel topic={topic} scene={scene} local={local} progress={progress} />
          </section>
        </div>
        <SourceRail topic={topic} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const CallidusBatchDeepDiveVideo: React.FC<{topicId: TopicId}> = ({topicId}) => {
  const topic = callidusBatchTopics[topicId];
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill className="bdeep-stage">
      {topic.scenes.map((scene, index) => (
        <Scene key={scene.title + index} topic={topic} scene={scene} index={index} />
      ))}
      {topic.scenes.map((scene) => (
        <Sequence key={scene.audio} from={scene.start} durationInFrames={scene.duration}>
          <Audio src={staticFile(scene.audio)} playbackRate={callidusBatchVoicePlaybackRate} />
        </Sequence>
      ))}
      <div className="bdeep-progress">
        <i style={{width: (useCurrentFrame() / (topic.durationInFrames || fps * 220)) * 100 + '%'}} />
      </div>
    </AbsoluteFill>
  );
};

export const Q10EvidenceDeepDive: React.FC = () => <CallidusBatchDeepDiveVideo topicId="coenzym-q10" />;
export const NMNEvidenceDeepDive: React.FC = () => <CallidusBatchDeepDiveVideo topicId="nmn" />;
export const MagnesiumEvidenceDeepDive: React.FC = () => <CallidusBatchDeepDiveVideo topicId="magnesium" />;
export const VitaminD3K2EvidenceDeepDive: React.FC = () => <CallidusBatchDeepDiveVideo topicId="vitamin-d3-k2" />;
export const Omega3EvidenceDeepDive: React.FC = () => <CallidusBatchDeepDiveVideo topicId="omega-3" />;
