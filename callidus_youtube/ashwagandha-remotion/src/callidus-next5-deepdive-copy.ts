export const callidusNext5VoicePlaybackRate = 1;

export const callidusNext5TopicIds = [
  "zink",
  "vitamin-c",
  "vitamin-b-komplex",
  "ashwagandha",
  "reishi"
] as const;

export const callidusNext5Topics = {
  "zink": {
    "accent": "mint",
    "icon": "Zn",
    "formula": "Spurenelement",
    "moleculeTitle": "Zink",
    "moleculeSubtitle": "kleiner Mineral-Helfer",
    "problem": "Immunsystem-Hype",
    "solution": "Mangel prüfen",
    "foodLabels": [
      "Kerne",
      "Fleisch",
      "Linsen",
      "Käse",
      "Hafer"
    ],
    "safetyRows": [
      "Kupfer im Blick",
      "Antibiotika-Abstand",
      "Eisen/Calcium trennen",
      "Nase nicht sprühen"
    ],
    "sources": [
      {
        "label": "NIH ODS",
        "year": "2025",
        "finding": "Zink ist für Enzyme, Immunfunktion, Wundheilung und Geschmack wichtig."
      },
      {
        "label": "Cochrane",
        "year": "2024",
        "finding": "Bei Erkältung kann Zink die Dauer etwas verkürzen, Evidenz aber niedrig."
      },
      {
        "label": "BMJ Open",
        "year": "2021",
        "finding": "Zink zeigte gemischte Effekte und häufiger milde Nebenwirkungen."
      },
      {
        "label": "NIH Safety",
        "year": "2025",
        "finding": "Zu viel Zink kann Kupfermangel und Wechselwirkungen begünstigen."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Zink einfach erklärt",
        "subtitle": "Ein winziger Mineralstoff mit vielen Aufgaben, aber kein Dauer-Booster.",
        "mode": "problemSolution",
        "bullets": [
          "Spurenelement",
          "Problem: Hype",
          "Lösung: Mangel prüfen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/zink/scene-01-aoede.wav",
        "audioSeconds": 22.411,
        "start": 0,
        "duration": 703
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Was ist es?",
        "title": "Ein Werkzeug für Enzyme",
        "subtitle": "Enzyme sind kleine Arbeitsmaschinen im Körper. Zink steckt in vielen davon.",
        "mode": "molecule",
        "bullets": [
          "Enzyme",
          "Zellen",
          "Immunsystem"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/zink/scene-02-aoede.wav",
        "audioSeconds": 21.611,
        "start": 703,
        "duration": 679
      },
      {
        "image": "pexels/q10-v1/08-workout-recovery.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "Reparieren, schützen, schmecken",
        "subtitle": "Zink hilft bei Eiweißaufbau, Wundheilung, Abwehr und dem Geschmacks- und Geruchssinn.",
        "mode": "process",
        "bullets": [
          "Aufbauen",
          "Reparieren",
          "Abwehr"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/zink/scene-03-aoede.wav",
        "audioSeconds": 18.851,
        "start": 1382,
        "duration": 596
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/acacia-v2/01-15120889.jpg",
        "eyebrow": "Lebensmittel",
        "title": "Nicht nur Kapseln",
        "subtitle": "Kerne, Hülsenfrüchte, Hafer, Käse, Fleisch und Meeresfrüchte können Zink liefern.",
        "mode": "foods",
        "bullets": [
          "Essen zuerst",
          "regelmäßig",
          "verträglich"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/zink/scene-04-aoede.wav",
        "audioSeconds": 18.731,
        "start": 1978,
        "duration": 592
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Erkältung",
        "title": "Lutschtablette ist nicht Tablette",
        "subtitle": "Bei Erkältungen geht es meist um Zink im Mund- und Rachenraum, nicht um jede beliebige Kapsel.",
        "mode": "evidence",
        "bullets": [
          "früh",
          "Lutschtablette",
          "niedrige Sicherheit"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/zink/scene-05-aoede.wav",
        "audioSeconds": 17.611,
        "start": 2570,
        "duration": 559
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Mythencheck",
        "title": "Mehr Zink ist nicht mehr Abwehr",
        "subtitle": "Wenn kein Mangel vorliegt, wird aus hoher Dosis nicht automatisch ein stärkeres Immunsystem.",
        "mode": "compare",
        "bullets": [
          "nicht täglich hoch",
          "nicht blind",
          "Status + Ernährung"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/zink/scene-06-aoede.wav",
        "audioSeconds": 18.891,
        "start": 3129,
        "duration": 597
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Dosis",
        "title": "Kurzfristig ist anders als dauerhaft",
        "subtitle": "Akut, Mangel und Langzeit-Einnahme sind drei verschiedene Situationen.",
        "mode": "dose",
        "bullets": [
          "kurz",
          "langsam",
          "prüfen"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/zink/scene-07-aoede.wav",
        "audioSeconds": 17.251,
        "start": 3726,
        "duration": 548
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Sicherheit",
        "title": "Kupfer nicht vergessen",
        "subtitle": "Dauerhaft viel Zink kann Kupfer verdrängen. Auch Medikamente brauchen Abstand.",
        "mode": "safety",
        "bullets": [
          "Kupfer",
          "Abstand",
          "nicht nasal"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/zink/scene-08-aoede.wav",
        "audioSeconds": 17.411,
        "start": 4274,
        "duration": 553
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Problem / Lösung",
        "title": "Erst Bedarf, dann Produkt",
        "subtitle": "Die bessere Frage ist nicht: wie viel maximal? Sondern: fehlt mir Zink überhaupt?",
        "mode": "quality",
        "bullets": [
          "Bedarf",
          "Form",
          "Qualität"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/zink/scene-09-aoede.wav",
        "audioSeconds": 17.211,
        "start": 4827,
        "duration": 547
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Wichtig, aber nicht blind",
        "subtitle": "Zink ist echte Basisbiologie. Sinnvoll wird es mit Maß, Anlass und Sicherheitsblick.",
        "mode": "summary",
        "bullets": [
          "essen",
          "prüfen",
          "nicht übertreiben"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/zink/scene-10-aoede.wav",
        "audioSeconds": 20.011,
        "start": 5374,
        "duration": 661
      }
    ],
    "id": "zink",
    "slug": "zink-normalos-video",
    "compositionId": "ZinkEvidenceDeepDive",
    "title": "Zink einfach erklärt: Immunsystem, Wundheilung und warum mehr nicht besser ist",
    "durationInFrames": 6035
  },
  "vitamin-c": {
    "accent": "gold",
    "icon": "C",
    "formula": "C6H8O6",
    "moleculeTitle": "Vitamin C",
    "moleculeSubtitle": "wasserlöslicher Helfer",
    "problem": "C-Hype",
    "solution": "regelmäßig essen",
    "foodLabels": [
      "Paprika",
      "Kiwi",
      "Zitrus",
      "Brokkoli",
      "Beeren"
    ],
    "safetyRows": [
      "Magen/Darm?",
      "Nierensteine?",
      "Eisen hoch?",
      "Megadosen meiden"
    ],
    "sources": [
      {
        "label": "NIH ODS",
        "year": "2025",
        "finding": "Vitamin C hilft bei Kollagen, Antioxidantien, Immunfunktion und Eisenaufnahme."
      },
      {
        "label": "Cochrane",
        "year": "2013",
        "finding": "Routine-C verhindert Erkältungen meist nicht, kann Dauer leicht verkürzen."
      },
      {
        "label": "NIH Dosis",
        "year": "2025",
        "finding": "Ab hohen oralen Dosen sinkt die Aufnahme; Überschuss wird ausgeschieden."
      },
      {
        "label": "NIH Safety",
        "year": "2025",
        "finding": "Hohe Dosen können Durchfall, Übelkeit und Bauchkrämpfe auslösen."
      }
    ],
    "scenes": [
      {
        "image": "pexels/acacia-v2/01-15120889.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Vitamin C einfach erklärt",
        "subtitle": "Wichtig für Gewebe und Abwehr, aber kein Erkältungs-Schutzschild.",
        "mode": "problemSolution",
        "bullets": [
          "Kollagen",
          "Problem: Mythos",
          "Lösung: regelmäßig"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-01-aoede.wav",
        "audioSeconds": 22.291,
        "start": 0,
        "duration": 699
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/acacia-v2/02-7110136.jpg",
        "eyebrow": "Was ist es?",
        "title": "Wasserlöslich heißt: Nachschub",
        "subtitle": "Vitamin C wird nicht wie Fett gespeichert. Der Körper hält es aktiv im Gleichgewicht.",
        "mode": "molecule",
        "bullets": [
          "wasserlöslich",
          "Nachschub",
          "Balance"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-02-aoede.wav",
        "audioSeconds": 17.091,
        "start": 699,
        "duration": 543
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "Kollagen = Körper-Kleber",
        "subtitle": "Kollagen stabilisiert Haut, Gefäße, Zahnfleisch, Bindegewebe und Wundheilung.",
        "mode": "process",
        "bullets": [
          "Haut",
          "Gefäße",
          "Wunden"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-03-aoede.wav",
        "audioSeconds": 15.731,
        "start": 1242,
        "duration": 502
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/acacia-v2/03-22696128.jpg",
        "eyebrow": "Lebensmittel",
        "title": "Bunt schlägt Megadosis",
        "subtitle": "Paprika, Kiwi, Beeren, Zitrusfrüchte, Kohl und Brokkoli liefern Vitamin C alltagstauglich.",
        "mode": "foods",
        "bullets": [
          "bunt",
          "frisch",
          "regelmäßig"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-04-aoede.wav",
        "audioSeconds": 19.571,
        "start": 1744,
        "duration": 618
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Erkältung",
        "title": "Nicht wie ein Schutzschild",
        "subtitle": "Regelmäßiges Vitamin C verhindert Erkältungen bei den meisten Menschen nicht zuverlässig.",
        "mode": "evidence",
        "bullets": [
          "nicht verhindern",
          "etwas kürzer",
          "nicht erst starten"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-05-aoede.wav",
        "audioSeconds": 17.731,
        "start": 2362,
        "duration": 562
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Mythencheck",
        "title": "Nach Beginn oft zu spät",
        "subtitle": "Erst bei Symptomen sehr viel Vitamin C zu nehmen, zeigt in Reviews keinen klaren Effekt.",
        "mode": "compare",
        "bullets": [
          "nicht akut zaubern",
          "nicht unbegrenzt",
          "regelmäßig besser"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-06-aoede.wav",
        "audioSeconds": 16.251,
        "start": 2924,
        "duration": 518
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Aufnahme",
        "title": "Mehr rein heißt nicht mehr drin",
        "subtitle": "Bei sehr hohen oralen Mengen nimmt der Körper anteilig weniger auf und scheidet mehr aus.",
        "mode": "dose",
        "bullets": [
          "Sättigung",
          "Ausscheidung",
          "Magen"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-07-aoede.wav",
        "audioSeconds": 16.891,
        "start": 3442,
        "duration": 537
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Sicherheit",
        "title": "Der Darm meldet sich zuerst",
        "subtitle": "Zu viel kann Durchfall, Übelkeit und Bauchkrämpfe machen. Bei Nieren- oder Eisenproblemen vorsichtig sein.",
        "mode": "safety",
        "bullets": [
          "Durchfall",
          "Oxalat",
          "Eisen"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-08-aoede.wav",
        "audioSeconds": 19.451,
        "start": 3979,
        "duration": 614
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/acacia-v2/05-7936976.jpg",
        "eyebrow": "Problem / Lösung",
        "title": "Nicht Rettung, sondern Routine",
        "subtitle": "Vitamin C funktioniert im Alltag besser als tägliche bunte Basis statt als Panik-Kapsel.",
        "mode": "quality",
        "bullets": [
          "Routine",
          "Lebensmittel",
          "moderat"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-09-aoede.wav",
        "audioSeconds": 18.171,
        "start": 4593,
        "duration": 576
      },
      {
        "image": "pexels/acacia-v2/01-15120889.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Wichtig, aber nicht magisch",
        "subtitle": "Vitamin C ist Basis für Gewebe, Abwehr und Eisenaufnahme. Kein Freifahrtschein für Megadosen.",
        "mode": "summary",
        "bullets": [
          "essen",
          "verstehen",
          "nicht übertreiben"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-c/scene-10-aoede.wav",
        "audioSeconds": 18.851,
        "start": 5169,
        "duration": 626
      }
    ],
    "id": "vitamin-c",
    "slug": "vitamin-c-normalos-video",
    "compositionId": "VitaminCEvidenceDeepDive",
    "title": "Vitamin C einfach erklärt: Kollagen, Immunsystem und der Erkältungs-Mythos",
    "durationInFrames": 5795
  },
  "vitamin-b-komplex": {
    "accent": "blue",
    "icon": "B",
    "formula": "B1-B12",
    "moleculeTitle": "B-Komplex",
    "moleculeSubtitle": "acht Helferstoffe",
    "problem": "Energie-Hype",
    "solution": "gezielt statt hoch",
    "foodLabels": [
      "Vollkorn",
      "Eier",
      "Fisch",
      "Hülsen",
      "Grünzeug"
    ],
    "safetyRows": [
      "B6 nicht hoch stapeln",
      "B12-Risiko prüfen",
      "Folat + B12",
      "Medikamente beachten"
    ],
    "sources": [
      {
        "label": "NIH B6",
        "year": "2025",
        "finding": "B6 ist an über 100 Enzymreaktionen beteiligt, vor allem im Protein-Stoffwechsel."
      },
      {
        "label": "NIH B12",
        "year": "2025",
        "finding": "B12 ist wichtig für Nerven, rote Blutkörperchen und DNA-Synthese."
      },
      {
        "label": "Folate NIH",
        "year": "2025",
        "finding": "Sehr viel Folsäure kann B12-Probleme verdecken oder verschärfen."
      },
      {
        "label": "JAMA RCT",
        "year": "2008",
        "finding": "Homocystein sinkt, aber Herz-Kreislauf-Nutzen ist meist nicht klar."
      }
    ],
    "scenes": [
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/08-workout-recovery.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "B-Komplex einfach erklärt",
        "subtitle": "Acht Vitamine als Helfer, nicht als Koffein-Ersatz.",
        "mode": "problemSolution",
        "bullets": [
          "Nerven",
          "Problem: Energie-Mythos",
          "Lösung: gezielt"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-01-aoede.wav",
        "audioSeconds": 22.491,
        "start": 0,
        "duration": 705
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Was ist es?",
        "title": "Acht kleine Teamspieler",
        "subtitle": "B1, B2, B3, B5, B6, B7, B9 und B12 arbeiten an vielen Stoffwechselwegen mit.",
        "mode": "molecule",
        "bullets": [
          "B1-B12",
          "Coenzyme",
          "Stoffwechsel"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-02-aoede.wav",
        "audioSeconds": 23.251,
        "start": 705,
        "duration": 728
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "Sie machen keine Energie",
        "subtitle": "B-Vitamine helfen, Nahrung in nutzbare Prozesse zu verwandeln. Die Energie kommt aus Essen.",
        "mode": "cellEnergy",
        "bullets": [
          "Nahrung",
          "Helfer",
          "Zellakku"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-03-aoede.wav",
        "audioSeconds": 17.971,
        "start": 1433,
        "duration": 570
      },
      {
        "image": "pexels/q10-v1/06-fatty-meal.jpg",
        "secondaryImage": "pexels/acacia-v2/05-7936976.jpg",
        "eyebrow": "Lebensmittel",
        "title": "Breit essen hilft",
        "subtitle": "Vollkorn, Hülsenfrüchte, Eier, Fisch, Fleisch, Milchprodukte und Gemüse decken verschiedene B-Vitamine ab.",
        "mode": "foods",
        "bullets": [
          "vielfältig",
          "regelmäßig",
          "B12 extra prüfen"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-04-aoede.wav",
        "audioSeconds": 21.331,
        "start": 2003,
        "duration": 670
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "B12",
        "title": "Nerven brauchen B12",
        "subtitle": "B12 ist besonders wichtig für Nerven, Blutbildung und DNA. Vegan lebende Menschen haben mehr Risiko.",
        "mode": "evidence",
        "bullets": [
          "Nerven",
          "Blut",
          "vegan prüfen"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-05-aoede.wav",
        "audioSeconds": 19.451,
        "start": 2673,
        "duration": 614
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Homocystein",
        "title": "Marker ist nicht automatisch Ergebnis",
        "subtitle": "B6, B9 und B12 können Homocystein senken. Das heißt nicht automatisch weniger Herzinfarkte.",
        "mode": "compare",
        "bullets": [
          "Marker sinkt",
          "Nutzen unklar",
          "Kontext"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-06-aoede.wav",
        "audioSeconds": 18.931,
        "start": 3287,
        "duration": 598
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Aktive Formen",
        "title": "Aktiv heißt nicht immer nötig",
        "subtitle": "Methylfolat, Methyl-B12 oder P5P können sinnvoll sein, sind aber keine Garantie für bessere Wirkung.",
        "mode": "quality",
        "bullets": [
          "Form",
          "Dosis",
          "Verträglichkeit"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-07-aoede.wav",
        "audioSeconds": 20.251,
        "start": 3885,
        "duration": 638
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Sicherheit",
        "title": "B6 kann zu viel werden",
        "subtitle": "Wasserlöslich heißt nicht risikofrei. Hohe B6-Dosen können Nervenprobleme verursachen.",
        "mode": "safety",
        "bullets": [
          "B6",
          "Nerven",
          "nicht stapeln"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-08-aoede.wav",
        "audioSeconds": 18.571,
        "start": 4523,
        "duration": 588
      },
      {
        "image": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Problem / Lösung",
        "title": "Nicht alles auf einmal hoch",
        "subtitle": "Besser: Risiko, Ernährung, Blutwerte und Medikamente anschauen, dann gezielt ergänzen.",
        "mode": "dose",
        "bullets": [
          "Risiko",
          "Werte",
          "gezielt"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-09-aoede.wav",
        "audioSeconds": 18.891,
        "start": 5111,
        "duration": 597
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Helfer, keine Turbopille",
        "subtitle": "B-Vitamine sind wichtig. Aber die beste Anwendung ist gezielt, niedrig genug und passend zur Person.",
        "mode": "summary",
        "bullets": [
          "verstehen",
          "prüfen",
          "nicht übertreiben"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/vitamin-b-komplex/scene-10-aoede.wav",
        "audioSeconds": 17.451,
        "start": 5708,
        "duration": 584
      }
    ],
    "id": "vitamin-b-komplex",
    "slug": "vitamin-b-komplex-normalos-video",
    "compositionId": "VitaminBKomplexEvidenceDeepDive",
    "title": "Vitamin-B-Komplex einfach erklärt: Energie, Nerven und warum aktiv nicht automatisch besser heißt",
    "durationInFrames": 6292
  },
  "ashwagandha": {
    "accent": "coral",
    "icon": "Ws",
    "formula": "Withania somnifera",
    "moleculeTitle": "Ashwagandha",
    "moleculeSubtitle": "Wurzelextrakt",
    "problem": "Stress-Hype",
    "solution": "kurz & geprüft",
    "foodLabels": [
      "Wurzel",
      "Extrakt",
      "KSM-66",
      "Sensoril",
      "Shoden"
    ],
    "safetyRows": [
      "Schwangerschaft meiden",
      "Schilddrüse?",
      "Leberzeichen?",
      "Sedativa/Immunsystem"
    ],
    "sources": [
      {
        "label": "NIH ODS",
        "year": "2025",
        "finding": "Mehrere kleine RCTs zeigen Stress- und Schlafsignale, aber Langzeitdaten fehlen."
      },
      {
        "label": "Sleep Review",
        "year": "2021",
        "finding": "Schlafnutzen war klein bis moderat und stärker bei Insomnie."
      },
      {
        "label": "Stress Review",
        "year": "2021",
        "finding": "Studien deuten auf weniger wahrgenommenen Stress und Cortisol hin."
      },
      {
        "label": "NIH Safety",
        "year": "2025",
        "finding": "Mögliche Leber-, Schilddrüsen- und Medikamententhemen beachten."
      }
    ],
    "scenes": [
      {
        "image": "pexels/ashwagandha-v2/01-17820710.jpg",
        "secondaryImage": "pexels/ashwagandha-v2/02-13014205.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Ashwagandha einfach erklärt",
        "subtitle": "Eine Wurzel für Stress-Forschung, aber kein harmloser Ruhe-Schalter.",
        "mode": "problemSolution",
        "bullets": [
          "Stress",
          "Problem: Hype",
          "Lösung: Grenzen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-01-aoede.wav",
        "audioSeconds": 19.131,
        "start": 0,
        "duration": 604
      },
      {
        "image": "pexels/ashwagandha-v2/03-9928286.jpg",
        "secondaryImage": "pexels/ashwagandha-v2/01-17820710.jpg",
        "eyebrow": "Was ist es?",
        "title": "Eine ayurvedische Wurzel",
        "subtitle": "Ashwagandha heißt botanisch Withania somnifera und wird meist als Extrakt genutzt.",
        "mode": "molecule",
        "bullets": [
          "Wurzel",
          "Withanolide",
          "Extrakt"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-02-aoede.wav",
        "audioSeconds": 19.171,
        "start": 604,
        "duration": 606
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/ashwagandha-v2/04-19177909.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "Adaptogen heißt nicht Beruhigungsmittel",
        "subtitle": "Die Idee: Stressantwort unterstützen. Das ist etwas anderes als Menschen einfach müde zu machen.",
        "mode": "process",
        "bullets": [
          "Stressachse",
          "Cortisol",
          "Balance"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-03-aoede.wav",
        "audioSeconds": 18.011,
        "start": 1210,
        "duration": 571
      },
      {
        "image": "pexels/ashwagandha-v2/05-6541080.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Formen",
        "title": "Extrakt ist nicht gleich Pulver",
        "subtitle": "Studien nutzen bestimmte Extrakte und Dosen. Ein beliebiges Produkt ist nicht automatisch gleichwertig.",
        "mode": "quality",
        "bullets": [
          "Extrakt",
          "standardisiert",
          "deklariert"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-04-aoede.wav",
        "audioSeconds": 20.251,
        "start": 1781,
        "duration": 638
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/ashwagandha-v2/06-17820718.jpg",
        "eyebrow": "Stress",
        "title": "Interessant, aber klein",
        "subtitle": "Studien zeigen Signale bei wahrgenommenem Stress, Angst und Cortisol. Trotzdem sind viele Studien kurz und klein.",
        "mode": "evidence",
        "bullets": [
          "Stress-Skalen",
          "Cortisol",
          "kurze Studien"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-05-aoede.wav",
        "audioSeconds": 20.051,
        "start": 2419,
        "duration": 632
      },
      {
        "image": "pexels/ashwagandha-v2/04-19177909.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Schlaf",
        "title": "Schlafhilfe, nicht Knock-out",
        "subtitle": "Bei Schlaf zeigen Reviews kleine bis moderate Effekte, besonders bei Menschen mit Schlafproblemen.",
        "mode": "timeline",
        "bullets": [
          "6-12 Wochen",
          "besser bei Insomnie",
          "kein Betäubungsmittel"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-06-aoede.wav",
        "audioSeconds": 17.931,
        "start": 3051,
        "duration": 568
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/ashwagandha-v2/03-9928286.jpg",
        "eyebrow": "Mythencheck",
        "title": "Natürlich heißt nicht risikofrei",
        "subtitle": "Ashwagandha kann müde machen, den Magen reizen und ist nicht für jede Lebenslage geeignet.",
        "mode": "compare",
        "bullets": [
          "nicht für alle",
          "nicht dauerhaft blind",
          "Risiko prüfen"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-07-aoede.wav",
        "audioSeconds": 15.811,
        "start": 3619,
        "duration": 505
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Sicherheit",
        "title": "Leber und Schilddrüse beachten",
        "subtitle": "Berichte zu Leberproblemen und Schilddrüsen-Effekten machen klare Grenzen wichtig.",
        "mode": "safety",
        "bullets": [
          "Leber",
          "Schilddrüse",
          "Schwangerschaft"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-08-aoede.wav",
        "audioSeconds": 18.451,
        "start": 4124,
        "duration": 584
      },
      {
        "image": "pexels/ashwagandha-v2/06-17820718.jpg",
        "secondaryImage": "pexels/q10-v1/03-healthy-aging-energy.jpg",
        "eyebrow": "Problem / Lösung",
        "title": "Nicht Stress überdecken",
        "subtitle": "Die Lösung ist nicht nur Kapsel nehmen, sondern Stressursache, Schlafrhythmus und Sicherheit mitdenken.",
        "mode": "dose",
        "bullets": [
          "kurz testen",
          "sauber wählen",
          "Stoppsignal"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-09-aoede.wav",
        "audioSeconds": 18.651,
        "start": 4708,
        "duration": 590
      },
      {
        "image": "pexels/ashwagandha-v2/01-17820710.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Spannend, aber mit Respekt",
        "subtitle": "Ashwagandha kann passen, wenn Ziel, Produkt und Risiken klar sind. Es ist kein Lifestyle-Bonbon.",
        "mode": "summary",
        "bullets": [
          "Stress",
          "Schlaf",
          "Sicherheit"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/ashwagandha/scene-10-aoede.wav",
        "audioSeconds": 17.571,
        "start": 5298,
        "duration": 588
      }
    ],
    "id": "ashwagandha",
    "slug": "ashwagandha-normalos-video",
    "compositionId": "AshwagandhaEvidenceDeepDive",
    "title": "Ashwagandha einfach erklärt: Stress, Schlaf und warum natürlich nicht automatisch harmlos ist",
    "durationInFrames": 5886
  },
  "reishi": {
    "accent": "coral",
    "icon": "Reishi",
    "formula": "Ganoderma",
    "moleculeTitle": "Reishi",
    "moleculeSubtitle": "Vitalpilz",
    "problem": "Reishi-Hype",
    "solution": "Evidenz prüfen",
    "foodLabels": [
      "Fruchtkörper",
      "Extrakt",
      "Beta-Glucane",
      "Triterpene",
      "Qualität"
    ],
    "safetyRows": [
      "Blutverdünner?",
      "Immunsuppression?",
      "Leberzeichen?",
      "OP geplant?"
    ],
    "sources": [
      {
        "label": "NCI PDQ",
        "year": "2024",
        "finding": "Reishi wird traditionell genutzt; Produkte sind nicht als Krebsbehandlung zugelassen."
      },
      {
        "label": "MSK",
        "year": "2025",
        "finding": "Beta-Glucane und Triterpene sind zentrale Inhaltsstoffgruppen."
      },
      {
        "label": "Cochrane",
        "year": "2015",
        "finding": "RCTs stützen Reishi nicht für kardiovaskuläre Risikofaktoren bei Typ-2-Diabetes."
      },
      {
        "label": "MSK Safety",
        "year": "2025",
        "finding": "Mögliche Nebenwirkungen und Interaktionen mit Blutverdünnern beachten."
      }
    ],
    "scenes": [
      {
        "image": "pexels/acacia-v2/04-4736077.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Gesundheits-Wissen",
        "title": "Reishi einfach erklärt",
        "subtitle": "Ein traditioneller Pilz mit spannender Biologie, aber kein Unsterblichkeits-Trick.",
        "mode": "problemSolution",
        "bullets": [
          "Vitalpilz",
          "Problem: Mythos",
          "Lösung: prüfen"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/reishi/scene-01-aoede.wav",
        "audioSeconds": 18.451,
        "start": 0,
        "duration": 584
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/acacia-v2/06-5078586.jpg",
        "eyebrow": "Was ist es?",
        "title": "Ling Zhi, Ganoderma, Reishi",
        "subtitle": "Reishi ist ein holziger Pilz. In Produkten stecken Extrakte, Pulver oder Sporen.",
        "mode": "molecule",
        "bullets": [
          "Pilz",
          "Extrakt",
          "Tradition"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/reishi/scene-02-aoede.wav",
        "audioSeconds": 16.731,
        "start": 584,
        "duration": 532
      },
      {
        "image": "pexels/q10-v1/02-cell-science.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Einfach übersetzt",
        "title": "Immunmodulation statt Booster",
        "subtitle": "Das Immunsystem ist kein Lautstärke-Regler. Reishi wird eher als Modulator untersucht.",
        "mode": "process",
        "bullets": [
          "Beta-Glucane",
          "Signale",
          "Balance"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/reishi/scene-03-aoede.wav",
        "audioSeconds": 19.411,
        "start": 1116,
        "duration": 613
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/acacia-v2/05-7936976.jpg",
        "eyebrow": "Qualität",
        "title": "Fruchtkörper, Myzel, Extrakt",
        "subtitle": "Produkte unterscheiden sich stark. Name, Pilzteil und Extraktionsart sind wichtig.",
        "mode": "quality",
        "bullets": [
          "Teil",
          "Extraktion",
          "Prüfung"
        ],
        "sourceIndex": 1,
        "audio": "audio/callidus-next5-normalos/reishi/scene-04-aoede.wav",
        "audioSeconds": 20.011,
        "start": 1729,
        "duration": 631
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/02-cell-science.jpg",
        "eyebrow": "Studienlage",
        "title": "Labor ist nicht Alltag",
        "subtitle": "Viele Daten sind Labor, Tiermodell oder kleine Humanstudien. Daraus wird kein Heilversprechen.",
        "mode": "evidence",
        "bullets": [
          "präklinisch",
          "klein",
          "vorsichtig"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/reishi/scene-05-aoede.wav",
        "audioSeconds": 19.491,
        "start": 2360,
        "duration": 615
      },
      {
        "image": "pexels/q10-v1/07-research.jpg",
        "secondaryImage": "pexels/q10-v1/05-capsules.jpg",
        "eyebrow": "Herz & Stoffwechsel",
        "title": "Kein klarer Beleg",
        "subtitle": "Ein Cochrane Review fand keine Unterstützung für Reishi bei kardiovaskulären Risikofaktoren.",
        "mode": "compare",
        "bullets": [
          "kein klarer Nutzen",
          "kleine Studien",
          "mehr Forschung"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/reishi/scene-06-aoede.wav",
        "audioSeconds": 17.051,
        "start": 2975,
        "duration": 542
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/acacia-v2/06-5078586.jpg",
        "eyebrow": "Mythencheck",
        "title": "Pilz der Unsterblichkeit?",
        "subtitle": "Der traditionelle Name ist schön, aber medizinisch zählt: Was ist beim Menschen wirklich gezeigt?",
        "mode": "timeline",
        "bullets": [
          "Tradition",
          "Marketing",
          "Nachweis"
        ],
        "sourceIndex": 0,
        "audio": "audio/callidus-next5-normalos/reishi/scene-07-aoede.wav",
        "audioSeconds": 17.171,
        "start": 3517,
        "duration": 546
      },
      {
        "image": "pexels/q10-v1/05-capsules.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Sicherheit",
        "title": "Blut, Immunsystem, Leber",
        "subtitle": "Reishi kann bei Blutverdünnern, Immunsuppression, OPs und Leberzeichen relevant werden.",
        "mode": "safety",
        "bullets": [
          "Blutung",
          "Immunsystem",
          "Leber"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/reishi/scene-08-aoede.wav",
        "audioSeconds": 16.651,
        "start": 4063,
        "duration": 530
      },
      {
        "image": "pexels/acacia-v2/04-4736077.jpg",
        "secondaryImage": "pexels/q10-v1/06-fatty-meal.jpg",
        "eyebrow": "Problem / Lösung",
        "title": "Nicht behandeln, einordnen",
        "subtitle": "Reishi kann ein Thema für Wohlbefinden sein, aber nicht als Ersatz für Diagnose oder Therapie.",
        "mode": "dose",
        "bullets": [
          "Ziel",
          "Qualität",
          "Abklärung"
        ],
        "sourceIndex": 3,
        "audio": "audio/callidus-next5-normalos/reishi/scene-09-aoede.wav",
        "audioSeconds": 15.731,
        "start": 4593,
        "duration": 502
      },
      {
        "image": "pexels/acacia-v2/06-5078586.jpg",
        "secondaryImage": "pexels/q10-v1/07-research.jpg",
        "eyebrow": "Kurzfazit",
        "title": "Spannend, aber vorsichtig",
        "subtitle": "Reishi ist biologisch interessant. Für harte Gesundheitsversprechen braucht es deutlich mehr Humanbelege.",
        "mode": "summary",
        "bullets": [
          "Tradition",
          "Biologie",
          "Grenzen"
        ],
        "sourceIndex": 2,
        "audio": "audio/callidus-next5-normalos/reishi/scene-10-aoede.wav",
        "audioSeconds": 14.851,
        "start": 5095,
        "duration": 506
      }
    ],
    "id": "reishi",
    "slug": "reishi-normalos-video",
    "compositionId": "ReishiEvidenceDeepDive",
    "title": "Reishi einfach erklärt: Vitalpilz, Immunsystem und warum mehr Forschung nötig ist",
    "durationInFrames": 5601
  }
} as const;

export const zinkDeepDiveDurationInFrames = callidusNext5Topics["zink"].durationInFrames;
export const vitaminCDeepDiveDurationInFrames = callidusNext5Topics["vitamin-c"].durationInFrames;
export const vitaminBKomplexDeepDiveDurationInFrames = callidusNext5Topics["vitamin-b-komplex"].durationInFrames;
export const ashwagandhaDeepDiveDurationInFrames = callidusNext5Topics["ashwagandha"].durationInFrames;
export const reishiDeepDiveDurationInFrames = callidusNext5Topics["reishi"].durationInFrames;
