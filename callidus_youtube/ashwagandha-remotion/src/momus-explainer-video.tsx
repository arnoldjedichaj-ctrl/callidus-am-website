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
import {momusExplainerChapters, momusExplainerDurationInFrames, momusExplainerScenes} from './momus-explainer-copy';
import './styles.css';

type Scene = (typeof momusExplainerScenes)[number];
type Mode = Scene['mode'];

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

const phoneTitle: Record<Mode, string> = {
  hero: 'MOMUS',
  cockpit: 'Energy Cockpit',
  microlife: 'Micro-Lives',
  leaks: 'Leak-Finder',
  phoenix: 'Phoenix Path',
  analyses: 'Analysen',
  crisis: 'Krisenmodus',
  tools: 'Werkzeuge',
  ecosystem: 'Callidus Hub',
};

const Count: React.FC<{from: number; to: number; local: number; suffix?: string}> = ({from, to, local, suffix = ''}) => {
  const value = Math.round(linear(local, [24, 150], [from, to]));
  return (
    <>
      {value}
      {suffix}
    </>
  );
};

const Background: React.FC<{scene: Scene; local: number; index: number}> = ({scene, local, index}) => {
  const drift = linear(local, [0, scene.duration], [index % 2 === 0 ? -24 : 24, index % 2 === 0 ? 28 : -28]);
  const scale = linear(local, [0, scene.duration], [1.03, 1.1]);

  return (
    <>
      <Img
        className="momx-bg-photo"
        src={staticFile(scene.mode === 'hero' || scene.mode === 'ecosystem' ? 'generated/momus-explainer/weg.jpg' : 'generated/momus-explainer/Kompassrose.jpeg')}
        style={{transform: `translate3d(${drift}px, 0, 0) scale(${scale})`}}
      />
      <div className="momx-bg-tint" />
      <div className="momx-bg-grid" />
      <div className="momx-bg-lines">
        {Array.from({length: 12}).map((_, item) => (
          <i key={item} style={{transform: `translateX(${Math.sin(local / 48 + item) * 16}px)`}} />
        ))}
      </div>
      <div className={`momx-accent-band tone-${scene.accent}`} />
    </>
  );
};

const Metric: React.FC<{label: string; value: string; tone?: string}> = ({label, value, tone = 'green'}) => (
  <div className={`momx-metric ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const MiniBars: React.FC<{local: number; values: number[]; labels?: string[]}> = ({local, values, labels}) => (
  <div className="momx-mini-bars">
    {values.map((value, index) => {
      const fill = ease(local, [18 + index * 5, 92 + index * 5], [10, value]);
      return (
        <div key={`${value}-${index}`}>
          <i style={{height: `${fill}%`}} />
          {labels ? <span>{labels[index]}</span> : null}
        </div>
      );
    })}
  </div>
);

const EnergyBattery: React.FC<{local: number}> = ({local}) => {
  const value = Math.round(ease(local, [15, 125], [42, 78]));
  return (
    <div className="momx-battery-card">
      <div className="momx-battery-head">
        <span>Energie-Akku</span>
        <strong>{value}%</strong>
      </div>
      <div className="momx-battery">
        <i style={{width: `${value}%`}} />
      </div>
      <div className="momx-intention">Heute: ruhig, klar, machbar.</div>
    </div>
  );
};

const PhoneContent: React.FC<{mode: Mode; local: number}> = ({mode, local}) => {
  if (mode === 'hero') {
    return (
      <div className="momx-phone-hero">
        <Img src={staticFile('generated/momus-explainer/logo_momus.png')} />
        <strong>Deine Energie. Deine Zeit.</strong>
        <span>Energy Cockpit · Phoenix Path · Leak-Finder</span>
      </div>
    );
  }

  if (mode === 'cockpit') {
    return (
      <>
        <EnergyBattery local={local} />
        <div className="momx-quick-log">
          {['Schlaf', 'Schritte', 'Sitzen', 'Screen', 'Social', 'Hydration'].map((item, index) => (
            <span key={item} style={{opacity: ease(local, [24 + index * 7, 70 + index * 7], [0, 1])}}>
              {item}
            </span>
          ))}
        </div>
        <MiniBars local={local} values={[78, 54, 38, 62]} labels={['Sleep', 'Move', 'Sit', 'Phone']} />
      </>
    );
  }

  if (mode === 'microlife') {
    return (
      <div className="momx-micro-board">
        <div>
          <span>Zurückgeholt</span>
          <strong>
            +<Count from={4} to={38} local={local} /> min
          </strong>
        </div>
        <div className="loss">
          <span>Verloren</span>
          <strong>
            -<Count from={2} to={22} local={local} /> min
          </strong>
        </div>
        {['Spaziergang', 'guter Schlaf', 'spätes Scrollen', 'Stress'].map((row, index) => (
          <i key={row} style={{opacity: ease(local, [40 + index * 10, 86 + index * 10], [0, 1])}}>
            {row}
          </i>
        ))}
      </div>
    );
  }

  if (mode === 'leaks') {
    return (
      <div className="momx-leak-board">
        {[
          ['Bildschirm', 'digital'],
          ['Social Load', 'sozial'],
          ['Kopf-Chaos', 'mental'],
          ['Umgebung', 'raum'],
        ].map(([label, sub], index) => (
          <div key={label} style={{transform: `translateY(${(1 - ease(local, [20 + index * 8, 70 + index * 8], [0, 1])) * 18}px)`}}>
            <strong>{label}</strong>
            <span>{sub}</span>
            <i style={{width: `${ease(local, [48 + index * 7, 130 + index * 7], [18, 78 - index * 8])}%`}} />
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'phoenix') {
    const score = Math.round(ease(local, [24, 138], [34, 82]));
    return (
      <div className="momx-phoenix-board">
        <div className="momx-shield">
          <i style={{transform: `rotate(${linear(local, [0, 180], [-126, 46])}deg)`}} />
          <strong>{score}</strong>
          <span>Phoenix-Score</span>
        </div>
        <div className="momx-xp-list">
          <Metric label="XP heute" value={`${Math.round(ease(local, [40, 150], [24, 186]))}/200`} />
          <Metric label="Streak" value={`${Math.round(ease(local, [44, 160], [1, 9]))} Tage`} tone="gold" />
          <Metric label="Plan" value="Wenn-Dann" tone="blue" />
        </div>
      </div>
    );
  }

  if (mode === 'analyses') {
    return (
      <div className="momx-analysis-board">
        <div className="momx-tabs">
          <span>Energy Lab</span>
          <span>Handy</span>
          <span>Profil</span>
        </div>
        <MiniBars local={local} values={[68, 82, 45, 74, 58]} labels={['Mo', 'Di', 'Mi', 'Do', 'Fr']} />
        <div className="momx-report">
          <strong>PDF Report</strong>
          <span>KI-Auswertung · Wochencharts · Kategorien</span>
        </div>
      </div>
    );
  }

  if (mode === 'crisis') {
    return (
      <div className="momx-crisis-board">
        <div className="momx-breath-ring" style={{transform: `scale(${1 + Math.sin(local / 18) * 0.06})`}}>
          <strong>02:00</strong>
          <span>stabilisieren</span>
        </div>
        <div className="momx-breath-steps">
          <span>einatmen</span>
          <span>halten</span>
          <span>ausatmen</span>
        </div>
        <small>immer frei</small>
      </div>
    );
  }

  if (mode === 'tools') {
    return (
      <div className="momx-tools-board">
        {['Dokumente', 'Food Scanner', 'Bibliothek', 'Brain Games', 'Highscores', 'TTS'].map((item, index) => (
          <div key={item} style={{opacity: ease(local, [20 + index * 6, 74 + index * 6], [0, 1])}}>
            <strong>{item}</strong>
            <span>{index === 3 ? '15 Spiele' : 'integriert'}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="momx-ecosystem-board">
      {['NEXUS', 'MOMUS', 'KAIROS'].map((item, index) => (
        <div className={item.toLowerCase()} key={item} style={{opacity: ease(local, [20 + index * 12, 82 + index * 12], [0, 1])}}>
          <strong>{item}</strong>
          <span>{item === 'NEXUS' ? 'Körper' : item === 'MOMUS' ? 'Energie' : 'Kontext'}</span>
        </div>
      ))}
      <i />
      <b />
    </div>
  );
};

const PhoneMock: React.FC<{mode: Mode; local: number}> = ({mode, local}) => (
  <div className="momx-phone">
    <div className="momx-phone-glow" />
    <div className="momx-phone-top">
      <span>{phoneTitle[mode]}</span>
      <small>MOMUS</small>
    </div>
    <div className="momx-phone-screen">
      <PhoneContent mode={mode} local={local} />
    </div>
    <div className="momx-phone-nav">
      {['Cockpit', 'Phoenix', 'Analyse', 'Docs', 'Games'].map((item, index) => (
        <span className={index === 0 || mode === 'phoenix' && index === 1 || mode === 'analyses' && index === 2 || mode === 'tools' && index > 2 ? 'active' : ''} key={item}>
          {item}
        </span>
      ))}
    </div>
  </div>
);

const InsightPanel: React.FC<{scene: Scene; local: number}> = ({scene, local}) => {
  const rows =
    scene.mode === 'ecosystem'
      ? ['NEXUS: Ernährung und Körper', 'MOMUS: Energie und Verhalten', 'KAIROS: Kontext und Verbindung']
      : scene.mode === 'crisis'
        ? ['2 Minuten Stabilisierung', 'Atemtechniken im Zugriff', 'KI-Begleitung ohne Paywall']
        : scene.bullets;

  return (
    <div className="momx-insight">
      <span>{scene.eyebrow}</span>
      {rows.map((row, index) => (
        <div key={row} style={{opacity: ease(local, [28 + index * 10, 72 + index * 12], [0, 1])}}>
          <i />
          <strong>{row}</strong>
        </div>
      ))}
    </div>
  );
};

const SceneView: React.FC<{scene: Scene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - scene.start;
  const active = frame >= scene.start && frame < scene.start + scene.duration;
  const opacity = active ? ease(frame, [scene.start, scene.start + 20], [0, 1]) * ease(frame, [scene.start + scene.duration - 28, scene.start + scene.duration], [1, 0]) : 0;
  const textSpring = spring({
    frame: Math.max(0, local - 8),
    fps,
    config: {damping: 24, stiffness: 92},
  });
  const phoneEnter = ease(local, [22, 78], [0, 1]);

  return (
    <AbsoluteFill className={`momx-scene tone-${scene.accent}`} style={{opacity}}>
      <Background scene={scene} local={local} index={index} />
      <div className="momx-copy" style={{transform: `translateY(${linear(textSpring, [0, 1], [38, 0])}px)`}}>
        <span className="momx-eyebrow">{scene.eyebrow}</span>
        <h1>{scene.title}</h1>
        <p>{scene.subtitle}</p>
      </div>
      <div
        className={`momx-visual mode-${scene.mode}`}
        style={{
          opacity: phoneEnter,
          transform: `translate3d(${(1 - phoneEnter) * 42}px, ${Math.sin(local / 42) * 8}px, 0)`,
        }}
      >
        {scene.mode === 'hero' ? (
          <div className="momx-hero-lockup">
            <Img src={staticFile('generated/momus-explainer/MOMUS_LOGO.png')} />
            <div>
              <Metric label="App Fokus" value="Energie" />
              <Metric label="System" value="Micro-Lives" tone="gold" />
              <Metric label="Richtung" value="Phoenix Path" tone="blue" />
            </div>
          </div>
        ) : (
          <>
            <PhoneMock mode={scene.mode} local={local} />
            <InsightPanel scene={scene} local={local} />
          </>
        )}
      </div>
      <div className="momx-scene-number">{String(index + 1).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

const ChapterRail: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div className="momx-chapters">
      {momusExplainerChapters.map((chapter, index) => {
        const scene = momusExplainerScenes[Math.min(index + 1, momusExplainerScenes.length - 1)];
        const active = frame >= scene.start && frame < scene.start + scene.duration;
        return (
          <span className={active ? 'active' : ''} key={chapter}>
            {chapter}
          </span>
        );
      })}
    </div>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const width = linear(frame, [0, momusExplainerDurationInFrames], [0, 100]);
  return (
    <div className="momx-progress">
      <span style={{width: `${width}%`}} />
    </div>
  );
};

export const MomusAppExplainer: React.FC = () => {
  return (
    <AbsoluteFill className="momx-canvas">
      {momusExplainerScenes.map((scene, index) => (
        <SceneView scene={scene} index={index} key={scene.title} />
      ))}

      <div className="momx-topbar">
        <strong>callidus A&amp;M</strong>
        <span>MOMUS App · Energie · Phoenix · Micro-Lives</span>
      </div>
      <ChapterRail />
      <div className="momx-footer">
        <strong>MOMUS</strong>
        <span>Kein Heilversprechen. Keine Diagnose-App. Ein digitaler Energie-Kompass.</span>
      </div>
      <Progress />
      <Audio src={staticFile('audio/background.mp3')} volume={0.025} loop />
      <Audio src={staticFile('audio/momus-explainer-aoede.wav')} volume={1} />
    </AbsoluteFill>
  );
};
