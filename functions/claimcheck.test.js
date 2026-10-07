"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  scoreClaim, quoteIsVerbatim, studyKind, isProtocol, fitAbstract, parseJsonLoose, runClaimCheck, makeJsonLlm,
} = require("./claimcheck");

const src = (kind, relevanz, richtung, verified = true) => ({ kind, relevanz, richtung, verified });

test("gut belegt bei übereinstimmenden Meta-Analysen", () => {
  const r = scoreClaim([src("meta", "passt", "stuetzt"), src("meta", "passt", "stuetzt"), src("rct", "passt", "stuetzt")]);
  assert.equal(r.level, "belegt");
  assert.equal(r.certainty, "hoch");
});

test("widerspricht bei gegenläufigen Studien", () => {
  const r = scoreClaim([src("meta", "passt", "widerspricht"), src("rct", "passt", "widerspricht")]);
  assert.equal(r.level, "widerspricht");
});

test("gemischt bei gleich starken Gegenpositionen", () => {
  const r = scoreClaim([src("meta", "passt", "stuetzt"), src("meta", "passt", "widerspricht")]);
  assert.equal(r.level, "gemischt");
  assert.equal(r.certainty, "mittel");
});

test("zu wenig Belege bei nur einer schwachen Studie", () => {
  const r = scoreClaim([src("other", "passt", "stuetzt")]);
  assert.equal(r.level, "unklar");
  assert.equal(r.value, null);
});

test("nur indirekt passende Studien ergeben kein Urteil", () => {
  const r = scoreClaim([src("rct", "teilweise", "stuetzt"), src("rct", "teilweise", "stuetzt"), src("meta", "teilweise", "stuetzt")]);
  assert.equal(r.level, "unklar");
  assert.equal(r.label, "Nur indirekt passende Studien");
});

test("nicht wörtliche Zitate zählen nicht", () => {
  const r = scoreClaim([src("meta", "passt", "stuetzt", false), src("meta", "passt", "stuetzt", false)]);
  assert.equal(r.level, "unklar");
});

test("unpassende Studien zählen nicht", () => {
  const r = scoreClaim([src("meta", "passt_nicht", "stuetzt"), src("meta", "passt_nicht", "stuetzt")]);
  assert.equal(r.level, "unklar");
});

test("Zitat muss ein vollständiger Satz sein", () => {
  const abstract = "Background: cramps are common. Magnesium supplementation significantly reduced  blood pressure in adults with deficiency. Further trials are needed.";
  assert.ok(quoteIsVerbatim("Magnesium supplementation significantly reduced blood pressure in adults with deficiency.", abstract));
  assert.ok(!quoteIsVerbatim("Magnesium supplementation significantly reduced blood pressure", abstract));
  assert.ok(!quoteIsVerbatim("Magnesium supplementation strongly reduced blood pressure in adults with deficiency.", abstract));
});

test("abgeschnittene Verneinung wird nicht akzeptiert", () => {
  const abstract = "There is no evidence that vitamin C prevents the common cold. Regular intake shortened colds slightly.";
  assert.ok(!quoteIsVerbatim("vitamin C prevents the common cold.", abstract));
  assert.ok(quoteIsVerbatim("There is no evidence that vitamin C prevents the common cold.", abstract));
});

test("mehrere aufeinanderfolgende Sätze sind erlaubt", () => {
  const abstract = "First finding was clear in this group. Second finding confirmed it again. Unrelated.";
  assert.ok(quoteIsVerbatim("First finding was clear in this group. Second finding confirmed it again.", abstract));
});

test("Studienart und Protokolle", () => {
  assert.equal(studyKind(["Meta-Analysis", "Review"], ""), "meta");
  assert.equal(studyKind(["Randomized Controlled Trial"], ""), "rct");
  assert.equal(studyKind([], "A randomised trial of x"), "rct");
  assert.equal(studyKind(["Journal Article"], "Cohort study"), "other");
  assert.ok(isProtocol([], "A randomized trial protocol for magnesium"));
  assert.ok(isProtocol(["Study Protocol"], "Magnesium trial"));
  assert.ok(!isProtocol(["Randomized Controlled Trial"], "Magnesium for cramps"));
});

test("lange Zusammenfassung behält den Schluss", () => {
  const long = `${"Background sentence. ".repeat(200)}CONCLUSION: Magnesium had no effect.`;
  const fitted = fitAbstract(long);
  assert.ok(fitted.length <= 3700);
  assert.ok(fitted.endsWith("CONCLUSION: Magnesium had no effect."));
});

test("JSON auch mit Begleittext lesbar", () => {
  assert.deepEqual(parseJsonLoose('Hier: {"a":1} fertig'), { a: 1 });
});

test("ungültiges JSON löst den Ersatzanbieter aus", async () => {
  let fallbackUsed = false;
  const llm = makeJsonLlm([
    async () => "kein json",
    async () => '{"claims": []}',
  ], { onFallback: () => { fallbackUsed = true; }, minRemainingMs: 0 });
  const result = await llm({ system: "", user: "" }, {}, (o) => { if (!Array.isArray(o.claims)) throw new Error("x"); return o; }, Date.now() + 10000);
  assert.ok(fallbackUsed);
  assert.deepEqual(result, { claims: [] });
});

test("falsche Struktur löst ebenfalls den Ersatz aus", async () => {
  const llm = makeJsonLlm([
    async () => '{"claims": "nicht-liste"}',
    async () => '{"claims": [{"aussage": "x", "suchbegriffe_en": ["a"]}]}',
  ], { minRemainingMs: 0 });
  const result = await llm({ system: "", user: "" }, {}, (o) => { if (!Array.isArray(o.claims)) throw new Error("x"); return o; }, Date.now() + 10000);
  assert.equal(result.claims.length, 1);
});

test("Gesamtablauf mit Attrappen für KI und Studiensuche", async () => {
  const abstract = "Background text here. In this meta-analysis, vitamin D supplementation did not reduce the incidence of acute respiratory infections overall.";
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ resultList: { result: [
      { id: "1", pmid: "111", title: "Vitamin D meta-analysis", abstractText: abstract, pubYear: "2021", pubTypeList: { pubType: ["Meta-Analysis"] } },
      { id: "2", pmid: "222", title: "Second meta-analysis", abstractText: abstract, pubYear: "2022", pubTypeList: { pubType: ["Meta-Analysis"] } },
      { id: "3", pmid: "333", title: "A trial protocol for vitamin D", abstractText: abstract, pubYear: "2022", pubTypeList: { pubType: ["Randomized Controlled Trial"] } },
    ] } }),
  });
  let call = 0;
  const provider = async (prompt) => {
    call += 1;
    assert.ok(prompt.user.startsWith("<daten>"));
    if (call === 1) return JSON.stringify({ claims: [{ aussage: "Vitamin D schützt vor Erkältungen.", suchbegriffe_en: ["vitamin D", "respiratory infection"] }] });
    const zitat = "In this meta-analysis, vitamin D supplementation did not reduce the incidence of acute respiratory infections overall.";
    return JSON.stringify({ quellen: [
      { nr: 1, relevanz: "passt", richtung: "widerspricht", zitat, erklaerung: "Kein Schutz insgesamt." },
      { nr: 2, relevanz: "passt", richtung: "widerspricht", zitat, erklaerung: "Kein Schutz insgesamt." },
    ], einschraenkung: "Ergebnisse gelten für die Gesamtbevölkerung." });
  };
  const llm = makeJsonLlm([provider], { minRemainingMs: 0 });
  const result = await runClaimCheck("Vitamin D schützt zuverlässig vor Erkältungen.", { llm, fetchImpl });
  assert.equal(result.aussagen.length, 1);
  const a = result.aussagen[0];
  assert.equal(a.ergebnis.level, "widerspricht");
  assert.equal(a.quellen.length, 2, "Protokoll wird aussortiert");
  assert.equal(a.quellen[0].verified, true);
  assert.equal(a.quellen[0].url, "https://pubmed.ncbi.nlm.nih.gov/111/");
});

test("Abschnittsüberschrift vor dem Zitat ist erlaubt", () => {
  const abstract = "Main results We found five trials. Authors' conclusions It is unlikely that magnesium supplementation provides clinically meaningful cramp prophylaxis to older adults.";
  assert.ok(quoteIsVerbatim("It is unlikely that magnesium supplementation provides clinically meaningful cramp prophylaxis to older adults.", abstract));
  assert.ok(!quoteIsVerbatim("magnesium supplementation provides clinically meaningful cramp prophylaxis to older adults.", abstract));
});

test("weggelassene Klammer-Statistik wird toleriert", () => {
  const abstract = "All trials were randomized. Compared to placebo, vitamin C significantly decreased the severity of the common cold by 15% (95% CI 9-21%). The direct comparison was done.";
  assert.ok(quoteIsVerbatim("Compared to placebo, vitamin C significantly decreased the severity of the common cold by 15%.", abstract));
});

test("abgeschnittener Nachsatz zeigt den vollständigen Originalsatz", () => {
  const { matchQuote } = require("./claimcheck");
  const abstract = "Authors' conclusions The failure of vitamin C supplementation to reduce the incidence of colds in the general population indicates that routine vitamin C supplementation is not justified, yet vitamin C may be useful for people exposed to brief periods of severe physical exercise.";
  const result = matchQuote("The failure of vitamin C supplementation to reduce the incidence of colds in the general population indicates that routine vitamin C supplementation is not justified", abstract);
  assert.ok(result.startsWith("The failure of vitamin C"));
  assert.ok(result.includes("yet vitamin C may be useful"));
});

test("sinnentstellende Satzanfang-Kürzung bleibt verboten", () => {
  const abstract = "Results were mixed. Although earlier trials suggested benefit, magnesium did not reduce cramp frequency in this trial.";
  assert.ok(!quoteIsVerbatim("magnesium did not reduce cramp frequency in this trial.", abstract));
});

test("gleicher Anbieter wird bei ungültigem JSON erneut gefragt", async () => {
  let calls = 0;
  const llm = makeJsonLlm([async () => { calls += 1; return calls === 1 ? '{"claims": [' : '{"claims": []}'; }], { minRemainingMs: 0 });
  const result = await llm({ system: "", user: "" }, {}, (o) => o, Date.now() + 10000);
  assert.equal(calls, 2);
  assert.deepEqual(result, { claims: [] });
});

test("ohne direkte Meta-Analyse oder RCT kein Urteil", () => {
  const r = scoreClaim([src("other", "passt", "stuetzt"), src("other", "passt", "stuetzt"), src("other", "passt", "stuetzt"), src("other", "passt", "stuetzt"), src("rct", "teilweise", "stuetzt")]);
  assert.equal(r.level, "unklar");
  assert.equal(r.label, "Keine passende Meta-Analyse oder kontrollierte Studie");
});

test("Fallberichte überstimmen keine Meta-Analyse", () => {
  const r = scoreClaim([src("meta", "passt", "widerspricht"), src("other", "passt", "stuetzt"), src("other", "passt", "stuetzt")]);
  assert.equal(r.level, "eher_nicht");
});
