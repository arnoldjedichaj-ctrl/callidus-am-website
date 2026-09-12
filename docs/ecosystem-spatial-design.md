# Callidus Ökosystem, 12. September 2026

Gezielte Überarbeitung des bestehenden Schaubilds für Besucher der App-Seite. Ruhige räumliche Darstellung im vorhandenen Callidus-Design mit echten App-Logos, einem gerenderten Hub und animierten Datenwegen. Native HTML/CSS/JavaScript ohne zusätzliche Laufzeitbibliothek.

Design-Parameter: DESIGN_VARIANCE 6, MOTION_INTENSITY 6, VISUAL_DENSITY 3. Bestehende Markenfarben und Schriftfamilie bleiben erhalten; die einzelnen App-Farben dienen der Zuordnung.

Audit: Die vorherige Grafik hatte kleine Beschriftungen, technische Nebenakteure auf gleicher Ebene wie Apps, ein eigenes Scrollfenster und dauerhaft laufende Hintergrundpartikel. Jetzt erklären auswählbare Wege den Gesundheitskontext, Energiekontext und Rückweg der Aktionen. Technische Details und Funktionsübersicht sind aufklappbar. Das eingebettete Dokument übernimmt das Seitenthema und passt seine Höhe dem Inhalt an.

Inhaltsquellen: https://www.callidus-am.de/nexus-app/, das bestehende public/handbuch/ecosystem.html und public/handbuch/callidus-handbuch.html. Die Grafik illustriert die dokumentierten Beziehungen; sie zeigt keine echten Nutzerdaten und stellt keine Verbindung zu App-Diensten her.

Bewegung: leichtes Schweben betont die räumliche Anordnung; wandernde Linien zeigen die Datenrichtung; begrenzte Mausneigung vermittelt Tiefe. Pause, prefers-reduced-motion und Pausieren außerhalb des sichtbaren Bereichs sind berücksichtigt. Alle Auswahlen funktionieren per Tastatur. Ohne JavaScript bleiben Erklärung und Funktionsübersichten verfügbar.

## Prüfung

Astro-Build erfolgreich (141 Seiten). JavaScript-Syntaxprüfung erfolgreich. Im Browser geprüft: Desktop- und 390-Pixel-Ansicht des Schaubilds, Auswahl von Apps und Datenwegen, Rückrichtung, Pause/Fortsetzen. Die Einbettung übernimmt Hell-/Dunkelmodus und wächst beim Öffnen der Funktionsübersicht (im Desktop-Test von 1018 auf 1177 Pixel). Die Browseraufnahme der vollständigen NEXUS-Seite lieferte eine leere Fläche; die eingebetteten Bedienelemente und Größen wurden deshalb über die Browser-DOM-Schnittstelle geprüft. Das eigenständige Schaubild wurde visuell geprüft.

## Bilddateien und Prompt

Erstellt mit dem eingebauten Imagegen-Tool. Original: public/assets/media/ecosystem/callidus-hub-3d.png. Webfassung: public/assets/media/ecosystem/callidus-hub-3d.webp, 640 × 640, rund 29 KB. Nur Größen- und Formatkonvertierung mit Sharp.

Finaler Prompt:

Use case: stylized-concept. Asset type: central decorative 3D hub object for Callidus wellness app ecosystem interactive website. Create one premium photorealistic 3D glass and brushed platinum sphere with a softly luminous pale mint inner core, enclosed by two thin elegant intersecting orbital metallic rings, tilted in perspective. Single isolated object centered and filling 72 percent of a square canvas, all rings fully inside frame. Deep near-black forest green background #091713, subtle soft contact glow beneath, no floor horizon. Refined physical materials, realistic refraction, crisp rim lighting from upper left, subtle green reflections, calm sophisticated wellness technology, not sci-fi gaming. No text, no typography, no logos, no other objects, no stars, no tiny particles, no purple. Balanced spherical silhouette. Asset will be displayed around 200px wide, keep object visually legible.
