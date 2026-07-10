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
import {valusXpScenes} from './valus-xp-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const CountUp: React.FC<{start: number; end: number; suffix?: string}> = ({start, end, suffix = ''}) => {
  const frame = useCurrentFrame();
  const value = Math.round(
    interpolate(frame, [start, end], [0, 10000], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <>
      {value.toLocaleString('de-DE')}
      {suffix}
    </>
  );
};

const AppBadge: React.FC<{type: 'nexus' | 'momus'}> = ({type}) => (
  <div className={`valxp-app-badge ${type}`}>
    <Img
      src={staticFile(
        type === 'nexus'
          ? 'generated/valus-xp-promo/app_icon_nexus.png'
          : 'generated/valus-xp-promo/logo_momus.png',
      )}
    />
    <div>
      <strong>{type === 'nexus' ? 'NEXUS' : 'MOMUS'}</strong>
      <span>{type === 'nexus' ? 'aktiv' : 'kommt bald'}</span>
    </div>
  </div>
);

const Visual: React.FC<{
  mode: (typeof valusXpScenes)[number]['mode'];
  start: number;
  duration: number;
}> = ({mode, start, duration}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - start);
  const progress = interpolate(local, [0, duration - 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const coinSpin = interpolate(local, [0, duration], [-8, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (mode === 'conversion') {
    return (
      <div className="valxp-visual conversion">
        <div className="valxp-xp-meter">
          <span>XP</span>
          <strong>
            <CountUp start={start + 18} end={start + duration - 18} />
          </strong>
          <div>
            <i style={{width: `${progress * 100}%`}} />
          </div>
        </div>
        <div className="valxp-arrow">→</div>
        <div className="valxp-val-card">
          <Img src={staticFile('generated/valus-xp-promo/valus-coin-cutout.png')} />
          <strong>1 VAL</strong>
          <span>= 1 Euro Rabatt</span>
        </div>
      </div>
    );
  }

  if (mode === 'value') {
    return (
      <div className="valxp-visual value">
        <div className="valxp-rule-card">
          <span>Interner Gutscheinwert</span>
          <strong>1 VAL = 1 EUR</strong>
          <small>Rabatt auf Kurse und Premium</small>
        </div>
        <div className="valxp-rule-grid">
          <span>max. 10 VAL / Monat</span>
          <span>kein Auszahlen</span>
          <span>kein Investment</span>
        </div>
      </div>
    );
  }

  if (mode === 'wallet') {
    return (
      <div className="valxp-visual wallet">
        <div className="valxp-wallet-card">
          <span>VAL Wallet</span>
          <strong>12 VAL</strong>
          <small>Beispiel-Guthaben</small>
          <div>
            <i style={{width: `${36 + progress * 42}%`}} />
          </div>
        </div>
        <div className="valxp-wallet-list">
          <span>XP prüfen</span>
          <span>VAL umwandeln</span>
          <span>Rabatt einlösen</span>
        </div>
      </div>
    );
  }

  if (mode === 'app' || mode === 'nexus') {
    return (
      <div className="valxp-visual app">
        <AppBadge type="nexus" />
        <div className="valxp-app-list">
          <span>Ernährung</span>
          <span>Training</span>
          <span>Regeneration</span>
          <span>Tageswerte</span>
        </div>
      </div>
    );
  }

  if (mode === 'momus') {
    return (
      <div className="valxp-visual app momus">
        <AppBadge type="momus" />
        <div className="valxp-app-list">
          <span>Energie</span>
          <span>Phoenix-Werte</span>
          <span>Tages-Signale</span>
        </div>
      </div>
    );
  }

  return (
    <div className="valxp-visual coin">
      <Img
        src={staticFile('generated/valus-xp-promo/valus-coin-cutout.png')}
        style={{transform: `rotate(${coinSpin}deg) scale(${1 + progress * 0.05})`}}
      />
      <div className="valxp-mini-equation">
        <span>Routine</span>
        <b>→</b>
        <span>XP</span>
        <b>→</b>
        <span>VAL</span>
      </div>
    </div>
  );
};

const Scene: React.FC<(typeof valusXpScenes)[number] & {index: number}> = ({
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
  const opacity = active ? ease(frame, start, 14) * (1 - ease(frame, start + duration - 18, 18)) : 0;
  const textSpring = spring({
    frame: Math.max(0, local - 5),
    fps,
    config: {damping: 22, stiffness: 84},
  });
  const scale = interpolate(local, [0, duration], [1.02, 1.085], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = interpolate(local, [0, duration], [index % 2 === 0 ? -28 : 28, index % 2 === 0 ? 24 : -24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className={`valxp-scene accent-${accent}`} style={{opacity}}>
      <Img className="valxp-shot" src={staticFile(image)} style={{transform: `translateX(${x}px) scale(${scale})`}} />
      <div className="valxp-scrim" />
      <div
        className="valxp-copy"
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [36, 0])}px)`}}
      >
        <span className="valxp-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <Visual mode={mode} start={start} duration={duration} />
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const total = valusXpScenes[valusXpScenes.length - 1].start + valusXpScenes[valusXpScenes.length - 1].duration;
  const width = interpolate(frame, [0, total], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="valxp-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const ValusXpSystemPromo: React.FC = () => {
  return (
    <AbsoluteFill className="valxp-canvas">
      {valusXpScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="valxp-topbar">
        <strong>callidus A&amp;M</strong>
        <span>XP · VALUS · Apps</span>
      </div>
      <div className="valxp-cta">
        <strong>callidus-am.de/valus</strong>
        <span>Internes Guthaben. Kein Investmentversprechen.</span>
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.045} startFrom={0} />
      <Audio src={staticFile('audio/valus-xp-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
