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
import {scenes} from './copy';
import './styles.css';

const clampEase = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Scene: React.FC<(typeof scenes)[number]> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  align,
  focus,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const fadeIn = clampEase(frame, start, 14);
  const fadeOut = 1 - clampEase(frame, start + duration - 18, 18);
  const opacity = active ? fadeIn * fadeOut : 0;
  const textSpring = spring({
    frame: local,
    fps,
    config: {damping: 20, stiffness: 82},
  });
  const scale = interpolate(local, [0, duration], [1.05, 1.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = focus === 'left' ? -76 : focus === 'right' ? 76 : 0;
  const y = align === 'top' ? 42 : -40;

  return (
    <AbsoluteFill style={{opacity}}>
      <Img
        className="ashwa-photo"
        src={staticFile(image)}
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
      <div className={align === 'top' ? 'ashwa-shade top' : 'ashwa-shade bottom'} />
      <div
        className={align === 'top' ? 'ashwa-copy top' : 'ashwa-copy bottom'}
        style={{
          transform: `translateY(${interpolate(textSpring, [0, 1], [38, 0])}px)`,
        }}
      >
        <div className="ashwa-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div className="ashwa-progress">
      {scenes.map((scene) => (
        <div
          className={frame >= scene.start && frame < scene.start + scene.duration ? 'active' : ''}
          key={scene.title}
        />
      ))}
    </div>
  );
};

export const AshwagandhaAffiliateShort: React.FC = () => {
  return (
    <AbsoluteFill className="ashwa-canvas">
      {scenes.map((scene) => (
        <Scene {...scene} key={scene.title} />
      ))}

      <div className="ashwa-topbar">
        <div>Callidus A&amp;M</div>
        <span>Anzeige / Affiliate</span>
      </div>

      <div className="ashwa-cta">Link in der Beschreibung</div>
      <div className="ashwa-disclaimer">
        Kein Heilversprechen. Nahrungserg&auml;nzung bewusst verwenden.
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.06} startFrom={0} />
      <Audio src={staticFile('audio/voiceover.wav')} volume={1} />
    </AbsoluteFill>
  );
};
