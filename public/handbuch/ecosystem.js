const root = document.documentElement;
const scene = document.querySelector('.scene');
const inner = document.querySelector('.scene-inner');
const motion = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;

const info = {
  hub: {kicker:'Die gemeinsame Verbindung',title:'Drei Perspektiven. Ein Gesamtbild.',body:'NEXUS versteht deinen Körper. MOMUS macht deine Energie sichtbar. KAIROS verbindet diese Perspektiven im Gespräch. Der Callidus Hub vermittelt zwischen den Apps.',route:'NEXUS + MOMUS → Hub → KAIROS',link:'App-Handbücher öffnen',href:'/handbuch/'},
  nexus: {kicker:'NEXUS · Körper & Gesundheit',title:'Verstehen, was dir guttut.',body:'Ernährung, Bewegung und Regeneration kommen in NEXUS zusammen. Über den Hub wird dein Gesundheitskontext für KAIROS verfügbar.',route:'Gesundheitskontext: NEXUS → Hub → KAIROS',link:'App-Handbücher öffnen',href:'/handbuch/'},
  momus: {kicker:'MOMUS · Energie & Fokus',title:'Erkennen, was Kraft kostet.',body:'MOMUS hilft dir, Energie-Leaks und deine Energiebalance zu erkennen. Diesen Energiekontext kann KAIROS über den Hub in die Reflexion einbeziehen. Die Bildschirmzeit-Analyse bleibt lokal.',route:'Energiekontext: MOMUS → Hub → KAIROS',link:'App-Handbücher öffnen',href:'/handbuch/'},
  kairos: {kicker:'KAIROS · Gespräch & Reflexion',title:'Aus Kontext wird Orientierung.',body:'Sprich mit KAIROS. Der KI-Assistent bezieht den verbundenen Gesundheits- und Energiekontext ein. Aus dem Gespräch können Aktionen für NEXUS und MOMUS entstehen.',route:'Aktionen: KAIROS → Hub → NEXUS / MOMUS',link:'App-Handbücher öffnen',href:'/handbuch/'}
};
const captions = {
  all:'Wähle eine App oder einen Datenweg. Die Animation zeigt das Zusammenspiel beispielhaft, keine Live-Daten.',
  health:'NEXUS → Callidus Hub → KAIROS: Dein Gesundheitskontext ergänzt das Gespräch um Ernährung, Bewegung und Regeneration.',
  energy:'MOMUS → Callidus Hub → KAIROS: Dein Energiekontext hilft, Belastung und persönliche Muster im Gespräch einzuordnen.',
  actions:'KAIROS → Callidus Hub → NEXUS / MOMUS: Aus der Reflexion können ausstehende Aktionen in den verbundenen Apps entstehen.'
};
function selectNode(key) {
  const data = info[key];
  document.querySelectorAll('.node').forEach(node => node.setAttribute('aria-pressed',String(node.dataset.node === key)));
  document.querySelector('.detail-kicker').textContent = data.kicker;
  document.querySelector('#detail-title').textContent = data.title;
  document.querySelector('#detail-body').textContent = data.body;
  document.querySelector('.detail-route').textContent = data.route;
  const link = document.querySelector('.detail a');
  link.textContent = data.link;
  link.href = data.href;
}
function selectFlow(mode) {
  scene.dataset.mode = mode;
  document.querySelectorAll('[data-flow]').forEach(control => control.setAttribute('aria-pressed',String(control.dataset.flow === mode)));
  document.querySelector('.flow-caption').textContent = captions[mode];
  selectNode({all:'hub',health:'nexus',energy:'momus',actions:'kairos'}[mode]);
}
document.querySelectorAll('.node').forEach(node => node.addEventListener('click',() => selectFlow({hub:'all',nexus:'health',momus:'energy',kairos:'actions'}[node.dataset.node])));
document.querySelectorAll('[data-flow]').forEach(button => button.addEventListener('click',() => selectFlow(button.dataset.flow)));
function updateMotion() {
  root.classList.toggle('paused',paused);
  motion.setAttribute('aria-pressed',String(paused));
  motion.textContent = paused ? 'Animation starten' : 'Animation pausieren';
  if (reducedMotion.matches) {
    motion.textContent = 'Reduzierte Bewegung';
    motion.disabled = true;
  } else motion.disabled = false;
}
motion.addEventListener('click',() => {paused = !paused; updateMotion();});
reducedMotion.addEventListener('change',() => {paused = reducedMotion.matches; updateMotion();});
updateMotion();
scene.addEventListener('pointermove',event => {
  if (paused || reducedMotion.matches || event.pointerType !== 'mouse') return;
  const rect = scene.getBoundingClientRect();
  inner.style.setProperty('--tilt-x',`${((event.clientY-rect.top)/rect.height-.5)*-5}deg`);
  inner.style.setProperty('--tilt-y',`${((event.clientX-rect.left)/rect.width-.5)*6}deg`);
});
scene.addEventListener('pointerleave',() => {inner.style.setProperty('--tilt-x','0deg');inner.style.setProperty('--tilt-y','0deg');});
const visibility = new IntersectionObserver(entries => root.classList.toggle('offscreen',!entries[0].isIntersecting));
visibility.observe(document.querySelector('.explorer'));

// Same-origin embedding: follow the website theme and grow with the content.
// No message listener, user data, or app service is needed for this illustration.
try {
  if (window.frameElement) {
    const parentRoot = window.parent.document.documentElement;
    const syncTheme = () => root.dataset.theme = parentRoot.dataset.theme || 'light';
    syncTheme();
    new MutationObserver(syncTheme).observe(parentRoot,{attributes:true,attributeFilter:['data-theme']});
    const resize = () => {window.frameElement.style.height = `${Math.ceil(document.querySelector('.ecosystem').getBoundingClientRect().height)+2}px`;};
    new ResizeObserver(resize).observe(document.querySelector('.ecosystem'));
    resize();
  } else {
    const dark = matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => root.dataset.theme = dark.matches ? 'dark' : 'light';
    syncTheme(); dark.addEventListener('change',syncTheme);
  }
} catch { /* Standalone content still works when a foreign site embeds it. */ }

