export const callidusBatchVoicePlaybackRate = 1.05;

export const callidusBatchTopicIds = [
  "coenzym-q10",
  "nmn",
  "magnesium",
  "vitamin-d3-k2",
  "omega-3"
] as const;

export const callidusBatchTopics = {
  "coenzym-q10": {
    "accent": "gold",
    "icon": "Q10",
    "formula": "C59H90O4",
    "moleculeTitle": "Q10",
    "moleculeSubtitle": "Zellenergie",
    "problem": "Energie-Hype",
    "solution": "Kontext prüfen",
    "foodLabels": [
      "Fisch",
      "Fleisch",
      "Nüsse",
      "Öle",
      "Basis"
    ],
    "safetyRows": [
      "Blutverdünner?",
      "Herzmedikamente?",
      "Schwangerschaft?",
      "OP geplant?"
    ],
    "sources": [
      {
        "label": "NCCIH",
        "year": "2019",
        "finding": "Q10 ist körpereigen, aber keine pauschale Therapie."
      },
      {
        "label": "Q-SYMBIO",
        "year": "2014",
        "finding": "Herzinsuffizienz-Daten sind interessant, aber medizinisch einzuordnen."
      },
      {
        "label": "Statin-Meta",
        "year": "2018",
        "finding": "Bei Muskelsymptomen sind Ergebnisse gemischt."
      },
      {
        "label": "Review",
        "year": "2016",
        "finding": "Mechanismus plausibel, Nutzen je nach Kontext unterschiedlich."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Q10 einfach erklärt",
        "subtitle": "Ein Zellstoff für Energie, kein Koffein-Ersatz und kein Wunderakku.",
        "mode": "problemSolution",
        "accent": "gold",
        "bullets": [
          "Zellenergie",
          "Problem: Hype",
          "Lösung: einordnen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-01-aoede.wav",
        "audioSeconds": 18.771,
        "start": 0,
        "duration": 574
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "eyebrow": "Was ist es?",
        "title": "Der Funke in den Kraftwerken",
        "subtitle": "Mitochondrien machen aus Nahrung nutzbare Zellenergie. Q10 hilft in dieser Kette.",
        "mode": "molecule",
        "accent": "gold",
        "bullets": [
          "Mitochondrien",
          "Elektronen",
          "ATP"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-02-aoede.wav",
        "audioSeconds": 16.051,
        "start": 574,
        "duration": 497
      },
      {
        "image": "pexels/q10-v1/08-workout-recovery.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "ATP = Zellakku",
        "subtitle": "Q10 lädt nicht dich direkt auf, sondern ist Teil der Energieproduktion in jeder Zelle.",
        "mode": "process",
        "accent": "gold",
        "bullets": [
          "Nahrung",
          "Kraftwerk",
          "ATP"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-03-aoede.wav",
        "audioSeconds": 19.771,
        "start": 1071,
        "duration": 603
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Warum nimmt es ab?",
        "title": "Alter, Belastung, Medikamente",
        "subtitle": "Q10-Spiegel können sinken. Das bedeutet nicht automatisch: jeder braucht hohe Dosen.",
        "mode": "timeline",
        "accent": "gold",
        "bullets": [
          "Alter",
          "Statine",
          "Stress"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-04-aoede.wav",
        "audioSeconds": 17.451,
        "start": 1674,
        "duration": 537
      },
      {
        "image": "pexels/q10-v1/04-heart-health.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Herz & Energie",
        "title": "Interessant, nicht allein behandeln",
        "subtitle": "Das Herz braucht viel Energie. Einige Studien prüften Q10 ergänzend bei Herzinsuffizienz.",
        "mode": "evidence",
        "accent": "gold",
        "bullets": [
          "Herzmuskel",
          "Studien",
          "ergänzend"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-05-aoede.wav",
        "audioSeconds": 18.531,
        "start": 2211,
        "duration": 567
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Statin-Mythos",
        "title": "Nicht automatisch Pflicht",
        "subtitle": "Bei Muskelschmerzen unter Statinen wird Q10 diskutiert. Die Daten sind gemischt.",
        "mode": "compare",
        "accent": "gold",
        "bullets": [
          "möglich",
          "nicht sicher",
          "abklären"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-06-aoede.wav",
        "audioSeconds": 18.611,
        "start": 2778,
        "duration": 570
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Formen",
        "title": "Ubiquinon oder Ubiquinol?",
        "subtitle": "Beide Formen können relevant sein. Wichtiger sind Qualität, Fett-Mahlzeit und Verträglichkeit.",
        "mode": "quality",
        "accent": "gold",
        "bullets": [
          "Form",
          "Fett",
          "Qualität"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-07-aoede.wav",
        "audioSeconds": 17.691,
        "start": 3348,
        "duration": 543
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/04-heart-health.jpg",
        "eyebrow": "Dosis",
        "title": "Mehr ist nicht automatisch besser",
        "subtitle": "Je nach Ziel und Situation unterscheiden sich Dosierungen stark.",
        "mode": "dose",
        "accent": "gold",
        "bullets": [
          "langsam",
          "prüfen",
          "konservativ"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-08-aoede.wav",
        "audioSeconds": 18.811,
        "start": 3891,
        "duration": 575
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Sicherheit",
        "title": "Nicht komplett harmlos denken",
        "subtitle": "Q10 ist meist gut verträglich, kann aber bei Medikamenten relevant sein.",
        "mode": "safety",
        "accent": "gold",
        "bullets": [
          "Medikamente",
          "OP",
          "ärztlich"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-09-aoede.wav",
        "audioSeconds": 17.251,
        "start": 4466,
        "duration": 531
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Spannend, aber kein Wunderakku",
        "subtitle": "Q10 ist echte Zellbiologie. Der Nutzen hängt vom Menschen, Ziel und Kontext ab.",
        "mode": "summary",
        "accent": "gold",
        "bullets": [
          "verstehen",
          "nicht übertreiben",
          "Qualität"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/coenzym-q10/scene-10-aoede.wav",
        "audioSeconds": 17.211,
        "start": 4997,
        "duration": 552
      }
    ],
    "id": "coenzym-q10",
    "slug": "coenzym-q10-mitochondrien-energie",
    "compositionId": "Q10EvidenceDeepDive",
    "title": "Coenzym Q10 einfach erklärt: Zellenergie, Herz und was Supplements wirklich leisten",
    "durationInFrames": 5549,
    "voicePlaybackRate": 0.88
  },
  "nmn": {
    "accent": "teal",
    "icon": "NMN",
    "formula": "C11H15N2O8P",
    "moleculeTitle": "NMN",
    "moleculeSubtitle": "Vorstufe von NAD+",
    "problem": "Longevity-Hype",
    "solution": "Studien prüfen",
    "foodLabels": [
      "Basis",
      "Training",
      "Schlaf",
      "Eiweiß",
      "Licht"
    ],
    "safetyRows": [
      "Krebsdiagnose?",
      "Schwangerschaft?",
      "Medikamente?",
      "Langzeit?"
    ],
    "sources": [
      {
        "label": "Science",
        "year": "2021",
        "finding": "Humanstudie: metabolische Signale, keine Verjüngungsgarantie."
      },
      {
        "label": "JISSN",
        "year": "2021",
        "finding": "NMN plus Training: aerobe Kapazität untersucht."
      },
      {
        "label": "npj Aging",
        "year": "2022",
        "finding": "NAD+-Marker stiegen; Bedeutung bleibt begrenzt."
      },
      {
        "label": "GeroScience",
        "year": "2023",
        "finding": "Kurzfristige Daten, Langzeitfragen offen."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "NMN einfach erklärt",
        "subtitle": "NAD+ klingt futuristisch. Gemeint ist ein Helferstoff für Zellenergie.",
        "mode": "problemSolution",
        "accent": "teal",
        "bullets": [
          "NAD+",
          "Problem: Hype",
          "Lösung: Daten"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/nmn/scene-01-aoede.wav",
        "audioSeconds": 19.451,
        "start": 0,
        "duration": 594
      },
      {
        "image": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Was ist NAD+?",
        "title": "Ein Helfer im Zellmotor",
        "subtitle": "NAD+ transportiert Energie-Signale. Ohne solche Helfer läuft Zellarbeit schlechter.",
        "mode": "process",
        "accent": "teal",
        "bullets": [
          "Nahrung",
          "NAD+",
          "Energie"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/nmn/scene-02-aoede.wav",
        "audioSeconds": 14.771,
        "start": 594,
        "duration": 460
      },
      {
        "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Warum Longevity?",
        "title": "NAD+ sinkt mit dem Alter",
        "subtitle": "Das ist biologisch interessant. Aber ein sinkender Marker ist noch keine Therapie.",
        "mode": "timeline",
        "accent": "teal",
        "bullets": [
          "Alter",
          "Marker",
          "Fragezeichen"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/nmn/scene-03-aoede.wav",
        "audioSeconds": 15.451,
        "start": 1054,
        "duration": 479
      },
      {
        "image": "pexels/fisetin-v1/03-microscope.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Sirtuine normal erklärt",
        "title": "Reparatur-Teams brauchen Helfer",
        "subtitle": "Sirtuine sind Enzyme. Sie werden oft als Anti-Aging-Schalter beworben.",
        "mode": "cellEnergy",
        "accent": "teal",
        "bullets": [
          "Enzyme",
          "Reparatur",
          "kein Schalter"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/nmn/scene-04-aoede.wav",
        "audioSeconds": 16.691,
        "start": 1533,
        "duration": 515
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/fisetin-v1/07-biohacking.jpg",
        "eyebrow": "Menschenstudien",
        "title": "Spannend, aber früh",
        "subtitle": "Es gibt Humanstudien, aber sie beantworten noch nicht die große Anti-Aging-Frage.",
        "mode": "evidence",
        "accent": "teal",
        "bullets": [
          "Marker",
          "kleine Studien",
          "offen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/nmn/scene-05-aoede.wav",
        "audioSeconds": 15.531,
        "start": 2048,
        "duration": 482
      },
      {
        "image": "pexels/fisetin-v1/07-biohacking.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "Problem",
        "title": "Marker sind keine Wunderwirkung",
        "subtitle": "Mehr NAD+ heißt nicht automatisch mehr Gesundheit, Energie oder Lebensjahre.",
        "mode": "compare",
        "accent": "teal",
        "bullets": [
          "Marker",
          "Symptom",
          "Nutzen"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/nmn/scene-06-aoede.wav",
        "audioSeconds": 18.051,
        "start": 2530,
        "duration": 554
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Dosis & Qualität",
        "title": "Viele Produkte, wenig Sicherheit",
        "subtitle": "Kapseln unterscheiden sich. Reinheit, Lagerung und Deklaration sind zentral.",
        "mode": "quality",
        "accent": "teal",
        "bullets": [
          "Reinheit",
          "mg klar",
          "Lagerung"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/nmn/scene-07-aoede.wav",
        "audioSeconds": 18.211,
        "start": 3084,
        "duration": 558
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "eyebrow": "Sicherheit",
        "title": "Langzeitdaten fehlen",
        "subtitle": "Kurzfristig untersucht heißt nicht automatisch langfristig geklärt.",
        "mode": "safety",
        "accent": "teal",
        "bullets": [
          "Langzeit",
          "Diagnosen",
          "Medikamente"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/nmn/scene-08-aoede.wav",
        "audioSeconds": 17.851,
        "start": 3642,
        "duration": 548
      },
      {
        "image": "pexels/q10-v1/08-workout-recovery.jpg",
        "secondaryImage": "pexels/spermidin-v1/08-breakfast.jpg",
        "eyebrow": "Lösung",
        "title": "Basis vor Biohacking",
        "subtitle": "Schlaf, Bewegung, Ernährung und Licht beeinflussen Zellenergie ebenfalls.",
        "mode": "foods",
        "accent": "teal",
        "bullets": [
          "Schlaf",
          "Training",
          "Eiweiß"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/nmn/scene-09-aoede.wav",
        "audioSeconds": 20.131,
        "start": 4190,
        "duration": 613
      },
      {
        "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "secondaryImage": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Kandidat, kein Jungbrunnen",
        "subtitle": "NMN bleibt spannend. Aber Normalo-Regel: Belege vor Versprechen.",
        "mode": "summary",
        "accent": "teal",
        "bullets": [
          "spannend",
          "vorsichtig",
          "nicht blind"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/nmn/scene-10-aoede.wav",
        "audioSeconds": 18.331,
        "start": 4803,
        "duration": 584
      }
    ],
    "id": "nmn",
    "slug": "nmn-nad-zellenergie-longevity",
    "compositionId": "NMNEvidenceDeepDive",
    "title": "NMN einfach erklärt: NAD+, Zellenergie und warum Longevity-Belege noch früh sind",
    "durationInFrames": 5387,
    "voicePlaybackRate": 0.88
  },
  "magnesium": {
    "accent": "mint",
    "icon": "Mg",
    "formula": "Mg2+",
    "moleculeTitle": "Magnesium",
    "moleculeSubtitle": "Mineralstoff",
    "problem": "Alles wird Mangel genannt",
    "solution": "Form & Kontext prüfen",
    "foodLabels": [
      "Kerne",
      "Nüsse",
      "Bohnen",
      "Vollkorn",
      "Spinat"
    ],
    "safetyRows": [
      "Niere?",
      "Antibiotika?",
      "Schilddrüse?",
      "Durchfall?"
    ],
    "sources": [
      {
        "label": "NIH ODS",
        "year": "2026",
        "finding": "Magnesium ist Cofaktor in über 300 Enzymsystemen."
      },
      {
        "label": "Blutdruck",
        "year": "2016",
        "finding": "RCT-Meta-Analyse: Effekte eher moderat."
      },
      {
        "label": "Migräne",
        "year": "2012",
        "finding": "Leitlinie: mögliche Option, nicht Universallösung."
      },
      {
        "label": "Schlaf",
        "year": "2021",
        "finding": "Evidenz begrenzt, besonders bei älteren Erwachsenen untersucht."
      }
    ],
    "scenes": [
      {
        "image": "pexels/spermidin-v1/08-breakfast.jpg",
        "secondaryImage": "pexels/fisetin-v1/05-capsules.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Magnesium einfach erklärt",
        "subtitle": "Wichtig für Muskeln und Nerven, aber nicht jede Beschwerde ist ein Mangel.",
        "mode": "problemSolution",
        "accent": "mint",
        "bullets": [
          "Mineralstoff",
          "Problem: Pauschal",
          "Lösung: prüfen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-01-aoede.wav",
        "audioSeconds": 21.731,
        "start": 0,
        "duration": 659
      },
      {
        "image": "pexels/fisetin-v1/03-microscope.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Was macht es?",
        "title": "Ein Helfer für Enzyme",
        "subtitle": "Enzyme sind kleine Arbeitsmaschinen. Magnesium hilft vielen davon bei der Arbeit.",
        "mode": "molecule",
        "accent": "mint",
        "bullets": [
          "Mg2+",
          "Enzyme",
          "Zellen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-02-aoede.wav",
        "audioSeconds": 19.131,
        "start": 659,
        "duration": 585
      },
      {
        "image": "pexels/q10-v1/08-workout-recovery.jpg",
        "secondaryImage": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "eyebrow": "Muskeln & Nerven",
        "title": "Anspannung und Entspannung",
        "subtitle": "Magnesium unterstützt Signalweitergabe, Muskelarbeit und normale Nervenfunktion.",
        "mode": "process",
        "accent": "mint",
        "bullets": [
          "Signal",
          "Muskel",
          "Ruhe"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-03-aoede.wav",
        "audioSeconds": 16.411,
        "start": 1244,
        "duration": 507
      },
      {
        "image": "pexels/fisetin-v1/08-research.jpg",
        "secondaryImage": "pexels/fisetin-v1/03-microscope.jpg",
        "eyebrow": "Blutwert-Falle",
        "title": "Serum ist nicht der ganze Speicher",
        "subtitle": "Viel Magnesium sitzt in Knochen und Zellen. Ein normaler Blutwert sagt nicht alles.",
        "mode": "compare",
        "accent": "mint",
        "bullets": [
          "Blut",
          "Zelle",
          "Knochen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-04-aoede.wav",
        "audioSeconds": 17.771,
        "start": 1751,
        "duration": 546
      },
      {
        "image": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
        "secondaryImage": "pexels/spermidin-v1/08-breakfast.jpg",
        "eyebrow": "Food first",
        "title": "Kerne, Nüsse, Hülsenfrüchte",
        "subtitle": "Lebensmittel liefern Magnesium plus Ballaststoffe und weitere Nährstoffe.",
        "mode": "foods",
        "accent": "mint",
        "bullets": [
          "Kerne",
          "Nüsse",
          "Bohnen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-05-aoede.wav",
        "audioSeconds": 17.651,
        "start": 2297,
        "duration": 542
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "Formen",
        "title": "Nicht jedes Magnesium ist gleich",
        "subtitle": "Gut lösliche Formen werden oft besser aufgenommen als Magnesiumoxid.",
        "mode": "quality",
        "accent": "mint",
        "bullets": [
          "Bisglycinat",
          "Citrat",
          "Oxid?"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-06-aoede.wav",
        "audioSeconds": 17.451,
        "start": 2839,
        "duration": 537
      },
      {
        "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Schlaf-Mythos",
        "title": "Hilft nicht jedem automatisch",
        "subtitle": "Magnesium kann unterstützen, ersetzt aber keine Schlafroutine.",
        "mode": "evidence",
        "accent": "mint",
        "bullets": [
          "Stress",
          "Schlaf",
          "begrenzte Daten"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-07-aoede.wav",
        "audioSeconds": 18.171,
        "start": 3376,
        "duration": 557
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
        "eyebrow": "Dosis",
        "title": "Verträglich statt maximal",
        "subtitle": "Bei Supplementen zählt elementares Magnesium und der Darm setzt oft die Grenze.",
        "mode": "dose",
        "accent": "mint",
        "bullets": [
          "Elementar",
          "Darm",
          "langsam"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-08-aoede.wav",
        "audioSeconds": 15.771,
        "start": 3933,
        "duration": 489
      },
      {
        "image": "pexels/fisetin-v1/08-research.jpg",
        "secondaryImage": "pexels/fisetin-v1/05-capsules.jpg",
        "eyebrow": "Sicherheit",
        "title": "Abstand zu Medikamenten",
        "subtitle": "Magnesium kann bestimmte Medikamente schlechter aufnehmen lassen.",
        "mode": "safety",
        "accent": "mint",
        "bullets": [
          "Niere",
          "Medikamente",
          "Abstand"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-09-aoede.wav",
        "audioSeconds": 17.651,
        "start": 4422,
        "duration": 542
      },
      {
        "image": "pexels/spermidin-v1/08-breakfast.jpg",
        "secondaryImage": "pexels/q10-v1/01-mitochondria-lab.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Basismineral, kein Alleskönner",
        "subtitle": "Magnesium ist wichtig. Die beste Lösung ist Versorgung plus passende Form.",
        "mode": "summary",
        "accent": "mint",
        "bullets": [
          "Essen",
          "Form",
          "Verträglichkeit"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/magnesium/scene-10-aoede.wav",
        "audioSeconds": 18.011,
        "start": 4964,
        "duration": 575
      }
    ],
    "id": "magnesium",
    "slug": "magnesium-nerven-muskeln-schlaf",
    "compositionId": "MagnesiumEvidenceDeepDive",
    "title": "Magnesium einfach erklärt: Muskeln, Nerven, Schlaf und welche Form sinnvoll ist",
    "durationInFrames": 5539,
    "voicePlaybackRate": 0.88
  },
  "vitamin-d3-k2": {
    "accent": "gold",
    "icon": "D3",
    "formula": "D3 + K2",
    "moleculeTitle": "Vitamin D3 + K2",
    "moleculeSubtitle": "Kalzium-System",
    "problem": "Hochdosis-Hype",
    "solution": "Wert messen",
    "foodLabels": [
      "Sonne",
      "Fisch",
      "Eier",
      "Natto",
      "Grünzeug"
    ],
    "safetyRows": [
      "Blutverdünner?",
      "Niere?",
      "Calcium hoch?",
      "Megadosis?"
    ],
    "sources": [
      {
        "label": "NIH D",
        "year": "2026",
        "finding": "Vitamin D steuert Kalziumaufnahme und Statusfragen."
      },
      {
        "label": "NIH K",
        "year": "2026",
        "finding": "Vitamin K ist wichtig für Gerinnung und Knochenproteine."
      },
      {
        "label": "VITAL",
        "year": "2019",
        "finding": "Keine pauschale Krebs- oder Herzprävention."
      },
      {
        "label": "Frakturen",
        "year": "2022",
        "finding": "Keine pauschale Frakturprävention in nicht ausgewählten Erwachsenen."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Vitamin D3 + K2 einfach erklärt",
        "subtitle": "Sonne, Knochen, Immunsystem: wichtig, aber nicht grenzenlos.",
        "mode": "problemSolution",
        "accent": "gold",
        "bullets": [
          "Sonne",
          "Problem: Megadosen",
          "Lösung: messen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-01-aoede.wav",
        "audioSeconds": 17.611,
        "start": 0,
        "duration": 541
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "eyebrow": "Vitamin D normal",
        "title": "Der Sonnen-Baustein",
        "subtitle": "Vitamin D hilft dem Körper, Kalzium aufzunehmen und Knochen zu versorgen.",
        "mode": "molecule",
        "accent": "gold",
        "bullets": [
          "D3",
          "Kalzium",
          "Knochen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-02-aoede.wav",
        "audioSeconds": 15.131,
        "start": 541,
        "duration": 470
      },
      {
        "image": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "K2 normal",
        "title": "Der Protein-Aktivierer",
        "subtitle": "Vitamin K hilft bestimmten Proteinen, etwa für Gerinnung und Knochenstoffwechsel.",
        "mode": "process",
        "accent": "gold",
        "bullets": [
          "K2",
          "Proteine",
          "Knochen"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-03-aoede.wav",
        "audioSeconds": 18.571,
        "start": 1011,
        "duration": 569
      },
      {
        "image": "pexels/fisetin-v1/03-microscope.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kalzium-Mythos",
        "title": "Nicht einfach: D rein, K lenkt",
        "subtitle": "K2 macht hohe Vitamin-D-Dosen nicht automatisch sicher.",
        "mode": "compare",
        "accent": "gold",
        "bullets": [
          "Kalzium",
          "Gefäße",
          "Kontext"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-04-aoede.wav",
        "audioSeconds": 19.211,
        "start": 1580,
        "duration": 587
      },
      {
        "image": "pexels/fisetin-v1/08-research.jpg",
        "secondaryImage": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "eyebrow": "Laborwert",
        "title": "25-OH-D ist der Marker",
        "subtitle": "Der Blutwert hilft, Mangel, Versorgung und Überdosierung besser einzuordnen.",
        "mode": "timeline",
        "accent": "gold",
        "bullets": [
          "messen",
          "einordnen",
          "anpassen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-05-aoede.wav",
        "audioSeconds": 19.171,
        "start": 2167,
        "duration": 586
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "eyebrow": "Studienlage",
        "title": "Nicht jede Krankheit verhindern",
        "subtitle": "Große Studien fanden keine pauschale Prävention für alle.",
        "mode": "evidence",
        "accent": "gold",
        "bullets": [
          "Knochen",
          "Herz",
          "Krebs"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-06-aoede.wav",
        "audioSeconds": 17.651,
        "start": 2753,
        "duration": 542
      },
      {
        "image": "pexels/spermidin-v1/08-breakfast.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Food & Sonne",
        "title": "Basis vor Kapsel",
        "subtitle": "Sonne, Fisch, Eier und Ernährung zählen. K2 steckt auch in fermentierten Lebensmitteln.",
        "mode": "foods",
        "accent": "gold",
        "bullets": [
          "Sonne",
          "Fisch",
          "Natto"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-07-aoede.wav",
        "audioSeconds": 17.491,
        "start": 3295,
        "duration": 538
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "Dosis",
        "title": "Hoch ist nicht automatisch klug",
        "subtitle": "Zu viel Vitamin D kann Kalzium im Blut erhöhen und Probleme machen.",
        "mode": "dose",
        "accent": "gold",
        "bullets": [
          "IU",
          "Wert",
          "Kontrolle"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-08-aoede.wav",
        "audioSeconds": 17.771,
        "start": 3833,
        "duration": 546
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/fisetin-v1/03-microscope.jpg",
        "eyebrow": "Sicherheit",
        "title": "Achtung bei Blutverdünnern",
        "subtitle": "Vitamin K ist bei Warfarin und ähnlichen Medikamenten besonders relevant.",
        "mode": "safety",
        "accent": "gold",
        "bullets": [
          "Warfarin",
          "Niere",
          "Calcium"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-09-aoede.wav",
        "audioSeconds": 18.091,
        "start": 4379,
        "duration": 555
      },
      {
        "image": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Messen statt raten",
        "subtitle": "D3 + K2 kann sinnvoll sein. Aber der Kontext entscheidet.",
        "mode": "summary",
        "accent": "gold",
        "bullets": [
          "messen",
          "nicht übertreiben",
          "Kontext"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/vitamin-d3-k2/scene-10-aoede.wav",
        "audioSeconds": 18.131,
        "start": 4934,
        "duration": 579
      }
    ],
    "id": "vitamin-d3-k2",
    "slug": "vitamin-d3-k2-sonne-knochen-immunsystem",
    "compositionId": "VitaminD3K2EvidenceDeepDive",
    "title": "Vitamin D3 + K2 einfach erklärt: Sonne, Knochen, Immunsystem und der Kalzium-Mythos",
    "durationInFrames": 5513,
    "voicePlaybackRate": 0.88
  },
  "omega-3": {
    "accent": "blue",
    "icon": "Ω3",
    "formula": "EPA + DHA",
    "moleculeTitle": "Omega-3",
    "moleculeSubtitle": "Fettsäuren",
    "problem": "Fischöl-Hype",
    "solution": "EPA/DHA prüfen",
    "foodLabels": [
      "Lachs",
      "Sardinen",
      "Hering",
      "Algenöl",
      "Walnüsse"
    ],
    "safetyRows": [
      "Blutverdünner?",
      "Vorhofflimmern?",
      "OP?",
      "Allergie?"
    ],
    "sources": [
      {
        "label": "NIH ODS",
        "year": "2026",
        "finding": "EPA und DHA aus Fisch oder Algen sind die zentralen Formen."
      },
      {
        "label": "REDUCE-IT",
        "year": "2019",
        "finding": "Hochdosiertes EPA half in spezieller Hochrisikogruppe."
      },
      {
        "label": "STRENGTH",
        "year": "2020",
        "finding": "EPA/DHA-Mix zeigte keinen Vorteil in Hochrisikostudie."
      },
      {
        "label": "VITAL",
        "year": "2019",
        "finding": "Keine pauschale Primärprävention für alle."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/fisetin-v1/08-research.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Omega-3 einfach erklärt",
        "subtitle": "EPA und DHA sind wichtig. Aber Fischöl ist kein Pauschalschutz.",
        "mode": "problemSolution",
        "accent": "blue",
        "bullets": [
          "EPA",
          "DHA",
          "Kontext"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-01-aoede.wav",
        "audioSeconds": 18.091,
        "start": 0,
        "duration": 555
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Was ist es?",
        "title": "Baustoff für Zellhüllen",
        "subtitle": "EPA und DHA sitzen in Zellmembranen. DHA ist besonders wichtig für Gehirn und Netzhaut.",
        "mode": "molecule",
        "accent": "blue",
        "bullets": [
          "EPA",
          "DHA",
          "Membran"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-02-aoede.wav",
        "audioSeconds": 18.451,
        "start": 555,
        "duration": 565
      },
      {
        "image": "pexels/fisetin-v1/06-polyphenol-foods.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "ALA vs EPA/DHA",
        "title": "Leinöl ist nicht dasselbe",
        "subtitle": "Pflanzliches ALA wird nur begrenzt zu EPA und DHA umgewandelt.",
        "mode": "compare",
        "accent": "blue",
        "bullets": [
          "ALA",
          "EPA",
          "DHA"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-03-aoede.wav",
        "audioSeconds": 17.611,
        "start": 1120,
        "duration": 541
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/spermidin-v1/08-breakfast.jpg",
        "eyebrow": "Food first",
        "title": "Fetter Fisch oder Algenöl",
        "subtitle": "Lachs, Sardinen, Hering und Algenöl liefern EPA und DHA direkt.",
        "mode": "foods",
        "accent": "blue",
        "bullets": [
          "Lachs",
          "Sardinen",
          "Algenöl"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-04-aoede.wav",
        "audioSeconds": 17.651,
        "start": 1661,
        "duration": 542
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/fisetin-v1/03-microscope.jpg",
        "eyebrow": "Herzstudien",
        "title": "Warum Ergebnisse gemischt sind",
        "subtitle": "REDUCE-IT war ein Medikamenten-Setting. STRENGTH und VITAL waren anders.",
        "mode": "evidence",
        "accent": "blue",
        "bullets": [
          "REDUCE-IT",
          "STRENGTH",
          "VITAL"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-05-aoede.wav",
        "audioSeconds": 17.931,
        "start": 2203,
        "duration": 550
      },
      {
        "image": "pexels/fisetin-v1/08-research.jpg",
        "secondaryImage": "pexels/q10-v1/04-heart-health.jpg",
        "eyebrow": "Triglyceride",
        "title": "Blutfette sind ein Spezialfall",
        "subtitle": "Hohe EPA/DHA-Dosen können Triglyceride senken, gehören aber fachlich begleitet.",
        "mode": "process",
        "accent": "blue",
        "bullets": [
          "Blutfette",
          "Dosis",
          "Arzt"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-06-aoede.wav",
        "audioSeconds": 18.291,
        "start": 2753,
        "duration": 561
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Qualität",
        "title": "Frisch statt ranzig",
        "subtitle": "Oxidiertes Öl ist ein Qualitätsproblem. Geruch, Lagerung und Analyse zählen.",
        "mode": "quality",
        "accent": "blue",
        "bullets": [
          "EPA/DHA",
          "Oxidation",
          "TOTOX"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-07-aoede.wav",
        "audioSeconds": 18.251,
        "start": 3314,
        "duration": 559
      },
      {
        "image": "pexels/fisetin-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/04-heart-health.jpg",
        "eyebrow": "Dosis",
        "title": "Mehr ist nicht automatisch besser",
        "subtitle": "Hohe Dosen können Vorhofflimmern oder Blutungsfragen relevanter machen.",
        "mode": "dose",
        "accent": "blue",
        "bullets": [
          "mg EPA/DHA",
          "Ziel",
          "Risiko"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-08-aoede.wav",
        "audioSeconds": 18.211,
        "start": 3873,
        "duration": 558
      },
      {
        "image": "pexels/q10-v1/04-heart-health.jpg",
        "secondaryImage": "pexels/fisetin-v1/05-capsules.jpg",
        "eyebrow": "Sicherheit",
        "title": "Blutverdünner und Rhythmus beachten",
        "subtitle": "Bei Medikamenten, OPs oder Herzrhythmusstörungen vorher nachfragen.",
        "mode": "safety",
        "accent": "blue",
        "bullets": [
          "Blutverdünner",
          "Rhythmus",
          "OP"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-09-aoede.wav",
        "audioSeconds": 17.251,
        "start": 4431,
        "duration": 531
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/fisetin-v1/04-healthy-aging.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Guter Baustein, kein Pauschalschutz",
        "subtitle": "Omega-3 ist sinnvoll, wenn Quelle, Menge, Qualität und Ziel stimmen.",
        "mode": "summary",
        "accent": "blue",
        "bullets": [
          "Quelle",
          "Menge",
          "Qualität"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-batch-normalos/omega-3/scene-10-aoede.wav",
        "audioSeconds": 20.731,
        "start": 4962,
        "duration": 653
      }
    ],
    "id": "omega-3",
    "slug": "omega-3-epa-dha-herz-gehirn",
    "compositionId": "Omega3EvidenceDeepDive",
    "title": "Omega-3 einfach erklärt: EPA, DHA, Gehirn, Herz und warum Fischöl nicht gleich Fischöl ist",
    "durationInFrames": 5615,
    "voicePlaybackRate": 0.88
  }
} as const;

export const q10DeepDiveDurationInFrames = callidusBatchTopics["coenzym-q10"].durationInFrames;
export const nmnDeepDiveDurationInFrames = callidusBatchTopics["nmn"].durationInFrames;
export const magnesiumDeepDiveDurationInFrames = callidusBatchTopics["magnesium"].durationInFrames;
export const vitaminD3K2DeepDiveDurationInFrames = callidusBatchTopics["vitamin-d3-k2"].durationInFrames;
export const omega3DeepDiveDurationInFrames = callidusBatchTopics["omega-3"].durationInFrames;
