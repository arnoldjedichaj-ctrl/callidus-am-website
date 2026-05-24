const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const DEFAULT_MODEL = "gemini-2.5-flash";

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
    "Fuege pro weeklyTraining-Einheit 2 bis 5 konkrete exercises hinzu. Nutze einfache deutsche Uebungsnamen wie Kniebeuge, Rudern, Liegestuetz, Plank, Ausfallschritt, Schulterdruecken, Band-Rudern, Mountain Climber, Glute Bridge oder Spaziergang, damit die Webseite passende Bildkarten anzeigen kann.",
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
      preferences: preferences.current || preferences || null,
      provider: latest.provider || "",
      model: latest.model || "",
      createdAt: latest.created_at_iso || safeTimestamp(latest.created_at),
    };
  },
);
