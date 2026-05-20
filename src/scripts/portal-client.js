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
    const app = appApi.getApps().length === 0
      ? appApi.initializeApp(firebaseConfig)
      : appApi.getApps()[0];

    state.api = { ...appApi, ...authApi, ...firestoreApi };
    state.auth = authApi.getAuth(app);
    state.db = firestoreApi.getFirestore(app);
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

    text('portal-san', displayNumber(balance.san, ' SAN'));
    text('portal-xp', displayNumber(balance.xp || userDoc.current_xp || userDoc.total_xp, ' XP'));
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
        title: `${num(entry.amount)} SAN | ${entry.description || entry.type || 'Transaktion'}`,
        meta: displayDate(entry.created_at),
      })),
      'Noch keine SAN-Transaktionen.',
    );
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
