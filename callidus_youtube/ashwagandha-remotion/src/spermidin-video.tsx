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
import {spermidinAffiliateUrl, spermidinDurationInFrames, spermidinScenes} from './spermidin-copy';
import './styles.css';

const fade = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const CheckItem: React.FC<{label: string; value?: string}> = ({label, value}) => (
  <div className="sperm-check-item">
    <span />
    <strong>{label}</strong>
    {value ? <small>{value}</small> : null}
  </div>
);

const Pill: React.FC<{children: React.ReactNode}> = ({children}) => <span className="sperm-pill">{children}</span>;

const Visual: React.FC<{
  mode: (typeof spermidinScenes)[number]['mode'];
  start: number;
  duration: number;
}> = ({mode, start, duration}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - start);
  const progress = interpolate(local, [0, duration - 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = interpolate(local, [0, duration / 2, duration], [0.96, 1.04, 0.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (mode === 'autophagy') {
    return (
      <div className="sperm-visual autophagy">
        <div className="sperm-cell" style={{transform: `scale(${pulse})`}}>
          <i />
          <b />
          <em />
        </div>
        <div className="sperm-flow">
          <span>abbauen</span>
          <span>recyceln</span>
          <span>erneuern</span>
        </div>
      </div>
    );
  }

  if (mode === 'evidence') {
    return (
      <div className="sperm-visual evidence">
        <div className="sperm-meter">
          <span>Mechanistik</span>
          <i style={{width: `${78 + progress * 10}%`}} />
          <strong>stark</strong>
        </div>
        <div className="sperm-meter">
          <span>Human-Daten</span>
          <i style={{width: `${42 + progress * 12}%`}} />
          <strong>begrenzt</strong>
        </div>
        <div className="sperm-meter muted">
          <span>Lebensverlängerung</span>
          <i style={{width: `${18 + progress * 8}%`}} />
          <strong>nicht bewiesen</strong>
        </div>
      </div>
    );
  }

  if (mode === 'foundation') {
    return (
      <div className="sperm-visual foundation">
        <Pill>Schlaf</Pill>
        <Pill>Krafttraining</Pill>
          <Pill>Protein & Pflanzen</Pill>
        <Pill>Stress runter</Pill>
      </div>
    );
  }

  if (mode === 'foods' || mode === 'foods2' || mode === 'foods3') {
    return (
      <div className="sperm-visual foods">
        <strong>Spermidin-Quellen</strong>
        <div>
          <Pill>Weizenkeime</Pill>
          <Pill>Soja</Pill>
          <Pill>Pilze</Pill>
          <Pill>Hülsenfrüchte</Pill>
          <Pill>gereifter Käse</Pill>
        </div>
      </div>
    );
  }

  if (mode === 'quality') {
    return (
      <div className="sperm-visual quality">
        <CheckItem label="standardisiert" value="mg transparent" />
        <CheckItem label="laborgeprüft" value="Qualität sichtbar" />
        <CheckItem label="wenig Zusätze" value="klare Rezeptur" />
      </div>
    );
  }

  if (mode === 'routine') {
    return (
      <div className="sperm-visual routine">
        <div className="sperm-stack">
          <span>Basis</span>
          <strong>Routine</strong>
          <small>Food + Schlaf + Training</small>
        </div>
        <div className="sperm-plus">+</div>
        <div className="sperm-stack accent">
          <span>Optional</span>
          <strong>Spermidin</strong>
          <small>sauber eingeordnet</small>
        </div>
      </div>
    );
  }

  if (mode === 'safety') {
    return (
      <div className="sperm-visual safety">
        <Pill>Weizenallergie?</Pill>
        <Pill>Schwangerschaft?</Pill>
        <Pill>Medikamente?</Pill>
        <Pill>ärztlich abklären</Pill>
      </div>
    );
  }

  if (mode === 'cta') {
    return (
      <div className="sperm-visual cta">
        <span>Anzeige / Affiliate</span>
        <strong>{spermidinAffiliateUrl.replace('https://', '')}</strong>
        <small>Unterstützt Callidus A&amp;M ohne Mehrkosten für dich.</small>
      </div>
    );
  }

  if (mode === 'summary') {
    return (
      <div className="sperm-visual summary">
        <span>Zellgesundheit</span>
        <b>+</b>
        <span>Autophagie</span>
        <b>+</b>
        <span>Longevity</span>
      </div>
    );
  }

  return (
    <div className="sperm-visual hero">
      <span>Autophagie</span>
      <strong>Zell-Recycling</strong>
      <small>Forschung statt Hype</small>
    </div>
  );
};

const Scene: React.FC<(typeof spermidinScenes)[number] & {index: number}> = ({
  start,
  duration,
  image,
  eyebrow,
  title,
  subtitle,
  mode,
  accent,
  index,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start;
  const active = frame >= start && frame < start + duration;
  const opacity = active ? fade(frame, start, 16) * (1 - fade(frame, start + duration - 20, 20)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local - 4),
    fps,
    config: {damping: 21, stiffness: 82},
  });
  const imageScale = interpolate(local, [0, duration], [1.03, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panX = interpolate(local, [0, duration], [index % 2 === 0 ? -34 : 34, index % 2 === 0 ? 28 : -28], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panY = interpolate(local, [0, duration], [index % 3 === 0 ? -18 : 18, index % 3 === 0 ? 18 : -18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className={`sperm-scene accent-${accent}`} style={{opacity}}>
      <Img
        className="sperm-shot"
        src={staticFile(image)}
        style={{transform: `translate3d(${panX}px, ${panY}px, 0) scale(${imageScale})`}}
      />
      <div className="sperm-scrim" />
      <div
        className="sperm-copy"
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [42, 0])}px)`}}
      >
        <span className="sperm-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <Visual mode={mode} start={start} duration={duration} />
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, spermidinDurationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="sperm-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const SpermidinLongevityInfo: React.FC = () => {
  return (
    <AbsoluteFill className="sperm-canvas">
      {spermidinScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="sperm-topbar">
        <strong>callidus A&amp;M</strong>
        <span>Longevity · Biohacking · Zellgesundheit</span>
      </div>
      <div className="sperm-cta-bar">
        <strong>Link in Beschreibung: {spermidinAffiliateUrl.replace('https://', '')}</strong>
        <span>Anzeige / Affiliate · keine medizinische Beratung</span>
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.035} loop />
      <Audio src={staticFile('audio/spermidin-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
