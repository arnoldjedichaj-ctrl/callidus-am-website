function bootPortal() {
  const root = document.querySelector('[data-portal-view]');
  if (!root || root.dataset.portalBooted === 'true') return;
  root.dataset.portalBooted = 'true';

  const configNode = document.getElementById('portal-config');
  const firebaseConfig = configNode ? JSON.parse(configNode.textContent || '{}') : {};
  const portalView = root.dataset.portalView;
  const portalApp = root.dataset.portalApp || '';

  const state = {
    ready: false,
    api: null,
    auth: null,
    db: null,
    fns: null,
    user: null,
  };

  const $ = (id) => document.getElementById(id);
  const text = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value == null || value === '' ? '-' : String(value);
  };
  const setError = (id, value) => {
    const el = $(id);
    if (!el) return;
    el.textContent = value || '';
    el.hidden = !value;
  };
  const show = (id) => {
    ['portal-loading', 'portal-auth', 'portal-content'].forEach((viewId) => {
      const el = $(viewId);
      if (el) el.hidden = viewId !== id;
    });
  };

  function todayKey() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function isoLocalDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function coachCalendarDays(startDate = new Date()) {
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setHours(12, 0, 0, 0);
      date.setDate(startDate.getDate() + index);
      return {
        day: dayNames[date.getDay()],
        date: isoLocalDate(date),
        label: date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      };
    });
  }

  function displayCalendarDay(day = {}, index = 0) {
    if (day.label) return day.label;
    const fallback = coachCalendarDays()[index] || {};
    const rawDate = day.date || fallback.date;
    if (!rawDate) return day.day || fallback.day || `Tag ${index + 1}`;
    const [year, month, date] = String(rawDate).split('-').map((part) => Number.parseInt(part, 10));
    const parsed = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(date)
      ? new Date(year, month - 1, date, 12)
      : new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return day.day || fallback.day || `Tag ${index + 1}`;
    return parsed.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  function num(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function displayNumber(value, unit = '') {
    if (value == null || value === '') return '-';
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return String(value);
    return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(parsed)}${unit}`;
  }

  function displayDate(value) {
    const date = value?.toDate?.() || (typeof value === 'string' ? new Date(value) : null);
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function displayDateTime(value) {
    const date = value?.toDate?.() || (value instanceof Date ? value : (typeof value === 'string' ? new Date(value) : null));
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function shortText(value, length = 140) {
    const clean = String(value || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return clean.length > length ? `${clean.slice(0, length - 3)}...` : clean;
  }

  function statusFrom(hub = {}, context = {}, fallbackConnected = false) {
    if (hub.connected || hub.summary_available || context.connected || fallbackConnected) {
      return { state: 'ok', label: 'Verbunden' };
    }
    if (hub.hub_enabled || hub.sync_state === 'hub_enabled') {
      return { state: 'pending', label: 'Freigabe aktiv' };
    }
    return { state: 'off', label: 'Noch nicht aktiv' };
  }

  function firstValue(...values) {
    return values.find((value) => value != null && value !== '');
  }

  function dateValue(value) {
    if (!value) return null;
    const date = value?.toDate?.() || (value instanceof Date ? value : new Date(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function normalizeTier(value) {
    const tier = String(value || '').toLowerCase();
    if (['premium', 'active', 'paid', 'pro'].includes(tier)) return 'premium';
    if (['trial', 'test', 'probe'].includes(tier)) return 'trial';
    if (['free', 'basic', 'basis'].includes(tier)) return 'free';
    return '';
  }

  function planFromSources(...sources) {
    const rank = { free: 1, trial: 2, premium: 3 };
    let selected = { tier: 'free', source: {} };

    sources.filter(Boolean).forEach((source) => {
      const rawTier = firstValue(
        source.status,
        source.plan,
        source.tier,
        source.access_tier,
        source.subscription_tier,
        source.subscription?.status,
        source.entitlement?.status,
      );
      const tier = source.premium_entitled === true || source.isPremium === true
        ? 'premium'
        : normalizeTier(rawTier);
      if (tier && rank[tier] > rank[selected.tier]) {
        selected = { tier, source };
      }
    });

    const expiry = dateValue(firstValue(
      selected.source.expires_at,
      selected.source.expiry_date,
      selected.source.valid_until,
      selected.source.subscription?.expires_at,
      selected.source.subscription?.expiry_date,
    ));
    const trialEnd = dateValue(firstValue(
      selected.source.trial_end_date,
      selected.source.trial_ends_at,
      selected.source.subscription?.trial_end_date,
      selected.source.subscription?.trial_ends_at,
    ));

    if (selected.tier === 'premium' && expiry && expiry.getTime() < Date.now()) {
      return { state: 'off', label: 'Free' };
    }
    if (selected.tier === 'trial' && trialEnd && trialEnd.getTime() < Date.now()) {
      return { state: 'off', label: 'Free' };
    }
    if (selected.tier === 'premium') return { state: 'ok', label: 'Premium' };
    if (selected.tier === 'trial') return { state: 'pending', label: 'Trial' };
    return { state: 'off', label: 'Free' };
  }

  function setPill(id, status) {
    const el = $(id);
    if (!el) return;
    el.textContent = status.label;
    el.dataset.state = status.state;
  }

  function clearNode(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function setStatus(id, message, state = '') {
    const el = $(id);
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
    if (state) el.dataset.state = state;
    else delete el.dataset.state;
  }

  function renderList(id, items, emptyText) {
    const list = $(id);
    if (!list) return;
    clearNode(list);
    if (!items.length) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'portal-empty';
      span.textContent = emptyText;
      li.appendChild(span);
      list.appendChild(li);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      const meta = document.createElement('small');
      title.textContent = item.title || 'Eintrag';
      meta.textContent = item.meta || '';
      li.appendChild(title);
      if (meta.textContent) li.appendChild(meta);
      list.appendChild(li);
    });
  }

  function renderMetrics(items) {
    const grid = $('portal-app-metrics');
    if (!grid) return;
    clearNode(grid);
    items.forEach((item) => {
      const node = document.createElement('div');
      node.className = 'portal-metric';
      const label = document.createElement('span');
      const value = document.createElement('strong');
      const sub = document.createElement('small');
      label.textContent = item.label;
      value.textContent = item.value;
      sub.textContent = item.sub || '';
      node.append(label, value, sub);
      grid.appendChild(node);
    });
  }

  async function docData(...path) {
    try {
      const { doc, getDoc } = state.api;
      const snap = await getDoc(doc(state.db, ...path));
      return snap.exists() ? snap.data() : {};
    } catch (error) {
      console.warn('Portal doc read failed', path.join('/'), error);
      return {};
    }
  }

  async function docsData(path, options = {}) {
    try {
      const { collection, getDocs, limit, orderBy, query, where } = state.api;
      const constraints = [];
      if (options.where) {
        constraints.push(where(options.where[0], options.where[1], options.where[2]));
      }
      if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || 'desc'));
      if (options.limit) constraints.push(limit(options.limit));
      const ref = collection(state.db, ...path);
      const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.warn('Portal collection read failed', path.join('/'), error);
      return [];
    }
  }

  async function getValusBalanceFallback() {
    try {
      const callable = state.api.httpsCallable(state.fns, 'getSanitasBalance');
      const result = await callable({});
      const raw = result.data?.balance || result.data?.balances || result.data || {};
      return {
        san: raw.san ?? raw.val ?? raw.valus ?? 0,
        xp: raw.xp ?? raw.current_xp ?? raw.total_xp ?? 0,
      };
    } catch (error) {
      console.warn('Portal balance callable failed', error);
      return {};
    }
  }

  function setupAuthHandlers() {
    if (root.dataset.authReady) return;
    root.dataset.authReady = 'true';

    document.querySelectorAll('.portal-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.portal-tab').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.authTab;
        $('portal-login-form').hidden = target !== 'login';
        $('portal-register-form').hidden = target !== 'register';
      });
    });

    $('portal-login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      setError('portal-auth-error', '');
      try {
        await state.api.signInWithEmailAndPassword(
          state.auth,
          $('portal-login-email').value,
          $('portal-login-password').value,
        );
      } catch (error) {
        setError('portal-auth-error', mapAuthError(error.code));
      }
    });

    $('portal-register-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      setError('portal-auth-error', '');
      try {
        const credential = await state.api.createUserWithEmailAndPassword(
          state.auth,
          $('portal-register-email').value,
          $('portal-register-password').value,
        );
        await state.api.updateProfile(credential.user, {
          displayName: $('portal-register-name').value,
        });
      } catch (error) {
        setError('portal-auth-error', mapAuthError(error.code));
      }
    });

    const googleSignIn = async () => {
      setError('portal-auth-error', '');
      try {
        await state.api.signInWithPopup(state.auth, new state.api.GoogleAuthProvider());
      } catch (error) {
        setError('portal-auth-error', mapAuthError(error.code));
      }
    };

    $('portal-google-login')?.addEventListener('click', googleSignIn);
    $('portal-google-register')?.addEventListener('click', googleSignIn);
    $('portal-reset-password')?.addEventListener('click', async () => {
      const email = $('portal-login-email')?.value;
      if (!email) {
        setError('portal-auth-error', 'Bitte E-Mail eintragen.');
        return;
      }
      await state.api.sendPasswordResetEmail(state.auth, email);
      setError('portal-auth-error', 'E-Mail zum Zuruecksetzen wurde gesendet.');
    });
    $('portal-signout')?.addEventListener('click', () => state.api.signOut(state.auth));
  }

  async function initFirebase() {
    if (state.ready) return;

    const appApi = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js');
    const authApi = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js');
    const firestoreApi = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js');
    const functionsApi = await import('https://www.gstatic.com/firebasejs/11.8.1/firebase-functions.js');
    const app = appApi.getApps().length === 0
      ? appApi.initializeApp(firebaseConfig)
      : appApi.getApps()[0];

    state.api = { ...appApi, ...authApi, ...firestoreApi, ...functionsApi };
    state.auth = authApi.getAuth(app);
    state.db = firestoreApi.getFirestore(app);
    state.fns = functionsApi.getFunctions(app, 'us-central1');
    state.ready = true;

    setupAuthHandlers();
    authApi.onAuthStateChanged(state.auth, async (user) => {
      state.user = user;
      if (!user) {
        show('portal-auth');
        return;
      }
      show('portal-content');
      await loadPortal(user);
    });
  }

  async function loadPortal(user) {
    text('portal-user-name', user.displayName || user.email?.split('@')[0] || 'Callidus Mitglied');
    text('portal-user-email', user.email || user.uid);
    if (portalView === 'overview') {
      await loadOverview(user);
    } else if (portalView === 'coach') {
      await loadCoach(user);
    } else {
      await loadAppDetail(user, portalApp);
    }
  }

  async function loadOverview(user) {
    const today = todayKey();
    const base = ['users', user.uid];
    const [
      userDoc,
      balance,
      nexusHub,
      momusHub,
      kairosProfile,
      nexusContext,
      momusContext,
      nexusStats,
      momusStats,
      nexusAccess,
      momusAccess,
      kairosAccess,
      nexusLink,
      momusLink,
      kairosLink,
      ledger,
    ] = await Promise.all([
      docData(...base),
      docData(...base, 'balances', 'current'),
      docData(...base, 'hub', 'nexus_status'),
      docData(...base, 'hub', 'momus_status'),
      docData(...base, 'kairos_profile', 'current'),
      docData(...base, 'kairos_context', 'nexus_current'),
      docData(...base, 'kairos_context', 'momus_current'),
      docData(...base, 'nexus_stats', today),
      docData(...base, 'momus_stats', today),
      docData(...base, 'app_access', 'nexus'),
      docData(...base, 'app_access', 'momus'),
      docData(...base, 'app_access', 'kairos'),
      docData(...base, 'linked_apps', 'nexus'),
      docData(...base, 'linked_apps', 'momus'),
      docData(...base, 'linked_apps', 'kairos'),
      docsData([...base, 'sanitas_ledger'], { orderBy: 'created_at', limit: 5 }),
    ]);

    const resolvedBalance = Object.keys(balance).length ? balance : await getValusBalanceFallback();
    const nexusToday = nexusContext.today || nexusStats || {};
    const momusShield = momusContext.energy_shield || {};
    const momusPhoenix = momusContext.phoenix || {};
    const linkedCount = [
      statusFrom(nexusHub, nexusContext, Object.keys(nexusStats).length > 0).state === 'ok',
      statusFrom(momusHub, momusContext, Object.keys(momusStats).length > 0).state === 'ok',
      Object.keys(kairosProfile).length > 0,
    ].filter(Boolean).length;
    const nexusPlan = planFromSources(nexusAccess, nexusLink, nexusHub, userDoc);
    const momusPlan = planFromSources(momusAccess, momusLink, momusHub, userDoc);
    const kairosPlan = planFromSources(kairosAccess, kairosLink, userDoc);

    text('portal-san', displayNumber(resolvedBalance.san, ' VAL'));
    text('portal-xp', displayNumber(resolvedBalance.xp || userDoc.current_xp || userDoc.total_xp, ' XP'));
    text('portal-wallet', userDoc.wallet_address ? `${userDoc.wallet_address.slice(0, 6)}...${userDoc.wallet_address.slice(-4)}` : 'Nicht verbunden');
    text('portal-linked-apps', `${linkedCount}/3`);

    setPill('portal-nexus-status', statusFrom(nexusHub, nexusContext, Object.keys(nexusStats).length > 0));
    setPill('portal-momus-status', statusFrom(momusHub, momusContext, Object.keys(momusStats).length > 0));
    setPill('portal-kairos-status', Object.keys(kairosProfile).length > 0
      ? { state: 'ok', label: 'Profil aktiv' }
      : { state: 'off', label: 'Noch nicht aktiv' });
    setPill('portal-nexus-plan', nexusPlan);
    setPill('portal-momus-plan', momusPlan);
    setPill('portal-kairos-plan', kairosPlan);

    text('portal-nexus-primary', displayNumber(nexusToday.steps || nexusStats.steps || nexusStats.steps_today));
    text('portal-nexus-secondary', displayNumber(nexusToday.meals_today || nexusStats.meals_today, ' Mahlzeiten'));
    text('portal-momus-primary', displayNumber(momusPhoenix.score || momusStats.phoenix_score));
    text('portal-momus-secondary', displayNumber(momusShield.energy_battery || momusStats.energy_battery, '% Akku'));
    text('portal-kairos-primary', kairosProfile.tone || kairosProfile.mode || 'Profil');
    text('portal-kairos-secondary', kairosProfile.memory_consent || kairosProfile.ecosystem_consent ? 'Kontext aktiv' : 'Basis');

    const integrationItems = [
      {
        title: 'NEXUS Hub',
        meta: `${nexusHub.sync_state || (nexusContext.connected ? 'summary_written' : 'keine Freigabe sichtbar')} | Tarif: ${nexusPlan.label}`,
      },
      {
        title: 'MOMUS Hub',
        meta: `${momusHub.sync_state || (momusContext.connected ? 'summary_written' : 'keine Freigabe sichtbar')} | Tarif: ${momusPlan.label}`,
      },
      {
        title: 'KAIROS Profil',
        meta: `${Object.keys(kairosProfile).length ? 'Profil vorhanden' : 'noch keine Profildaten'} | Tarif: ${kairosPlan.label}`,
      },
    ];
    renderList('portal-integration-list', integrationItems, 'Noch keine App-Verbindung sichtbar.');

    renderList(
      'portal-ledger-list',
      ledger.map((entry) => ({
        title: `${num(entry.amount)} VAL | ${entry.description || entry.type || 'Transaktion'}`,
        meta: displayDate(entry.created_at),
      })),
      'Noch keine VAL-Transaktionen.',
    );
  }

  function setCoachFormValues(values = {}) {
    const form = $('coach-preferences-form');
    if (!form) return;
    ['goal', 'level', 'sessionsPerWeek', 'minutesPerSession', 'nutritionGoal', 'dietStyle', 'intolerances', 'restrictions', 'notes']
      .forEach((name) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field && values[name] != null && values[name] !== '') {
          field.value = values[name];
        }
      });
    const equipment = Array.isArray(values.equipment) ? values.equipment : [];
    form.querySelectorAll('input[name="equipment"]').forEach((field) => {
      field.checked = equipment.includes(field.value);
    });
  }

  function boundedInt(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function collectCoachPreferences(form) {
    const data = new FormData(form);
    return {
      goal: String(data.get('goal') || '').trim(),
      level: String(data.get('level') || '').trim(),
      sessionsPerWeek: boundedInt(data.get('sessionsPerWeek'), 3, 1, 6),
      minutesPerSession: boundedInt(data.get('minutesPerSession'), 35, 10, 120),
      equipment: data.getAll('equipment').map((item) => String(item).trim()).filter(Boolean),
      nutritionGoal: String(data.get('nutritionGoal') || 'balanced').trim(),
      dietStyle: String(data.get('dietStyle') || 'mixed').trim(),
      intolerances: shortText(data.get('intolerances'), 240),
      restrictions: shortText(data.get('restrictions'), 520),
      notes: shortText(data.get('notes'), 520),
    };
  }

  function appendEmpty(container, textValue) {
    clearNode(container);
    const span = document.createElement('span');
    span.className = 'portal-empty';
    span.textContent = textValue;
    container.appendChild(span);
  }

  const exerciseLibrary = [
    {
      key: 'squat',
      title: 'Kniebeuge',
      cue: 'Huefte nach hinten, Knie folgen den Fussspitzen.',
      aliases: ['kniebeuge', 'squat', 'hocke'],
      icon: 'squat',
    },
    {
      key: 'row',
      title: 'Rudern',
      cue: 'Brust lang, Ellenbogen nah am Koerper zurueckziehen.',
      aliases: ['rudern', 'band-rudern', 'hantelrudern', 'rows'],
      icon: 'row',
    },
    {
      key: 'pushup',
      title: 'Liegestuetz',
      cue: 'Koerper als Linie, Haende unter den Schultern.',
      aliases: ['liegestuetz', 'push-up', 'pushup', 'auf knien'],
      icon: 'pushup',
    },
    {
      key: 'plank',
      title: 'Plank',
      cue: 'Rippen runter, Bauch aktiv, ruhig atmen.',
      aliases: ['plank', 'unterarmstuetz', 'core'],
      icon: 'plank',
    },
    {
      key: 'lunge',
      title: 'Ausfallschritt',
      cue: 'Vorderer Fuss stabil, Oberkoerper aufrecht.',
      aliases: ['ausfallschritt', 'lunge', 'lunges'],
      icon: 'lunge',
    },
    {
      key: 'press',
      title: 'Schulterdruecken',
      cue: 'Gewicht kontrolliert ueber Kopf, Bauch bleibt fest.',
      aliases: ['schulterdruecken', 'press', 'overhead'],
      icon: 'press',
    },
    {
      key: 'bridge',
      title: 'Glute Bridge',
      cue: 'Fersen in den Boden, Huefte kontrolliert anheben.',
      aliases: ['glute bridge', 'hueftbruecke', 'hip bridge'],
      icon: 'bridge',
    },
    {
      key: 'mountain',
      title: 'Mountain Climber',
      cue: 'Stuetz stabil halten, Knie rhythmisch nach vorn.',
      aliases: ['mountain climber', 'climber'],
      icon: 'mountain',
    },
    {
      key: 'walk',
      title: 'Spaziergang',
      cue: 'Locker starten, Tempo so waehlen, dass Atmung ruhig bleibt.',
      aliases: ['spaziergang', 'gehen', 'walking', 'zone 2'],
      icon: 'walk',
    },
    {
      key: 'bike',
      title: 'Rad / Ergometer',
      cue: 'Gleichmaessig treten, Intensitaet bewusst niedrig halten.',
      aliases: ['rad', 'ergometer', 'bike', 'fahrrad'],
      icon: 'bike',
    },
  ];

  function exerciseVisual(kind) {
    const visuals = {
      squat: [
        'M18 12c5 0 8 4 8 10v10h-5V22c0-3-1-5-3-5s-3 2-3 5v10h-5V22c0-6 3-10 8-10Z',
        'M64 21c6 0 11 5 11 12v9h-6v-8c0-4-2-7-5-7s-5 3-5 7v8h-6v-9c0-7 5-12 11-12Z',
        'M112 32c6 0 11 5 11 12v12h-6V44c0-4-2-7-5-7s-5 3-5 7v12h-6V44c0-7 5-12 11-12Z',
      ],
      row: [
        'M13 35h24l-8 8H8l5-8Zm5-18 13 10-5 5-13-9 5-6Z',
        'M57 32h27l-6 8H52l5-8Zm5-15 17 7-3 6-17-6 3-7Z',
        'M103 29h29l-4 8h-30l5-8Zm3-15 20 2-1 7-20-2 1-7Z',
      ],
      pushup: [
        'M8 42h37v6H8v-6Zm6-13 21 8-2 6-21-8 2-6Z',
        'M55 38h38v6H55v-6Zm5-11 26 6-1 6-27-6 2-6Z',
        'M102 34h39v6h-39v-6Zm4-10 31 4-1 6-31-4 1-6Z',
      ],
      plank: [
        'M8 38h38v6H8v-6Zm7-12 27 8-2 6-27-8 2-6Z',
        'M55 37h38v6H55v-6Zm7-11 27 8-2 6-27-8 2-6Z',
        'M102 37h38v6h-38v-6Zm7-11 27 8-2 6-27-8 2-6Z',
      ],
      lunge: [
        'M19 12c5 0 8 4 8 9 0 6-3 10-8 10s-8-4-8-10c0-5 3-9 8-9Z',
        'M67 20c6 0 11 5 11 12 0 5-3 9-7 11l-4-5c2-1 4-3 4-6 0-4-2-6-5-6s-5 3-5 7v10h-6V33c0-8 5-13 12-13Z',
        'M115 30c7 0 12 5 12 12 0 4-2 8-5 10l-5-4c2-1 3-3 3-6 0-4-2-6-5-6s-5 2-5 6v14h-6V42c0-7 5-12 11-12Z',
      ],
      press: [
        'M18 29h9v23h-6V35h-6v17H9V29h9Zm-4-16h16v5H14v-5Z',
        'M65 22h9v30h-6V28h-6v24h-6V22h9Zm-8-12h22v5H57v-5Z',
        'M112 17h9v35h-6V23h-6v29h-6V17h9Zm-12-12h30v5h-30V5Z',
      ],
      bridge: [
        'M8 45h38v6H8v-6Zm6-18h25l4 18H36l-2-10H18l-4 10H8l6-18Z',
        'M55 42h38v6H55v-6Zm6-19h26l5 19h-7l-3-11H66l-4 11h-7l6-19Z',
        'M102 42h38v6h-38v-6Zm6-19h26l5 19h-7l-3-11h-16l-4 11h-7l6-19Z',
      ],
      mountain: [
        'M8 40h38v6H8v-6Zm7-17 24 11-2 6-24-11 2-6Z',
        'M55 38h38v6H55v-6Zm8-18 22 13-3 6-22-13 3-6Z',
        'M102 36h38v6h-38v-6Zm8-17 24 12-3 6-24-12 3-6Z',
      ],
      walk: [
        'M18 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-2 12 7 8-4 4-4-5-5 13-6-2 7-18h5Z',
        'M66 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-3 12 8 8-4 4-4-5-5 13-6-2 7-18h4Z',
        'M114 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-3 12 8 8-4 4-4-5-5 13-6-2 7-18h4Z',
      ],
      bike: [
        'M14 40a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm34 0a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-34 9h34L34 25H24L14 49Z',
        'M62 40a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm34 0a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-34 9h34L82 25H72L62 49Z',
        'M110 40a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm34 0a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-34 9h34l-14-24h-10l-10 24Z',
      ],
    };
    const phases = visuals[kind] || visuals.squat;
    return `
      <svg viewBox="0 0 150 70" aria-hidden="true" class="portal-exercise-sequence">
        <path class="floor" d="M7 58h136" />
        <g class="phase phase-1"><path d="${phases[0]}"/></g>
        <path class="arrow" d="M45 34h14m-4-4 4 4-4 4"/>
        <g class="phase phase-2"><path d="${phases[1]}"/></g>
        <path class="arrow" d="M93 34h14m-4-4 4 4-4 4"/>
        <g class="phase phase-3"><path d="${phases[2]}"/></g>
      </svg>
    `;
  }

  function exerciseIcon(kind) {
    const icons = {
      squat: '<path d="M12 4.2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z"/><path d="M9 9.2h6l1.8 3.1"/><path d="m9.5 9.4-2.1 3.8 3.1 2.2"/><path d="m14.8 12.5-2.5 2.8 3.7 3.8"/><path d="m10.4 15.4-1.9 4.1"/>',
      row: '<path d="M12 4.2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z"/><path d="M8.1 10.5h7.8"/><path d="m8.1 10.5-2.8 4.6"/><path d="m15.9 10.5 2.8 4.6"/><path d="M6.5 15.1h11"/><path d="m10.2 11.2 1.2 4.2 3.3-2.1"/>',
      pushup: '<path d="M17.5 6.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z"/><path d="M4 15.5h16"/><path d="m6.2 14.9 5.6-4.1 5.2 3.9"/><path d="m10.4 11.9 1.7 3.6"/><path d="M18.8 14.8 20.6 18"/>',
      plank: '<path d="M17.6 7.1a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Z"/><path d="M4.4 15.2h14.2"/><path d="m5.8 14.9 7.3-4.3 4.7 4.2"/><path d="M8.2 15.1 7 18.5"/><path d="M16.6 15.1l1.8 3.2"/>',
      lunge: '<path d="M12 4.2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z"/><path d="m11 9.2 2.5 3.5"/><path d="m13.5 12.7 4.4.3"/><path d="m13.5 12.7-2.8 6.2"/><path d="m17.9 13-1.7 5.5"/><path d="M8.2 18.9h4.2"/>',
      press: '<path d="M12 5a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 12 5Z"/><path d="M8.2 11.2h7.6"/><path d="M8 7.8V4.6"/><path d="M16 7.8V4.6"/><path d="M7 4.6h2"/><path d="M15 4.6h2"/><path d="m10 11.4-.8 7.2"/><path d="m14 11.4.8 7.2"/>',
      bridge: '<path d="M17.8 11.3a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Z"/><path d="M4 17.2h16"/><path d="m5.8 16.9 4.1-5 5.4 4.9"/><path d="m9.9 11.9 4.3-.1"/><path d="M6.2 17.1 4.8 20"/><path d="m18.1 17.1 1.4 2.8"/>',
      mountain: '<path d="M17.6 5.9a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Z"/><path d="m5.2 15.4 5.4-5 5.9 3.9"/><path d="m10.6 10.4 2.4 6"/><path d="m13 16.4-4.8 2.4"/><path d="m16.5 14.3 3.4 3.5"/>',
      walk: '<path d="M12.7 4.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z"/><path d="m11.8 9.3-2.1 4.2 3.2 2.1"/><path d="m12.1 9.5 3.1 2.4"/><path d="m12.9 15.6-1.2 4"/><path d="m9.7 13.5-3 1.8"/><path d="m15.2 11.9 2.4-1.3"/>',
      bike: '<circle cx="7" cy="16.5" r="3.1"/><circle cx="17" cy="16.5" r="3.1"/><path d="M7 16.5 10.6 10h3.2l3.2 6.5"/><path d="m10.6 10 2.1 6.5L17 16.5"/><path d="M13.8 10h2.8"/><path d="M9.7 8h2.2"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[kind] || icons.squat}</svg>`;
  }

  function lookupExercise(name) {
    const haystack = String(name || '').toLowerCase();
    return exerciseLibrary.find((item) => item.aliases.some((alias) => haystack.includes(alias)));
  }

  function resolveExercises(item = {}) {
    const explicit = Array.isArray(item.exercises)
      ? item.exercises.map((exercise) => ({
          sourceName: typeof exercise === 'string' ? exercise : exercise.name,
          cue: typeof exercise === 'string' ? '' : exercise.cue,
        }))
      : [];
    const sourceText = [item.focus, item.workout, item.notes].filter(Boolean).join(' ');
    const inferred = exerciseLibrary
      .filter((exercise) => exercise.aliases.some((alias) => sourceText.toLowerCase().includes(alias)))
      .map((exercise) => ({ sourceName: exercise.title, cue: '' }));
    const seen = new Set();
    return [...explicit, ...inferred]
      .map((entry) => {
        const match = lookupExercise(entry.sourceName) || {
          title: cleanExerciseName(entry.sourceName),
          cue: 'Langsam starten und saubere Technik priorisieren.',
          icon: 'squat',
          key: cleanExerciseName(entry.sourceName).toLowerCase(),
        };
        return {
          key: match.key || match.title,
          title: match.title || cleanExerciseName(entry.sourceName),
          cue: entry.cue || match.cue,
          icon: match.icon || 'squat',
        };
      })
      .filter((exercise) => {
        const key = exercise.key.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }

  function cleanExerciseName(value) {
    return shortText(value || 'Uebung', 40);
  }

  function renderExerciseCards(container, exercises) {
    if (!exercises.length) return;
    const grid = document.createElement('div');
    grid.className = 'portal-exercise-grid';
    exercises.forEach((exercise) => {
      const card = document.createElement('article');
      card.className = 'portal-exercise-card';
      const visual = document.createElement('div');
      visual.className = 'portal-exercise-visual';
      visual.innerHTML = exerciseIcon(exercise.icon);
      const body = document.createElement('div');
      body.className = 'portal-exercise-body';
      const title = document.createElement('strong');
      const cue = document.createElement('span');
      title.textContent = exercise.title;
      cue.textContent = exercise.cue;
      body.append(title, cue);
      card.append(visual, body);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function appendNutritionSummary(container, nutrition = {}) {
    if (!nutrition.dailyTarget && !nutrition.hydration) return;
    const node = document.createElement('div');
    node.className = 'portal-nutrition-summary';
    const title = document.createElement('strong');
    const detail = document.createElement('span');
    title.textContent = nutrition.dailyTarget || 'Tagesziel';
    detail.textContent = nutrition.hydration || '';
    node.append(title);
    if (detail.textContent) node.append(detail);
    container.appendChild(node);
  }

  function mealDetail(meal = {}) {
    return [meal.foods, meal.reason, meal.notes].filter(Boolean).join(' | ');
  }

  function renderWeeklyNutrition(container, nutrition = {}) {
    const days = Array.isArray(nutrition.weeklyDays) ? nutrition.weeklyDays : [];
    if (!days.length) return false;
    appendNutritionSummary(container, nutrition);
    const calendar = document.createElement('div');
    calendar.className = 'portal-nutrition-calendar';
    days.slice(0, 7).forEach((day, index) => {
      const article = document.createElement('article');
      article.className = 'portal-nutrition-day';

      const head = document.createElement('div');
      head.className = 'portal-nutrition-head';
      const datePill = document.createElement('span');
      datePill.className = 'portal-nutrition-date';
      datePill.textContent = displayCalendarDay(day, index);
      const title = document.createElement('strong');
      title.textContent = day.focus || day.day || `Tag ${index + 1}`;
      head.append(datePill, title);
      article.appendChild(head);

      const meals = Array.isArray(day.meals) ? day.meals : [];
      if (meals.length) {
        const list = document.createElement('div');
        list.className = 'portal-nutrition-meals';
        meals.slice(0, 5).forEach((meal) => {
          const row = document.createElement('div');
          const label = document.createElement('strong');
          const detail = document.createElement('span');
          label.textContent = meal.name || meal.time || 'Mahlzeit';
          detail.textContent = mealDetail(meal);
          row.append(label);
          if (detail.textContent) row.append(detail);
          list.appendChild(row);
        });
        article.appendChild(list);
      }

      if (day.prep) {
        const prep = document.createElement('small');
        prep.className = 'portal-nutrition-prep';
        prep.textContent = day.prep;
        article.appendChild(prep);
      }

      calendar.appendChild(article);
    });
    container.appendChild(calendar);
    return true;
  }

  function renderDailyNutrition(container, nutrition = {}) {
    appendNutritionSummary(container, nutrition);
    const meals = Array.isArray(nutrition.meals) ? nutrition.meals : [];
    meals.forEach((meal) => {
      const node = document.createElement('div');
      node.className = 'portal-plan-meal';
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      title.textContent = meal.name || meal.time || 'Mahlzeit';
      detail.textContent = mealDetail(meal);
      node.append(title);
      if (detail.textContent) node.append(detail);
      container.appendChild(node);
    });
  }

  function renderCoachPlan(plan = {}, meta = {}) {
    const hasPlan = plan && Object.keys(plan).length > 0;
    if (!hasPlan) {
      setPill('coach-plan-state', { state: 'off', label: 'Noch kein Plan' });
      setPill('coach-plan-source', { state: 'off', label: 'MVP' });
      return;
    }

    text('coach-plan-summary', plan.summary || 'Plan gespeichert.');
    text('coach-plan-updated', meta.createdAt ? `Erstellt am ${displayDateTime(meta.createdAt)}` : 'Plan gespeichert.');
    text('coach-plan-checkin', plan.nextCheckIn ? `Naechster Check-in: ${plan.nextCheckIn}` : 'Naechster Check-in: nach der ersten Trainingswoche.');
    setPill('coach-plan-state', { state: 'ok', label: 'Plan aktiv' });
    setPill('coach-plan-source', { state: meta.provider === 'gemini' ? 'ok' : 'pending', label: meta.model || 'Gemini' });

    const trainingNode = $('coach-plan-training');
    if (trainingNode) {
      clearNode(trainingNode);
      const items = Array.isArray(plan.weeklyTraining) ? plan.weeklyTraining : [];
      if (!items.length) {
        appendEmpty(trainingNode, 'Noch kein Trainingsplan vorhanden.');
      } else {
        items.forEach((item, index) => {
          const node = document.createElement('div');
          node.className = 'portal-training-card';
          const head = document.createElement('div');
          head.className = 'portal-training-head';
          const dayPill = document.createElement('span');
          dayPill.className = 'portal-training-day';
          dayPill.textContent = item.day || `Tag ${index + 1}`;
          const duration = document.createElement('small');
          duration.textContent = item.duration || '';
          const title = document.createElement('strong');
          title.textContent = item.focus || 'Training';
          head.append(dayPill, title);
          if (duration.textContent) head.appendChild(duration);
          const workout = document.createElement('p');
          workout.textContent = item.workout || item.session || '';
          node.append(head);
          if (workout.textContent) node.append(workout);
          renderExerciseCards(node, resolveExercises(item));
          if (item.notes) {
            const notes = document.createElement('small');
            notes.className = 'portal-training-note';
            notes.textContent = item.notes;
            node.appendChild(notes);
          }
          trainingNode.appendChild(node);
        });
      }
    }

    const nutritionNode = $('coach-plan-nutrition');
    if (nutritionNode) {
      clearNode(nutritionNode);
      const nutrition = plan.nutritionPlan || {};
      if (!renderWeeklyNutrition(nutritionNode, nutrition)) renderDailyNutrition(nutritionNode, nutrition);
      if (!nutritionNode.children.length) {
        appendEmpty(nutritionNode, 'Noch kein Ernaehrungsplan vorhanden.');
      }
    }

    const recoveryItems = Array.isArray(plan.recovery) ? plan.recovery : [];
    renderList(
      'coach-plan-recovery',
      recoveryItems.map((item) => ({
        title: typeof item === 'string' ? item : item.title || item.focus || 'Regeneration',
        meta: typeof item === 'string' ? '' : item.detail || item.notes || '',
      })),
      'Noch keine Regenerationshinweise.',
    );

    const safetyItems = Array.isArray(plan.safetyNotes) ? plan.safetyNotes : [];
    renderList(
      'coach-plan-safety',
      safetyItems.map((item) => ({
        title: typeof item === 'string' ? item : item.title || item.type || 'Hinweis',
        meta: typeof item === 'string' ? '' : item.detail || item.notes || '',
      })),
      'Hinweise erscheinen nach der Planerstellung.',
    );
  }

  function coachCacheKey(user) {
    return user?.uid ? `callidus-sport-coach-plan:${user.uid}` : '';
  }

  function saveCoachCache(user, payload = {}) {
    const key = coachCacheKey(user);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        plan: payload.plan || null,
        provider: payload.provider || 'gemini',
        model: payload.model || '',
        createdAt: payload.createdAt || new Date().toISOString(),
        preferences: payload.preferences || null,
      }));
    } catch (error) {
      console.warn('Coach cache write failed', error);
    }
  }

  function readCoachCache(user) {
    const key = coachCacheKey(user);
    if (!key) return null;
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      return cached?.plan ? cached : null;
    } catch (error) {
      console.warn('Coach cache read failed', error);
      return null;
    }
  }

  async function fetchCoachPlanViaFunction() {
    try {
      const callable = state.api.httpsCallable(state.fns, 'getSportEnergyPlan');
      const response = await callable({});
      return response.data || null;
    } catch (error) {
      console.warn('Coach plan callable read failed', error);
      return null;
    }
  }

  function coachErrorMessage(error) {
    const code = error?.code || '';
    if (code.includes('not-found')) return 'Die Gemini-Funktion ist noch nicht deployt. Die Oberflaeche ist bereit, der Serverteil fehlt noch.';
    if (code.includes('failed-precondition')) return 'Die Gemini-Funktion ist deployt, aber noch nicht voll konfiguriert. Bitte GEMINI_API_KEY als Secret setzen.';
    if (code.includes('unauthenticated')) return 'Bitte erneut einloggen.';
    if (code.includes('invalid-argument')) return error.message || 'Bitte die Pflichtfelder pruefen.';
    return 'Plan konnte gerade nicht erstellt werden. Bitte spaeter erneut versuchen.';
  }

  function setupCoachHandlers(user) {
    const form = $('coach-preferences-form');
    if (!form || form.dataset.ready === 'true') return;
    form.dataset.ready = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = $('coach-generate-plan');
      const preferences = collectCoachPreferences(form);
      if (!preferences.goal || !preferences.level) {
        setStatus('coach-status', 'Bitte Ziel und Trainingslevel auswaehlen.', 'error');
        return;
      }
      setStatus('coach-status', 'Gemini erstellt deinen Plan...', '');
      if (button) button.disabled = true;
      try {
        const callable = state.api.httpsCallable(state.fns, 'generateSportEnergyPlan');
        const response = await callable({ preferences, calendarDays: coachCalendarDays() });
        const payload = response.data || {};
        renderCoachPlan(payload.plan, {
          provider: 'gemini',
          model: payload.model || 'Gemini',
          createdAt: payload.createdAt || new Date().toISOString(),
        });
        saveCoachCache(user, {
          plan: payload.plan,
          provider: 'gemini',
          model: payload.model || 'Gemini',
          createdAt: payload.createdAt || new Date().toISOString(),
          preferences,
        });
        setPill('coach-gemini-state', { state: 'ok', label: 'Gemini aktiv' });
        setStatus('coach-status', 'Plan wurde erstellt und gespeichert.', 'ok');
        await loadCoach(user, { skipFormSetup: true });
      } catch (error) {
        console.warn('Coach generation failed', error);
        setPill('coach-gemini-state', { state: 'pending', label: 'Function pruefen' });
        setStatus('coach-status', coachErrorMessage(error), 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  async function loadCoach(user, options = {}) {
    const today = todayKey();
    const base = ['users', user.uid];
    const [
      userDoc,
      nexusContext,
      nexusStats,
      healthPlan,
      mealPlan,
      momusContext,
      momusStats,
      kairosProfile,
      preferences,
      latestPlan,
      planHistory,
    ] = await Promise.all([
      docData(...base),
      docData(...base, 'kairos_context', 'nexus_current'),
      docData(...base, 'daily_stats', today),
      docData(...base, 'health_plan', 'current'),
      docData(...base, 'meal_plan', 'current'),
      docData(...base, 'kairos_context', 'momus_current'),
      docData(...base, 'momus_stats', today),
      docData(...base, 'kairos_profile', 'current'),
      docData(...base, 'sport_coach', 'preferences'),
      docData(...base, 'sport_coach', 'latest_plan'),
      docsData([...base, 'sport_coach_plans'], { orderBy: 'created_at', limit: 1 }),
    ]);

    let latest = Object.keys(latestPlan).length ? latestPlan : (planHistory[0] || {});
    let plan = latest.plan || {};
    const callablePlan = Object.keys(plan).length ? null : await fetchCoachPlanViaFunction();
    if (!Object.keys(plan).length && callablePlan?.plan) {
      latest = {
        plan: callablePlan.plan,
        provider: callablePlan.provider,
        model: callablePlan.model,
        created_at_iso: callablePlan.createdAt,
      };
      plan = callablePlan.plan;
      saveCoachCache(user, {
        plan,
        provider: callablePlan.provider,
        model: callablePlan.model,
        createdAt: callablePlan.createdAt,
        preferences: callablePlan.preferences,
      });
    }
    const cachedPlan = Object.keys(plan).length ? null : readCoachCache(user);
    if (!Object.keys(plan).length && cachedPlan?.plan) {
      latest = {
        plan: cachedPlan.plan,
        provider: cachedPlan.provider,
        model: cachedPlan.model,
        created_at_iso: cachedPlan.createdAt,
      };
      plan = cachedPlan.plan;
    }
    const nexusToday = nexusContext.today || {};
    const momusShield = momusContext.energy_shield || {};

    text('coach-context-nexus', displayNumber(nexusToday.steps ?? nexusStats.steps ?? nexusStats.steps_today));
    text('coach-context-nexus-sub', `${displayNumber(nexusToday.calories_consumed ?? nexusStats.caloriesConsumed)} kcal | Ziel ${displayNumber(nexusToday.calorie_goal || mealPlan.targetCalories || userDoc.daily_calorie_goal)}`);
    text('coach-context-momus', displayNumber(momusShield.energy_battery ?? momusStats.energy_battery, '%'));
    text('coach-context-momus-sub', momusShield.state || momusStats.energy_shield_state || 'Noch wenige Energie-Signale');
    text('coach-context-kairos', kairosProfile.tone || kairosProfile.mode || (Object.keys(kairosProfile).length ? 'Aktiv' : 'Basis'));
    text('coach-context-kairos-sub', kairosProfile.focus || kairosProfile.intention || 'Profil und Kontext');
    text('coach-context-plan', Object.keys(plan).length ? 'Aktiv' : '-');
    text('coach-context-plan-sub', displayDateTime(latest.created_at) || 'Noch kein gespeicherter Plan');

    const currentPreferences = preferences.current || preferences;
    if (!options.skipFormSetup) setCoachFormValues(currentPreferences);
    renderCoachPlan(plan, {
      provider: latest.provider,
      model: latest.model,
      createdAt: latest.created_at || latest.created_at_iso,
    });
    setupCoachHandlers(user);
  }

  async function loadAppDetail(user, appId) {
    if (appId === 'nexus') {
      await loadNexus(user);
    } else if (appId === 'momus') {
      await loadMomus(user);
    } else {
      await loadKairos(user);
    }
  }

  async function loadNexus(user) {
    const today = todayKey();
    const base = ['users', user.uid];
    const [userDoc, context, stats, healthPlan, mealPlan, meals, journals, activities, hub, access, linked] = await Promise.all([
      docData(...base),
      docData(...base, 'kairos_context', 'nexus_current'),
      docData(...base, 'daily_stats', today),
      docData(...base, 'health_plan', 'current'),
      docData(...base, 'meal_plan', 'current'),
      docsData([...base, 'meals'], { orderBy: 'timestamp', limit: 8 }),
      docsData([...base, 'diary_entries'], { orderBy: 'date', limit: 5 }),
      docsData([...base, 'activities'], { orderBy: 'timestamp', limit: 5 }),
      docData(...base, 'hub', 'nexus_status'),
      docData(...base, 'app_access', 'nexus'),
      docData(...base, 'linked_apps', 'nexus'),
    ]);

    const todayData = context.today || {};
    setPill('portal-app-status', statusFrom(hub, context, meals.length > 0 || Object.keys(stats).length > 0));
    setPill('portal-app-plan', planFromSources(access, linked, hub, userDoc));
    renderMetrics([
      {
        label: 'Kalorien',
        value: displayNumber(todayData.calories_consumed ?? stats.caloriesConsumed),
        sub: `Ziel ${displayNumber(todayData.calorie_goal || mealPlan.targetCalories || userDoc.daily_calorie_goal)}`,
      },
      {
        label: 'Schritte',
        value: displayNumber(todayData.steps ?? stats.steps ?? stats.steps_today),
        sub: `${displayNumber(todayData.activity_minutes, ' Min')} Aktivitaet`,
      },
      {
        label: 'Mahlzeiten',
        value: displayNumber(todayData.meals_today ?? meals.filter((meal) => meal.date === today).length),
        sub: 'Heute erfasst',
      },
      {
        label: 'Wohlbefinden',
        value: displayNumber(todayData.wellbeing_score ?? context.latest_journal?.wellbeing_score),
        sub: healthPlan.healthType || userDoc.healthType || 'Gesundheitsprofil',
      },
    ]);

    text(
      'portal-app-insight',
      shortText(context.latest_journal?.ai_summary || context.latest_journal?.text || healthPlan.summary || 'Noch keine aktuelle NEXUS-Zusammenfassung vorhanden.', 280),
    );

    renderList(
      'portal-primary-list',
      meals.map((meal) => ({
        title: meal.name || 'Mahlzeit',
        meta: `${displayNumber(meal.calories, ' kcal')} | ${displayDate(meal.timestamp) || meal.date || ''}`,
      })),
      'Noch keine Mahlzeiten gespeichert.',
    );

    const journalItems = journals.map((entry) => ({
      title: shortText(entry.ai_summary || entry.text || entry.gratitude || 'Journal-Eintrag', 90),
      meta: `${entry.id || entry.date || ''} | Schlaf ${entry.score_sleep ?? '-'} | Stress ${entry.score_grief ?? entry.score_stress ?? '-'}`,
    }));
    renderList('portal-secondary-list', journalItems, 'Noch keine Journal-Eintraege.');

    const activityItems = activities.map((entry) => ({
      title: entry.name || entry.type || 'Aktivitaet',
      meta: `${displayNumber(entry.duration_minutes || entry.minutes, ' Min')} | ${displayDate(entry.timestamp)}`,
    }));
    renderList('portal-tertiary-list', activityItems, 'Noch keine Aktivitaeten.');
  }

  async function loadMomus(user) {
    const today = todayKey();
    const base = ['users', user.uid];
    const [userDoc, context, stats, log, hub, linked, access, knowledge] = await Promise.all([
      docData(...base),
      docData(...base, 'kairos_context', 'momus_current'),
      docData(...base, 'momus_stats', today),
      docData(...base, 'daily_logs', today),
      docData(...base, 'hub', 'momus_status'),
      docData(...base, 'linked_apps', 'momus'),
      docData(...base, 'app_access', 'momus'),
      docData(...base, 'kairos_context', 'momus_knowledge'),
    ]);

    const phoenix = context.phoenix || {};
    const shield = context.energy_shield || {};
    const leaks = context.leaks || {};
    const body = context.body_profile || knowledge.body_profile || {};
    setPill('portal-app-status', statusFrom(hub, context, Object.keys(stats).length > 0 || Object.keys(log).length > 0));
    setPill('portal-app-plan', planFromSources(access, linked, hub, userDoc));

    renderMetrics([
      {
        label: 'Phoenix',
        value: displayNumber(phoenix.score ?? stats.phoenix_score ?? userDoc.phoenix_score),
        sub: phoenix.level || stats.phoenix_level || 'Score',
      },
      {
        label: 'Energie-Schild',
        value: displayNumber(shield.score ?? stats.energy_shield_score),
        sub: shield.state || stats.energy_shield_state || 'Tageslage',
      },
      {
        label: 'Energie-Akku',
        value: displayNumber(shield.energy_battery ?? stats.energy_battery, '%'),
        sub: `${displayNumber(shield.timer_delta_today_min ?? stats.timer_delta_today_min, ' Min')} Delta`,
      },
      {
        label: 'Lecks',
        value: displayNumber(leaks.open_count ?? stats.leaks_logged_count ?? log.leaksLogged?.length),
        sub: `${displayNumber(leaks.closed_count ?? stats.leaks_closed_count, '')} geschlossen`,
      },
    ]);

    text(
      'portal-app-insight',
      shortText(context.energy_check?.latest_council_summary || knowledge.analyses?.latest_profile || 'Noch keine MOMUS-Zusammenfassung vorhanden.', 280),
    );

    renderList('portal-primary-list', [
      { title: 'Hub-Status', meta: hub.sync_state || linked.sync_state || 'keine Kopplung sichtbar' },
      { title: 'Dokument-Kontext', meta: hub.document_context_granted ? 'freigegeben' : 'nicht freigegeben' },
      { title: 'Letzte Sync-Markierung', meta: displayDate(hub.last_summary_sync_at || context.synced_at) || '-' },
    ], 'Noch keine Hub-Daten.');

    const riskFlags = Array.isArray(context.risk_flags) ? context.risk_flags : Object.values(context.risk_flags || {});
    renderList(
      'portal-secondary-list',
      riskFlags.filter(Boolean).map((flag) => ({
        title: typeof flag === 'string' ? flag : flag.label || flag.type || 'Signal',
        meta: typeof flag === 'string' ? '' : flag.detail || flag.reason || '',
      })),
      'Keine aktuellen Risiko-Signale.',
    );

    renderList('portal-tertiary-list', [
      { title: 'Schlaf', meta: body.sleep_hours ? `${body.sleep_hours} Stunden` : 'nicht gesetzt' },
      { title: 'BMI', meta: body.bmi ? `${body.bmi} | ${body.bmi_label || ''}` : 'nicht gesetzt' },
      { title: 'Schritte', meta: displayNumber(context.steps?.today ?? stats.steps_today) },
    ], 'Noch kein Koerperprofil.');
  }

  async function loadKairos(user) {
    const base = ['users', user.uid];
    const [userDoc, profile, memory, messages, reminders, pending, nexusLink, momusLink, kairosAccess, nexusHub, momusHub] = await Promise.all([
      docData(...base),
      docData(...base, 'kairos_profile', 'current'),
      docsData([...base, 'kairos_memory'], { orderBy: 'created_at', limit: 5 }),
      docsData([...base, 'kairos_chat_messages'], { orderBy: 'created_at', limit: 8 }),
      docsData([...base, 'kairos_reminders'], { orderBy: 'created_at', limit: 8 }),
      docsData([...base, 'pending_actions'], { orderBy: 'created_at', limit: 8 }),
      docData(...base, 'linked_apps', 'nexus'),
      docData(...base, 'linked_apps', 'momus'),
      docData(...base, 'app_access', 'kairos'),
      docData(...base, 'hub', 'nexus_status'),
      docData(...base, 'hub', 'momus_status'),
    ]);

    setPill('portal-app-status', Object.keys(profile).length
      ? { state: 'ok', label: 'Profil aktiv' }
      : { state: 'off', label: 'Noch nicht aktiv' });
    setPill('portal-app-plan', planFromSources(kairosAccess, userDoc));

    const linkedApps = [
      nexusLink.connected || nexusHub.kairos_linked || nexusHub.connected,
      momusLink.connected || momusHub.kairos_linked || momusHub.connected,
    ].filter(Boolean).length;

    renderMetrics([
      {
        label: 'Profil',
        value: profile.tone || profile.mode || (Object.keys(profile).length ? 'Aktiv' : '-'),
        sub: profile.language || 'KAIROS',
      },
      {
        label: 'Erinnerungen',
        value: displayNumber(reminders.filter((item) => item.status !== 'done').length),
        sub: 'geplant oder offen',
      },
      {
        label: 'Kontext',
        value: `${linkedApps}/2`,
        sub: 'NEXUS und MOMUS',
      },
      {
        label: 'Aktionen',
        value: displayNumber(pending.length),
        sub: 'wartend',
      },
    ]);

    text(
      'portal-app-insight',
      shortText(profile.intention || profile.focus || messages[0]?.text || 'Noch keine aktuelle KAIROS-Zusammenfassung vorhanden.', 280),
    );

    renderList(
      'portal-primary-list',
      messages.map((message) => ({
        title: shortText(message.text, 100) || 'Nachricht',
        meta: `${message.role || (message.isUser ? 'Nutzer' : 'KAIROS')} | ${displayDate(message.created_at)}`,
      })),
      'Noch keine Chat-Nachrichten.',
    );

    renderList(
      'portal-secondary-list',
      reminders.map((reminder) => ({
        title: shortText(reminder.title || reminder.text || reminder.content, 100) || 'Erinnerung',
        meta: `${reminder.status || 'geplant'} | ${displayDate(reminder.created_at)}`,
      })),
      'Noch keine Erinnerungen.',
    );

    renderList(
      'portal-tertiary-list',
      memory.map((item) => ({
        title: shortText(item.title || item.summary || item.text, 100) || 'Memory',
        meta: displayDate(item.created_at),
      })),
      'Noch keine Memory-Eintraege.',
    );
  }

  function mapAuthError(code) {
    const map = {
      'auth/invalid-email': 'Ungueltige E-Mail-Adresse.',
      'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
      'auth/wrong-password': 'Falsches Passwort.',
      'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
      'auth/weak-password': 'Passwort muss mindestens 6 Zeichen haben.',
      'auth/too-many-requests': 'Zu viele Versuche. Bitte warten.',
      'auth/invalid-credential': 'E-Mail oder Passwort ungueltig.',
      'auth/popup-closed-by-user': 'Google-Anmeldung wurde geschlossen.',
    };
    return map[code] || 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
  }

  show('portal-loading');
  initFirebase().catch((error) => {
    console.error(error);
    show('portal-auth');
    setError('portal-auth-error', 'Firebase konnte nicht geladen werden.');
  });
}

bootPortal();
document.addEventListener('astro:page-load', bootPortal);
