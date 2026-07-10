import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {proteinSatireDurationInFrames, proteinSatireScenes} from './protein-satire-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Chips: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="protsat-chips">
    {items.map((item, index) => {
      const appear = ease(local, 18 + index * 8, 34);
      return (
        <span key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 16}px)`}}>
          {item}
        </span>
      );
    })}
  </div>
);

const SatirePanel: React.FC<{local: number}> = ({local}) => {
  const value = interpolate(local, [24, 150], [0, 93], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="protsat-meter">
      <div>
        <span>Hype-Level</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <i>
        <b style={{width: `${value}%`}} />
      </i>
    </div>
  );
};

const AminoPanel: React.FC<{local: number}> = ({local}) => {
  const items = ['Zerlegen', 'Bausteine', 'Aufbauen'];

  return (
    <div className="protsat-steps">
      {items.map((item, index) => {
        const appear = ease(local, 20 + index * 10, 36);
        return (
          <div key={item} style={{opacity: appear, transform: `translateX(${(1 - appear) * 18}px)`}}>
            <i>{index + 1}</i>
            <strong>{item}</strong>
          </div>
        );
      })}
    </div>
  );
};

const NumberPanel: React.FC<{local: number}> = ({local}) => {
  const rows = [
    ['Erwachsene', '0,8 g/kg'],
    ['ab 65', '1,0 g/kg'],
    ['Basis', 'Essen'],
  ];

  return (
    <div className="protsat-numbers">
      {rows.map(([label, value], index) => {
        const appear = ease(local, 16 + index * 9, 36);
        return (
          <div key={label} style={{opacity: appear, transform: `translateY(${(1 - appear) * 16}px)`}}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
};

const TrainingPanel: React.FC<{local: number}> = ({local}) => {
  const value = interpolate(local, [20, 150], [0, 78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="protsat-range">
      <div>
        <span>Sporternährung</span>
        <strong>1,4-2,0 g/kg</strong>
      </div>
      <i>
        <b style={{width: `${value}%`}} />
      </i>
    </div>
  );
};

const FoodPanel: React.FC<{local: number}> = ({local}) => {
  const items = ['Hülsenfrüchte', 'Tofu', 'Eier', 'Joghurt', 'Fisch', 'Nüsse'];

  return (
    <div className="protsat-food-list">
      {items.map((item, index) => {
        const appear = ease(local, 16 + index * 7, 32);
        return (
          <span key={item} style={{opacity: appear, transform: `scale(${0.95 + appear * 0.05})`}}>
            {item}
          </span>
        );
      })}
    </div>
  );
};

const ProductPanel: React.FC<{local: number}> = ({local}) => {
  const items = ['Hanfprotein', 'Aminosäuren', 'EAA'];

  return (
    <div className="protsat-products">
      {items.map((item, index) => {
        const appear = ease(local, 18 + index * 9, 34);
        return (
          <div key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
            <span>{index + 1}</span>
            <strong>{item}</strong>
          </div>
        );
      })}
    </div>
  );
};

const ScenePanel: React.FC<{panel: (typeof proteinSatireScenes)[number]['panel']; local: number}> = ({panel, local}) => {
  if (panel === 'satire') {
    return <SatirePanel local={local} />;
  }

  if (panel === 'amino') {
    return <AminoPanel local={local} />;
  }

  if (panel === 'numbers') {
    return <NumberPanel local={local} />;
  }

  if (panel === 'training') {
    return <TrainingPanel local={local} />;
  }

  if (panel === 'food') {
    return <FoodPanel local={local} />;
  }

  return <ProductPanel local={local} />;
};

const Scene: React.FC<(typeof proteinSatireScenes)[number] & {index: number}> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  align,
  chips,
  panel,
  index,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? ease(frame, start, 16) * (1 - ease(frame, start + duration - 24, 24)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local),
    fps,
    config: {damping: 23, stiffness: 88},
  });
  const scale = interpolate(local, [0, duration], [1.02, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pan = interpolate(local, [0, duration], [index % 2 === 0 ? -20 : 22, index % 2 === 0 ? 24 : -18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="protsat-scene" style={{opacity}}>
      <Img
        className="protsat-photo"
        src={staticFile(image)}
        style={{transform: `translateX(${pan}px) scale(${scale})`}}
      />
      <div className={align === 'top' ? 'protsat-shade top' : 'protsat-shade bottom'} />
      <div
        className={align === 'top' ? 'protsat-copy top' : 'protsat-copy bottom'}
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [36, 0])}px)`}}
      >
        <div className="protsat-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <ScenePanel panel={panel} local={local} />
      <Chips items={chips} local={local} />
      <div className="protsat-index">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, proteinSatireDurationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="protsat-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const ProteinSatireKnowledgeShort: React.FC = () => {
  return (
    <AbsoluteFill className="protsat-canvas">
      {proteinSatireScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="protsat-topbar">
        <strong>Callidus A&amp;M</strong>
        <span>Anzeige / Affiliate</span>
      </div>
      <div className="protsat-cta">Links in der Beschreibung</div>
      <div className="protsat-disclaimer">Keine medizinische Beratung. Bei Erkrankungen bitte fachlich abklären.</div>
      <Progress />

      <Audio src={staticFile('audio/protein-soft-corporate-background-clean-business-bed-459456.mp3')} volume={0.045} loop />
      <Audio src={staticFile('audio/protein-satire-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
