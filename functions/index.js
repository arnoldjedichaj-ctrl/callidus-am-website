const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
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
const digistoreApiKey = defineSecret("DIGISTORE24_API_KEY");
const digistoreIpnPassphrase = defineSecret("DIGISTORE24_IPN_PASSPHRASE");
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

function xpFromSources(balance = {}, user = {}) {
  return numberValue(
    balance.xp ?? balance.current_xp ?? user.current_xp ?? user.total_xp,
    0,
  );
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
    const [userSnap, balanceSnap, monthSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("balances").doc("current").get(),
      userRef.collection("valus_conversions").doc(monthKey()).get(),
    ]);
    const user = userSnap.exists ? userSnap.data() : {};
    const balance = balanceSnap.exists ? balanceSnap.data() : {};
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
    if (source !== "nexus") {
      throw new HttpsError("failed-precondition", "Aktuell kann nur NEXUS-XP in VAL umgewandelt werden.");
    }

    const xpAmount = Number.parseInt(request.data?.xpAmount, 10);
    if (!Number.isFinite(xpAmount)) {
      throw new HttpsError("invalid-argument", "Bitte NEXUS-XP-Betrag eingeben.");
    }
    if (xpAmount < XP_PER_VALUS) {
      throw new HttpsError("invalid-argument", `Minimum ${XP_PER_VALUS} NEXUS-XP.`);
    }
    if (xpAmount > XP_PER_VALUS * MONTHLY_VALUS_LIMIT) {
      throw new HttpsError("invalid-argument", `Maximal ${XP_PER_VALUS * MONTHLY_VALUS_LIMIT} NEXUS-XP pro Monat.`);
    }
    if (xpAmount % XP_PER_VALUS !== 0) {
      throw new HttpsError("invalid-argument", `Bitte in ${XP_PER_VALUS}-XP-Schritten umwandeln.`);
    }

    const valusAmount = Math.floor(xpAmount / XP_PER_VALUS);
    const userRef = db.collection("users").doc(uid);
    const balanceRef = userRef.collection("balances").doc("current");
    const conversionRef = userRef.collection("valus_conversions").doc(monthKey());
    const ledgerRef = userRef.collection("valus_ledger").doc();

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
        throw new HttpsError("failed-precondition", `Nicht genug NEXUS-XP vorhanden. Aktuell verfuegbar: ${availableXp} XP.`);
      }

      const nextXp = availableXp - xpAmount;
      const nextValus = valusFromSources(balance, user) + valusAmount;
      const balancePayload = {
        valus: nextValus,
        val: nextValus,
        xp: nextXp,
        current_xp: nextXp,
        xp_source: "nexus",
        valus_legacy_migrated: true,
        updated_at: FieldValue.serverTimestamp(),
      };

      transaction.set(balanceRef, balancePayload, { merge: true });
      transaction.set(userRef, {
        current_xp: nextXp,
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(conversionRef, {
        source: "nexus",
        valus: FieldValue.increment(valusAmount),
        xp: FieldValue.increment(xpAmount),
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(ledgerRef, {
        type: "nexus_xp_conversion",
        source: "nexus",
        amount: valusAmount,
        xp_amount: xpAmount,
        description: "NEXUS-XP in VAL umgewandelt",
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
            source: "nexus",
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
    const availableXp = xpFromSources(balance, user);
    const currentValus = valusFromSources(balance, user);
    const xpCreditCents = Math.floor(availableXp / XP_PER_CENT);
    const valusCreditCents = centsFromValus(currentValus);
    const availableCreditCents = xpCreditCents + valusCreditCents;

    if (availableCreditCents < creditCents) {
      throw new HttpsError(
        "failed-precondition",
        `Nicht genug XP/VAL vorhanden. Aktuell verfuegbar: ${valusFromCents(availableCreditCents)} EUR Rabattwert.`,
      );
    }

    const appliedXpCents = Math.min(creditCents, xpCreditCents);
    const appliedXpAmount = appliedXpCents * XP_PER_CENT;
    const appliedValusCents = creditCents - appliedXpCents;
    const appliedValusAmount = valusFromCents(appliedValusCents);
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
  try {
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
  } catch (error) {
    logger.error("createVoucher failed", { code: redemptionCode, error: String(error?.message || error) });
    await redemptionRef.set({
      status: "coupon_failed",
      coupon_error: cleanString(error?.message, 300),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    throw new HttpsError("internal", "Der Rabattcode konnte bei Digistore24 nicht erstellt werden. Dein Guthaben wurde nicht belastet. Bitte versuche es spaeter erneut.");
  }

  const voucherParam = encodeURIComponent(redemptionCode);
  const checkoutUrl = `${product.checkoutUrl}?voucher=${voucherParam}&custom=${voucherParam}`;

  await Promise.all([
    redemptionRef.set({
      status: "coupon_created",
      checkout_url_with_voucher: checkoutUrl,
      voucher_expires_at: voucherExpiresAt.toISOString(),
      coupon_created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true }),
    db.collection("digistore_redemptions").doc(redemptionCode.toLowerCase()).set({
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

async function settleRedemptionPaid(code, ipn) {
  const mappingRef = db.collection("digistore_redemptions").doc(code);
  const mappingSnap = await mappingRef.get();
  if (!mappingSnap.exists) {
    logger.warn("IPN payment without redemption mapping", { code });
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

    transaction.set(balanceRef, {
      valus: nextValus,
      val: nextValus,
      xp: nextXp,
      current_xp: nextXp,
      valus_legacy_migrated: true,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(userRef, {
      current_xp: nextXp,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(ledgerRef, {
      type: mapping.ledger_type || "product_redemption",
      source: "digistore24",
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

async function settleRedemptionReversal(code, ipn, event) {
  const mappingRef = db.collection("digistore_redemptions").doc(code);
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

    transaction.set(balanceRef, {
      valus: nextValus,
      val: nextValus,
      xp: nextXp,
      current_xp: nextXp,
      valus_legacy_migrated: true,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(userRef, {
      current_xp: nextXp,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(ledgerRef, {
      type: `${mapping.ledger_type || "product_redemption"}_refund`,
      source: "digistore24",
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

