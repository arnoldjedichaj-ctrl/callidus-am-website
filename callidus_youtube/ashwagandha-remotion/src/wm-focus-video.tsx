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
import {wmFocusScenes} from './wm-focus-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const breathLabels = ['Einatmen', 'Halten', 'Ausatmen', 'Halten'];

const BreathingMeter: React.FC<{sceneStart: number}> = ({sceneStart}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - sceneStart);
  const cycle = local % 480;
  const phase = Math.floor(cycle / 120);
  const phaseFrame = cycle % 120;
  const scale =
    phase === 0
      ? interpolate(phaseFrame, [0, 120], [0.72, 1])
      : phase === 2
        ? interpolate(phaseFrame, [0, 120], [1, 0.72])
        : phase === 1
          ? 1
          : 0.72;
  const progress = interpolate(phaseFrame, [0, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="wm-breathing">
      <div className="wm-breathing-ring" style={{transform: `scale(${scale})`}}>
        <div>{breathLabels[phase]}</div>
        <span>4 Sek.</span>
      </div>
      <div className="wm-breathing-bars">
        {breathLabels.map((label, index) => (
          <div className={index === phase ? 'active' : ''} key={label + index}>
            <span style={{width: `${index === phase ? progress * 100 : index < phase ? 100 : 0}%`}} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Scene: React.FC<(typeof wmFocusScenes)[number]> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  align,
  focus,
  breathing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? ease(frame, start, 16) * (1 - ease(frame, start + duration - 20, 20)) : 0;
  const textSpring = spring({
    frame: local,
    fps,
    config: {damping: 20, stiffness: 82},
  });
  const scale = interpolate(local, [0, duration], [1.04, 1.13], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = focus === 'left' ? -72 : focus === 'right' ? 72 : 0;
  const y = align === 'top' ? 44 : -38;

  return (
    <AbsoluteFill style={{opacity}}>
      <Img
        className="wm-photo"
        src={staticFile(image)}
        style={{transform: `translate(${x}px, ${y}px) scale(${scale})`}}
      />
      <div className={align === 'top' ? 'wm-shade top' : 'wm-shade bottom'} />
      {breathing ? <BreathingMeter sceneStart={start} /> : null}
      <div
        className={align === 'top' ? 'wm-copy top' : 'wm-copy bottom'}
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [38, 0])}px)`}}
      >
        <div className="wm-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div className="wm-progress">
      {wmFocusScenes.map((scene) => (
        <div
          className={frame >= scene.start && frame < scene.start + scene.duration ? 'active' : ''}
          key={scene.title}
        />
      ))}
    </div>
  );
};

export const WorldCupFocusShort: React.FC = () => {
  return (
    <AbsoluteFill className="wm-canvas">
      {wmFocusScenes.map((scene) => (
        <Scene {...scene} key={scene.title} />
      ))}

      <div className="wm-topbar">
        <div>Callidus A&amp;M</div>
        <span>Anzeige / Affiliate</span>
      </div>

      <div className="wm-cta">Links in der Beschreibung</div>
      <div className="wm-disclaimer">Fokus- und Lifestyle-Tipp. Kein Heilversprechen.</div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.055} startFrom={0} />
      <Audio src={staticFile('audio/wm-focus-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
