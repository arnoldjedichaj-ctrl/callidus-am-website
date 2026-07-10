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
import {sitePromoScenes} from './site-promo-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Scene: React.FC<(typeof sitePromoScenes)[number] & {index: number}> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  chips,
  align,
  tone,
  index,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? ease(frame, start, 14) * (1 - ease(frame, start + duration - 18, 18)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local - 6),
    fps,
    config: {damping: 22, stiffness: 86},
  });
  const scale = interpolate(local, [0, duration], [1.015, 1.085], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pan = interpolate(local, [0, duration], [index % 2 === 0 ? -22 : 24, index % 2 === 0 ? 24 : -22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className={`sitepromo-scene tone-${tone}`} style={{opacity}}>
      <Img
        className="sitepromo-shot"
        src={staticFile(image)}
        style={{
          transform: `translate3d(${pan}px, 0, 0) scale(${scale})`,
        }}
      />
      <div className={align === 'top' ? 'sitepromo-scrim top' : 'sitepromo-scrim bottom'} />
      <div
        className={align === 'top' ? 'sitepromo-copy top' : 'sitepromo-copy bottom'}
        style={{
          transform: `translateY(${interpolate(textSpring, [0, 1], [38, 0])}px)`,
        }}
      >
        <div className="sitepromo-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="sitepromo-chips">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
      <div className="sitepromo-number">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const total = sitePromoScenes[sitePromoScenes.length - 1].start + sitePromoScenes[sitePromoScenes.length - 1].duration;
  const width = interpolate(frame, [0, total], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="sitepromo-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const CallidusWebsitePromo: React.FC = () => {
  return (
    <AbsoluteFill className="sitepromo-canvas">
      {sitePromoScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="sitepromo-topbar">
        <div>
          <strong>callidus A&amp;M</strong>
          <span>Ganzheitliche Gesundheit</span>
        </div>
        <em>Website Preview</em>
      </div>

      <div className="sitepromo-cta">
        <span>callidus-am.de entdecken</span>
        <small>Orientierung statt Diagnose.</small>
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.045} startFrom={0} />
      <Audio src={staticFile('audio/site-promo-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
