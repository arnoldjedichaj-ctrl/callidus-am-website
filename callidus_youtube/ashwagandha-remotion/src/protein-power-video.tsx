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
import {proteinPowerDurationInFrames, proteinPowerScenes} from './protein-power-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Chips: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="protein-chips">
    {items.map((item, index) => {
      const appear = ease(local, 16 + index * 7, 32);
      return (
        <span key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
          {item}
        </span>
      );
    })}
  </div>
);

const ProteinMeter: React.FC<{local: number}> = ({local}) => {
  const value = interpolate(local, [28, 130], [0, 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="protein-meter">
      <div>
        <span>DGE Referenz</span>
        <strong>0,8 g/kg</strong>
      </div>
      <div>
        <span>ab 65 Jahre</span>
        <strong>1,0 g/kg</strong>
      </div>
      <i style={{width: `${value}%`}} />
    </div>
  );
};

const Checklist: React.FC<{local: number}> = ({local}) => {
  const items = ['klarer Proteingehalt', 'kurze Zutatenliste', 'wenig Zucker', 'schmeckt auch mit Wasser'];

  return (
    <div className="protein-checklist">
      {items.map((item, index) => {
        const appear = ease(local, 20 + index * 9, 36);
        return (
          <div key={item} style={{opacity: appear, transform: `translateX(${(1 - appear) * 18}px)`}}>
            <span />
            <strong>{item}</strong>
          </div>
        );
      })}
    </div>
  );
};

const Scene: React.FC<(typeof proteinPowerScenes)[number] & {index: number}> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  align,
  chips,
  index,
  meter,
  checklist,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? ease(frame, start, 16) * (1 - ease(frame, start + duration - 22, 22)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local),
    fps,
    config: {damping: 22, stiffness: 86},
  });
  const scale = interpolate(local, [0, duration], [1.03, 1.13], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pan = interpolate(local, [0, duration], [index % 2 === 0 ? -22 : 24, index % 2 === 0 ? 26 : -22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="protein-scene" style={{opacity}}>
      <Img
        className="protein-photo"
        src={staticFile(image)}
        style={{transform: `translateX(${pan}px) scale(${scale})`}}
      />
      <div className={align === 'top' ? 'protein-shade top' : 'protein-shade bottom'} />
      <div
        className={align === 'top' ? 'protein-copy top' : 'protein-copy bottom'}
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [38, 0])}px)`}}
      >
        <div className="protein-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {meter ? <ProteinMeter local={local} /> : checklist ? <Checklist local={local} /> : <Chips items={chips} local={local} />}
      <div className="protein-index">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, proteinPowerDurationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="protein-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const ProteinPowerAdShort: React.FC = () => {
  return (
    <AbsoluteFill className="protein-canvas">
      {proteinPowerScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="protein-topbar">
        <strong>Callidus A&amp;M</strong>
        <span>Anzeige / Affiliate</span>
      </div>
      <div className="protein-cta">Empfehlung über den Link in der Beschreibung</div>
      <div className="protein-disclaimer">Protein ersetzt keine ausgewogene Ernährung.</div>
      <Progress />

      <Audio src={staticFile('audio/protein-soft-corporate-background-clean-business-bed-459456.mp3')} volume={0.047} loop />
      <Audio src={staticFile('audio/protein-power-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
