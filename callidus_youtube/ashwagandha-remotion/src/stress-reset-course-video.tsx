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
import {stressResetCourseDurationInFrames, stressResetCourseScenes} from './stress-reset-course-copy';
import './styles.css';

const ease = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Chips: React.FC<{items: readonly string[]; local: number}> = ({items, local}) => (
  <div className="stressad-chips">
    {items.map((item, index) => {
      const appear = ease(local, 18 + index * 7, 34);
      return (
        <span key={item} style={{opacity: appear, transform: `translateY(${(1 - appear) * 16}px)`}}>
          {item}
        </span>
      );
    })}
  </div>
);

const BreathPanel: React.FC<{local: number}> = ({local}) => {
  const cycle = local % 240;
  const scale = interpolate(cycle, [0, 72, 126, 198, 240], [0.88, 1.1, 1.1, 0.88, 0.88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labels = ['Einatmen', 'Halten', 'Ausatmen', 'Pause'];
  const active = Math.min(3, Math.floor(cycle / 60));
  const fill = interpolate(cycle % 60, [0, 60], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="stressad-breath">
      <div className="stressad-breath-ring" style={{transform: `scale(${scale})`}}>
        <strong>{labels[active]}</strong>
        <span>30 Sekunden Reset</span>
      </div>
      <div className="stressad-breath-bars">
        {labels.map((label, index) => (
          <div className={index === active ? 'active' : ''} key={label}>
            <span style={{width: `${index === active ? fill : index < active ? 100 : 0}%`}} />
          </div>
        ))}
      </div>
    </div>
  );
};

const CoursePanel: React.FC<{local: number}> = ({local}) => {
  const rows = [
    ['Modul 1', 'Reset-Knopf'],
    ['7 Tage', 'Video + Journal'],
    ['Alltag', 'sanfte Übungen'],
  ];

  return (
    <div className="stressad-course-panel">
      {rows.map(([label, value], index) => {
        const appear = ease(local, 20 + index * 9, 36);
        return (
          <div key={label} style={{opacity: appear, transform: `translateX(${(1 - appear) * 18}px)`}}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
};

const StepsPanel: React.FC<{local: number}> = ({local}) => {
  const steps = ['Wahrnehmen', 'Atmen', 'Ankommen'];

  return (
    <div className="stressad-steps">
      {steps.map((step, index) => {
        const appear = ease(local, 22 + index * 12, 38);
        return (
          <div key={step} style={{opacity: appear, transform: `translateY(${(1 - appear) * 18}px)`}}>
            <i>{index + 1}</i>
            <strong>{step}</strong>
          </div>
        );
      })}
    </div>
  );
};

const AlarmPanel: React.FC<{local: number}> = ({local}) => {
  const meter = interpolate(local, [18, 132], [0, 82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="stressad-alarm-panel">
      <div>
        <span>Systemstatus</span>
        <strong>Alarmmodus</strong>
      </div>
      <i>
        <b style={{width: `${meter}%`}} />
      </i>
    </div>
  );
};

const ScenePanel: React.FC<{panel: (typeof stressResetCourseScenes)[number]['panel']; local: number}> = ({
  panel,
  local,
}) => {
  if (panel === 'breath') {
    return <BreathPanel local={local} />;
  }

  if (panel === 'course') {
    return <CoursePanel local={local} />;
  }

  if (panel === 'steps') {
    return <StepsPanel local={local} />;
  }

  return <AlarmPanel local={local} />;
};

const Scene: React.FC<(typeof stressResetCourseScenes)[number] & {index: number}> = ({
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
    config: {damping: 24, stiffness: 88},
  });
  const scale = interpolate(local, [0, duration], [1.02, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pan = interpolate(local, [0, duration], [index % 2 === 0 ? -22 : 24, index % 2 === 0 ? 26 : -20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isFinalScene = index === stressResetCourseScenes.length - 1;

  return (
    <AbsoluteFill className="stressad-scene" style={{opacity}}>
      <Img
        className="stressad-photo"
        src={staticFile(image)}
        style={{transform: `translateX(${pan}px) scale(${scale})`}}
      />
      <div className={align === 'top' ? 'stressad-shade top' : 'stressad-shade bottom'} />
      <div
        className={align === 'top' ? 'stressad-copy top' : 'stressad-copy bottom'}
        style={{transform: `translateY(${interpolate(textSpring, [0, 1], [34, 0])}px)`}}
      >
        <div className="stressad-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {isFinalScene ? <Chips items={chips} local={local} /> : <ScenePanel panel={panel} local={local} />}
      <div className="stressad-index">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, stressResetCourseDurationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="stressad-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const StressResetCourseAdShort: React.FC = () => {
  return (
    <AbsoluteFill className="stressad-canvas">
      {stressResetCourseScenes.map((scene, index) => (
        <Scene {...scene} index={index} key={scene.title} />
      ))}

      <div className="stressad-topbar">
        <div>
          <Img src={staticFile('generated/stress-reset-course/callidus-logo.png')} />
          <strong>Callidus A&amp;M</strong>
        </div>
        <span>7-Tage Stress Reset</span>
      </div>

      <div className="stressad-cta">callidus-am.de/stress-reset-kurs</div>
      <div className="stressad-disclaimer">
        Kein Therapie- oder Heilversprechen. Bei starker Belastung bitte professionelle Hilfe nutzen.
      </div>
      <Progress />

      <Audio
        src={staticFile('audio/stress-reset-soft-corporate-background-clean-business-bed-459456.mp3')}
        volume={0.045}
        loop
      />
      <Audio src={staticFile('audio/stress-reset-course-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
