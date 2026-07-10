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
import {q10AffiliateUrl, q10DurationInFrames, q10Scenes, q10Sources} from './q10-copy';
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

const Tag: React.FC<{children: React.ReactNode}> = ({children}) => <span className="q10-tag">{children}</span>;

const Visual: React.FC<{
  mode: (typeof q10Scenes)[number]['mode'];
  start: number;
  duration: number;
}> = ({mode, start, duration}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - start);
  const progress = linear(local, [0, duration], [0, 1]);
  const pulse = 1 + Math.sin(local / 18) * 0.035;

  if (mode === 'mitochondria') {
    return (
      <div className="q10-visual mitochondria">
        <div className="q10-mito" style={{transform: `rotate(${Math.sin(local / 42) * 4}deg) scale(${pulse})`}}>
          <i />
          <b />
          <em />
        </div>
        <div className="q10-chain">
          <span>Elektronen</span>
          <span>Atmungskette</span>
          <span>ATP</span>
        </div>
      </div>
    );
  }

  if (mode === 'atp') {
    return (
      <div className="q10-visual atp">
        <div className="q10-atp-meter">
          <span>ATP</span>
          <strong>{Math.round(38 + progress * 62)}%</strong>
          <i style={{width: `${38 + progress * 62}%`}} />
        </div>
        <small>Zellenergie statt Koffein-Kick</small>
      </div>
    );
  }

  if (mode === 'organs') {
    return (
      <div className="q10-visual organs">
        <Tag>Herz</Tag>
        <Tag>Muskeln</Tag>
        <Tag>Gehirn</Tag>
        <Tag>Zellmembranen</Tag>
      </div>
    );
  }

  if (mode === 'aging') {
    return (
      <div className="q10-visual aging">
        <div className="q10-age-line">
          <span>20</span>
          <i style={{width: `${78 - progress * 22}%`}} />
          <span>40+</span>
        </div>
        <strong>Produktion kann nachlassen</strong>
        <small>deshalb: Kontext statt Hype</small>
      </div>
    );
  }

  if (mode === 'evidence') {
    return (
      <div className="q10-visual evidence">
        {q10Sources.map((source, index) => {
          const fill = ease(local, [18 + index * 14, 86 + index * 18], [12, index === 0 ? 70 : index === 1 ? 58 : 42]);
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

  if (mode === 'forms') {
    return (
      <div className="q10-visual forms">
        <div>
          <span>Ubiquinon</span>
          <strong>oxidierte Form</strong>
        </div>
        <b>↔</b>
        <div className="active">
          <span>Ubiquinol</span>
          <strong>reduzierte Form</strong>
        </div>
      </div>
    );
  }

  if (mode === 'absorption') {
    return (
      <div className="q10-visual absorption">
        <Tag>fettlöslich</Tag>
        <Tag>mit Mahlzeit</Tag>
        <Tag>Ölmatrix</Tag>
        <Tag>klare mg-Angabe</Tag>
      </div>
    );
  }

  if (mode === 'cta') {
    return (
      <div className="q10-visual cta">
        <span>Anzeige / Affiliate</span>
        <strong>{q10AffiliateUrl.replace('https://', '')}</strong>
        <small>Unterstützt Callidus A&amp;M ohne Mehrkosten für dich.</small>
      </div>
    );
  }

  if (mode === 'summary') {
    return (
      <div className="q10-visual summary">
        <span>Mitochondrien</span>
        <b>+</b>
        <span>ATP</span>
        <b>+</b>
        <span>Healthy Aging</span>
      </div>
    );
  }

  return (
    <div className="q10-visual hero">
      <span>Q10</span>
      <strong>Zellenergie</strong>
      <small>biochemisch spannend, sauber eingeordnet</small>
    </div>
  );
};

const Scene: React.FC<(typeof q10Scenes)[number] & {index: number}> = ({
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
    <AbsoluteFill className={`q10-scene accent-${accent}`} style={{opacity}}>
      <Img
        className="q10-shot"
        src={staticFile(image)}
        style={{transform: `translate3d(${panX}px, ${panY}px, 0) scale(${imageScale})`}}
      />
      <div className="q10-scrim" />
      <div className="q10-energy-dots">
        {Array.from({length: 14}).map((_, dotIndex) => (
          <span
            key={dotIndex}
            style={{
              left: `${8 + ((dotIndex * 29) % 84)}%`,
              top: `${12 + ((dotIndex * 41) % 72)}%`,
              transform: `translate3d(${Math.sin(local / 24 + dotIndex) * 18}px, ${Math.cos(local / 34 + dotIndex) * 11}px, 0)`,
            }}
          />
        ))}
      </div>
      <div
        className="q10-copy"
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [40, 0])}px)`}}
      >
        <span className="q10-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <Visual mode={mode} start={start} duration={duration} />
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = linear(frame, [0, q10DurationInFrames], [0, 100]);

  return (
    <div className="q10-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const Q10KnowledgeShort: React.FC = () => {
  return (
    <AbsoluteFill className="q10-canvas">
      {q10Scenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="q10-topbar">
        <strong>callidus A&amp;M</strong>
        <span>Coenzym Q10 · Zellenergie · Mitochondrien</span>
      </div>
      <div className="q10-cta-bar">
        <strong>Link in Beschreibung: {q10AffiliateUrl.replace('https://', '')}</strong>
        <span>Anzeige / Affiliate · keine medizinische Beratung</span>
      </div>
      <Progress />

      <Audio src={staticFile('audio/background.mp3')} volume={0.035} loop />
      <Audio src={staticFile('audio/q10-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
