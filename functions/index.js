const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const functionsV1 = require("firebase-functions/v1");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");
const callidusKnowledge = require("./data/callidus-knowledge.json");

admin.initializeApp();

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const falApiKey = defineSecret("FAL_KEY");
const digistoreApiKey = defineSecret("DIGISTORE24_API_KEY");
const digistoreIpnPassphrase = defineSecret("DIGISTORE24_IPN_PASSPHRASE");
// Dev-Dashboard-Apps haben keinen statischen Admin-Token. Der Zugriff laeuft ueber
// den Client-Credentials-Grant: Client-ID + Secret werden gegen einen Token
// getauscht, der 24 h gilt. Dasselbe Secret signiert auch die Webhooks.
const shopifyClientId = defineSecret("SHOPIFY_CLIENT_ID");
const shopifyClientSecret = defineSecret("SHOPIFY_CLIENT_SECRET");
const DEFAULT_MODEL = "gemini-2.5-flash";
const SOURCE_BY_ID = new Map(callidusKnowledge.sources.map((source) => [source.id, source]));
const CALLABLE_CORS = [
  "https://www.callidus-am.de",
  "https://callidus-am.de",
  "http://127.0.0.1:4321",
  "http://localhost:4321",
];
const XP_PER_VALUS = 10000;
const MONTHLY_VALUS_LIMIT = 10;
const CENTS_PER_EURO = 100;
const XP_PER_CENT = XP_PER_VALUS / CENTS_PER_EURO;

// Tagesaufgabe: 100 XP pro erledigtem Tag plus einmalige Streak-Meilensteine.
// Bewusst klein gegenueber dem Monatslimit (10 VAL = 100.000 XP), damit die
// Tagesaufgabe motiviert, ohne mit echten Kaeufen zu konkurrieren oder Gaming
// zu belohnen. Ein perfektes Jahr inkl. aller Meilensteine bleibt unter 5 %
// der einloesbaren Jahresdecke.
const DAILY_TASK_XP = 100;
const DAILY_TASK_MILESTONES = [
  { days: 7, bonus: 500 },
  { days: 30, bonus: 2000 },
  { days: 100, bonus: 5000 },
  { days: 365, bonus: 10000 },
];

const PLAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    weeklyTraining: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "STRING" },
          focus: { type: "STRING" },
          workout: { type: "STRING" },
          duration: { type: "STRING" },
          notes: { type: "STRING" },
          exercises: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                cue: { type: "STRING" },
              },
              required: ["name"],
            },
          },
        },
        required: ["day", "focus", "workout"],
      },
    },
    nutritionPlan: {
      type: "OBJECT",
      properties: {
        dailyTarget: { type: "STRING" },
        hydration: { type: "STRING" },
        weeklyDays: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              day: { type: "STRING" },
              date: { type: "STRING" },
              focus: { type: "STRING" },
              prep: { type: "STRING" },
              meals: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    time: { type: "STRING" },
                    name: { type: "STRING" },
                    foods: { type: "STRING" },
                    reason: { type: "STRING" },
                    notes: { type: "STRING" },
                  },
                  required: ["time", "name", "foods"],
                },
              },
            },
            required: ["day", "date", "meals"],
          },
        },
        meals: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              time: { type: "STRING" },
              name: { type: "STRING" },
              foods: { type: "STRING" },
              reason: { type: "STRING" },
              notes: { type: "STRING" },
            },
            required: ["time", "name", "foods"],
          },
        },
      },
      required: ["dailyTarget", "weeklyDays"],
    },
    recovery: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
        },
        required: ["title"],
      },
    },
    safetyNotes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
        },
        required: ["title"],
      },
    },
    nextCheckIn: { type: "STRING" },
  },
  required: ["summary", "weeklyTraining", "nutritionPlan", "recovery", "safetyNotes", "nextCheckIn"],
};

function todayKey() {
  const date = new Date();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function isoDate(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function defaultCalendarDays(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = new Date(start);
    dayDate.setUTCDate(start.getUTCDate() + index);
    return {
      day: DAY_NAMES[dayDate.getUTCDay()],
      date: isoDate(dayDate),
    };
  });
}

function cleanString(value, maxLength = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanEnum(value, allowed, fallback = "") {
  const clean = cleanString(value, 80);
  return allowed.includes(clean) ? clean : fallback;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sanitizePreferences(input = {}) {
  const equipmentAllowed = ["bodyweight", "dumbbells", "bands", "gym", "bike"];
  const equipment = Array.isArray(input.equipment)
    ? input.equipment.map((item) => cleanEnum(item, equipmentAllowed)).filter(Boolean)
    : [];

  return {
    goal: cleanEnum(input.goal, ["energy", "fat_loss", "muscle_gain", "endurance", "stress_resilience"]),
    level: cleanEnum(input.level, ["beginner", "returning", "intermediate", "advanced"]),
    sessionsPerWeek: boundedInt(input.sessionsPerWeek, 3, 1, 6),
    minutesPerSession: boundedInt(input.minutesPerSession, 35, 10, 120),
    equipment,
    nutritionGoal: cleanEnum(input.nutritionGoal, ["balanced", "high_protein", "light_digestive", "performance", "calorie_control"], "balanced"),
    dietStyle: cleanEnum(input.dietStyle, ["mixed", "vegetarian", "vegan", "low_carb", "mediterranean"], "mixed"),
    intolerances: cleanString(input.intolerances, 240),
    restrictions: cleanString(input.restrictions, 520),
    notes: cleanString(input.notes, 520),
  };
}

function sanitizeCalendarDays(input = []) {
  const fallback = defaultCalendarDays();
  if (!Array.isArray(input)) return fallback;
  const cleaned = input.slice(0, 7).map((item = {}, index) => ({
    day: cleanString(item.day, 40) || fallback[index]?.day || `Tag ${index + 1}`,
    date: cleanString(item.date, 20) || fallback[index]?.date || "",
    label: cleanString(item.label, 40),
  }));
  return fallback.map((fallbackDay, index) => cleaned[index] || fallbackDay);
}

async function docData(ref) {
  try {
    const snap = await ref.get();
    return snap.exists ? snap.data() : {};
  } catch (error) {
    logger.warn("Coach doc read failed", { path: ref.path, error: error.message });
    return {};
  }
}

async function docsData(query) {
  try {
    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.warn("Coach collection read failed", { error: error.message });
    return [];
  }
}

function safeTimestamp(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value).slice(0, 80);
}

function compactContext({ userDoc, nexusContext, nexusStats, healthPlan, mealPlan, meals, activities, momusContext, momusStats, kairosProfile, calendarDays }) {
  const nexusToday = nexusContext.today || {};
  const momusShield = momusContext.energy_shield || {};
  return {
    profile: {
      healthType: userDoc.healthType || healthPlan.healthType || "",
      dailyCalorieGoal: nexusToday.calorie_goal || mealPlan.targetCalories || userDoc.daily_calorie_goal || null,
      currentXp: userDoc.current_xp || userDoc.total_xp || null,
    },
    nexus: {
      steps: nexusToday.steps || nexusStats.steps || nexusStats.steps_today || null,
      caloriesConsumed: nexusToday.calories_consumed || nexusStats.caloriesConsumed || null,
      mealsToday: nexusToday.meals_today || nexusStats.meals_today || null,
      wellbeingScore: nexusToday.wellbeing_score || nexusContext.latest_journal?.wellbeing_score || null,
      latestSummary: cleanString(nexusContext.latest_journal?.ai_summary || healthPlan.summary, 500),
    },
    momus: {
      energyBattery: momusShield.energy_battery || momusStats.energy_battery || null,
      energyShield: momusShield.score || momusStats.energy_shield_score || null,
      state: momusShield.state || momusStats.energy_shield_state || "",
    },
    kairos: {
      tone: kairosProfile.tone || kairosProfile.mode || "",
      focus: cleanString(kairosProfile.focus || kairosProfile.intention, 360),
    },
    calendarDays: calendarDays || defaultCalendarDays(),
    recentMeals: meals.slice(0, 5).map((meal) => ({
      name: cleanString(meal.name, 120),
      calories: meal.calories || null,
      date: safeTimestamp(meal.timestamp || meal.date),
    })),
    recentActivities: activities.slice(0, 5).map((activity) => ({
      name: cleanString(activity.name || activity.type, 120),
      minutes: activity.duration_minutes || activity.minutes || null,
      date: safeTimestamp(activity.timestamp),
    })),
  };
}

function buildPrompt(preferences, context) {
  return [
    "Du bist der Sport & Energie Coach von callidus A&M.",
    "Erstelle einen alltagstauglichen Plan auf Deutsch. Der Plan darf motivieren, aber nicht medizinisch diagnostizieren.",
    "Nutze die App-Daten nur als Kontext, nicht als absolute Wahrheit. Wenn Daten fehlen, plane konservativ.",
    "Sicherheitsregeln: Keine Heilversprechen. Bei Schmerzen, Brustdruck, Schwindel, Schwangerschaft, Essstoerung, bekannten Erkrankungen oder Medikamenten immer professionelle Abklaerung empfehlen. Keine extremen Diaeten oder gefaehrliche Belastung.",
    "Erstelle genau die JSON-Struktur aus dem Schema: summary, weeklyTraining, nutritionPlan, recovery, safetyNotes, nextCheckIn.",
    "Fuege pro weeklyTraining-Einheit 2 bis 5 konkrete exercises hinzu. Nutze moeglichst ausschliesslich diese bildgestuetzten Uebungsnamen: Kniebeuge, Rudern, Liegestuetz, Plank, Ausfallschritt, Schulterdruecken, Band-Rudern, Kreuzheben, Dips, Russian Twist, Beinheben, Superman, Mountain Climber, Glute Bridge, Katze-Kuh, Hueftbeuger-Dehnung, Schulterkreisen, Leichte Dehnuebungen, Spaziergang oder Rad / Ergometer. So kann die Webseite passende Bildkarten anzeigen.",
    "nutritionPlan.weeklyDays muss exakt 7 Kalendertage enthalten und die calendarDays aus dem App-Kontext verwenden. Jeder Tag braucht Fruehstueck, Mittagessen, Abendessen und optional 1 Snack. Plane abwechslungsreich, aber alltagstauglich; keine extreme Diaet.",
    `Nutzerangaben: ${JSON.stringify(preferences)}`,
    `App-Kontext: ${JSON.stringify(context)}`,
  ].join("\n\n");
}

function extractJson(text) {
  const clean = cleanString(text, 20000)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");
  return JSON.parse(clean);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePlan(plan) {
  const nutritionPlan = plan.nutritionPlan || {};
  return {
    summary: cleanString(plan.summary, 900),
    weeklyTraining: ensureArray(plan.weeklyTraining).slice(0, 7).map((item) => ({
      day: cleanString(item.day, 80),
      focus: cleanString(item.focus, 120),
      workout: cleanString(item.workout, 700),
      duration: cleanString(item.duration, 80),
      notes: cleanString(item.notes, 300),
      exercises: ensureArray(item.exercises).slice(0, 5).map((exercise) => ({
        name: cleanString(exercise.name || exercise, 120),
        cue: cleanString(exercise.cue, 180),
      })),
    })),
    nutritionPlan: {
      dailyTarget: cleanString(nutritionPlan.dailyTarget, 500),
      hydration: cleanString(nutritionPlan.hydration, 240),
      weeklyDays: ensureArray(nutritionPlan.weeklyDays).slice(0, 7).map((day) => ({
        day: cleanString(day.day, 80),
        date: cleanString(day.date, 20),
        focus: cleanString(day.focus, 160),
        prep: cleanString(day.prep, 240),
        meals: ensureArray(day.meals).slice(0, 5).map((item) => ({
          time: cleanString(item.time, 80),
          name: cleanString(item.name, 120),
          foods: cleanString(item.foods, 500),
          reason: cleanString(item.reason, 260),
          notes: cleanString(item.notes, 220),
        })),
      })),
      meals: ensureArray(nutritionPlan.meals).slice(0, 6).map((item) => ({
        time: cleanString(item.time, 80),
        name: cleanString(item.name, 120),
        foods: cleanString(item.foods, 500),
        reason: cleanString(item.reason, 300),
        notes: cleanString(item.notes, 240),
      })),
    },
    recovery: ensureArray(plan.recovery).slice(0, 6).map((item) => ({
      title: cleanString(item.title, 140),
      detail: cleanString(item.detail, 360),
    })),
    safetyNotes: ensureArray(plan.safetyNotes).slice(0, 6).map((item) => ({
      title: cleanString(item.title, 140),
      detail: cleanString(item.detail, 360),
    })),
    nextCheckIn: cleanString(plan.nextCheckIn, 180),
  };
}

function sanitizeWeekKey(value) {
  const key = cleanString(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    throw new HttpsError("invalid-argument", "Ungueltiger Wochenwert.");
  }
  const parsed = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || isoDate(parsed) !== key) {
    throw new HttpsError("invalid-argument", "Ungueltiger Wochenwert.");
  }
  if (parsed.getUTCDay() !== 1) {
    throw new HttpsError("invalid-argument", "Die Trainingswoche muss mit einem Montag beginnen.");
  }
  return key;
}

function previousWeekKey(weekKey) {
  const parsed = new Date(`${weekKey}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 7);
  return isoDate(parsed);
}

function optionalNumber(value, min, max, decimals = 0) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new HttpsError("invalid-argument", "Trainingswerte liegen ausserhalb des erlaubten Bereichs.");
  }
  const factor = 10 ** decimals;
  return Math.round(parsed * factor) / factor;
}

function optionalInt(value, min, max) {
  const parsed = optionalNumber(value, min, max, 0);
  return parsed == null ? null : Math.round(parsed);
}

function sanitizeSportCoachLogEntry(entry = {}, index = 0) {
  const exerciseName = cleanString(entry.exerciseName, 120);
  if (!exerciseName) return null;
  return {
    id: cleanString(entry.id, 140) || `entry_${index + 1}`,
    day: cleanString(entry.day, 80),
    focus: cleanString(entry.focus, 140),
    exerciseName,
    exerciseKey: cleanString(entry.exerciseKey, 120),
    sortKey: optionalInt(entry.sortKey, 0, 999) ?? index,
    sets: optionalInt(entry.sets, 0, 20),
    reps: optionalInt(entry.reps, 0, 500),
    weightKg: optionalNumber(entry.weightKg, 0, 500, 1),
    durationSec: optionalInt(entry.durationSec, 0, 7200),
    note: cleanString(entry.note, 240),
    completed: Boolean(entry.completed),
  };
}

function hasSportCoachLogValue(entry = {}) {
  return Boolean(
    entry.completed ||
    entry.note ||
    entry.sets != null ||
    entry.reps != null ||
    entry.weightKg != null ||
    entry.durationSec != null,
  );
}

function sanitizeSportCoachLogPayload(input = {}) {
  const weekKey = sanitizeWeekKey(input.weekKey);
  const entries = ensureArray(input.entries)
    .slice(0, 60)
    .map(sanitizeSportCoachLogEntry)
    .filter((entry) => entry && hasSportCoachLogValue(entry));
  return {
    weekKey,
    planId: cleanString(input.planId, 120),
    entries,
    weeklyNote: cleanString(input.weeklyNote, 700),
  };
}

function formatSportCoachLog(docSnap) {
  if (!docSnap || !docSnap.exists) return null;
  const data = docSnap.data() || {};
  return {
    weekKey: data.week_key || docSnap.id,
    planId: data.plan_id || "",
    entries: ensureArray(data.entries).slice(0, 60),
    weeklyNote: data.weekly_note || "",
    entryCount: data.entry_count || ensureArray(data.entries).length,
    updatedAt: data.updated_at_iso || safeTimestamp(data.updated_at),
    createdAt: data.created_at_iso || safeTimestamp(data.created_at),
  };
}

async function callGemini({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        responseSchema: PLAN_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    logger.error("Gemini request failed", { status: response.status, detail: detail.slice(0, 600) });
    throw new HttpsError("internal", "Gemini konnte gerade keinen Plan erstellen.");
  }

  const payload = await response.json();
  const text = ensureArray(payload.candidates?.[0]?.content?.parts)
    .map((part) => part.text || "")
    .join("")
    .trim();
  if (!text) {
    logger.error("Gemini returned empty response", { payload });
    throw new HttpsError("internal", "Gemini hat keine verwertbare Antwort geliefert.");
  }
  return normalizePlan(extractJson(text));
}

async function callGeminiText({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 520,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    logger.error("Gemini chat request failed", { status: response.status, detail: detail.slice(0, 600) });
    throw new Error("Gemini chat failed");
  }

  const payload = await response.json();
  return cleanString(
    ensureArray(payload.candidates?.[0]?.content?.parts)
      .map((part) => part.text || "")
      .join(" ")
      .trim(),
    1800,
  );
}

const CHAT_STOPWORDS = new Set([
  "aber", "alle", "alles", "also", "auch", "auf", "aus", "bei", "bin", "bitte", "das", "dass", "den", "der", "die", "dir",
  "ein", "eine", "einem", "einen", "er", "es", "finde", "finden", "fuer", "für", "gibt", "habe", "hat", "ich", "im", "in", "ist", "kann",
  "mein", "meine", "mit", "nach", "nicht", "oder", "sich", "sie", "sind", "und", "was", "wenn", "wie", "wir",
  "zu", "zum", "zur", "zeige",
]);

function normalizeSearch(value) {
  return cleanString(value, 5000)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchTokens(value) {
  return normalizeSearch(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !CHAT_STOPWORDS.has(token))
    .slice(0, 18);
}

function scoreKnowledgeEntry(tokens, entry, pagePath) {
  const title = normalizeSearch(entry.title);
  const topics = normalizeSearch((entry.topics || []).join(" "));
  const keywords = normalizeSearch((entry.keywords || []).join(" "));
  const summary = normalizeSearch(entry.summary);
  const body = normalizeSearch(entry.text);
  const wantsVideo = tokens.some((token) => ["video", "videos", "film", "filme", "youtube"].includes(token));
  const wantsProduct = tokens.some((token) => ["produkt", "produkte", "affiliate", "empfehlung", "shop"].includes(token));
  const intentTokens = new Set(["video", "videos", "film", "filme", "youtube", "produkt", "produkte", "affiliate", "empfehlung", "shop"]);
  let score = entry.path && pagePath && entry.path === pagePath ? 8 : 0;
  let contentScore = 0;
  tokens.forEach((token) => {
    if (intentTokens.has(token)) return;
    let tokenScore = 0;
    if (title.includes(token)) tokenScore += 5;
    if (topics.includes(token)) tokenScore += 4;
    if (keywords.includes(token)) tokenScore += 4;
    if (summary.includes(token)) tokenScore += 2;
    if (body.includes(token)) tokenScore += 1;
    score += tokenScore;
    contentScore += tokenScore;
  });
  if (wantsVideo) {
    if (entry.kind === "video-card" && contentScore > 0) score += 12;
    if (entry.kind === "supplement-card" && contentScore > 0 && (keywords.includes("video") || body.includes("passendes video"))) score += 10;
    if (entry.kind === "knowledge-hub" && body.includes("video")) score += 4;
    if (entry.kind === "affiliate-product" && !body.includes("video")) score -= 4;
  }
  if (wantsProduct) {
    if (entry.kind === "affiliate-product" && contentScore > 0) score += 10;
    if (entry.kind === "supplement-card" && contentScore > 0 && body.includes("produktempfehlung")) score += 3;
  }
  return score;
}

function retrieveCallidusKnowledge(message, pagePath) {
  const tokens = searchTokens(message);
  if (!tokens.length && !pagePath) return [];
  const scored = callidusKnowledge.entries
    .map((entry) => ({ ...entry, score: scoreKnowledgeEntry(tokens, entry, pagePath) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  const minimumScore = Math.max(3, (scored[0]?.score || 0) - 8);
  return scored
    .filter((entry) => entry.score >= minimumScore)
    .slice(0, 5);
}

function sourceKey(source) {
  return `${source.type || ""}:${source.url || source.path || source.title}`;
}

function collectChatSources(entries) {
  const sources = [];
  entries.slice(0, 4).forEach((entry) => {
    const type = entry.kind === "affiliate-product"
      ? "Produkt"
      : entry.kind === "supplement-card"
        ? "Gesundheits-Wissen"
        : entry.kind === "knowledge-hub"
          ? "Callidus"
          : entry.app === "momus"
            ? "Callidus Satire"
            : "Callidus";
    sources.push({
      title: entry.title,
      url: entry.path,
      type,
    });
  });
  entries.flatMap((entry) => entry.sourceIds || []).forEach((id) => {
    const source = SOURCE_BY_ID.get(id);
    if (source) sources.push(source);
  });
  const seen = new Set();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function directVideoAnswer(message, entries) {
  const wantsVideo = searchTokens(message)
    .some((token) => ["video", "videos", "film", "filme", "youtube"].includes(token));
  if (!wantsVideo) return null;

  for (const entry of entries) {
    const match = String(entry.text || "").match(
      /Passendes Video:\s*(.+?)\.\s*Status:\s*Video ansehen\.\s*YouTube-ID:\s*([A-Za-z0-9_-]{11})\./i,
    );
    if (!match) continue;
    const [, title, youtubeId] = match;
    return {
      answer: `Hier ist das passende Callidus-Video: „${title}“.`,
      source: {
        title: `Video: ${title}`,
        url: `https://youtu.be/${youtubeId}`,
        type: "Video",
      },
    };
  }

  return null;
}

function sanitizeChatHistory(history) {
  return ensureArray(history).slice(-6).map((item) => ({
    role: cleanEnum(item.role, ["user", "assistant"], "user"),
    text: cleanString(item.text, 500),
  })).filter((item) => item.text);
}

function buildCallidusChatPrompt({ message, history, entries, sources }) {
  const context = entries.map((entry, index) => [
    `Quelle ${index + 1}: ${entry.title}`,
    `Pfad: ${entry.path}`,
    `Typ: ${entry.kind}; App: ${entry.app}`,
    `Themen: ${(entry.topics || []).join(", ")}`,
    `Inhalt: ${entry.text}`,
  ].join("\n")).join("\n\n");
  const sourceList = sources.map((source) => `${source.title} (${source.type || "Quelle"}): ${source.url}`).join("\n");
  const historyText = history.map((item) => `${item.role}: ${item.text}`).join("\n");
  return [
    "Du bist der Callidus Assistent auf callidus-am.de.",
    "Antworte auf Deutsch, klar, freundlich und knapp. Maximal 150 Wörter.",
    "Erklaere Fachbegriffe sofort in einfachen Worten, zum Beispiel: Autophagie = Zell-Recycling.",
    "Wenn eine Frage nach Problem, Loesung, Vor-/Nachteilen oder Einordnung klingt, strukturiere die Antwort danach.",
    "Nutze ausschließlich den Kontext und die Quellenliste. Erfinde keine Studien, Links, Produktversprechen oder medizinischen Diagnosen.",
    "Wenn die Wissensbasis nicht reicht, sage das offen und verweise auf passende Callidus-Seiten oder fachliche Abklärung.",
    "Gesundheitsgrenzen: keine Diagnose, keine Therapieanweisung, keine individuelle Dosierung. Bei akuten oder starken Beschwerden professionelle Hilfe empfehlen.",
    "MOMUS-Inhalte immer als Satire oder Mindset-Spiegel kennzeichnen.",
    "Valus (VAL) ist ein internes, nicht-übertragbares Rabatt-Guthaben und kein Krypto-Token. Krypto-Inhalte sind Bildung: keine Anlageberatung, keine Kauf- oder Verkaufsempfehlungen.",
    "Nenne am Ende nicht alle Links im Fließtext; die Oberfläche zeigt Quellen separat.",
    historyText ? `Bisheriger Chat:\n${historyText}` : "",
    `Callidus-Kontext:\n${context || "Kein passender Kontext gefunden."}`,
    `Quellenliste:\n${sourceList || "Keine externen Quellen."}`,
    `Nutzerfrage: ${message}`,
  ].filter(Boolean).join("\n\n");
}

function fallbackChatAnswer(entries) {
  if (!entries.length) {
    return "Dazu habe ich in der kuratierten Callidus-Wissensbasis noch keine belastbare Grundlage. Ich kann dir besser helfen, wenn du nach Stress, Schlaf, Atmung, Mikronährstoffen, Gesundheits-Wissen, Supplementen, Produkten, Videos, NEXUS, Stress Reset (SRK), Valus (VAL), Krypto verstehen, Sport & Energie, dem Kinderbuch, dem Audio-Raum, dem Wissens-Quiz oder einem konkreten Callidus-Artikel fragst.";
  }
  const lead = entries[0];
  const normalizedLead = normalizeSearch(lead.text);
  const excerptLimit = normalizedLead.includes("problem") && normalizedLead.includes("losung") ? 700 : 520;
  const excerpt = sentenceExcerpt(lead.text, excerptLimit);
  const related = entries.slice(1, 3).filter((entry) => entry.score >= lead.score - 3).map((entry) => entry.title).join(", ");
  return [
    `In der Callidus-Wissensbasis passt dazu vor allem „${lead.title}“.`,
    excerpt,
    related ? `Auch relevant: ${related}.` : "",
    "Das ist Orientierung und ersetzt keine medizinische Beratung oder Laborwerte.",
  ].filter(Boolean).join(" ");
}

function sentenceExcerpt(text, maxLength = 520) {
  const clean = cleanString(text, maxLength + 120).replace(/\s+/g, " ").replace(/\.\./g, ".");
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength);
  const boundary = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("! "), clipped.lastIndexOf("? "));
  if (boundary >= 160) return clipped.slice(0, boundary + 1);
  return `${clipped.replace(/[\s,;:.-]+$/, "")}...`;
}

function isUsefulChatAnswer(answer) {
  const clean = cleanString(answer, 1000);
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length >= 18 && /[.!?]$/.test(clean);
}

function publicChatSessionId(value) {
  const clean = cleanString(value, 120) || "anon";
  return crypto.createHash("sha256").update(clean).digest("hex").slice(0, 48);
}

async function enforcePublicChatRate(sessionId) {
  const day = todayKey();
  const ref = db.collection("public_chat_rate").doc(`${day}_${publicChatSessionId(sessionId)}`);
  const snap = await ref.get();
  const count = snap.exists ? Number(snap.data().count || 0) : 0;
  if (count >= 30) {
    throw new HttpsError("resource-exhausted", "Bitte spÃ¤ter erneut fragen. Das Tageslimit fÃ¼r diesen Browser ist erreicht.");
  }
  await ref.set({
    count: FieldValue.increment(1),
    day,
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true });
}

function safetyAnswerFor(message) {
  const text = normalizeSearch(message);
  if (/(suizid|selbstmord|selbstverletz|nicht mehr leben|leben beenden|akute gefahr)/.test(text)) {
    return "Das klingt akut belastend. Bitte suche jetzt direkte Hilfe: in Deutschland 112 bei unmittelbarer Gefahr oder den Ã¤rztlichen Bereitschaftsdienst 116117. Wenn SelbstgefÃ¤hrdung im Raum steht, bleib bitte nicht allein und kontaktiere sofort eine vertraute Person oder professionelle Hilfe.";
  }
  if (/(brustschmerz|brustdruck|atemnot|ohnmacht|schlaganfall|laehmung|lÃ¤hmung|starke blutung|vergiftung)/.test(text)) {
    return "Bei solchen akuten oder potenziell ernsten Beschwerden ist eine Website nicht der richtige Ort fÃ¼r AbklÃ¤rung. Bitte nutze umgehend medizinische Hilfe, bei NotfÃ¤llen die 112.";
  }
  return "";
}

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Bitte einloggen.");
  }
  return request.auth.uid;
}

function monthKey(date = new Date()) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberValues(...values) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function maxNumberValue(...values) {
  const numbers = numberValues(...values);
  return numbers.length ? Math.max(0, ...numbers) : 0;
}

function canonicalValusFromBalance(balance = {}) {
  return maxNumberValue(balance.valus, balance.val);
}

function legacyValusFromSources(balance = {}, user = {}) {
  return maxNumberValue(
    balance.san,
    balance.valus_balance,
    balance.val_balance,
    balance.san_balance,
    balance.valusBalance,
    balance.sanBalance,
    balance.current_valus,
    balance.current_san,
    balance.balance?.valus,
    balance.balance?.val,
    balance.balance?.san,
    user.valus,
    user.val,
    user.san,
    user.valus_balance,
    user.val_balance,
    user.san_balance,
    user.valusBalance,
    user.sanBalance,
    user.current_valus,
    user.current_san,
    user.balance?.valus,
    user.balance?.val,
    user.balance?.san,
  );
}

function valusFromSources(balance = {}, user = {}) {
  const canonical = canonicalValusFromBalance(balance);
  if (balance.valus_legacy_migrated) return canonical;
  const legacy = legacyValusFromSources(balance, user);
  if (canonical > 0 && canonical >= legacy) return canonical;
  return canonical + legacy;
}

// Einziger Spend-Topf ist balances/current.xp. Momus- und Nexus-XP fliessen beide
// hier hinein (via reconcileEarnedXp/creditMomusXp). Deshalb hier NUR den Topf
// lesen — sonst koennte in xpFromSources addiertes, aber nicht abgebuchtes XP
// mehrfach in VAL umgewandelt werden.
function xpFromSources(balance = {}, user = {}) {
  return numberValue(
    balance.xp ?? balance.current_xp ?? user.current_xp ?? user.total_xp,
    0,
  );
}

// Berechnet die noch nicht in den Spend-Topf eingeflossenen Betraege je Quelle.
// Wasserstandsmarken: momus_xp_credited (Momus) und nexus_xp_credited (Nexus).
// - Momus: Quelle ist user.momus_xp_total (monoton, bereits "ausgebbares" XP).
// - Nexus: Quelle ist user.total_xp (lebenslang verdient, monoton). Beim ersten
//   Abgleich wird nexus_xp_credited selbst-initialisiert auf den bereits im Topf
//   liegenden Nicht-Momus-Anteil (balance.xp - momus_xp_credited), damit schon
//   vorhandenes Nexus-XP NICHT doppelt gutgeschrieben wird.
function earnedXpDeltas(user = {}, balance = {}) {
  const poolXp = numberValue(balance.xp ?? balance.current_xp, 0);
  const momusCredited = Math.max(0, numberValue(balance.momus_xp_credited, 0));
  const momusTotal = Math.max(0, numberValue(user.momus_xp_total, 0));
  const momusDelta = Math.max(0, momusTotal - momusCredited);

  const nexusTotal = Math.max(0, numberValue(user.total_xp, 0));
  const nexusInit = balance.nexus_xp_credited === undefined || balance.nexus_xp_credited === null;
  const nexusCredited = nexusInit
    ? Math.max(0, poolXp - momusCredited)
    : Math.max(0, numberValue(balance.nexus_xp_credited, 0));
  const nexusDelta = Math.max(0, nexusTotal - nexusCredited);

  return { poolXp, momusTotal, momusDelta, nexusTotal, nexusDelta, nexusInit };
}

// Bucht offenes Momus- und Nexus-XP idempotent und transaktionssicher in
// balances/current.xp. Die Wasserstandsmarken werden atomar mitgezogen, damit
// dieselben XP niemals doppelt gutgeschrieben werden.
async function reconcileEarnedXp(userRef) {
  const balanceRef = userRef.collection("balances").doc("current");
  return db.runTransaction(async (transaction) => {
    const [userSnap, balanceSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(balanceRef),
    ]);
    const user = userSnap.exists ? userSnap.data() : {};
    const balance = balanceSnap.exists ? balanceSnap.data() : {};
    const { poolXp, momusTotal, momusDelta, nexusTotal, nexusDelta, nexusInit } = earnedXpDeltas(user, balance);
    const totalDelta = momusDelta + nexusDelta;

    // Nichts gutzuschreiben UND Marken bereits gesetzt -> No-op.
    if (totalDelta <= 0 && !nexusInit) {
      return { user, balance, momusDelta: 0, nexusDelta: 0, momusTotal, nexusTotal, balanceXp: poolXp };
    }

    const newXp = poolXp + totalDelta;
    const patch = {
      xp: newXp,
      current_xp: newXp,
      momus_xp_credited: momusTotal,
      nexus_xp_credited: nexusTotal,
      updated_at: FieldValue.serverTimestamp(),
    };
    transaction.set(balanceRef, patch, { merge: true });
    return {
      user,
      balance: { ...balance, ...patch },
      momusDelta,
      nexusDelta,
      momusTotal,
      nexusTotal,
      balanceXp: newXp,
    };
  });
}

function publicBalance(balance = {}, user = {}) {
  const valus = valusFromSources(balance, user);
  return {
    valus,
    val: valus,
    xp: xpFromSources(balance, user),
    rate: {
      xpPerValus: XP_PER_VALUS,
      monthlyValusLimit: MONTHLY_VALUS_LIMIT,
      source: "nexus",
    },
  };
}

function ledgerDate(entry = {}) {
  const value = entry.created_at || entry.timestamp || entry.date;
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function cleanValusText(value) {
  return String(value || "")
    .replace(new RegExp(["Sani", "tas"].join(""), "gi"), "Valus")
    .replace(/\bSAN\b/g, "VAL")
    .trim();
}

function publicLedgerEntry(docSnap, source = "valus") {
  const entry = docSnap.data() || {};
  const date = ledgerDate(entry);
  return {
    id: docSnap.id,
    source,
    type: cleanValusText(entry.type || "transaction"),
    description: cleanValusText(entry.description || entry.type || "Transaktion"),
    amount: numberValue(entry.amount ?? entry.valus ?? entry.val ?? entry.san ?? entry.valus_amount, 0),
    xp_amount: numberValue(entry.xp_amount, 0),
    created_at: date ? date.toISOString() : null,
    timestamp: date ? date.getTime() : 0,
  };
}

function parseValusAmount(data = {}) {
  const parsed = Number.parseInt(data.valusAmount, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(500, Math.max(0, parsed));
}

const VALUS_PACKAGES = {
  valus_10: { amount: 10, env: "VALUS_CHECKOUT_10_URL" },
  valus_25: { amount: 25, env: "VALUS_CHECKOUT_25_URL" },
  valus_50: { amount: 50, env: "VALUS_CHECKOUT_50_URL" },
};

const KINDERBUCH_PRODUCTS = {
  band1: {
    id: "band1",
    title: "Band 1: Hoer auf deinen Koerper",
    productId: "digistore_709550",
    checkoutUrl: "https://www.digistore24.com/product/709550",
    priceCents: 990,
  },
  band2: {
    id: "band2",
    title: "Band 2: Das Zucker-Monster",
    productId: "digistore_709996",
    checkoutUrl: "https://www.digistore24.com/product/709996",
    priceCents: 990,
  },
  band3: {
    id: "band3",
    title: "Band 3: Der Zappelmotor",
    productId: "digistore_710152",
    checkoutUrl: "https://www.digistore24.com/product/710152",
    priceCents: 990,
  },
  band4: {
    id: "band4",
    title: "Band 4: Die Schlaf-Werkstatt",
    productId: "digistore_710833",
    checkoutUrl: "https://www.digistore24.com/product/710833",
    priceCents: 990,
  },
  band5: {
    id: "band5",
    title: "Band 5: Das Gefuehls-Wetter",
    productId: "digistore_710837",
    checkoutUrl: "https://www.digistore24.com/product/710837",
    priceCents: 990,
  },
  band6: {
    id: "band6",
    title: "Band 6: Die Abwehr-Polizei",
    productId: "digistore_711028",
    checkoutUrl: "https://www.digistore24.com/product/711028",
    priceCents: 990,
  },
};

// Eigenmarken-Shop (Shopify). Preise in Cent, Varianten-IDs wie auf
// /unsere-produkte/. Der Rabattcode wird immer auf genau diese Variante
// beschraenkt, damit eingeloeste VAL nicht auf ein anderes Produkt wandern.
const SHOPIFY_SHOP_DOMAIN = "ywg7pa-bq.myshopify.com";
const SHOPIFY_API_VERSION = "2026-01";

const SHOPIFY_PRODUCTS = {
  magnesium: {
    id: "magnesium",
    title: "4-fach Magnesium Komplex",
    variantId: "58671561113925",
    priceCents: 1999,
  },
  curcuma: {
    id: "curcuma",
    title: "Curcuma + Piperin",
    variantId: "58671554167109",
    priceCents: 1999,
  },
  d3k2: {
    id: "d3k2",
    title: "Vitamin D3 + K2 Tropfen",
    variantId: "58671539224901",
    priceCents: 1699,
  },
};

const STRESS_RESET_PRODUCTS = {
  modul4: {
    id: "modul4",
    title: "Stress-Reset – Modul 4",
    productId: "digistore_643822",
    checkoutUrl: "https://www.digistore24.com/product/643822",
    priceCents: 2900,
  },
  modul5: {
    id: "modul5",
    title: "Stress-Reset – Modul 5",
    productId: "digistore_645365",
    checkoutUrl: "https://www.digistore24.com/product/645365",
    priceCents: 2900,
  },
  bundle: {
    id: "bundle",
    title: "Stress-Reset – Kompletter 7-Tage-Kurs",
    productId: "digistore_645388",
    checkoutUrl: "https://www.digistore24.com/product/645388",
    priceCents: 11600,
  },
};

function centsFromValus(value) {
  return Math.max(0, Math.floor(numberValue(value, 0) * CENTS_PER_EURO));
}

function valusFromCents(cents) {
  return Math.round(cents) / CENTS_PER_EURO;
}

function parseCreditCents(data = {}, maxCents = 0) {
  const direct = Number.parseInt(data.creditCents ?? data.redeemCents ?? data.cents, 10);
  if (Number.isFinite(direct)) {
    return Math.min(maxCents, Math.max(0, direct));
  }
  const rawEuro = String(data.creditEuro ?? data.redeemEuro ?? data.valusAmount ?? "").replace(",", ".");
  const euro = Number.parseFloat(rawEuro);
  if (!Number.isFinite(euro)) return 0;
  return Math.min(maxCents, Math.max(0, Math.round(euro * CENTS_PER_EURO)));
}

const DIGISTORE_API_BASE = "https://www.digistore24.com/api/call";
const REDEMPTION_VOUCHER_TTL_MS = 24 * 60 * 60 * 1000;

function digistoreProductIdNumber(productId) {
  return String(productId || "").replace(/\D/g, "");
}

function digistoreTimestamp(date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

async function digistoreApiCall(apiKey, functionName, data = {}) {
  if (!apiKey) {
    throw new Error("Digistore24 API-Key ist nicht konfiguriert.");
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(`data[${key}]`, String(value));
  }
  const response = await fetch(`${DIGISTORE_API_BASE}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "Accept": "application/json",
      "X-DS-API-KEY": apiKey,
    },
    body: params.toString(),
  });
  const raw = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Digistore24 ${functionName}: unerwartete Antwort (HTTP ${response.status}).`);
  }
  if (payload?.result !== "success") {
    const message = cleanString(payload?.message || payload?.error?.message || "unbekannter Fehler", 300);
    throw new Error(`Digistore24 ${functionName}: ${message}`);
  }
  return payload.data || {};
}

function digistoreIpnSignature(passphrase, params, upperCaseKeys = false) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sha_sign" && key !== "SHASIGN")
    .sort((a, b) => {
      const left = a.toLowerCase();
      const right = b.toLowerCase();
      if (left === right) return a < b ? -1 : a > b ? 1 : 0;
      return left < right ? -1 : 1;
    });
  let base = "";
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "" || value === false) continue;
    base += `${upperCaseKeys ? key.toUpperCase() : key}=${value}${passphrase}`;
  }
  return crypto.createHash("sha512").update(base, "utf8").digest("hex").toUpperCase();
}

function isValidIpnSignature(passphrase, params) {
  const received = String(params.sha_sign || params.SHASIGN || "").trim().toUpperCase();
  if (!passphrase || !received) return false;
  return received === digistoreIpnSignature(passphrase, params, false)
    || received === digistoreIpnSignature(passphrase, params, true);
}

// Token gilt 24 h. Zwischen warmen Instanzen wiederverwenden, aber eine Minute
// vor Ablauf erneuern, damit kein Aufruf mitten im Request ungueltig wird.
let shopifyTokenCache = { token: "", expiresAt: 0 };

async function shopifyAccessToken({ force = false } = {}) {
  const now = Date.now();
  if (!force && shopifyTokenCache.token && shopifyTokenCache.expiresAt > now + 60000) {
    return shopifyTokenCache.token;
  }
  const clientId = shopifyClientId.value();
  const clientSecret = shopifyClientSecret.value();
  if (!clientId || !clientSecret) {
    throw new Error("Shopify Client-ID/Secret sind nicht konfiguriert.");
  }

  const response = await fetch(`https://${SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  const raw = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Shopify Token-Endpunkt: unerwartete Antwort (HTTP ${response.status}).`);
  }
  const token = cleanString(payload?.access_token, 200);
  if (!token) {
    throw new Error(`Shopify Token-Endpunkt: ${cleanString(payload?.error_description || payload?.error || `HTTP ${response.status}`, 300)}`);
  }
  const expiresIn = numberValue(payload?.expires_in, 86399);
  shopifyTokenCache = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

async function shopifyAdminGraphql(query, variables = {}, { retryOnAuthError = true } = {}) {
  const token = await shopifyAccessToken();
  const response = await fetch(
    `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  // Ein zwischenzeitlich zurueckgezogener Token faellt hier auf; einmal frisch holen.
  if (response.status === 401 && retryOnAuthError) {
    shopifyTokenCache = { token: "", expiresAt: 0 };
    await shopifyAccessToken({ force: true });
    return shopifyAdminGraphql(query, variables, { retryOnAuthError: false });
  }

  const raw = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Shopify Admin API: unerwartete Antwort (HTTP ${response.status}).`);
  }
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    throw new Error(`Shopify Admin API: ${cleanString(payload.errors[0]?.message, 300)}`);
  }
  return payload?.data || {};
}

const SHOPIFY_DISCOUNT_CREATE = `
  mutation CreateValRedemptionCode($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const SHOPIFY_DISCOUNT_DELETE = `
  mutation DeleteValRedemptionCode($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors { field message }
    }
  }
`;

// Legt einen einmaligen Rabattcode ueber genau den eingeloesten Betrag an,
// beschraenkt auf die gekaufte Variante und befristet auf die Reservierungsdauer.
async function createShopifyDiscountCode({ code, title, variantId, creditCents, expiresAt }) {
  const data = await shopifyAdminGraphql(SHOPIFY_DISCOUNT_CREATE, {
    basicCodeDiscount: {
      title,
      code,
      startsAt: new Date().toISOString(),
      endsAt: expiresAt.toISOString(),
      usageLimit: 1,
      appliesOncePerCustomer: true,
      context: { all: "ALL" },
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
      customerGets: {
        appliesOnOneTimePurchase: true,
        appliesOnSubscription: false,
        items: {
          products: {
            productVariantsToAdd: [`gid://shopify/ProductVariant/${variantId}`],
          },
        },
        value: {
          discountAmount: {
            amount: (creditCents / CENTS_PER_EURO).toFixed(2),
            appliesOnEachItem: false,
          },
        },
      },
    },
  });
  const result = data?.discountCodeBasicCreate || {};
  const userErrors = Array.isArray(result.userErrors) ? result.userErrors : [];
  if (userErrors.length) {
    throw new Error(`Shopify discountCodeBasicCreate: ${cleanString(userErrors[0]?.message, 300)}`);
  }
  const nodeId = cleanString(result.codeDiscountNode?.id, 120);
  if (!nodeId) {
    throw new Error("Shopify discountCodeBasicCreate: keine Rabatt-ID erhalten.");
  }
  return nodeId;
}

exports.getValusBalance = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 20,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const userRef = db.collection("users").doc(uid);
    // Offenes Momus- und Nexus-XP zuerst sicher in den Spend-Topf abgleichen, dann anzeigen.
    const { user, balance } = await reconcileEarnedXp(userRef);
    const monthSnap = await userRef.collection("valus_conversions").doc(monthKey()).get();
    const convertedThisMonth = numberValue(monthSnap.data()?.valus, 0);
    const normalizedBalance = publicBalance(balance, user);
    const canonicalValus = canonicalValusFromBalance(balance);

    if (normalizedBalance.valus > canonicalValus && !balance.valus_legacy_migrated) {
      await userRef.collection("balances").doc("current").set({
        valus: normalizedBalance.valus,
        val: normalizedBalance.valus,
        valus_legacy_migrated: true,
        legacy_valus_migrated_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return {
      balance: normalizedBalance,
      convertedThisMonth,
      remainingMonthlyValus: Math.max(0, MONTHLY_VALUS_LIMIT - convertedThisMonth),
    };
  },
);

exports.getValusLedger = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 20,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const limitValue = Number.parseInt(request.data?.limit, 10);
    const entryLimit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 20;
    const userRef = db.collection("users").doc(uid);
    const legacyLedgerName = ["sani", "tas_ledger"].join("");

    const [valusSnap, legacySnap] = await Promise.all([
      userRef.collection("valus_ledger").orderBy("created_at", "desc").limit(entryLimit).get(),
      userRef.collection(legacyLedgerName).orderBy("created_at", "desc").limit(entryLimit).get().catch(() => ({ docs: [] })),
    ]);

    const entries = [
      ...valusSnap.docs.map((docSnap) => publicLedgerEntry(docSnap, "valus")),
      ...legacySnap.docs.map((docSnap) => publicLedgerEntry(docSnap, "legacy")),
    ]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, entryLimit);

    return { entries };
  },
);

exports.convertNexusXpToValus = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const source = cleanString(request.data?.source || "nexus", 20).toLowerCase();
    if (source !== "nexus" && source !== "momus") {
      throw new HttpsError("failed-precondition", "Aktuell kann nur NEXUS- oder Momus-XP in VAL umgewandelt werden.");
    }

    const xpAmount = Number.parseInt(request.data?.xpAmount, 10);
    if (!Number.isFinite(xpAmount)) {
      throw new HttpsError("invalid-argument", "Bitte XP-Betrag eingeben.");
    }
    if (xpAmount < XP_PER_VALUS) {
      throw new HttpsError("invalid-argument", `Minimum ${XP_PER_VALUS} XP.`);
    }
    if (xpAmount > XP_PER_VALUS * MONTHLY_VALUS_LIMIT) {
      throw new HttpsError("invalid-argument", `Maximal ${XP_PER_VALUS * MONTHLY_VALUS_LIMIT} XP pro Monat.`);
    }
    if (xpAmount % XP_PER_VALUS !== 0) {
      throw new HttpsError("invalid-argument", `Bitte in ${XP_PER_VALUS}-XP-Schritten umwandeln.`);
    }

    const valusAmount = Math.floor(xpAmount / XP_PER_VALUS);
    const userRef = db.collection("users").doc(uid);
    const balanceRef = userRef.collection("balances").doc("current");
    const conversionRef = userRef.collection("valus_conversions").doc(monthKey());
    const ledgerRef = userRef.collection("valus_ledger").doc();

    // Offenes Momus-/Nexus-XP zuerst sicher in den Spend-Topf abgleichen, damit auch
    // frisch verdientes XP umgewandelt werden kann (setzt die Wasserstandsmarken).
    await reconcileEarnedXp(userRef);

    const result = await db.runTransaction(async (transaction) => {
      const [userSnap, balanceSnap, conversionSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(balanceRef),
        transaction.get(conversionRef),
      ]);
      const user = userSnap.exists ? userSnap.data() : {};
      const balance = balanceSnap.exists ? balanceSnap.data() : {};
      const availableXp = xpFromSources(balance, user);
      const alreadyConverted = numberValue(conversionSnap.data()?.valus, 0);
      const remainingValus = MONTHLY_VALUS_LIMIT - alreadyConverted;

      if (valusAmount > remainingValus) {
        throw new HttpsError("resource-exhausted", `Monatslimit erreicht. Verfuegbar sind noch ${Math.max(0, remainingValus)} VAL.`);
      }
      if (availableXp < xpAmount) {
        throw new HttpsError("failed-precondition", `Nicht genug XP vorhanden. Aktuell verfuegbar: ${availableXp} XP.`);
      }

      const nextXp = availableXp - xpAmount;
      const nextValus = valusFromSources(balance, user) + valusAmount;
      // Nur den Spend-Topf (balances/current) veraendern. user.current_xp NICHT
      // anfassen — das ist der Nexus-Level-Fortschritt und gehoert der Nexus-App.
      const balancePayload = {
        valus: nextValus,
        val: nextValus,
        xp: nextXp,
        current_xp: nextXp,
        xp_source: source,
        valus_legacy_migrated: true,
        updated_at: FieldValue.serverTimestamp(),
      };

      transaction.set(balanceRef, balancePayload, { merge: true });
      transaction.set(conversionRef, {
        source,
        valus: FieldValue.increment(valusAmount),
        xp: FieldValue.increment(xpAmount),
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(ledgerRef, {
        type: "xp_conversion",
        source,
        amount: valusAmount,
        xp_amount: xpAmount,
        description: `${source === "momus" ? "Momus" : "NEXUS"}-XP in VAL umgewandelt`,
        created_at: FieldValue.serverTimestamp(),
      });

      return {
        balance: {
          valus: nextValus,
          val: nextValus,
          xp: nextXp,
          rate: {
            xpPerValus: XP_PER_VALUS,
            monthlyValusLimit: MONTHLY_VALUS_LIMIT,
            source,
          },
        },
        convertedValus: valusAmount,
        convertedXp: xpAmount,
        remainingMonthlyValus: remainingValus - valusAmount,
      };
    });

    return result;
  },
);

// Wird von der Momus-App aufgerufen (MomusXpService._creditToWallet), sobald neue
// Momus-XP gebankt wurden. Schreibt den Zuwachs seit dem letzten Kredit idempotent
// in balances/current.xp, damit das XP-Guthaben auf der Website angezeigt und via
// convertNexusXpToValus in VAL umgewandelt werden kann.
exports.creditMomusXp = onCall(
  {
    region: "europe-west3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const userRef = db.collection("users").doc(uid);
    const { momusDelta, momusTotal, balanceXp } = await reconcileEarnedXp(userRef);
    return { credited: momusDelta, momusTotal, balanceXp };
  },
);

// Verschiebt einen YYYY-MM-DD-Schluessel um n Tage (negativ = zurueck).
function shiftDateKey(dateKey, deltaDays) {
  const base = new Date(`${dateKey}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
}

function dailyTaskMilestonesFor(streak, alreadyAwarded = []) {
  const done = new Set(alreadyAwarded.map((value) => Number(value)));
  return DAILY_TASK_MILESTONES.filter((milestone) => streak >= milestone.days && !done.has(milestone.days));
}

function dailyTaskSummaryView(summary = {}, todayClaimed = false) {
  return {
    currentStreak: Math.max(0, numberValue(summary.currentStreak, 0)),
    longestStreak: Math.max(0, numberValue(summary.longestStreak, 0)),
    totalDays: Math.max(0, numberValue(summary.totalDays, 0)),
    totalXp: Math.max(0, numberValue(summary.totalXp, 0)),
    milestonesAwarded: Array.isArray(summary.milestonesAwarded) ? summary.milestonesAwarded : [],
    todayClaimed,
    perTask: DAILY_TASK_XP,
    milestones: DAILY_TASK_MILESTONES,
  };
}

// Schreibt genau einmal pro Kalendertag (Europe/Berlin) 100 XP + faellige
// Streak-Meilensteine in den Spend-Topf. Streak und Meilensteine werden aus der
// serverseitigen Historie berechnet – der localStorage-Streak im Browser ist
// manipulierbar und darf niemals XP ausloesen. Nur der heutige Tag ist gueltig.
exports.claimDailyTaskXp = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const dateKey = publicFoodDateKey();
    const yesterday = shiftDateKey(dateKey, -1);

    const userRef = db.collection("users").doc(uid);
    const balanceRef = userRef.collection("balances").doc("current");
    const summaryRef = userRef.collection("daily_task_xp").doc("_summary");
    const dayRef = userRef.collection("daily_task_xp").doc(dateKey);
    const ledgerRef = userRef.collection("valus_ledger").doc();

    const result = await db.runTransaction(async (transaction) => {
      const [daySnap, summarySnap, balanceSnap] = await Promise.all([
        transaction.get(dayRef),
        transaction.get(summaryRef),
        transaction.get(balanceRef),
      ]);
      const summary = summarySnap.exists ? summarySnap.data() || {} : {};

      // Idempotent: heute schon eingeloest -> keine weitere Gutschrift.
      if (daySnap.exists) {
        return { alreadyClaimed: true, awarded: 0, bonus: 0, milestones: [], view: dailyTaskSummaryView(summary, true), dateKey };
      }

      const previousStreak = Math.max(0, numberValue(summary.currentStreak, 0));
      const streak = summary.lastDate === yesterday ? previousStreak + 1 : 1;

      const dueMilestones = dailyTaskMilestonesFor(streak, summary.milestonesAwarded);
      const bonus = dueMilestones.reduce((sum, milestone) => sum + milestone.bonus, 0);
      const award = DAILY_TASK_XP + bonus;

      const balance = balanceSnap.exists ? balanceSnap.data() || {} : {};
      const poolXp = numberValue(balance.xp ?? balance.current_xp, 0);
      const momusCredited = Math.max(0, numberValue(balance.momus_xp_credited, 0));
      const nextXp = poolXp + award;

      const balancePatch = {
        xp: nextXp,
        current_xp: nextXp,
        updated_at: FieldValue.serverTimestamp(),
      };
      // Nexus-Wasserstand initialisieren, BEVOR Tages-XP hinzukommt, damit der
      // erste reconcileEarnedXp die Tages-XP nicht als bereits gutgeschriebenes
      // Nexus-XP wertet und dadurch verschluckt.
      if (balance.nexus_xp_credited === undefined || balance.nexus_xp_credited === null) {
        balancePatch.nexus_xp_credited = Math.max(0, poolXp - momusCredited);
      }
      transaction.set(balanceRef, balancePatch, { merge: true });

      const awardedMilestones = [
        ...(Array.isArray(summary.milestonesAwarded) ? summary.milestonesAwarded.map((value) => Number(value)) : []),
        ...dueMilestones.map((milestone) => milestone.days),
      ].sort((a, b) => a - b);
      const longestStreak = Math.max(streak, numberValue(summary.longestStreak, 0));

      transaction.set(dayRef, {
        awarded: award,
        base: DAILY_TASK_XP,
        bonus,
        streak,
        created_at: FieldValue.serverTimestamp(),
      });
      transaction.set(summaryRef, {
        currentStreak: streak,
        longestStreak,
        lastDate: dateKey,
        totalDays: FieldValue.increment(1),
        totalXp: FieldValue.increment(award),
        milestonesAwarded: awardedMilestones,
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(ledgerRef, {
        type: "daily_task_xp",
        amount: 0,
        xp_amount: award,
        base: DAILY_TASK_XP,
        bonus,
        streak,
        description: bonus > 0
          ? `Tagesaufgabe erledigt – ${streak} Tage in Folge inkl. Bonus`
          : `Tagesaufgabe erledigt – ${streak} Tage in Folge`,
        created_at: FieldValue.serverTimestamp(),
      });

      const view = dailyTaskSummaryView({
        currentStreak: streak,
        longestStreak,
        totalDays: numberValue(summary.totalDays, 0) + 1,
        totalXp: numberValue(summary.totalXp, 0) + award,
        milestonesAwarded: awardedMilestones,
      }, true);

      return { alreadyClaimed: false, awarded: award, base: DAILY_TASK_XP, bonus, milestones: dueMilestones, streak, xpBalance: nextXp, view, dateKey };
    });

    logger.info("Daily task XP claimed", { uid, dateKey, awarded: result.awarded, streak: result.view.currentStreak, already: result.alreadyClaimed });
    return result;
  },
);

exports.getDailyTaskState = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 20,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const dateKey = publicFoodDateKey();
    const userRef = db.collection("users").doc(uid);
    const [summarySnap, daySnap] = await Promise.all([
      userRef.collection("daily_task_xp").doc("_summary").get(),
      userRef.collection("daily_task_xp").doc(dateKey).get(),
    ]);
    const summary = summarySnap.exists ? summarySnap.data() || {} : {};
    // Wenn die letzte Erledigung laenger als gestern her ist, ist die Serie abgerissen.
    const yesterday = shiftDateKey(dateKey, -1);
    const streakAlive = summary.lastDate === dateKey || summary.lastDate === yesterday;
    const view = dailyTaskSummaryView(
      { ...summary, currentStreak: streakAlive ? summary.currentStreak : 0 },
      daySnap.exists,
    );
    return { ...view, dateKey };
  },
);

exports.getValusCheckoutUrl = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 20,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    requireAuth(request);
    const packageId = cleanString(request.data?.packageId, 40);
    const selected = VALUS_PACKAGES[packageId];
    if (!selected) {
      throw new HttpsError("invalid-argument", "Unbekanntes VAL-Paket.");
    }
    const url = process.env[selected.env];
    if (!url) {
      throw new HttpsError("failed-precondition", "Checkout ist noch nicht konfiguriert.");
    }
    return { url, packageId, valus: selected.amount };
  },
);

// Zentrale Einloese-Logik fuer alle Produkttypen (Kinderbuch, Stress-Reset-Kurs, spaetere).
// product = { key, title, productId, checkoutUrl, priceCents, codePrefix,
//             redemptionCollection, productType, ledgerType }
async function createProductRedemption(request, product) {
  const uid = requireAuth(request);
  const creditCents = parseCreditCents(request.data || {}, product.priceCents);
  if (creditCents < 1) {
    throw new HttpsError("invalid-argument", "Bitte Einloesebetrag eingeben.");
  }

  const userRef = db.collection("users").doc(uid);
  const balanceRef = userRef.collection("balances").doc("current");
  const redemptionCode = `${product.codePrefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const redemptionRef = userRef.collection(product.redemptionCollection).doc(redemptionCode.toLowerCase());

  const result = await db.runTransaction(async (transaction) => {
    const [userSnap, balanceSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(balanceRef),
    ]);
    const user = userSnap.exists ? userSnap.data() : {};
    const balance = balanceSnap.exists ? balanceSnap.data() : {};
    const currentValus = valusFromSources(balance, user);
    const valusCreditCents = centsFromValus(currentValus);

    // Es wird ausschliesslich VAL eingeloest. XP muss der Nutzer vorher bewusst
    // ueber die VAL-Seite in VAL umwandeln (convertNexusXpToValus).
    if (valusCreditCents < creditCents) {
      throw new HttpsError(
        "failed-precondition",
        `Nicht genug VAL vorhanden. Aktuell verfuegbar: ${valusFromCents(valusCreditCents)} EUR (VAL). XP kannst du auf der VAL-Seite in VAL umwandeln.`,
      );
    }

    const appliedXpAmount = 0;
    const appliedValusAmount = valusFromCents(creditCents);
    const remainingCents = Math.max(0, product.priceCents - creditCents);

    transaction.set(redemptionRef, {
      code: redemptionCode,
      status: "pending_purchase",
      uid,
      user_email: cleanString(request.auth?.token?.email, 180),
      product_key: product.key,
      product_title: product.title,
      product_type: product.productType,
      product_id: product.productId,
      checkout_url: product.checkoutUrl,
      price_cents: product.priceCents,
      credit_cents: creditCents,
      remaining_cents: remainingCents,
      xp_equivalent: creditCents * XP_PER_CENT,
      applied_xp_amount: appliedXpAmount,
      applied_valus_amount: appliedValusAmount,
      rate: {
        xpPerValus: XP_PER_VALUS,
        xpPerCent: XP_PER_CENT,
        valusPerEuro: 1,
      },
      note: "Einloesung reserviert. Guthaben wird bei bestaetigtem Kauf bzw. manueller Freigabe verbucht.",
      created_at: FieldValue.serverTimestamp(),
    });

    return {
      code: redemptionCode,
      status: "pending_purchase",
      product: {
        key: product.key,
        title: product.title,
        checkoutUrl: product.checkoutUrl,
        priceCents: product.priceCents,
      },
      creditCents,
      remainingCents,
      xpEquivalent: creditCents * XP_PER_CENT,
      appliedXpAmount,
      appliedValusAmount,
      rate: {
        xpPerValus: XP_PER_VALUS,
        xpPerCent: XP_PER_CENT,
        valusPerEuro: 1,
      },
    };
  });

  const voucherExpiresAt = new Date(Date.now() + REDEMPTION_VOUCHER_TTL_MS);
  const isShopify = product.provider === "shopify";
  const providerLabel = isShopify ? "Shopify" : "Digistore24";
  let discountNodeId = "";

  try {
    if (isShopify) {
      discountNodeId = await createShopifyDiscountCode({
        code: redemptionCode,
        title: `VAL-Einloesung ${redemptionCode}`,
        variantId: product.variantId,
        creditCents,
        expiresAt: voucherExpiresAt,
      });
    } else {
      await digistoreApiCall(digistoreApiKey.value(), "createVoucher", {
        code: redemptionCode,
        product_ids: digistoreProductIdNumber(product.productId),
        expires_at: digistoreTimestamp(voucherExpiresAt),
        first_amount: (creditCents / CENTS_PER_EURO).toFixed(2),
        currency: "EUR",
        is_count_limited: "Y",
        count_left: 1,
        upgrade_policy: "valid",
      });
    }
  } catch (error) {
    logger.error("createVoucher failed", {
      code: redemptionCode,
      provider: product.provider || "digistore",
      error: String(error?.message || error),
    });
    await redemptionRef.set({
      status: "coupon_failed",
      coupon_error: cleanString(error?.message, 300),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    throw new HttpsError("internal", `Der Rabattcode konnte bei ${providerLabel} nicht erstellt werden. Dein Guthaben wurde nicht belastet. Bitte versuche es spaeter erneut.`);
  }

  const voucherParam = encodeURIComponent(redemptionCode);
  const checkoutUrl = isShopify
    ? `${product.checkoutUrl}?discount=${voucherParam}`
    : `${product.checkoutUrl}?voucher=${voucherParam}&custom=${voucherParam}`;
  const mappingCollection = product.mappingCollection || "digistore_redemptions";

  await Promise.all([
    redemptionRef.set({
      status: "coupon_created",
      checkout_url_with_voucher: checkoutUrl,
      voucher_expires_at: voucherExpiresAt.toISOString(),
      discount_node_id: discountNodeId,
      coupon_created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true }),
    db.collection(mappingCollection).doc(redemptionCode.toLowerCase()).set({
      code: redemptionCode,
      uid,
      product_type: product.productType,
      product_key: product.key,
      product_id: product.productId,
      redemption_collection: product.redemptionCollection,
      ledger_type: product.ledgerType,
      product_title: product.title,
      credit_cents: creditCents,
      status: "coupon_created",
      discount_node_id: discountNodeId,
      voucher_expires_at: voucherExpiresAt.toISOString(),
      created_at: FieldValue.serverTimestamp(),
    }),
  ]);

  return {
    ...result,
    status: "coupon_created",
    checkoutUrl,
    // Rueckwaertskompatibel fuer die bestehende Kinderbuchseite:
    book: result.product,
    voucherExpiresAt: voucherExpiresAt.toISOString(),
  };
}

exports.createKinderbuchRedemption = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: CALLABLE_CORS,
    secrets: [digistoreApiKey],
  },
  async (request) => {
    const bookId = cleanString(request.data?.bookId, 40).toLowerCase();
    const book = KINDERBUCH_PRODUCTS[bookId];
    if (!book) {
      throw new HttpsError("invalid-argument", "Unbekannter Kinderbuch-Band.");
    }
    return createProductRedemption(request, {
      key: book.id,
      title: book.title,
      productId: book.productId,
      checkoutUrl: book.checkoutUrl,
      priceCents: book.priceCents,
      codePrefix: "KB",
      redemptionCollection: "kinderbuch_redemptions",
      productType: "kinderbuch",
      ledgerType: "kinderbuch_redemption",
    });
  },
);

exports.createKursRedemption = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: CALLABLE_CORS,
    secrets: [digistoreApiKey],
  },
  async (request) => {
    const moduleId = cleanString(request.data?.moduleId ?? request.data?.productKey, 40).toLowerCase();
    const kurs = STRESS_RESET_PRODUCTS[moduleId];
    if (!kurs) {
      throw new HttpsError("invalid-argument", "Unbekanntes Kurs-Modul.");
    }
    return createProductRedemption(request, {
      key: kurs.id,
      title: kurs.title,
      productId: kurs.productId,
      checkoutUrl: kurs.checkoutUrl,
      priceCents: kurs.priceCents,
      codePrefix: "SR",
      redemptionCollection: "kurs_redemptions",
      productType: "stress_reset",
      ledgerType: "kurs_redemption",
    });
  },
);

exports.createShopifyRedemption = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: CALLABLE_CORS,
    secrets: [shopifyClientId, shopifyClientSecret],
  },
  async (request) => {
    const productKey = cleanString(request.data?.productKey ?? request.data?.productId, 40).toLowerCase();
    const item = SHOPIFY_PRODUCTS[productKey];
    if (!item) {
      throw new HttpsError("invalid-argument", "Unbekanntes Shop-Produkt.");
    }
    return createProductRedemption(request, {
      key: item.id,
      title: item.title,
      productId: item.variantId,
      variantId: item.variantId,
      checkoutUrl: `https://${SHOPIFY_SHOP_DOMAIN}/cart/${item.variantId}:1`,
      priceCents: item.priceCents,
      codePrefix: "SH",
      provider: "shopify",
      mappingCollection: "shopify_redemptions",
      redemptionCollection: "shopify_redemptions",
      productType: "shopify_supplement",
      ledgerType: "shopify_redemption",
    });
  },
);

const IPN_PAID_EVENTS = new Set(["on_payment"]);
const IPN_REVERSAL_EVENTS = new Set(["on_refund", "on_chargeback"]);

function ipnRedemptionCode(params = {}) {
  const candidates = [params.custom, params.coupon_code, params.voucher_code, params.used_coupon_code];
  for (const candidate of candidates) {
    const value = cleanString(candidate, 60);
    if (/^(KB|SR)-[A-F0-9]{8}$/i.test(value)) return value.toLowerCase();
  }
  return "";
}

async function settleRedemptionPaid(code, ipn, options = {}) {
  const { mappingCollection = "digistore_redemptions", source = "digistore24" } = options;
  const mappingRef = db.collection(mappingCollection).doc(code);
  const mappingSnap = await mappingRef.get();
  if (!mappingSnap.exists) {
    logger.warn("IPN payment without redemption mapping", { code, mappingCollection });
    return { handled: false };
  }
  const mapping = mappingSnap.data() || {};
  const userRef = db.collection("users").doc(mapping.uid);
  const redemptionRef = userRef.collection(mapping.redemption_collection || "kinderbuch_redemptions").doc(code);
  const balanceRef = userRef.collection("balances").doc("current");
  const ledgerRef = userRef.collection("valus_ledger").doc();

  return db.runTransaction(async (transaction) => {
    const [redemptionSnap, userSnap, balanceSnap] = await Promise.all([
      transaction.get(redemptionRef),
      transaction.get(userRef),
      transaction.get(balanceRef),
    ]);
    if (!redemptionSnap.exists) return { handled: false };
    const redemption = redemptionSnap.data() || {};
    if (redemption.status === "paid" || redemption.status === "refunded") {
      return { handled: true, alreadySettled: true };
    }

    const user = userSnap.exists ? userSnap.data() : {};
    const balance = balanceSnap.exists ? balanceSnap.data() : {};
    const availableXp = xpFromSources(balance, user);
    const availableValus = valusFromSources(balance, user);

    const reservedXp = Math.max(0, numberValue(redemption.applied_xp_amount, 0));
    const reservedValus = Math.max(0, numberValue(redemption.applied_valus_amount, 0));
    const settledXp = Math.min(reservedXp, availableXp);
    const settledValus = Math.min(reservedValus, availableValus);
    const needsReview = settledXp < reservedXp || settledValus < reservedValus;

    const nextXp = availableXp - settledXp;
    const nextValus = Math.round((availableValus - settledValus) * CENTS_PER_EURO) / CENTS_PER_EURO;

    // Nur den Spend-Topf (balances/current) veraendern. user.current_xp NICHT
    // anfassen — das ist der Nexus-Level-Fortschritt und gehoert der Nexus-App.
    transaction.set(balanceRef, {
      valus: nextValus,
      val: nextValus,
      xp: nextXp,
      current_xp: nextXp,
      valus_legacy_migrated: true,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(ledgerRef, {
      type: mapping.ledger_type || "product_redemption",
      source,
      amount: -settledValus,
      xp_amount: -settledXp,
      description: `Einloesung ${redemption.code || code.toUpperCase()} (${redemption.product_title || redemption.book_title || mapping.product_title || "Produkt"})`,
      order_id: cleanString(ipn.order_id, 60),
      created_at: FieldValue.serverTimestamp(),
    });
    transaction.set(redemptionRef, {
      status: "paid",
      needs_review: needsReview,
      settled_xp_amount: settledXp,
      settled_valus_amount: settledValus,
      order_id: cleanString(ipn.order_id, 60),
      buyer_email: cleanString(ipn.email, 180),
      paid_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(mappingRef, {
      status: "paid",
      needs_review: needsReview,
      order_id: cleanString(ipn.order_id, 60),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { handled: true, settledXp, settledValus, needsReview };
  });
}

async function settleRedemptionReversal(code, ipn, event, options = {}) {
  const { mappingCollection = "digistore_redemptions", source = "digistore24" } = options;
  const mappingRef = db.collection(mappingCollection).doc(code);
  const mappingSnap = await mappingRef.get();
  if (!mappingSnap.exists) return { handled: false };
  const mapping = mappingSnap.data() || {};
  const userRef = db.collection("users").doc(mapping.uid);
  const redemptionRef = userRef.collection(mapping.redemption_collection || "kinderbuch_redemptions").doc(code);
  const balanceRef = userRef.collection("balances").doc("current");
  const ledgerRef = userRef.collection("valus_ledger").doc();

  return db.runTransaction(async (transaction) => {
    const [redemptionSnap, userSnap, balanceSnap] = await Promise.all([
      transaction.get(redemptionRef),
      transaction.get(userRef),
      transaction.get(balanceRef),
    ]);
    if (!redemptionSnap.exists) return { handled: false };
    const redemption = redemptionSnap.data() || {};
    if (redemption.status !== "paid") {
      transaction.set(redemptionRef, {
        [`${event}_received_at`]: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { handled: true, skipped: true };
    }

    const user = userSnap.exists ? userSnap.data() : {};
    const balance = balanceSnap.exists ? balanceSnap.data() : {};
    const refundXp = Math.max(0, numberValue(redemption.settled_xp_amount, 0));
    const refundValus = Math.max(0, numberValue(redemption.settled_valus_amount, 0));
    const nextXp = xpFromSources(balance, user) + refundXp;
    const nextValus = Math.round((valusFromSources(balance, user) + refundValus) * CENTS_PER_EURO) / CENTS_PER_EURO;

    // Nur den Spend-Topf (balances/current) veraendern. user.current_xp NICHT
    // anfassen — das ist der Nexus-Level-Fortschritt und gehoert der Nexus-App.
    transaction.set(balanceRef, {
      valus: nextValus,
      val: nextValus,
      xp: nextXp,
      current_xp: nextXp,
      valus_legacy_migrated: true,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(ledgerRef, {
      type: `${mapping.ledger_type || "product_redemption"}_refund`,
      source,
      amount: refundValus,
      xp_amount: refundXp,
      description: `Rueckbuchung Einloesung ${redemption.code || code.toUpperCase()} (${event})`,
      order_id: cleanString(ipn.order_id, 60),
      created_at: FieldValue.serverTimestamp(),
    });
    transaction.set(redemptionRef, {
      status: "refunded",
      refund_event: event,
      refunded_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(mappingRef, {
      status: "refunded",
      refund_event: event,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { handled: true, refundXp, refundValus };
  });
}

exports.digistoreIpn = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [digistoreIpnPassphrase],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("POST only");
      return;
    }
    const params = req.body && typeof req.body === "object" ? req.body : {};

    if (!isValidIpnSignature(digistoreIpnPassphrase.value(), params)) {
      logger.warn("digistoreIpn: invalid signature", {
        event: cleanString(params.event, 40),
        order_id: cleanString(params.order_id, 60),
      });
      res.status(403).send("invalid sha_sign");
      return;
    }

    const event = cleanString(params.event, 40).toLowerCase();
    const orderId = cleanString(params.order_id, 60);
    const eventId = crypto.createHash("sha256")
      .update(`${orderId}|${event}|${cleanString(params.order_item_id, 60)}|${cleanString(params.transaction_id, 60)}`)
      .digest("hex")
      .slice(0, 48);

    try {
      await db.collection("digistore_ipn_events").doc(eventId).set({
        event,
        order_id: orderId,
        product_id: cleanString(params.product_id, 40),
        email: cleanString(params.email, 180),
        amount: cleanString(params.amount, 40),
        currency: cleanString(params.currency, 10),
        redemption_code: ipnRedemptionCode(params),
        payload: JSON.parse(JSON.stringify(params)),
        received_at: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (event === "connection_test" || event === "") {
        res.status(200).send("OK");
        return;
      }

      const code = ipnRedemptionCode(params);
      if (code) {
        if (IPN_PAID_EVENTS.has(event)) {
          const outcome = await settleRedemptionPaid(code, params);
          logger.info("digistoreIpn payment settled", { code, orderId, ...outcome });
        } else if (IPN_REVERSAL_EVENTS.has(event)) {
          const outcome = await settleRedemptionReversal(code, params, event);
          logger.info("digistoreIpn reversal settled", { code, orderId, event, ...outcome });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      logger.error("digistoreIpn failed", { event, orderId, error: String(error?.message || error) });
      res.status(500).send("internal error");
    }
  },
);

const SHOPIFY_CODE_PATTERN = /^SH-[A-F0-9]{8}$/i;
const SHOPIFY_PAID_TOPICS = new Set(["orders/paid"]);
const SHOPIFY_REVERSAL_TOPICS = new Set(["refunds/create", "orders/cancelled"]);

function isValidShopifyHmac(secret, rawBody, headerValue) {
  if (!secret || !rawBody || !headerValue) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const providedBuf = Buffer.from(String(headerValue), "utf8");
  const computedBuf = Buffer.from(computed, "utf8");
  // Laengenpruefung ist noetig: timingSafeEqual wirft bei ungleich langen Buffern.
  if (providedBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, computedBuf);
}

// Der Einloesecode steht im Bestell-Payload als angewendeter Rabattcode.
function shopifyRedemptionCode(payload = {}) {
  const codes = Array.isArray(payload.discount_codes) ? payload.discount_codes : [];
  for (const entry of codes) {
    const value = cleanString(typeof entry === "string" ? entry : entry?.code, 60);
    if (SHOPIFY_CODE_PATTERN.test(value)) return value.toLowerCase();
  }
  return "";
}

// Refund-Payloads enthalten keine Rabattcodes, nur die Bestell-ID. Die Zuordnung
// laeuft daher ueber die beim Kauf gespeicherte order_id.
async function shopifyCodeByOrderId(orderId) {
  const id = cleanString(orderId, 60);
  if (!id) return "";
  const snap = await db.collection("shopify_redemptions")
    .where("order_id", "==", id)
    .limit(1)
    .get();
  return snap.empty ? "" : snap.docs[0].id;
}

exports.shopifyOrderWebhook = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [shopifyClientSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("POST only");
      return;
    }

    const topic = cleanString(req.get("x-shopify-topic"), 60).toLowerCase();
    const shopDomain = cleanString(req.get("x-shopify-shop-domain"), 120).toLowerCase();
    const deliveryId = cleanString(req.get("x-shopify-webhook-id"), 80);

    if (!isValidShopifyHmac(shopifyClientSecret.value(), req.rawBody, req.get("x-shopify-hmac-sha256"))) {
      logger.warn("shopifyOrderWebhook: invalid hmac", { topic, shopDomain });
      res.status(401).send("invalid hmac");
      return;
    }
    if (shopDomain && shopDomain !== SHOPIFY_SHOP_DOMAIN) {
      logger.warn("shopifyOrderWebhook: unexpected shop", { topic, shopDomain });
      res.status(403).send("unexpected shop");
      return;
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const isRefund = topic === "refunds/create";
    const orderId = cleanString(isRefund ? payload.order_id : payload.id, 60);
    const eventId = deliveryId || crypto.createHash("sha256")
      .update(`${orderId}|${topic}|${cleanString(payload.id, 60)}`)
      .digest("hex")
      .slice(0, 48);

    try {
      const eventRef = db.collection("shopify_webhook_events").doc(eventId);
      const alreadySeen = (await eventRef.get()).exists;
      await eventRef.set({
        topic,
        order_id: orderId,
        shop_domain: shopDomain,
        email: cleanString(payload.email ?? payload.contact_email, 180),
        received_at: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Shopify wiederholt Zustellungen. Ohne diese Sperre wuerde derselbe Kauf
      // mehrfach verbucht werden.
      if (alreadySeen) {
        logger.info("shopifyOrderWebhook: duplicate delivery ignored", { eventId, topic, orderId });
        res.status(200).send("OK");
        return;
      }

      const code = shopifyRedemptionCode(payload) || (isRefund ? await shopifyCodeByOrderId(orderId) : "");
      if (code) {
        const settleOptions = { mappingCollection: "shopify_redemptions", source: "shopify" };
        const normalized = { order_id: orderId, email: cleanString(payload.email ?? payload.contact_email, 180) };
        if (SHOPIFY_PAID_TOPICS.has(topic)) {
          const outcome = await settleRedemptionPaid(code, normalized, settleOptions);
          logger.info("shopifyOrderWebhook payment settled", { code, orderId, ...outcome });
        } else if (SHOPIFY_REVERSAL_TOPICS.has(topic)) {
          const event = isRefund ? "on_refund" : "on_cancel";
          const outcome = await settleRedemptionReversal(code, normalized, event, settleOptions);
          logger.info("shopifyOrderWebhook reversal settled", { code, orderId, event, ...outcome });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      logger.error("shopifyOrderWebhook failed", { topic, orderId, error: String(error?.message || error) });
      res.status(500).send("internal error");
    }
  },
);

// Loescht abgelaufene bzw. eingeloeste Shopify-Rabattcodes, damit die Rabattliste
// im Shop-Admin nicht mit SH-Codes volllaeuft.
exports.cleanupShopifyDiscounts = onSchedule(
  {
    schedule: "every day 03:45",
    timeZone: "Europe/Berlin",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "256MiB",
    secrets: [shopifyClientId, shopifyClientSecret],
  },
  async () => {
    const cutoff = new Date().toISOString();
    const snap = await db.collection("shopify_redemptions")
      .where("voucher_expires_at", "<", cutoff)
      .limit(200)
      .get();

    let deleted = 0;
    let failed = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      const nodeId = cleanString(data.discount_node_id, 120);
      if (!nodeId || data.discount_deleted) continue;

      try {
        const result = await shopifyAdminGraphql(SHOPIFY_DISCOUNT_DELETE, { id: nodeId });
        const userErrors = result?.discountCodeDelete?.userErrors || [];
        if (userErrors.length) throw new Error(cleanString(userErrors[0]?.message, 300));
        await docSnap.ref.set({
          discount_deleted: true,
          discount_deleted_at: FieldValue.serverTimestamp(),
        }, { merge: true });
        deleted += 1;
      } catch (error) {
        failed += 1;
        logger.warn("cleanupShopifyDiscounts: delete failed", {
          code: docSnap.id,
          error: String(error?.message || error),
        });
      }
    }

    logger.info("cleanupShopifyDiscounts done", { scanned: snap.size, deleted, failed });
  },
);

// Raeumt taeglich abgelaufene bzw. verbrauchte Einloese-Rabattcodes (KB-/SR-) bei
// Digistore24 auf, damit sich die Gutschein-Liste nicht endlos fuellt. Eigene,
// manuell angelegte Codes (anderes Namensmuster) werden NIE angefasst.
exports.cleanupDigistoreVouchers = onSchedule(
  {
    schedule: "every day 03:30",
    timeZone: "Europe/Berlin",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "256MiB",
    secrets: [digistoreApiKey],
  },
  async () => {
    const apiKey = digistoreApiKey.value();
    const data = await digistoreApiCall(apiKey, "listVouchers", {});
    const coupons = Array.isArray(data?.coupons) ? data.coupons : [];
    const now = Date.now();
    let deleted = 0;
    let failed = 0;

    for (const coupon of coupons) {
      const code = cleanString(coupon?.code, 60);
      if (!/^(KB|SR)-[A-F0-9]{8}$/i.test(code)) continue; // nur unsere Einloese-Codes

      const expiresRaw = cleanString(coupon?.expires_at, 40);
      const expiresAt = expiresRaw ? Date.parse(expiresRaw.replace(" ", "T")) : NaN;
      const isExpired = Number.isFinite(expiresAt) && expiresAt < now;
      const isUsedUp = String(coupon?.is_count_limited).toUpperCase() === "Y"
        && numberValue(coupon?.count_left, 1) <= 0;

      if (!isExpired && !isUsedUp) continue; // noch gueltig und nutzbar -> behalten

      try {
        await digistoreApiCall(apiKey, "deleteVoucher", { code });
        deleted += 1;
      } catch (error) {
        failed += 1;
        logger.warn("cleanupDigistoreVouchers: delete failed", { code, error: String(error?.message || error) });
      }
    }

    logger.info("cleanupDigistoreVouchers done", { scanned: coupons.length, deleted, failed });
  },
);

exports.redeemValus = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    const uid = requireAuth(request);
    const productId = cleanString(request.data?.productId, 80) || "stress_reset_kurs";
    const valusAmount = parseValusAmount(request.data || {});
    if (valusAmount < 1) {
      throw new HttpsError("invalid-argument", "Bitte VAL-Betrag eingeben.");
    }

    const userRef = db.collection("users").doc(uid);
    const balanceRef = userRef.collection("balances").doc("current");
    const redemptionRef = userRef.collection("valus_redemptions").doc();
    const redemptionCode = crypto.randomBytes(8).toString("hex");

    await db.runTransaction(async (transaction) => {
      const [userSnap, balanceSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(balanceRef),
      ]);
      const user = userSnap.exists ? userSnap.data() : {};
      const balance = balanceSnap.exists ? balanceSnap.data() : {};
      const currentValus = valusFromSources(balance, user);
      if (currentValus < valusAmount) {
        throw new HttpsError("failed-precondition", `Nicht genug VAL vorhanden. Aktuell verfuegbar: ${currentValus} VAL.`);
      }
      transaction.set(redemptionRef, {
        product_id: productId,
        valus_amount: valusAmount,
        code: redemptionCode,
        status: "pending_purchase",
        note: "VAL wird erst nach bestaetigtem Kauf abgezogen.",
        created_at: FieldValue.serverTimestamp(),
      });
    });

    return {
      code: redemptionCode,
      status: "pending_purchase",
      discountUrl: `https://www.callidus-am.de/stress-reset-kurs/?valus=${encodeURIComponent(redemptionCode)}`,
    };
  },
);

exports.linkWalletAddress = functionsV1
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
      throw new functionsV1.https.HttpsError("unauthenticated", "Bitte einloggen.");
    }
    const uid = context.auth.uid;
    const address = cleanString(data?.address, 80);
    const message = cleanString(data?.message, 300);
    const signature = cleanString(data?.signature, 300);
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new functionsV1.https.HttpsError("invalid-argument", "Ungueltige Wallet-Adresse.");
    }
    if (!message || !signature) {
      throw new functionsV1.https.HttpsError("invalid-argument", "Wallet-Signatur fehlt.");
    }

    await db.collection("users").doc(uid).set({
      wallet_address: address,
      wallet_signature: signature,
      wallet_message: message,
      wallet_linked_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { address };
  });

exports.generateSportEnergyPlan = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [geminiApiKey],
    cors: [
      "https://www.callidus-am.de",
      "https://callidus-am.de",
      "http://127.0.0.1:4321",
      "http://localhost:4321",
    ],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Bitte einloggen.");
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "GEMINI_API_KEY ist nicht gesetzt.");
    }

    const preferences = sanitizePreferences(request.data?.preferences || {});
    const calendarDays = sanitizeCalendarDays(request.data?.calendarDays);
    if (!preferences.goal || !preferences.level) {
      throw new HttpsError("invalid-argument", "Ziel und Trainingslevel sind Pflichtfelder.");
    }

    const uid = request.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const today = todayKey();
    const [
      userDoc,
      nexusContext,
      nexusStats,
      healthPlan,
      mealPlan,
      meals,
      activities,
      momusContext,
      momusStats,
      kairosProfile,
    ] = await Promise.all([
      docData(userRef),
      docData(userRef.collection("kairos_context").doc("nexus_current")),
      docData(userRef.collection("daily_stats").doc(today)),
      docData(userRef.collection("health_plan").doc("current")),
      docData(userRef.collection("meal_plan").doc("current")),
      docsData(userRef.collection("meals").orderBy("timestamp", "desc").limit(5)),
      docsData(userRef.collection("activities").orderBy("timestamp", "desc").limit(5)),
      docData(userRef.collection("kairos_context").doc("momus_current")),
      docData(userRef.collection("momus_stats").doc(today)),
      docData(userRef.collection("kairos_profile").doc("current")),
    ]);

    const context = compactContext({
      userDoc,
      nexusContext,
      nexusStats,
      healthPlan,
      mealPlan,
      meals,
      activities,
      momusContext,
      momusStats,
      kairosProfile,
      calendarDays,
    });
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const prompt = buildPrompt(preferences, context);
    const plan = await callGemini({ apiKey, model, prompt });
    const planId = `plan_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const record = {
      plan_id: planId,
      plan,
      preferences,
      context_summary: context,
      provider: "gemini",
      model,
      created_at: FieldValue.serverTimestamp(),
      created_at_iso: createdAt,
    };

    await Promise.all([
      userRef.collection("sport_coach").doc("preferences").set({
        current: preferences,
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true }),
      userRef.collection("sport_coach").doc("latest_plan").set(record, { merge: true }),
      userRef.collection("sport_coach_plans").doc(planId).set(record),
    ]);

    return {
      plan,
      planId,
      provider: "gemini",
      model,
      createdAt,
    };
  },
);

exports.getSportEnergyPlan = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: [
      "https://www.callidus-am.de",
      "https://callidus-am.de",
      "http://127.0.0.1:4321",
      "http://localhost:4321",
    ],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Bitte einloggen.");
    }

    const userRef = db.collection("users").doc(request.auth.uid);
    const [latestSnap, preferencesSnap] = await Promise.all([
      userRef.collection("sport_coach").doc("latest_plan").get(),
      userRef.collection("sport_coach").doc("preferences").get(),
    ]);

    const latest = latestSnap.exists ? latestSnap.data() : {};
    const preferences = preferencesSnap.exists ? preferencesSnap.data() : {};

    return {
      plan: latest.plan || null,
      planId: latest.plan_id || "",
      preferences: preferences.current || preferences || null,
      provider: latest.provider || "",
      model: latest.model || "",
      createdAt: latest.created_at_iso || safeTimestamp(latest.created_at),
    };
  },
);

exports.saveSportCoachLog = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Bitte einloggen.");
    }

    const payload = sanitizeSportCoachLogPayload(request.data || {});
    const uid = request.auth.uid;
    const now = new Date().toISOString();
    const logRef = db
      .collection("users")
      .doc(uid)
      .collection("sport_coach_logs")
      .doc(payload.weekKey);
    const existing = await logRef.get();

    await logRef.set({
      week_key: payload.weekKey,
      plan_id: payload.planId,
      entries: payload.entries,
      weekly_note: payload.weeklyNote,
      entry_count: payload.entries.length,
      created_at: existing.exists ? (existing.data()?.created_at || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      created_at_iso: existing.exists ? (existing.data()?.created_at_iso || now) : now,
      updated_at: FieldValue.serverTimestamp(),
      updated_at_iso: now,
    });

    return {
      ok: true,
      weekKey: payload.weekKey,
      updatedAt: now,
    };
  },
);

exports.getSportCoachLogs = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: CALLABLE_CORS,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Bitte einloggen.");
    }

    const weekKey = sanitizeWeekKey(request.data?.weekKey);
    const historyLimit = boundedInt(request.data?.historyLimit, 8, 1, 24);
    const logsRef = db
      .collection("users")
      .doc(request.auth.uid)
      .collection("sport_coach_logs");
    const previousKey = previousWeekKey(weekKey);
    const [activeSnap, previousSnap, recentSnap] = await Promise.all([
      logsRef.doc(weekKey).get(),
      logsRef.doc(previousKey).get(),
      logsRef.orderBy("week_key", "desc").limit(historyLimit).get(),
    ]);

    return {
      activeWeek: formatSportCoachLog(activeSnap),
      previousWeek: formatSportCoachLog(previousSnap),
      recentWeeks: recentSnap.docs.map(formatSportCoachLog).filter(Boolean),
    };
  },
);

exports.askCallidus = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 45,
    memory: "512MiB",
    secrets: [geminiApiKey],
    cors: [
      "https://www.callidus-am.de",
      "https://callidus-am.de",
      "http://127.0.0.1:4321",
      "http://localhost:4321",
    ],
  },
  async (request) => {
    const message = cleanString(request.data?.message, 700);
    if (!message || message.length < 3) {
      throw new HttpsError("invalid-argument", "Bitte eine Frage eingeben.");
    }

    const sessionId = cleanString(request.data?.sessionId, 120);
    await enforcePublicChatRate(sessionId);

    const pagePath = cleanString(request.data?.pagePath, 160);
    const history = sanitizeChatHistory(request.data?.history);
    const safetyAnswer = safetyAnswerFor(message);
    const entries = retrieveCallidusKnowledge(message, pagePath);
    const sources = collectChatSources(entries);
    const safetyNotice = "Callidus ersetzt keine medizinische Beratung. Bei starken, akuten oder anhaltenden Beschwerden bitte professionelle Hilfe nutzen.";

    if (safetyAnswer) {
      return {
        answer: safetyAnswer,
        sources,
        safetyNotice,
        provider: "safety",
      };
    }

    if (!entries.length) {
      return {
        answer: fallbackChatAnswer(entries),
        sources,
        safetyNotice,
        provider: "retrieval",
      };
    }

    const videoAnswer = directVideoAnswer(message, entries);
    if (videoAnswer) {
      return {
        answer: videoAnswer.answer,
        sources: [videoAnswer.source, ...sources].slice(0, 8),
        safetyNotice,
        provider: "retrieval",
      };
    }

    const apiKey = geminiApiKey.value();
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    if (!apiKey) {
      return {
        answer: fallbackChatAnswer(entries),
        sources,
        safetyNotice,
        provider: "retrieval",
      };
    }

    try {
      const prompt = buildCallidusChatPrompt({ message, history, entries, sources });
      const answer = await callGeminiText({ apiKey, model, prompt });
      const hasUsefulAnswer = isUsefulChatAnswer(answer);
      const finalAnswer = hasUsefulAnswer ? answer : fallbackChatAnswer(entries);
      return {
        answer: finalAnswer,
        sources,
        safetyNotice,
        provider: hasUsefulAnswer ? "gemini" : "retrieval",
        model: hasUsefulAnswer ? model : undefined,
      };
    } catch (error) {
      logger.warn("Callidus assistant fell back to retrieval", { error: error.message });
      return {
        answer: fallbackChatAnswer(entries),
        sources,
        safetyNotice,
        provider: "retrieval",
      };
    }
  },
);

// Öffentliche Rezept-Inhalte für die Website. Dieser Bereich ist absichtlich
// von NEXUS getrennt: Er liest nur die bereits veröffentlichte Wochenidee und
// erzeugt eine einzelne, allgemeine Tagesmahlzeit ohne Nutzer- oder Profildaten.
const PUBLIC_FOOD_ORIGINS = new Set([
  "https://www.callidus-am.de",
  "https://callidus-am.de",
  "http://127.0.0.1:4321",
  "http://localhost:4321",
]);

const DAILY_MEAL_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    prepTime: { type: "INTEGER" },
    servings: { type: "INTEGER" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          amount: { type: "STRING" },
          name: { type: "STRING" },
        },
        required: ["amount", "name"],
      },
    },
    preparation: { type: "ARRAY", items: { type: "STRING" } },
    nutrition: {
      type: "OBJECT",
      properties: {
        calories: { type: "NUMBER" },
        protein: { type: "NUMBER" },
        carbs: { type: "NUMBER" },
        fat: { type: "NUMBER" },
        fiber: { type: "NUMBER" },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
    quickAlternative: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        prepTime: { type: "NUMBER" },
        steps: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "description", "prepTime", "steps"],
    },
    imagePrompt: { type: "STRING" },
  },
  required: ["title", "description", "prepTime", "servings", "ingredients", "preparation", "nutrition", "quickAlternative", "imagePrompt"],
};

function publicFoodDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function publicFoodNumber(value, fallback = null, min = 0, max = 10000) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? Math.round(number * 10) / 10 : fallback;
}

function publicFoodMillis(value) {
  if (value?.toMillis) return value.toMillis();
  if (value?.toDate) return value.toDate().getTime();
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function publicFoodQuickAlternative(value) {
  if (!value) return null;
  const source = typeof value === "string" ? { description: value } : value;
  const description = cleanString(source.description, 320);
  const steps = ensureArray(source.steps).slice(0, 4).map((step) => cleanString(step, 220)).filter(Boolean);
  if (!description && !steps.length) return null;
  return {
    title: cleanString(source.title, 90) || "Schnelle Alternative",
    description,
    prepTime: publicFoodNumber(source.prepTime, null, 1, 120),
    steps,
  };
}

function publicFoodRecipe(value = {}, { daily = false } = {}) {
  const nutrition = value.nutrition || {};
  const ingredients = ensureArray(value.ingredients).slice(0, 16).map((ingredient) => {
    if (!daily || typeof ingredient === "string") return cleanString(ingredient, 150);
    return {
      amount: cleanString(ingredient?.amount, 60),
      name: cleanString(ingredient?.name, 120),
    };
  }).filter((ingredient) => (typeof ingredient === "string" ? Boolean(ingredient) : ingredient.name));

  return {
    title: cleanString(value.title, 160),
    description: cleanString(value.description, 420),
    type: cleanString(value.type, 60),
    mealType: cleanString(value.mealType, 60),
    prepTime: publicFoodNumber(value.prepTime, null, 1, 180),
    servings: publicFoodNumber(value.servings, null, 1, 12),
    ingredients,
    preparation: ensureArray(value.preparation).slice(0, 8).map((step) => cleanString(step, 320)).filter(Boolean),
    nutrition: {
      calories: publicFoodNumber(nutrition.calories, null, 0, 2500),
      protein: publicFoodNumber(nutrition.protein, null, 0, 250),
      carbs: publicFoodNumber(nutrition.carbs, null, 0, 350),
      fat: publicFoodNumber(nutrition.fat, null, 0, 250),
      fiber: publicFoodNumber(nutrition.fiber, null, 0, 150),
    },
    imageUrl: cleanString(value.imageUrl, 1000),
    quickAlternative: daily ? publicFoodQuickAlternative(value.quickAlternative) : null,
    dateKey: cleanString(value.dateKey, 20),
    publishedDate: cleanString(value.publishedDate, 20),
  };
}

function publicFoodFallbackDaily(dateKey) {
  return publicFoodRecipe({
    title: "Bunte Linsen-Gemüse-Pfanne",
    description: "Eine einfache, sättigende Tagesidee mit Linsen, frischem Gemüse und Vollkorn – unkompliziert für alle.",
    prepTime: 25,
    servings: 2,
    ingredients: [
      { amount: "150 g", name: "rote Linsen" },
      { amount: "1", name: "Zucchini" },
      { amount: "1", name: "rote Paprika" },
      { amount: "1", name: "kleine Zwiebel" },
      { amount: "250 ml", name: "Gemüsebrühe" },
      { amount: "2 EL", name: "Olivenöl" },
      { amount: "100 g", name: "Naturjoghurt oder pflanzliche Alternative" },
      { amount: "nach Geschmack", name: "Zitrone, Petersilie, Salz und Pfeffer" },
    ],
    preparation: [
      "Zwiebel, Zucchini und Paprika klein schneiden und im Olivenöl kurz anbraten.",
      "Linsen und Gemüsebrühe zugeben und etwa 15 Minuten sanft köcheln lassen.",
      "Mit Zitrone, Petersilie, Salz und Pfeffer abschmecken und mit Joghurt servieren.",
    ],
    nutrition: { calories: 440, protein: 22, carbs: 52, fat: 15, fiber: 16 },
    quickAlternative: {
      title: "Linsen-Couscous in 10 Minuten",
      description: "Die gleiche Idee ohne Kochzeit: Vorgegarte Linsen mit TK-Gemüse und Vollkorn-Couscous kombinieren.",
      prepTime: 10,
      steps: [
        "Vollkorn-Couscous mit heißer Gemüsebrühe übergießen und 5 Minuten quellen lassen.",
        "TK-Gemüse und vorgegarte Linsen aus dem Glas kurz in der Pfanne erhitzen.",
        "Alles mischen, mit Zitrone und Kräutern abschmecken und mit Joghurt servieren.",
      ],
    },
    imageUrl: "/assets/food/bunte-linsen-gemuese-pfanne.jpg",
    dateKey,
    publishedDate: dateKey,
  }, { daily: true });
}

function publicFoodParseJson(text) {
  const value = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  const candidates = [value];
  if (start >= 0 && end > start) candidates.push(value.slice(start, end + 1));
  let lastError;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Die Tagesidee enthielt kein gültiges JSON.");
}

async function publicFoodGeminiJson({ apiKey, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: attempt === 0 ? prompt : `${prompt}\nWichtig: Liefere ausschließlich ein vollständiges, gültiges JSON-Objekt.` }] }],
        generationConfig: {
          temperature: attempt === 0 ? 0.45 : 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: DAILY_MEAL_SCHEMA,
          // Ohne dieses Limit verbraucht gemini-2.5-flash das Token-Budget fuer
          // internes "thinking" und liefert abgeschnittenes JSON zurueck.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      logger.error("Daily meal generation failed", { status: response.status, detail: detail.slice(0, 600) });
      throw new Error("Gemini konnte die Tagesmahlzeit nicht erstellen.");
    }
    const payload = await response.json();
    const candidate = payload.candidates?.[0];
    const text = ensureArray(candidate?.content?.parts).map((part) => part.text || "").join("").trim();
    try {
      if (!text) throw new Error("Gemini hat keine Tagesmahlzeit geliefert.");
      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        throw new Error(`Gemini hat die Tagesidee abgebrochen (${candidate.finishReason}).`);
      }
      const generatedMeal = publicFoodParseJson(text);
      return {
        ...publicFoodRecipe(generatedMeal, { daily: true }),
        imagePrompt: cleanString(generatedMeal.imagePrompt, 900),
      };
    } catch (error) {
      lastError = error;
      logger.warn("Daily meal JSON was incomplete; retrying generation", { attempt: attempt + 1, error: String(error?.message || error) });
    }
  }
  throw lastError || new Error("Gemini hat keine vollständige Tagesidee geliefert.");
}

// Bildgenerierung laeuft ueber fal.ai (flux/schnell) wie im NEXUS Wochenrezept.
// Der Gemini-Bildendpunkt ist im Free Tier dieses Projekts auf Kontingent 0 gesetzt.
async function publicFoodImage({ falKey, prompt, dateKey }) {
  if (!falKey) {
    logger.warn("Daily meal image skipped: FAL_KEY is not set");
    return "";
  }
  const fullPrompt = `${cleanString(prompt, 900)}, professional healthy food photography, appetizing daylight, shallow depth of field, no text, no logos`;
  try {
    const generated = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
    });
    if (!generated.ok) {
      const detail = await generated.text();
      logger.warn("Daily meal image generation failed", { status: generated.status, detail: detail.slice(0, 300) });
      return "";
    }
    const payload = await generated.json();
    const sourceUrl = cleanString(payload?.images?.[0]?.url || payload?.image?.url || payload?.url, 1000);
    if (!sourceUrl) {
      logger.warn("Daily meal image response contained no image url");
      return "";
    }
    // Die fal.ai-URL ist nur temporaer gueltig, deshalb dauerhaft in Storage kopieren.
    const download = await fetch(sourceUrl);
    if (!download.ok) {
      logger.warn("Daily meal image could not be downloaded", { status: download.status });
      return "";
    }
    const imageBuffer = Buffer.from(await download.arrayBuffer());
    const bucket = admin.storage().bucket();
    const fileName = `website-food/${dateKey}.jpg`;
    const file = bucket.file(fileName);
    await file.save(imageBuffer, { metadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" }, public: true });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    logger.warn("Daily meal image request failed", { error: String(error?.message || error) });
    return "";
  }
}

function publicFoodSetCors(req, res) {
  const origin = req.get("origin");
  if (origin && PUBLIC_FOOD_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept");
}

exports.publishDailyHealthyMeal = onSchedule(
  {
    schedule: "15 6 * * *",
    timeZone: "Europe/Berlin",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [geminiApiKey, falApiKey],
  },
  async () => {
    const dateKey = publicFoodDateKey();
    const mealRef = db.collection("website_public_food").doc(`daily_${dateKey}`);
    const now = Date.now();
    const acquired = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(mealRef);
      const current = snapshot.exists ? snapshot.data() || {} : {};
      const startedAt = publicFoodMillis(current.generationStartedAt);
      const isFreshLock = current.status === "generating" && startedAt > now - (20 * 60 * 1000);
      if (current.status === "ready" || isFreshLock) return false;
      transaction.set(mealRef, {
        status: "generating",
        dateKey,
        generationStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return true;
    });
    if (!acquired) return { skipped: true, dateKey };

    try {
      const recentSnapshot = await db.collection("website_public_food").orderBy("dateKey", "desc").limit(8).get();
      const recentTitles = recentSnapshot.docs
        .filter((doc) => doc.data()?.status === "ready")
        .map((doc) => cleanString(doc.data()?.title, 160))
        .filter(Boolean)
        .slice(0, 7);
      const themes = [
        "pflanzenbasiert, sättigend und unkompliziert",
        "vegetarisch und mediterran",
        "proteinreich mit Hülsenfrüchten",
        "vollwertig mit saisonalem Obst oder Gemüse",
        "leicht, bunt und sommerlich",
        "mild und familientauglich",
        "ballaststoffreich mit Vollkorn und Gemüse",
      ];
      const theme = themes[Number(dateKey.replace(/-/g, "")) % themes.length];
      const prompt = [
        "Du erstellst die allgemeine Callidus Tagesmahlzeit für eine öffentliche Website.",
        "Erstelle genau ein gesundes, alltagstaugliches Rezept auf Deutsch für 2 Portionen. Es ist keine individuelle Ernährungsberatung und darf keine Heil- oder Abnehmversprechen enthalten.",
        `Heute ist ${dateKey}. Stil: ${theme}. Sie darf sich nicht zu stark mit diesen zuletzt verwendeten Titeln überschneiden: ${recentTitles.join(" | ") || "keine"}.`,
        "Die Zutaten müssen in deutschen Supermärkten gut erhältlich sein. Keine rohen Eier, kein Alkohol, keine Nahrungsergänzungsmittel. Nenne klare Mengen, 3 bis 6 Zubereitungsschritte und plausible geschätzte Nährwerte pro Portion.",
        "quickAlternative ist dasselbe Gericht als deutlich schnellere Variante: title ist ein kurzer Name (maximal 60 Zeichen), description ein Satz dazu, prepTime die Zubereitungszeit in Minuten und steps zwei bis drei kurze Schritte mit Zutaten aus dem Supermarkt.",
        "imagePrompt muss Englisch sein und das fertige Gericht fotorealistisch beschreiben; keine Schrift, keine Marken.",
      ].join("\n");
      const apiKey = geminiApiKey.value();
      if (!apiKey) throw new Error("GEMINI_API_KEY ist nicht gesetzt.");
      const meal = await publicFoodGeminiJson({ apiKey, prompt });
      const imageUrl = await publicFoodImage({ falKey: falApiKey.value(), prompt: meal.imagePrompt || meal.title, dateKey });
      await mealRef.set({
        ...meal,
        imageUrl,
        dateKey,
        publishedDate: dateKey,
        status: "ready",
        provider: "gemini-2.5-flash",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const historySnapshot = await db.collection("website_public_food").orderBy("dateKey", "desc").limit(32).get();
      const obsoleteDocs = historySnapshot.docs.slice(7);
      if (obsoleteDocs.length) {
        const cleanup = db.batch();
        obsoleteDocs.forEach((doc) => cleanup.delete(doc.ref));
        await cleanup.commit();
      }
      logger.info("Daily healthy meal published", { dateKey, title: meal.title, imageReady: Boolean(imageUrl) });
      return { ok: true, dateKey, title: meal.title, imageReady: Boolean(imageUrl) };
    } catch (error) {
      await mealRef.set({
        status: "failed",
        failure: cleanString(error?.message || error, 280),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.error("Daily healthy meal failed", { dateKey, error: String(error?.message || error) });
      throw error;
    }
  },
);

exports.getPublicFoodContent = onRequest(
  { region: "us-central1", timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    publicFoodSetCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "GET") {
      res.status(405).json({ error: "GET only" });
      return;
    }
    try {
      const today = publicFoodDateKey();
      const [dailySnapshot, dailyHistorySnapshot, weeklySnapshot] = await Promise.all([
        db.collection("website_public_food").doc(`daily_${today}`).get(),
        db.collection("website_public_food").orderBy("dateKey", "desc").limit(7).get(),
        db.collection("recipes").where("category", "==", "weekly_special").limit(32).get(),
      ]);
      const weeklyHistory = weeklySnapshot.docs
        .map((doc) => ({ data: doc.data() || {}, created: publicFoodMillis(doc.data()?.createdAt || doc.data()?.created_at) }))
        .filter((entry) => entry.data.active !== false)
        .sort((a, b) => b.created - a.created)
        .slice(0, 7)
        .map((entry) => publicFoodRecipe({ ...entry.data, publishedDate: publicFoodDateKey(new Date(entry.created || Date.now())) }));
      const dailyData = dailySnapshot.exists && dailySnapshot.data()?.status === "ready" ? dailySnapshot.data() : null;
      const daily = dailyData ? publicFoodRecipe(dailyData, { daily: true }) : publicFoodFallbackDaily(today);
      const dailyHistory = dailyHistorySnapshot.docs
        .filter((doc) => doc.data()?.status === "ready")
        .map((doc) => publicFoodRecipe(doc.data(), { daily: true }));
      // Damit die Tagesnavigation immer einen Eintrag fuer heute hat - auch wenn
      // nur das Ersatzrezept ausgeliefert wird.
      if (!dailyHistory.some((entry) => entry.dateKey === daily.dateKey)) dailyHistory.unshift(daily);
      res.set("Cache-Control", "public, max-age=300, s-maxage=300");
      res.status(200).json({ daily, weekly: weeklyHistory[0] || null, dailyHistory, weeklyHistory, updatedAt: new Date().toISOString() });
    } catch (error) {
      logger.error("Public food content failed", { error: String(error?.message || error) });
      res.status(500).json({ error: "content unavailable" });
    }
  },
);

