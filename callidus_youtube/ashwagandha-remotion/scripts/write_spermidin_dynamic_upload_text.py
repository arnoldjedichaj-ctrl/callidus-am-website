from pathlib import Path
root = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion')
upload = '''Titel:
Spermidin im Check: Autophagie, Longevity und was Humanstudien wirklich zeigen

Beschreibung:
Spermidin wird oft als Longevity-Hoffnung beworben. Dieses Video ordnet ruhig und wissenschaftlich vorsichtig ein, was Spermidin ist, wie Autophagie funktioniert, welche Lebensmittel Spermidin liefern und was Humanstudien bisher wirklich zeigen.

Kurz gesagt: biologisch spannend, aber kein bewiesenes Anti-Aging-Wundermittel. Keine Heilversprechen, keine medizinische Beratung.

Kapitelvorschlag:
00:00 Spermidin im Check
00:22 Was ist Spermidin?
00:45 Autophagie einfach erklärt
01:10 Food first: natürliche Quellen
01:37 Mythos Lebensverlängerung
01:58 Was Humanstudien zeigen
02:29 Mythos: mehr ist besser
02:53 Qualität und Produktauswahl
03:15 Sicherheit und Risiken
03:38 Kurzfazit

Quellen:
JAMA Network Open (2022): Spermidine supplementation did not improve memory/biomarkers vs placebo in a 12-month RCT
https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2792725

Nutrients / PMC (2023): High-dose spermidine did not increase spermidine levels in plasma/saliva in a short RCT
https://pmc.ncbi.nlm.nih.gov/articles/PMC10143675/

Nutrition Research (2024): 40 mg/day spermidine showed minimal effects on circulating polyamines in older men
https://www.sciencedirect.com/science/article/pii/S027153172400126X

ClinicalTrials.gov: POLYCAD spermidine trial, completion expected August 2026
https://www.clinicaltrials.gov/study/NCT05459961

Website-Hinweis:
Nach dem YouTube-Upload in src/data/videos.json nur die youtubeId ergänzen. Das Video hängt bereits an der Spermidin-Karte im Bereich Gesundheits-Wissen.

Datei lokal:
C:\\Users\\marga\\callidus_youtube\\ashwagandha-remotion\\out\\spermidin-evidence-deepdive-dynamisch-final.mp4
'''
voiceover = '''01 Intro
Spermidin klingt nach Longevity-Wundermittel. Aber genau da schauen wir genauer hin. Es ist biologisch spannend, weil es mit Zellrecycling, also Autophagie, verbunden wird. Gleichzeitig zeigen Humanstudien bisher deutlich weniger, als viele Werbetexte versprechen. In diesem Video ordnen wir es ruhig ein.

02 Was ist es?
Spermidin ist ein natürliches Polyamin. Das bedeutet: Es gehört zu kleinen Molekülen, die in Zellen vorkommen und an Wachstum, Reparatur und Stoffwechsel beteiligt sind. Der Körper bildet selbst Polyamine, und wir nehmen sie auch über Lebensmittel auf. Es ist also kein fremder Zauberstoff.

03 Autophagie
Der wichtigste Begriff ist Autophagie. Stell dir eine Zelle wie einen Haushalt vor: beschädigte Bestandteile werden erkannt, zerlegt und brauchbare Bausteine wiederverwendet. Das ist keine Detox-Magie, sondern normale Zellpflege. Spermidin kann diesen Prozess in Modellen beeinflussen, aber daraus folgt noch kein automatisch bewiesener Nutzen beim Menschen.

04 Food first
Praktisch beginnt Spermidin am sinnvollsten mit Food first. Weizenkeime, Soja, Hülsenfrüchte, Pilze und gereifter Käse liefern natürlicherweise Polyamine. Der Vorteil: Lebensmittel bringen nicht nur einen isolierten Stoff, sondern auch Ballaststoffe, Proteine, Mineralstoffe und ein Ernährungsmuster. Für viele ist das die solidere Basis als sofort zur Kapsel zu greifen.

05 Mythos 1
Der erste Mythos lautet: Spermidin verlängert sicher das Leben. Das ist so nicht belegt. Es gibt plausible Mechanismen und spannende Tier- und Zelldaten. Aber Humanstudien müssen zeigen, ob daraus messbare Vorteile entstehen. Eine biologische Idee ist noch kein klinischer Beweis.

06 Humanstudien
Was zeigen Studien beim Menschen? Eine zwölfmonatige placebokontrollierte Studie in JAMA Network Open fand keinen klaren Vorteil bei Gedächtnis oder Biomarkern. Eine kurze Studie in Nutrients fand trotz höherer Gabe keine deutlich erhöhten Spermidinspiegel in Plasma oder Speichel. Und eine Studie von 2024 sah bei älteren Männern nur minimale Veränderungen zirkulierender Polyamine.

07 Mythos 2
Der zweite Mythos lautet: mehr Milligramm bedeuten automatisch mehr Wirkung. Gerade bei Polyaminen ist das zu einfach gedacht. Der Körper reguliert diese Stoffe eng. Ein Etikett, eine hohe Dosis oder ein schöner Longevity-Claim ersetzen keine belastbaren Endpunkte. Bei Supplementen bleibt konservatives Denken sinnvoll.

08 Praxis
Wenn man ein Produkt nutzt, dann bitte nüchtern prüfen: Ist die Milligramm-Angabe klar? Ist die Quelle nachvollziehbar? Gibt es Laborprüfung oder wenigstens transparente Qualität? Und wird ohne Heilversprechen kommuniziert? Gute Aufklärung erkennt man oft daran, dass Grenzen genauso sichtbar sind wie mögliche Vorteile.

09 Sicherheit
Wichtig ist auch Sicherheit. Bei Weizenallergie muss die Quelle beachtet werden. Schwangerschaft, Stillzeit, chronische Erkrankungen oder Medikamente sind Gründe, vorher fachlich nachzufragen. Und wenn Beschwerden, Entzündungen oder unklare Diagnosen bestehen, sollte kein Supplement die medizinische Abklärung ersetzen.

10 Kurzfazit
Das Fazit: Spermidin ist kein Unsinn, aber auch kein Shortcut. Es ist ein interessanter Baustein in der Zellbiologie. Die besten Grundlagen bleiben Ernährung, Bewegung, Schlaf und Stressregulation. Wer Supplemente nutzt, sollte das als kleinen möglichen Zusatz sehen, wissenschaftlich vorsichtig und ohne Heilsversprechen.
'''
(root / 'spermidin-deepdive-dynamisch-upload-text.txt').write_text(upload, encoding='utf-8')
(root / 'spermidin-deepdive-dynamisch-voiceover.txt').write_text(voiceover, encoding='utf-8')
print('wrote upload and voiceover text')
