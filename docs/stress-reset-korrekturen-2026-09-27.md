# Stress Reset: umgesetzte Korrekturen

Stand: 27.09.2026. Fortsetzung nach dem Nutzungslimit.

## Code und Bereitstellung

Basis: Commit 27694c3, Worktree `.claude/worktrees/stress-reset-paywall`.

- Brevo-Käufersynchronisierung liest bei jedem Versuch den aktuellen Bestellstatus. Wiederholungen sind aktiviert. Erfolgreiche Synchronisierung wird pro E-Mail dokumentiert; Newsletter-Abmeldungen werden nicht überschrieben.
- Neue stündliche Funktion `reconcileCourseBuyersToBrevo` holt alte, verpasste oder fehlgeschlagene Synchronisierungen bezahlter Bestellungen nach.
- Fehlgeschlagene Rabattcodes werden bei der automatischen Freigabe berücksichtigt. Reservierung, Guthaben und Code-Zuordnung werden gemeinsam in einer Transaktion aktualisiert. Bereits bezahlte oder erstattete Codes bleiben geschützt.
- Sechs Funktionen gezielt in `nexus-app-61494`, Region `us-central1`, bereitgestellt: `createKinderbuchRedemption`, `createKursRedemption`, `createShopifyRedemption`, `releaseValusReservations`, `syncCourseBuyerToBrevo`, `reconcileCourseBuyersToBrevo`.
- Deployment erfolgreich; anschließend alle sechs als ACTIVE und `syncCourseBuyerToBrevo.eventTrigger.retry=true` bestätigt.

## Brevo

- Aktive Automatisierung 3, „Lead-Sequenz Gratis-Downloads“: Zusätzlich zum Ausschluss bei neuem Eintrag in Liste 8 („SRK Bundle“) ist der Ausschluss bereits vorhandener Listenmitglieder gespeichert. Brevo prüft diese zweite Bedingung täglich um 19:45 Uhr laut Oberfläche. Sie wirkt nicht sofort bei jedem Eintritt.
- Vorlagen 9 und 10 dauerhaft mit „ALT – nicht verwenden:“ im Namen gekennzeichnet; über das Brevo-Plugin nachgelesen. Die Vorlagen selbst sind technisch weiterhin aktiv und wurden nicht gelöscht oder inhaltlich erneuert.
- Die zugehörige alte Automatisierung 2, „Willkommensnachricht“, ist als „Nicht aktiv“ bestätigt. Nicht wieder aktivieren, solange die alten Inhalte und Links nicht überarbeitet sind.

## Prüfungen

`node scripts/test-course-reliability.cjs`: 9 von 9 Tests bestanden. Getestet werden sofortige und wiederholte VAL-Freigabe, Wiederanlauf nach Transaktionsfehler, konkurrierende Zahlung, Verarbeitung von 501 Reservierungen, Schutz nicht abgelaufener Codes, Brevo-Ausfall mit erfolgreichem Wiederholungsversuch, veraltete Ereignisse, geänderte Käufer-E-Mail und Erstattung bei weiter gültigem Bundle. Zusätzlich JavaScript-Syntaxprüfung und `git diff --check` bestanden.

Die Tests laufen isoliert gegen die Produktionsfunktionen mit simuliertem Firestore und Brevo. Sie ersetzen keinen echten Zahlung-/Erstattungsdurchlauf. Der erste produktive Lauf der neuen stündlichen Nachholfunktion wurde beim Abschluss noch nicht nachgewiesen.

## Weiter offen

- Digistore24-Genehmigungen für Module 1, 2, 3, 6 und 7: abhängig vom Anbieter; in dieser Fortsetzung nicht erneut verändert oder bestätigt.
- Brevo-Domain `callidus-am.de`: Oberfläche meldet weiterhin nicht authentifiziert. IONOS-/DMARC-Klärung bleibt offen; keine DNS-Änderung vorgenommen.
- Selbst eingetragene App-XP und Umwandlung in bis zu 10 VAL/Monat: separate Aufgabe; hier nicht verändert.
- Echte Erstattung: H4VKAJPL ist eine bezahlte Bestellung, kein isolierter Sandbox-Test. Keine Erstattung ausgelöst. Das gleiche Konto besitzt außerdem einen bezahlten Komplettkurs; daher wäre eine weiterhin freigeschaltete Modul-4-Seite nach Erstattung nur des Einzelmoduls korrekt. Für einen belastbaren Sperrtest ein separates Testkonto ohne weitere gültige Berechtigung verwenden.
- Altvorlagen 9/10 sind markiert, aber nicht technisch deaktiviert. Die alte Automatisierung bleibt deaktiviert.

Keine Test-E-Mails versandt. Bei späteren Deployments die Änderungen in `functions/index.js` übernehmen, damit die live bereitgestellten Korrekturen nicht verloren gehen.
