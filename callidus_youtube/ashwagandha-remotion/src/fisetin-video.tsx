import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fisetinAffiliateUrl, fisetinDurationInFrames, fisetinScenes, fisetinSources} from './fisetin-copy';
import './styles.css';

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

const Tag: React.FC<{children: React.ReactNode}> = ({children}) => <span className="fis-tag">{children}</span>;

const QualityCheck: React.FC<{label: string; sub: string; local: number; index: number}> = ({label, sub, local, index}) => {
  const appear = ease(local, [14 + index * 10, 44 + index * 10], [0, 1]);
  return (
    <div className="fis-quality-check" style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
      <i />
      <strong>{label}</strong>
      <small>{sub}</small>
    </div>
  );
};

const Visual: React.FC<{
  mode: (typeof fisetinScenes)[number]['mode'];
  start: number;
  duration: number;
}> = ({mode, start, duration}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - start);
  const progress = linear(local, [0, duration], [0, 1]);
  const pulse = 1 + Math.sin(local / 18) * 0.035;

  if (mode === 'senescence') {
    return (
      <div className="fis-visual senescence">
        <div className="fis-cell-map">
          {Array.from({length: 7}).map((_, index) => (
            <span
              className={index === 1 || index === 4 ? 'old' : ''}
              key={index}
              style={{transform: `scale(${1 + Math.sin(local / 16 + index) * 0.06})`}}
            />
          ))}
        </div>
        <div className="fis-sasp">
          <strong>SASP</strong>
          <small>Entzündungssignale</small>
        </div>
      </div>
    );
  }

  if (mode === 'senolytic') {
    return (
      <div className="fis-visual senolytic">
        <div className="fis-clean-ring" style={{transform: `rotate(${progress * 120}deg) scale(${pulse})`}} />
        <div className="fis-clean-center">
          <span>Senolytika</span>
          <strong>gezielt erforscht</strong>
        </div>
        <div className="fis-clean-flow">
          <Tag>erkennen</Tag>
          <Tag>adressieren</Tag>
          <Tag>aufräumen</Tag>
        </div>
      </div>
    );
  }

  if (mode === 'foods') {
    return (
      <div className="fis-visual foods">
        <strong>Natürliche Quellen</strong>
        <div>
          <Tag>Erdbeeren</Tag>
          <Tag>Äpfel</Tag>
          <Tag>Zwiebeln</Tag>
          <Tag>Gurken</Tag>
          <Tag>Trauben</Tag>
        </div>
      </div>
    );
  }

  if (mode === 'evidence') {
    return (
      <div className="fis-visual evidence">
        {fisetinSources.map((source, index) => {
          const fill = ease(local, [18 + index * 14, 86 + index * 18], [12, index === 0 ? 82 : index === 1 ? 46 : 34]);
          return (
            <div key={source.label}>
              <span>{source.year}</span>
              <i style={{width: `${fill}%`}} />
              <strong>{source.label}</strong>
            </div>
          );
        })}
      </div>
    );
  }

  if (mode === 'routine') {
    return (
      <div className="fis-visual routine">
        <Tag>Schlaf</Tag>
        <Tag>Krafttraining</Tag>
        <Tag>Ernährung</Tag>
        <Tag>Stress runter</Tag>
        <Tag>Blutwerte</Tag>
        <Tag>Konstanz</Tag>
      </div>
    );
  }

  if (mode === 'quality') {
    return (
      <div className="fis-visual quality">
        <QualityCheck label="hochrein" sub="klare Rezeptur" local={local} index={0} />
        <QualityCheck label="mg klar" sub="transparent" local={local} index={1} />
        <QualityCheck label="vegan" sub="GMO-frei" local={local} index={2} />
      </div>
    );
  }

  if (mode === 'safety') {
    return (
      <div className="fis-visual safety">
        <Tag>Schwangerschaft?</Tag>
        <Tag>Immunsuppressiva?</Tag>
        <Tag>Blutverdünner?</Tag>
        <Tag>geplante OP?</Tag>
        <strong>ärztlich abklären</strong>
      </div>
    );
  }

  if (mode === 'cta') {
    return (
      <div className="fis-visual cta">
        <span>Anzeige / Affiliate</span>
        <strong>{fisetinAffiliateUrl.replace('https://', '')}</strong>
        <small>Unterstützt Callidus A&amp;M ohne Mehrkosten für dich.</small>
      </div>
    );
  }

  if (mode === 'summary') {
    return (
      <div className="fis-visual summary">
        <span>Zellgesundheit</span>
        <b>+</b>
        <span>Seneszenz</span>
        <b>+</b>
        <span>Biohacking</span>
      </div>
    );
  }

  return (
    <div className="fis-visual hero">
      <span>Fisetin</span>
      <strong>pflanzliches Flavonol</strong>
      <small>interessant in der Senolytika-Forschung</small>
    </div>
  );
};

const Scene: React.FC<(typeof fisetinScenes)[number] & {index: number}> = ({
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
  const opacity = active ? ease(frame, [start, start + 16], [0, 1]) * (1 - ease(frame, [start + duration - 20, start + duration], [0, 1])) : 0;
  const textSpring = spring({
    frame: Math.max(0, local - 5),
    fps,
    config: {damping: 22, stiffness: 84},
  });
  const imageScale = linear(local, [0, duration], [1.03, 1.14]);
  const panX = linear(local, [0, duration], [index % 2 === 0 ? -34 : 34, index % 2 === 0 ? 26 : -26]);
  const panY = linear(local, [0, duration], [index % 3 === 0 ? -18 : 18, index % 3 === 0 ? 18 : -18]);

  return (
    <AbsoluteFill className={`fis-scene accent-${accent}`} style={{opacity}}>
      <Img
        className="fis-shot"
        src={staticFile(image)}
        style={{transform: `translate3d(${panX}px, ${panY}px, 0) scale(${imageScale})`}}
      />
      <div className="fis-scrim" />
      <div className="fis-particles">
        {Array.from({length: 13}).map((_, particleIndex) => (
          <span
            key={particleIndex}
            style={{
              left: `${8 + ((particleIndex * 31) % 84)}%`,
              top: `${12 + ((particleIndex * 47) % 72)}%`,
              transform: `translate3d(${Math.sin(local / 28 + particleIndex) * 15}px, ${Math.cos(local / 36 + particleIndex) * 10}px, 0)`,
            }}
          />
        ))}
      </div>
      <div
        className="fis-copy"
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [40, 0])}px)`}}
      >
        <span className="fis-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <Visual mode={mode} start={start} duration={duration} />
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = linear(frame, [0, fisetinDurationInFrames], [0, 100]);

  return (
    <div className="fis-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const FisetinLongevityAd: React.FC = () => {
  return (
    <AbsoluteFill className="fis-canvas">
      {fisetinScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="fis-topbar">
        <strong>callidus A&amp;M</strong>
        <span>Fisetin · Longevity · Senolytika</span>
      </div>
      <div className="fis-cta-bar">
        <strong>Link in Beschreibung: {fisetinAffiliateUrl.replace('https://', '')}</strong>
        <span>Anzeige / Affiliate · keine medizinische Beratung</span>
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.035} loop />
      <Audio src={staticFile('audio/fisetin-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
