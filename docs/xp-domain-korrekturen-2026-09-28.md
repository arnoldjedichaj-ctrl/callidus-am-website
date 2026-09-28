# Domain und XP: Korrekturen vom 28.09.2026

## Domain: erledigt

IONOS: `_dmarc` CNAME `dmarc.ionos.de` ersetzt durch TXT `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` (TTL 3600). Die bisherige DMARC-Policy `p=none` bleibt bestehen; neu ist die Berichterstattung an Brevo. Domain Guard blieb aktiv.

Die vorher getrennten SPF-TXT-Einträge für Firebase und IONOS sind durch genau einen Eintrag ersetzt: `v=spf1 include:_spf.firebasemail.com include:_spf-eu.ionos.com ~all`. IONOS hatte beim Zusammenführen zunächst den alten Firebase-Eintrag stehen gelassen; dieser wurde anschließend entfernt. MX, Website-Ziele und DKIM wurden nicht verändert.

Brevo wurde zur erneuten Prüfung aufgefordert und bestätigt `callidus-am.de` ausdrücklich als **Authentifiziert**.

## XP: bestätigte Produktregel

Der Nutzer hat ausdrücklich bestätigt: Selbst gemeldete App-XP werden nicht mehr in VAL umgewandelt. App-Level und bestehende Punkte bleiben erhalten. Nicht belegbare Altbestände werden nicht als umwandelbare XP übernommen.

- Neue ausschließlich serverseitige Quelle: `users/{uid}/valus_xp_rewards/current.xp`.
- Kein Import aus `total_xp`, `momus_xp_total`, dem gemischten alten XP-Konto oder Angaben in Requests.
- Die bisherige Synchronisierung bleibt als lesender Kompatibilitätsaufruf bestehen; `creditMomusXp` bestätigt keine neuen VAL-fähigen Punkte aus App-Angaben.
- `claimDailyTaskXp` schreibt ausschließlich den serverseitig berechneten Tagesbonus, gemeinsam mit dem Tagesbeleg, in einer Transaktion. Wiederholte Anfragen für denselben Tag bringen keine zusätzliche Gutschrift. Die tatsächliche Ausführung der persönlichen Tagesaufgabe wird dadurch nicht bewiesen; abgesichert sind Höhe, Kalenderdatum und Einmaligkeit der Belohnung.
- `convertNexusXpToValus` prüft und reduziert das bestätigte Konto zusammen mit VAL-Gutschrift und Monatslimit in derselben Transaktion. Das gemeinsame Limit von 10 VAL pro Monat bleibt.
- Guthabenantworten unterscheiden umwandelbare XP und den erhaltenen Altbestand. Frontend-Fallbacks können unbestätigte Zahlen nicht mehr als umwandelbare XP anzeigen.
- Keine rückwirkende Entziehung bereits vorhandener VAL und keine Änderung an App-Leveln.

Die produktiven Firestore-Regeln wurden über die Rules API gelesen: Ruleset `b7af8828-8ee8-457c-b4c0-fe2d89663d82`. `valus_xp_rewards` ist nicht in der Client-Schreib-Whitelist enthalten; die übergreifende Standardregel verweigert den Zugriff. Dafür ist keine Erweiterung von Client-Berechtigungen notwendig.

Prüfung: sechs isolierte Tests in `scripts/test-xp-trust.cjs`, zusätzlich die neun Kurs-/Brevo-Tests; alle bestanden. Syntaxprüfung und Astro-Build erfolgreich. Die simulierten Transaktionen ersetzen keinen Emulator-Lasttest.

## Digistore24 und Erstattung

Laut Nutzer sind Module 6 und 7 seit heute genehmigt; 1, 2 und 3 warten weiter auf Genehmigung.

Für einen echten Erstattungstest wird eine geeignete bezahlte Testbestellung ohne zusätzlichen gültigen Kurszugang benötigt. H4VKAJPL gehört zu einem Konto mit weiter gültigem Komplettkurs. Die Erstattung nur des Einzelmoduls kann daher keine vollständige Zugangssperre belegen. Keine echte Rückzahlung ausgelöst.
