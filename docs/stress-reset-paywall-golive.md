# Stress-Reset-Kurs: Umstellung auf „alles kostenpflichtig“

Stand: 24.09.2026, Branch `feature/stress-reset-paywall`.

## Was sich geändert hat

| Vorher | Jetzt |
|---|---|
| Modul 1–3 gratis (YouTube + PDF auf `/reset-hub/`) | Alle 7 Module kostenpflichtig. Gratis bleiben Kompendium „Wahre Entlastung“, Journal, Vitamin- und Klangfrequenzen-Kompendium und die 60-Sekunden-Übung |
| Mitgliederbereich ohne Login, PDFs öffentlich, Videos auf YouTube | Login mit Kauf-E-Mail, Videos und PDFs in einem privaten Speicher, Links gelten nur 4 Stunden |
| Kompletter Kurs: „116 € regulär, 69 € Einführung“ per Gutschein | Kompletter Kurs: **69 €** als echter Preis, ohne Streichpreis |
| Modul 4 und 5: „29 € regulär, 19 €“ per Gutschein | Jedes Modul **19 €**. Modul 1, 2, 3, 6, 7 erscheinen, sobald die Digistore-Produkte existieren |

Preise und Produkt-IDs stehen **nur** in `functions/data/stress-reset-course.json`. Website und
Cloud Functions lesen beide daraus.

So kommt man an den Kurs:

1. Kauf bei Digistore24 → die Kaufmeldung (IPN) an `digistoreIpn` legt `course_orders/{Bestellnr}_{Produkt}` an.
2. Danke-Seite → `/kurs-mitgliederbereich/` → Anmeldung mit der Kauf-E-Mail (Passwort-Konten müssen die E-Mail bestätigen, Google-Konten nicht).
3. `getStressResetAccess` prüft den Kauf und liefert zeitlich begrenzte Links zu Video und PDF.
4. Anderes Login als die Kauf-E-Mail? Unten im Mitgliederbereich die Bestellnummer eingeben (`claimStressResetOrder`, max. 10 Versuche pro Stunde).
5. Erstattung oder Rückbuchung → die IPN setzt den Kauf auf `refunded`, und der Zugang ist weg.

## Reihenfolge beim Livegang

**Wichtig:** Die Website erst veröffentlichen, wenn die Schritte 1–5 erledigt sind. Sonst
landen Käufer in einem Mitgliederbereich ohne Inhalte.

### 1. Google Cloud: Berechtigung zum Signieren (einmalig)

Die Cloud Functions erzeugen die zeitlich begrenzten Links. Dafür braucht ihr Dienstkonto die
Rolle „Ersteller von Dienstkonto-Tokens“ auf sich selbst.

In der Google Cloud Console (Projekt `nexus-app-61494`):

1. *APIs & Dienste* → „IAM Service Account Credentials API“ aktivieren.
2. *IAM & Verwaltung → Dienstkonten* → `…-compute@developer.gserviceaccount.com` öffnen →
   *Berechtigungen* → *Zugriff gewähren* → als Hauptkonto dieselbe Adresse eintragen →
   Rolle **Ersteller von Dienstkonto-Tokens** → Speichern.

Alternativ im Terminal (Projektnummer steht in der Console auf der Startseite):

```bash
gcloud services enable iamcredentials.googleapis.com --project=nexus-app-61494
```

```bash
gcloud iam service-accounts add-iam-policy-binding PROJEKTNUMMER-compute@developer.gserviceaccount.com --member=serviceAccount:PROJEKTNUMMER-compute@developer.gserviceaccount.com --role=roles/iam.serviceAccountTokenCreator --project=nexus-app-61494
```

Fehlt diese Rolle, zeigt der Mitgliederbereich „Einige Inhalte konnten gerade nicht geladen
werden“. Im Functions-Log steht dann `stress reset signed url failed`.

### 2. Videos und PDFs hochladen

Die PDFs liegen schon in `course-media/stress-reset/`. Der Ordner ist per `.gitignore`
ausgeschlossen und landet nie im Repo.

Die Original-Videos in `course-media/originale/` legen und genau so benennen (Endung egal):

| Datei | Inhalt |
|---|---|
| `modul-1` | Der Reset-Knopf |
| `modul-2` | Wahrnehmen statt Reagieren |
| `modul-3` | Ankommen im Körper |
| `modul-4` | Sprache & Selbstbild |
| `modul-5` | Loslassen |
| `modul-6` | Energie tanken |
| `modul-7` | Balance leben |
| `bonus-zukunftsanker` | Bonus: Der Zukunftsanker |

Dann im Projektordner:

```bash
node scripts/upload-course-media.mjs --transcode
```

Das Skript wandelt die Videos mit ffmpeg in browsertaugliche MP4-Dateien um (1080p, startet
sofort). Es legt den privaten Bucket `nexus-app-61494-kurse` in Frankfurt an, falls er fehlt,
und lädt alles hoch. Nur prüfen, was fehlt: `--check`.

### 3. Digistore24

1. **Preise ändern:** Produkt 645388 → 69 €, Produkt 643822 (Modul 4) → 19 €, Produkt 645365 (Modul 5) → 19 €.
2. **Gutscheine deaktivieren:** `EINFUEHRUNGSRABATT`, `EINFUEHRUNGSRABATT_MODUL4`, `EINFUEHRUNGSRABATT_MODUL5`.
   Sonst ziehen sie vom neuen Preis weiter ab. Die automatischen `SR-…`-Codes der VAL-Einlösung sind davon nicht betroffen.
3. **Danke-Seite** aller Kursprodukte: `https://www.callidus-am.de/kurs-mitgliederbereich/`.
   Die alten Adressen `/modul-4/` und `/modul-5/` leiten dorthin weiter.
4. **IPN prüfen:** Die bestehende IPN-Verbindung zu `digistoreIpn` muss für **alle** Kursprodukte
   gelten, auch für neu angelegte. Ohne IPN gibt es keinen Zugang.
5. **Optional: Modul 1, 2, 3, 6, 7 anlegen** (je 19 €, gleiche Danke-Seite, IPN, Affiliate-Freigabe).
   Die neuen Produkt-IDs in `functions/data/stress-reset-course.json` bei `digistoreProductId`
   eintragen. Danach Functions **und** Website neu ausrollen. Solange eine ID fehlt, steht das
   Modul auf der Website als „im Komplettkurs enthalten“.
6. **Produktbeschreibung / Kaufbestätigung:** Satz ergänzen: „Nach dem Kauf meldest du dich unter
   callidus-am.de/kurs-mitgliederbereich/ mit der E-Mail-Adresse an, die du hier angibst.“

### 4. Cloud Functions ausrollen

Immer gezielt, nie alle (siehe Notiz zu fremden Functions im Projekt):

```bash
firebase deploy --only functions:digistoreIpn,getStressResetAccess,claimStressResetOrder,createKursRedemption,askCallidus --project nexus-app-61494
```

`askCallidus` nur wegen des aktualisierten Chatbot-Wissens zum Kurs.

### 5. Bisherige Käufer freischalten

- **Käufe seit der IPN-Anbindung (Juli 2026)** werden beim ersten Login automatisch aus
  `digistore_ipn_events` nachgetragen. Dafür ist nichts zu tun.
- **Ältere Käufe:** In Digistore24 die Käuferliste als CSV exportieren und daraus eine Datei
  `kaeufer.csv` mit `email;produkt;bestellnummer` machen (`produkt` = `bundle`, `modul4`, `modul5`).
  Dann:

```bash
node scripts/stress-reset-access.mjs import kaeufer.csv
```

Einzelfälle: `node scripts/stress-reset-access.mjs grant kunde@example.de bundle`,
Kontrolle: `… list kunde@example.de`, Sperren: `… revoke <dokument-id>`.

Danach die bisherigen Käufer kurz informieren, z. B. über Digistore24 oder Brevo:

> Betreff: Dein Stress-Reset hat ein neues Zuhause
>
> Hallo, dein 7-Tage-Stress-Reset liegt ab sofort in einem geschützten Mitgliederbereich:
> callidus-am.de/kurs-mitgliederbereich/ – melde dich dort mit dieser E-Mail-Adresse an
> (einmalig Konto anlegen oder mit Google). Alle Module, die du gekauft hast, sind freigeschaltet.
> Bei Fragen einfach auf diese Mail antworten. Herzliche Grüße, Arnold

### 6. Website veröffentlichen

Branch `feature/stress-reset-paywall` nach `main` mergen → GitHub Pages baut neu.

### 7. Aufräumen

- **YouTube:** Die 8 Kursvideos auf „Privat“ stellen, sobald die Uploads laufen:
  `cyjxJZaLM4k`, `cvIIAgtsUH4`, `NkYzOAEmpfY`, `WeGmEGYwqEw`, `yiZgKN5F3YY`, `ZfGdQT1F1PM`, `N0J5DA9g2wk`, `90OeLwvQEkM`.
- **Brevo:** Vorlagen `mail-1`, `mail-4`, `mail-5`, `mail-6` aus `marketing/brevo-kompendium-sequenz/`
  neu einfügen (Vorgehen wie in der README dort). Im Formular „SRK-LEADS-3-MODULE-GRATIS“ und
  in der Double-Opt-in-Mail („Deine Freebies warten“) nach „Video-Module“ suchen und durch
  „Journal und 60-Sekunden-Übung“ ersetzen.
- **Firestore-Regeln prüfen:** `course_orders` enthält Käufer-E-Mails. Die Sammlung darf vom
  Browser aus weder lesbar noch beschreibbar sein. Ich konnte die Regeln von hier nicht einsehen.
  Wenn es irgendwo eine pauschale Regel wie `allow read, write: if request.auth != null;` gibt,
  muss sie weg (das beträfe auch `digistore_redemptions`).

## Testlauf nach dem Livegang

1. In Digistore24 einen Testkauf von Modul 4 machen (100-%-Testgutschein oder Testmodus).
2. Im Mitgliederbereich mit der Kauf-E-Mail registrieren → E-Mail bestätigen → Modul 4 muss laufen, alle anderen gesperrt.
3. Den Testkauf erstatten → nach dem Neuladen ist Modul 4 wieder gesperrt.
4. Mit einem zweiten Konto die Bestellnummer eingeben → muss mit „bereits einem anderen Konto zugeordnet“ scheitern.

## Bekannte Grenzen

- **Git-Historie:** Die alten Modul-PDFs sind aus `public/` entfernt, liegen aber weiterhin in
  der Git-Historie des **öffentlichen** GitHub-Repos. Die Videos, also der eigentliche Wert,
  waren nie im Repo.
- **Weitergabe:** Ein Käufer kann einen Videolink kopieren. Der Link funktioniert aber nur
  4 Stunden.
- **Kosten:** Videoauslieferung aus Google Cloud Storage kostet ca. 0,12 € pro GB. Ein kompletter
  Kursdurchlauf liegt je nach Videogröße bei wenigen Cent.
