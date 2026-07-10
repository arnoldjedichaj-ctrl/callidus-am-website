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
  callidusNext5Topics,
  callidusNext5TopicIds,
  callidusNext5VoicePlaybackRate,
} from './callidus-next5-deepdive-copy';
import './styles.css';

type TopicId = (typeof callidusNext5TopicIds)[number];
type TopicData = (typeof callidusNext5Topics)[TopicId];
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

const ParticleField: React.FC<{local: number}> = ({local}) => (
  <div className="bdeep-particles next5">
    {Array.from({length: 28}).map((_, index) => {
      const x = 4 + ((index * 37) % 92);
      const y = 5 + ((index * 53) % 88);
      const driftX = Math.sin(local / 25 + index * 0.73) * (18 + (index % 5) * 4);
      const driftY = Math.cos(local / 29 + index * 0.61) * (12 + (index % 3) * 5);
      const opacity = 0.12 + Math.sin(local / 26 + index) * 0.1;
      return <span key={index} style={{left: x + '%', top: y + '%', opacity, transform: 'translate3d(' + driftX + 'px, ' + driftY + 'px, 0) scale(' + (0.7 + (index % 4) * 0.13) + ')'}} />;
    })}
  </div>
);

const BackgroundMotion: React.FC<{scene: SceneData; index: number; local: number; progress: number}> = ({scene, index, local, progress}) => {
  const primaryScale = linear(local, [0, scene.duration], [1.03, 1.2]);
  const secondaryScale = linear(local, [0, scene.duration], [1.22, 1.06]);
  const pan = linear(local, [0, scene.duration], [index % 2 === 0 ? -56 : 54, index % 2 === 0 ? 42 : -44]);
  const panelDrift = Math.sin(progress * Math.PI * 2) * 24;
  return (
    <>
      <Img className="bdeep-bg primary" src={staticFile(scene.image)} style={{transform: 'translate3d(' + pan + 'px, 0, 0) scale(' + primaryScale + ')'}} />
      <Img
        className="bdeep-bg secondary"
        src={staticFile(scene.secondaryImage)}
        style={{
          opacity: 0.2 + Math.sin(progress * Math.PI) * 0.2,
          transform: 'translate3d(' + panelDrift + 'px, ' + -panelDrift * 0.55 + 'px, 0) scale(' + secondaryScale + ')',
        }}
      />
      <div className="bdeep-photo-slice next5" style={{transform: 'translateX(' + linear(local, [0, scene.duration], [34, -36]) + 'px) rotate(' + Math.sin(progress * Math.PI) * 1.8 + 'deg)'}}>
        <Img src={staticFile(scene.secondaryImage)} />
      </div>
      <div className="bdeep-grid" />
      <ParticleField local={local} />
      <div className="bdeep-scrim" />
      <div className="bdeep-scanline" />
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
  const problem = ease(local, [8, 38], [0, 1]);
  const solution = ease(local, [44, 84], [0, 1]);
  const arrow = ease(local, [30, 82], [0, 1]);
  return (
    <div className="bdeep-problem-solution next5-panel">
      <div className="problem" style={{opacity: problem, transform: 'translateX(' + (1 - problem) * -32 + 'px) rotate(' + (1 - problem) * -1.5 + 'deg)'}}>
        <span>Problem</span>
        <strong>{topic.problem}</strong>
        <p>Ein echter Mechanismus wird in Social Media schnell größer erzählt, als die Studienlage hergibt.</p>
      </div>
      <div className="bridge" style={{transform: 'scaleX(' + arrow + ')'}} />
      <div className="solution" style={{opacity: solution, transform: 'translateX(' + (1 - solution) * 32 + 'px) rotate(' + (1 - solution) * 1.5 + 'deg)'}}>
        <span>Lösung</span>
        <strong>{topic.solution}</strong>
        <p>Alltag, Zielgruppe, Dosis, Produktqualität und Sicherheit zusammen betrachten.</p>
      </div>
    </div>
  );
};

const MoleculePanel: React.FC<{topic: TopicData; local: number; progress: number}> = ({topic, local, progress}) => (
  <div className="bdeep-molecule next5-panel">
    <div className="bdeep-orbit" style={{transform: 'rotate(' + progress * 120 + 'deg)'}} />
    <div className="bdeep-molecule-id">
      <span>Was ist das?</span>
      <strong>{topic.moleculeTitle}</strong>
      <small>{topic.formula}</small>
    </div>
    <div className={'bdeep-structure next5 ' + topic.id.replace(/[^a-z0-9]/g, '-')}>
      {Array.from({length: 12}).map((_, index) => {
        const appear = ease(local, [12 + index * 4, 42 + index * 5], [0, 1]);
        const angle = (index / 12) * Math.PI * 2 + progress * 1.8;
        const radiusX = 115 + (index % 4) * 34;
        const radiusY = 72 + (index % 3) * 28;
        return (
          <i
            key={index}
            style={{
              opacity: appear,
              transform: 'translate(' + Math.cos(angle) * radiusX + 'px, ' + Math.sin(angle) * radiusY + 'px) scale(' + (0.62 + appear * 0.4) + ')',
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
  <div className="bdeep-process next5-panel">
    {scene.bullets.slice(0, 3).map((item, index) => {
      const appear = ease(local, [14 + index * 16, 52 + index * 18], [0, 1]);
      return (
        <div key={item} style={{opacity: appear, transform: 'translateY(' + (1 - appear) * 26 + 'px) scale(' + (0.96 + appear * 0.04) + ')'}}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{item}</strong>
        </div>
      );
    })}
    <i style={{transform: 'scaleX(' + ease(local, [32, 130], [0, 1]) + ')'}} />
    <em style={{transform: 'rotate(' + progress * 190 + 'deg)'}} />
  </div>
);

const FoodWheel: React.FC<{topic: TopicData; local: number; progress: number}> = ({topic, local, progress}) => (
  <div className="bdeep-food-wheel next5-panel">
    <div className="bdeep-food-plate" style={{transform: 'rotate(' + progress * 42 + 'deg)'}} />
    {topic.foodLabels.map((food, index) => {
      const angle = (index / topic.foodLabels.length) * Math.PI * 2 + progress * 1.05;
      const appear = ease(local, [18 + index * 8, 50 + index * 9], [0, 1]);
      return <span key={food} style={{opacity: appear, transform: 'translate(' + Math.cos(angle) * 232 + 'px, ' + Math.sin(angle) * 138 + 'px) scale(' + (0.82 + appear * 0.18) + ')'}}>{food}</span>;
    })}
    <strong>Basis zuerst</strong>
  </div>
);

const EvidenceBoard: React.FC<{topic: TopicData; scene: SceneData; local: number}> = ({topic, scene, local}) => {
  const selectedIndex = typeof scene.sourceIndex === 'number' ? scene.sourceIndex : 0;
  const selected = topic.sources[selectedIndex];
  return (
    <div className="bdeep-evidence-board next5-panel">
      <div>
        <span>Nachweis</span>
        <strong>{selected.label + ' ' + selected.year}</strong>
        <p>{selected.finding}</p>
      </div>
      <div className="bdeep-study-stack">
        {topic.sources.slice(0, 4).map((source, index) => {
          const fill = ease(local, [24 + index * 14, 108 + index * 18], [12, index === selectedIndex ? 86 : 44 + index * 8]);
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
  <div className="bdeep-compare next5-panel">
    <div style={{opacity: ease(local, [14, 46], [0, 1]), transform: 'translateY(' + (1 - ease(local, [14, 46], [0, 1])) * 18 + 'px)'}}>
      <span>nicht so einfach</span>
      <strong>{scene.bullets[0]}</strong>
    </div>
    <i style={{transform: 'scaleY(' + ease(local, [28, 74], [0, 1]) + ')'}} />
    <div style={{opacity: ease(local, [48, 88], [0, 1]), transform: 'translateY(' + (1 - ease(local, [48, 88], [0, 1])) * -18 + 'px)'}}>
      <span>besser fragen</span>
      <strong>{scene.bullets[2] ?? 'Kontext'}</strong>
    </div>
  </div>
);

const TimelinePanel: React.FC<{scene: SceneData; local: number}> = ({scene, local}) => (
  <div className="bdeep-timeline next5-panel">
    {scene.bullets.slice(0, 3).map((item, index) => {
      const appear = ease(local, [16 + index * 20, 56 + index * 22], [0, 1]);
      return (
        <div key={item} style={{opacity: appear, transform: 'translateX(' + (1 - appear) * -24 + 'px)'}}>
          <span />
          <strong>{item}</strong>
        </div>
      );
    })}
  </div>
);

const DosePanel: React.FC<{local: number}> = ({local}) => {
  const fill = ease(local, [38, 124], [16, 66]);
  return (
    <div className="bdeep-dose-panel next5-panel">
      <span>Dosis</span>
      <div className="bdeep-dose-meter"><i style={{width: fill + '%'}} /></div>
      <strong>mehr ist nicht automatisch besser</strong>
      <p>Kontext, Ziel, Verträglichkeit und Medikamente entscheiden mit.</p>
    </div>
  );
};

const QualityPanel: React.FC<{local: number}> = ({local}) => {
  const checks = [['klar', 'deklariert'], ['rein', 'geprüft'], ['ehrlich', 'Grenzen']];
  return (
    <div className="bdeep-checks next5-panel">
      {checks.map(([label, sub], index) => {
        const appear = ease(local, [18 + index * 15, 62 + index * 17], [0, 1]);
        return (
          <div key={label} style={{opacity: appear, transform: 'translateY(' + (1 - appear) * 24 + 'px) rotate(' + (1 - appear) * 1.6 + 'deg)'}}>
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
  <div className="bdeep-safety next5-panel">
    {topic.safetyRows.map((row, index) => {
      const appear = ease(local, [14 + index * 11, 52 + index * 12], [0, 1]);
      return (
        <div key={row} style={{opacity: appear, transform: 'translateX(' + (1 - appear) * 24 + 'px)'}}>
          <span>!</span>
          <strong>{row}</strong>
        </div>
      );
    })}
    <p>Bei Medikamenten, Erkrankungen oder Schwangerschaft fachlich abklären.</p>
  </div>
);

const CellEnergyPanel: React.FC<{local: number; progress: number}> = ({local, progress}) => (
  <div className="bdeep-cell-energy next5-panel">
    <div className="cell" style={{transform: 'scale(' + (1 + Math.sin(local / 18) * 0.045) + ')'}}>
      <i style={{transform: 'rotate(' + progress * 210 + 'deg)'}} />
      <b style={{transform: 'translateX(' + Math.sin(local / 16) * 34 + 'px)'}} />
      <em style={{transform: 'translateY(' + Math.cos(local / 14) * 24 + 'px)'}} />
    </div>
    <strong>kein An-Aus-Schalter</strong>
    <p>Zellprozesse sind Netzwerke, nicht einzelne Zaubertasten.</p>
  </div>
);

const SummaryPanel: React.FC<{topic: TopicData; local: number}> = ({topic, local}) => (
  <div className="bdeep-summary next5-panel">
    <div className="badge" style={{transform: 'scale(' + ease(local, [8, 48], [0.82, 1]) + ') rotate(' + Math.sin(local / 20) * 2 + 'deg)'}}>{topic.icon}</div>
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
  const intro = ease(local, [0, 38], [0, 1]);
  const outro = ease(local, [scene.duration - 38, scene.duration], [1, 0]);
  const active = intro * outro;
  return (
    <Sequence from={scene.start} durationInFrames={scene.duration}>
      <AbsoluteFill className={'bdeep bdeep-next5 bdeep-' + topic.accent} style={{opacity: active}}>
        <BackgroundMotion scene={scene} index={index} local={local} progress={progress} />
        <div className="bdeep-brand">
          <b>callidus A&amp;M</b>
          <span>{topic.title.split(':')[0]}</span>
        </div>
        <div className="bdeep-main">
          <section className="bdeep-copy" style={{transform: 'translateY(' + (1 - intro) * 32 + 'px)'}}>
            <p className="bdeep-eyebrow">{scene.eyebrow}</p>
            <h1>{scene.title}</h1>
            <h2>{scene.subtitle}</h2>
            <BulletList items={scene.bullets} local={local} />
          </section>
          <section className="bdeep-visual" style={{transform: 'translateY(' + (1 - intro) * -24 + 'px) scale(' + (0.965 + intro * 0.035) + ')'}}>
            <VisualPanel topic={topic} scene={scene} local={local} progress={progress} />
          </section>
        </div>
        <SourceRail topic={topic} />
      </AbsoluteFill>
    </Sequence>
  );
};

export const CallidusNext5DeepDiveVideo: React.FC<{topicId: TopicId}> = ({topicId}) => {
  const topic = callidusNext5Topics[topicId];
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill className="bdeep-stage">
      {topic.scenes.map((scene, index) => (
        <Scene key={scene.title + index} topic={topic} scene={scene} index={index} />
      ))}
      {topic.scenes.map((scene) => (
        <Sequence key={scene.audio} from={scene.start} durationInFrames={scene.duration}>
          <Audio src={staticFile(scene.audio)} playbackRate={callidusNext5VoicePlaybackRate} />
        </Sequence>
      ))}
      <div className="bdeep-progress">
        <i style={{width: (useCurrentFrame() / (topic.durationInFrames || fps * 220)) * 100 + '%'}} />
      </div>
    </AbsoluteFill>
  );
};

export const ZinkEvidenceDeepDive: React.FC = () => <CallidusNext5DeepDiveVideo topicId="zink" />;
export const VitaminCEvidenceDeepDive: React.FC = () => <CallidusNext5DeepDiveVideo topicId="vitamin-c" />;
export const VitaminBKomplexEvidenceDeepDive: React.FC = () => <CallidusNext5DeepDiveVideo topicId="vitamin-b-komplex" />;
export const AshwagandhaEvidenceDeepDive: React.FC = () => <CallidusNext5DeepDiveVideo topicId="ashwagandha" />;
export const ReishiEvidenceDeepDive: React.FC = () => <CallidusNext5DeepDiveVideo topicId="reishi" />;
