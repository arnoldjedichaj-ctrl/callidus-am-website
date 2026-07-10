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
import {wmMatchdayDurationInFrames, wmMatchdayScenes} from './wm-matchday-routine-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const RoutineCard: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="wmday-card">
    {items.map((item, index) => {
      const appear = ease(local, 18 + index * 8, 36);
      return (
        <div key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
          <span />
          <strong>{item}</strong>
        </div>
      );
    })}
  </div>
);

const MatchMeter: React.FC<{local: number}> = ({local}) => {
  const minutes = Math.round(interpolate(local, [20, 120], [0, 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const energy = Math.round(interpolate(local, [40, 160], [42, 86], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  return (
    <div className="wmday-meter">
      <div>
        <span>Bewegung</span>
        <strong>{minutes} min</strong>
      </div>
      <div>
        <span>Energie</span>
        <strong>{energy}%</strong>
      </div>
      <i style={{width: `${energy}%`}} />
    </div>
  );
};

const Scene: React.FC<(typeof wmMatchdayScenes)[number] & {index: number}> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  align,
  checklist,
  index,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? ease(frame, start, 16) * (1 - ease(frame, start + duration - 20, 20)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local),
    fps,
    config: {damping: 21, stiffness: 84},
  });
  const scale = interpolate(local, [0, duration], [1.03, 1.13], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pan = interpolate(local, [0, duration], [index % 2 === 0 ? -28 : 24, index % 2 === 0 ? 22 : -24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="wmday-scene" style={{opacity}}>
      <Img
        className="wmday-photo"
        src={staticFile(image)}
        style={{transform: `translateX(${pan}px) scale(${scale})`}}
      />
      <div className={align === 'top' ? 'wmday-shade top' : 'wmday-shade bottom'} />
      <div
        className={align === 'top' ? 'wmday-copy top' : 'wmday-copy bottom'}
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [38, 0])}px)`}}
      >
        <div className="wmday-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {index === 1 ? <MatchMeter local={local} /> : <RoutineCard items={checklist} local={local} />}
      <div className="wmday-index">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, wmMatchdayDurationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="wmday-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const WorldCupMatchdayRoutineShort: React.FC = () => {
  return (
    <AbsoluteFill className="wmday-canvas">
      {wmMatchdayScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="wmday-topbar">
        <strong>Callidus A&amp;M</strong>
        <span>Anzeige / Affiliate</span>
      </div>
      <div className="wmday-cta">Links in Beschreibung oder Bio ergänzen</div>
      <div className="wmday-disclaimer">Fokus- und Lifestyle-Tipp. Kein Heilversprechen.</div>
      <Progress />

      <Audio src={staticFile('audio/wm-soft-corporate-background-clean-business-bed-459456.mp3')} volume={0.05} loop />
      <Audio src={staticFile('audio/wm-matchday-routine-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
