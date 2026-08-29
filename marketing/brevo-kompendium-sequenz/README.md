# Brevo-Sequenz „Gratis-Downloads“

Sechs E-Mails über 13 Tage für alle, die sich auf der Website die kostenlosen Downloads
holen. Ziel der Strecke: Vertrauen aufbauen → Brücke von Nährstoffen zu Stress → Verkauf
des 7-Tage-Stress-Reset (69 €), am Ende Downsell (Module je 19 €) und ein Hinweis auf die
Kinderbücher für Eltern.

## Wie der Funnel wirklich läuft (Stand 29.08.2026, abends)

Auf der Website ist **nicht** das Formular „Vitamin-Kompendium PDF Download“ (Liste #2)
eingebunden, sondern **„SRK-LEADS-3-MODULE-GRATIS“** → Liste **#7 KURS_LEADS_STRESS_RESET**.
Alle Einbindungen (Startseite, `/gesundheits-checks/`, special-pages) nutzen dieselbe
sibforms-URL, und die gehört zum SRK-Formular. Nachgewiesen durch direkten Aufruf der URL.

Daraus folgt:

- Die Sequenz triggert auf **Liste #7**, nicht auf #2.
- Die alte Automatisierung „Willkommensnachricht“ (Trigger ebenfalls #7) ist
  **deaktiviert** — sonst kämen zwei Willkommensmails.
- **Mail 1 liefert alle drei Gratis-Sachen**, die die Startseite verspricht:
  Vitamin-Kompendium, Klangfrequenzen-Kompendium und das Stress-Reset-Starterpaket
  (Link auf `/reset-hub/`). Vorher wurde das Vitamin-Kompendium nirgends ausgeliefert,
  obwohl die Startseiten-Überschrift es ausdrücklich zusagt.

In Brevo heißt die Automatisierung **„Lead-Sequenz Gratis-Downloads“** (`/automation/edit/3`).

## Die Dateien

| Datei | Betreffzeile | Versand |
|---|---|---|
| `mail-1-willkommen.html` | Da sind sie – deine Gratis-Downloads | sofort (1 Min.) |
| `mail-2-vitamin-d.html` | Der häufigste Fehler bei Vitamin D | Tag 2 |
| `mail-3-warum-naehrstoffe-nicht-reichen.html` | Warum Nährstoffe allein nicht reichen | Tag 4 |
| `mail-4-60-sekunden-reset.html` | 60 Sekunden, die deinen Tag drehen | Tag 6 |
| `mail-5-angebot-stress-reset.html` | Sieben Tage. Zehn Minuten am Tag. | Tag 9 |
| `mail-6-kleiner-einstieg.html` | Falls sieben Tage gerade zu viel sind | Tag 13 |

Mail 1–4 verkaufen nichts. Mail 5 ist das Angebot, Mail 6 der Downsell plus
Kinderbuch-Hinweis. Diese Reihenfolge ist Absicht: Wer zu früh verkauft, verliert die Liste.

## Einrichtung in Brevo

### Schritt 1 – die sechs E-Mail-Vorlagen anlegen

Für jede der sechs Dateien:

1. **Kampagnen → Templates → Neue Vorlage**
2. Vorlagenname: Dateiname ohne `.html` (z. B. `mail-2-vitamin-d`)
3. Betreffzeile: aus der Tabelle oben
4. Absender: die verifizierte callidus-Absenderadresse
5. Als Editor **„Eigenen Code verwenden“ / „Code einfügen“** wählen – **nicht** den
   Drag-and-drop-Editor, der zerlegt das Layout
6. Kompletten Inhalt der HTML-Datei hineinkopieren, speichern

### Schritt 2 – die Automatisierung bauen

**Automatisierungen → Workflows → Automatisierung erstellen → Von Grund auf neu**

Name: `Lead-Sequenz Gratis-Downloads`

| Schritt | Typ | Einstellung |
|---|---|---|
| 1 | Trigger | Ein Kontakt wurde zur Liste hinzugefügt → **Liste #7 KURS_LEADS_STRESS_RESET** |
| 2 | Warten | 1 Minute |
| 3 | E-Mail senden | `mail-1-willkommen` |
| 4 | Warten | 2 Tage |
| 5 | E-Mail senden | `mail-2-vitamin-d` |
| 6 | Warten | 2 Tage |
| 7 | E-Mail senden | `mail-3-warum-naehrstoffe-nicht-reichen` |
| 8 | Warten | 2 Tage |
| 9 | E-Mail senden | `mail-4-60-sekunden-reset` |
| 10 | Warten | 3 Tage |
| 11 | E-Mail senden | `mail-5-angebot-stress-reset` |
| 12 | Warten | 4 Tage |
| 13 | E-Mail senden | `mail-6-kleiner-einstieg` |

### Schritt 3 – testen, bevor sie aktiv wird

1. Über **„Testen“** im Workflow-Editor eine eigene Adresse durchschicken
2. Alle Links anklicken, besonders den Digistore-Link in Mail 5
3. Auf dem Handy gegenlesen
4. Erst dann auf **Aktiv** stellen

Wichtig: Die Automatisierung erst aktivieren, wenn die Google-Ads-Kampagne startet –
sonst laufen Tests und echte Leads durcheinander.

## Was bewusst so gebaut ist

- **Keine Vornamen-Anrede.** Das Formular erfasst nur die E-Mail-Adresse. Ein leeres
  `{{ contact.VORNAME }}` würde als „Hallo ,“ ankommen.
- **`{{ unsubscribe }}` steht im Footer jeder Mail** und muss dort bleiben (Pflicht).
- **Health Claims konservativ.** Es werden nur zugelassene EFSA-Formulierungen benutzt
  („trägt zur normalen Funktion des Immunsystems bei“, „hilft, Müdigkeit und Ermüdung
  zu verringern“). Keine Heilversprechen – die HCVO ist bei Nahrungsergänzung streng.
- **Nur echte, existierende Links.** Alle verlinkten Ratgeber-Artikel wurden gegen
  `src/data/articles.json` geprüft.
- **Keine externen Bilder.** Reines Text-/Tabellenlayout: bessere Zustellbarkeit,
  nichts kaputt, wenn ein Client Bilder blockiert.

## Änderungen

Die Mails wurden aus einem Generator erzeugt, damit alle dasselbe Gerüst teilen. Für
kleine Textänderungen kannst du die HTML-Dateien direkt bearbeiten – das Gerüst
(Kopfzeile, Footer, Button-Stil) ist in jeder Datei vollständig enthalten.
