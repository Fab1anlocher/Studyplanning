# 7. Prototyp und Evaluation

## 7.1 Final Prototype Features

Der finale Prototyp der StudyPlanner-Anwendung umfasst eine Reihe von Features, die darauf abzielen, Studierende bei der effizienten Planung und Organisation ihres Lernalltags zu unterstützen. Die Kernfunktionalitäten des Prototyps gliedern sich in folgende Bereiche:

### 7.1.1 Upload von Materialien und Eingabe von Themen

Die Anwendung bietet eine intuitive PDF-Upload-Funktion, die es Nutzern ermöglicht, ihre Modulbeschreibungen direkt hochzuladen. Mithilfe der PDF.js-Bibliothek wird der Text aus den Dokumenten extrahiert und durch die OpenAI GPT-4o-mini API automatisch analysiert. Das System identifiziert dabei folgende Informationen:

- **Modulname**: Eindeutige Bezeichnung der Lehrveranstaltung
- **ECTS-Punkte**: Kreditpunkte als Indikator für den erwarteten Arbeitsaufwand
- **Workload**: Gesamter Zeitaufwand in Stunden
- **Leistungsnachweise**: Art der Prüfungen (Klausuren, Präsentationen, Projekte) mit jeweiliger Gewichtung
- **Prüfungstermine**: Deadlines für die verschiedenen Assessments

Diese automatisierte Extraktion reduziert den manuellen Eingabeaufwand erheblich und minimiert Fehlerquellen bei der Datenerfassung. Sollten PDFs nicht verfügbar sein oder die automatische Extraktion fehlschlagen, können Nutzer die Modulinformationen auch manuell eingeben oder anpassen.

### 7.1.2 Eingabe von Prüfungsterminen und verfügbarer Zeit

Ein zentrales Feature ist der interaktive **Wochenplaner**, der es Studierenden ermöglicht, ihre verfügbaren Lernzeiten präzise zu definieren. Die Zeitauswahl erfolgt über ein Grid-basiertes Interface mit folgenden Funktionen:

- **2-Stunden-Blöcke**: Auswahl einzelner Zeitslots für jeden Wochentag
- **Schnellauswahl-Vorlagen**: Vordefinierte Templates wie "Vormittags", "Nachmittags", "Abends" oder "Ganztags"
- **Flexible Anpassung**: Individuelle Markierung oder Demarkierung einzelner Zeitfenster
- **Visuelle Übersicht**: Farbcodierte Darstellung der gewählten Zeitfenster

Die Prüfungstermine werden entweder aus den hochgeladenen PDFs extrahiert oder können manuell für jedes Modul angegeben werden. Das System berücksichtigt diese Deadlines bei der Lernplangenerierung, um einen realistischen zeitlichen Rahmen zu schaffen.

### 7.1.3 Generierung eines personalisierten Lernplans

Das Herzstück der Anwendung ist die **KI-gestützte Lernplangenerierung**. Basierend auf den eingegebenen Modulen, verfügbaren Zeitslots und Prüfungsterminen erstellt die OpenAI API einen detaillierten, personalisierten Lernplan. Der Generierungsprozess berücksichtigt dabei:

**Pädagogische Prinzipien:**
- **ECTS-gewichtete Zeitallokation**: Module mit höheren ECTS-Punkten erhalten proportional mehr Lernzeit
- **Assessment-Gewichtung**: Prüfungen mit höherer Gewichtung (z.B. 80% Präsentation) werden priorisiert
- **Lernmethoden-Auswahl**: Automatische Zuweisung evidenzbasierter Lernmethoden (Spaced Repetition, Deep Work, Pomodoro-Technik, etc.)
- **Zeitliche Verteilung**: Optimale Streuung der Lernsessions über den verfügbaren Zeitraum

**Technische Umsetzung:**
- Strukturierte JSON-Ausgabe des LLM für konsistente Datenverarbeitung
- Validierung der generierten Sessions gegen definierte Zeitfenster
- Kalenderbasierte Visualisierung der Lernsessions

Jede Lernsession im Plan enthält:
- Datum und Uhrzeit
- Zugeordnetes Modul
- Spezifisches Thema/Topic
- Detaillierte Beschreibung der Lernaktivitäten
- Empfohlene Lernmethode mit Anwendungstipps

### 7.1.4 Anzeige von Fortschritt und Feedback

Die Anwendung bietet mehrere Features zur Fortschrittsverfolgung und Unterstützung:

**Visuelle Darstellung:**
- **Kalenderansicht**: Übersichtliche Darstellung aller Lernsessions in einem monatlichen Kalender-Grid
- **Farbcodierung**: Unterschiedliche Farben für verschiedene Module zur besseren Orientierung
- **Session-Details**: Expandierbare Karten mit vollständigen Informationen zu jeder Lernsession

**Module Learning Guide:**
Für jedes Modul kann ein detaillierter Lernguide generiert werden, der folgende Elemente umfasst:
- **Kompetenzübersicht**: Zu erwerbende Fähigkeiten und Kenntnisse
- **Lernstrategie**: Detaillierte Erklärung der empfohlenen Methode mit Begründung
- **Wochenplan**: Fokusthemen und Aufgaben für jede Woche bis zur Prüfung
- **Übungsvorschläge**: Konkrete Aufgaben und Aktivitäten zur Kompetenzerweiterung
- **Prüfungsvorbereitung**: Gestaffelte Checklisten für 4 Wochen, 2 Wochen, 1 Woche und den letzten Tag vor der Prüfung
- **Tipps und häufige Fehler**: Praktische Hinweise zur Vermeidung typischer Probleme
- **Erfolgscheckliste**: Validierungspunkte zur Selbstüberprüfung

**Study Assistant Interaktion:**
Die Anwendung fungiert als interaktiver Studienassistent durch:
- Bereitstellung methodischer Erklärungen für jede Lernmethode
- Tipps zur praktischen Umsetzung der Sessions
- Strukturierte Darstellung von Lernressourcen und Tools

## 7.2 User Experience

### 7.2.1 UI Flow: Onboarding-Prozess

Der User Flow der StudyPlanner-Anwendung folgt einem linearen, schrittweisen Onboarding-Prozess, der Nutzer intuitiv durch die Einrichtung führt:

**Schritt 1: Welcome Page**
Die Startseite begrüßt Nutzer mit einer klaren Value Proposition und erklärt kurz die Funktionsweise der Anwendung. Ein Call-to-Action-Button ("Jetzt starten") initiiert den Onboarding-Prozess.

**Schritt 2: API-Key Eingabe**
Da die Anwendung direkt mit der OpenAI API kommuniziert, müssen Nutzer zunächst ihren persönlichen API-Key eingeben. Diese Designentscheidung ermöglicht:
- Vollständige Datenkontrolle durch den Nutzer
- Keine serverseitige Speicherung sensibler Daten
- Transparenz über API-Kosten

Die Seite enthält hilfreiche Links zur API-Key-Erstellung und Hinweise zur sicheren Handhabung. Der Key wird lokal im Browser (localStorage) gespeichert.

**Schritt 3: Module Upload**
Im dritten Schritt laden Nutzer ihre Modulbeschreibungen als PDF-Dateien hoch. Der Prozess umfasst:
1. Drag-and-Drop oder manuelle Dateiauswahl
2. Automatische PDF-Textextraktion
3. KI-basierte Datenextraktion der Modulinformationen
4. Anzeige und manuelle Editierbarkeit der extrahierten Daten

Jedes Modul wird in einer übersichtlichen Card dargestellt, die folgende Informationen zeigt:
- Modulname
- ECTS-Punkte und Workload
- Leistungsnachweise mit Gewichtung und Deadlines
- PDF-Quellendokument

**Schritt 4: Wochenplan-Definition**
Der vierte Schritt ermöglicht die Definition verfügbarer Lernzeiten durch:
- Interaktives Grid mit 7 Tagen × 12 Zeitslots (08:00-20:00 Uhr)
- Click-to-Toggle Mechanismus für einzelne Slots
- Schnellauswahl-Buttons für gängige Zeitfenster
- Visuelle Bestätigung durch Farbänderung

**Schritt 5: Lernplan-Generierung und Ansicht**
Im finalen Schritt wird der personalisierte Lernplan generiert und dargestellt. Die Generierung erfolgt durch einen expliziten "Plan generieren"-Button, der den API-Call initiiert.

### 7.2.2 Plan-Übersicht

Nach erfolgreicher Generierung präsentiert die Anwendung den Lernplan in zwei Hauptansichten:

**Kalenderansicht:**
- Monatliches Grid-Layout mit allen Tagen
- Farbcodierte Session-Karten für jedes Modul
- Kompakte Darstellung mit Modulname und Uhrzeit
- Klickbare Sessions für Detail-Expansion

**Detailansicht:**
Beim Klick auf eine Session öffnet sich ein Collapsible-Element mit vollständigen Informationen:
- Zeitfenster (Start- und Endzeit)
- Modulzuordnung mit ECTS-Indikator
- Lernthema und detaillierte Beschreibung
- Empfohlene Lernmethode mit Badge
- Praktische Tipps zur Umsetzung

**Filter- und Sortieroptionen:**
- Monatswahl zur Navigation durch den Semesterverlauf
- Modulfilter zur fokussierten Ansicht einzelner Fächer

### 7.2.3 Interaktion mit dem Study Assistant

Die Interaktion mit dem KI-gestützten Study Assistant erfolgt auf mehreren Ebenen:

**Initiale Plangenerierung:**
Der Assistant analysiert die Nutzereingaben und erstellt einen holistischen Lernplan unter Berücksichtigung pädagogischer Best Practices. Die Interaktion erfolgt hier implizit durch die Strukturierung der Prompts und die Validierung der LLM-Ausgabe.

**Module Learning Guide:**
Für vertiefende Informationen zu einem spezifischen Modul können Nutzer einen detaillierten Lernguide anfordern. Der Assistant generiert dabei:
- Eine modulspezifische Lernstrategie mit Begründung
- Wöchentliche Fokusthemen und konkrete Aufgaben
- Gestaffelte Prüfungsvorbereitungspläne
- Praktische Tipps und Warnungen vor häufigen Fehlern

**Lernmethoden-Erklärungen:**
Für jede empfohlene Lernmethode bietet die Anwendung:
- Titel und kurze Beschreibung der Methode
- Wissenschaftliche Begründung (wo relevant)
- Praktische Anwendungstipps
- Ideal geeignete Lernszenarien

Diese Informationen sind als statischer Content in der Anwendung hinterlegt, basieren jedoch auf den KI-generierten Empfehlungen im Lernplan.

### 7.2.4 Screenshots im Anhang

*(Hinweis: Die Screenshots sollten folgende Screens zeigen:)*
- *Screenshot 1: Welcome Page mit CTA*
- *Screenshot 2: API-Key Eingabeseite*
- *Screenshot 3: Module Upload mit extrahierten Daten*
- *Screenshot 4: Wochenplaner mit ausgewählten Zeitslots*
- *Screenshot 5: Generierter Lernplan in Kalenderansicht*
- *Screenshot 6: Expandierte Session-Details mit Lernmethode*
- *Screenshot 7: Module Learning Guide Übersicht*

## 7.3 Limitations and Technical Constraints

### 7.3.1 Technische Grenzen

Die entwickelte Prototyp-Anwendung unterliegt mehreren technischen Limitierungen, die sowohl aus architektonischen Entscheidungen als auch aus den verwendeten Technologien resultieren:

**Kontextlänge und Token-Limits:**
Die Nutzung der OpenAI GPT-4o-mini API unterliegt inhärenten Token-Beschränkungen:
- **Input-Limit**: Maximal 128.000 Tokens pro Request
- **Output-Limit**: Maximal 16.384 Tokens pro Response

Bei der Verarbeitung umfangreicher Modulbeschreibungen oder der Generierung sehr detaillierter Lernpläne können diese Grenzen erreicht werden. Dies kann zu unvollständigen Extraktionen oder abgeschnittenen Lernplänen führen. Die Anwendung implementiert zwar Error-Handling für solche Fälle, eine automatische Chunking-Strategie für überlange Dokumente existiert jedoch noch nicht.

**Latenz und Netzwerkabhängigkeit:**
Die direkte Client-seitige Kommunikation mit der OpenAI API führt zu spürbaren Wartezeiten:
- **Modul-Extraktion**: 5-15 Sekunden pro PDF (abhängig von Komplexität und Länge)
- **Lernplan-Generierung**: 10-30 Sekunden (abhängig von Anzahl der Module und Zeitfenster)
- **Learning Guide**: 15-40 Sekunden pro Modul

Diese Latenz ist für Nutzer wahrnehmbar, wird jedoch durch Loading-Indikatoren kommuniziert. Eine serverseitige Implementierung mit Caching-Mechanismen könnte die User Experience hier deutlich verbessern.

**Fehlende Persistenz:**
Die aktuelle Implementierung speichert alle Daten ausschließlich im Browser-LocalStorage:
- **Begrenzte Kapazität**: Typischerweise 5-10 MB pro Origin
- **Keine Synchronisation**: Daten existieren nur auf dem genutzten Gerät und Browser
- **Datenverlust-Risiko**: Cache-Löschung oder Browser-Wechsel führt zu vollständigem Datenverlust
- **Keine Versionierung**: Änderungen am Lernplan überschreiben vorherige Versionen ohne Backup

Für einen produktiven Einsatz wäre eine Backend-Lösung mit Datenbank-Persistenz notwendig, um Multi-Device-Zugriff und langfristige Datensicherheit zu gewährleisten.

**PDF-Verarbeitungsgrenzen:**
Die PDF-Extraktion mittels PDF.js unterliegt mehreren Einschränkungen:
- **Bildbasierte PDFs**: Gescannte Dokumente ohne OCR-Verarbeitung können nicht gelesen werden
- **Komplexe Layouts**: Mehrspaltige oder tabellarische Layouts können zu fehlerhafter Textextraktion führen
- **Verschlüsselte Dateien**: Passwortgeschützte oder DRM-geschützte PDFs sind nicht verarbeitbar
- **Dateigröße**: Sehr große PDFs (>50 MB) können zu Performance-Problemen führen

**Browser-Kompatibilität:**
Die Anwendung nutzt moderne Web-APIs und ist auf aktuelle Browser-Versionen angewiesen:
- **Minimum-Anforderungen**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **LocalStorage-Abhängigkeit**: Private/Incognito-Modi können eingeschränkte Funktionalität aufweisen
- **File API**: Ältere Browser unterstützen möglicherweise keine Drag-and-Drop-Funktionalität

**Keine Offline-Funktionalität:**
Da alle intelligenten Features API-Calls erfordern, ist die Anwendung vollständig von einer Internetverbindung abhängig. Eine Progressive Web App (PWA) Implementierung mit Service Workers könnte hier zumindest grundlegende Offline-Funktionalität ermöglichen.

**Skalierbarkeit:**
Die clientseitige Verarbeitung limitiert die Skalierbarkeit:
- **Performance-Degradation**: Bei vielen Modulen (>10) oder umfangreichen Semesterplänen kann die UI träge werden
- **Memory-Constraints**: Große JSON-Strukturen im State können zu erhöhtem RAM-Verbrauch führen
- **API-Rate-Limits**: OpenAI-Rate-Limits könnten bei simultaner Nutzung durch viele User erreicht werden

### 7.3.2 Ethische und datenschutzrechtliche Überlegungen

Neben technischen Limitierungen ergeben sich aus dem Einsatz von KI-Technologie und der Verarbeitung persönlicher Studiendaten auch ethische und rechtliche Fragestellungen:

**Datenspeicherung und -verarbeitung:**

*Lokale vs. Cloud-Speicherung:*
Die aktuelle Architektur speichert alle Daten lokal im Browser, was sowohl Vor- als auch Nachteile mit sich bringt:

*Vorteile:*
- **Datensouveränität**: Nutzer behalten vollständige Kontrolle über ihre Daten
- **DSGVO-Konformität**: Keine Übertragung personenbezogener Daten an Drittserver (außer OpenAI)
- **Keine Backend-Infrastruktur**: Reduzierte Komplexität und potenzielle Angriffsfläche

*Nachteile:*
- **Fehlende Backup-Strategie**: Datenverlust bei Browser-Cache-Löschung
- **OpenAI-Datenfluss**: Modulinformationen und Lerninhalte werden an OpenAI übermittelt

*OpenAI Data Processing Agreement:*
Gemäß den OpenAI API-Nutzungsbedingungen werden API-Anfragen für bis zu 30 Tage zur Missbrauchserkennung gespeichert, danach aber nicht für Modelltraining verwendet (Stand: Dezember 2024). Dennoch müssen Nutzer darauf hingewiesen werden, dass:
- Modulinhalte und Prüfungstermine an einen US-amerikanischen Anbieter übermittelt werden
- Potenziell sensible Studieninformationen verarbeitet werden
- Die API-Key-Verwaltung in Nutzerverantwortung liegt

Für einen DSGVO-konformen Produktiveinsatz wären erforderlich:
1. Explizite Einwilligungserklärung vor API-Nutzung
2. Transparente Datenschutzerklärung mit Details zur OpenAI-Verarbeitung
3. Auftragsverarbeitungsvertrag (AVV) mit OpenAI
4. Opt-out-Möglichkeit aus Datenverarbeitung

**Vertrauen in AI-Generierte Inhalte:**

Die Anwendung generiert Lernpläne und Empfehlungen durch ein Large Language Model, was mehrere Risiken birgt:

*Halluzination und Faktenfehler:*
LLMs können plausibel klingende, aber faktisch falsche Informationen generieren. Im Kontext der StudyPlanner-Anwendung könnte dies bedeuten:
- Falsche Zeitschätzungen für Lernaufwand
- Ungeeignete Lernmethoden-Empfehlungen
- Fehlerhafte Interpretation von Modulinhalten

*Mangelnde Individualisierung:*
Obwohl die Pläne "personalisiert" wirken, basieren sie auf generischen Prompts und berücksichtigen nicht:
- Individuelle Lerngeschwindigkeit und Vorkenntnisse
- Persönliche Lernpräferenzen und -stile
- Gesundheitliche oder soziale Faktoren
- Andere akademische oder persönliche Verpflichtungen

*Abhängigkeit und kritisches Denken:*
Die Automatisierung der Lernplanung könnte dazu führen, dass Studierende:
- Unkritisch AI-Empfehlungen folgen ohne eigene Reflexion
- Metakognitive Fähigkeiten zur Selbstorganisation nicht entwickeln
- Bei technischen Problemen keine Backup-Strategien haben

**Verantwortungsvolle AI-Nutzung:**

Um diese Risiken zu mitigieren, implementiert der Prototyp mehrere Maßnahmen:

*Transparenz:*
- Klare Kennzeichnung aller AI-generierten Inhalte mit Sparkles-Icon
- Erklärungen zur Funktionsweise der Lernmethoden
- Hinweise, dass Pläne als Vorschlag zu verstehen sind

*User Agency:*
- Möglichkeit zur manuellen Bearbeitung extrahierter Moduldaten
- Export-Funktion für externe Weiterverarbeitung
- Regenerierungs-Option bei unzufriedenstellenden Ergebnissen

*Pädagogische Fundierung:*
Die verwendeten Prompts referenzieren wissenschaftlich validierte Lernprinzipien:
- Spaced Repetition (Ebbinghaus)
- Active Recall (Karpicke & Roediger)
- Interleaving und Deep Work (Newport)

Dennoch bleibt die Notwendigkeit einer **kritischen Nutzerbildung**: Studierende sollten die Anwendung als Unterstützungswerkzeug verstehen, nicht als Ersatz für eigene Planung und Selbstreflexion.

**Barrierefreiheit und Inklusion:**

Der aktuelle Prototyp berücksichtigt nicht ausreichend:
- **Screen Reader-Kompatibilität**: Unzureichende ARIA-Labels für assistive Technologien
- **Keyboard-Navigation**: Nicht alle Interaktionen sind ohne Maus zugänglich
- **Farbkontraste**: Möglicherweise unzureichend für sehbehinderte Nutzer
- **Sprachliche Barrieren**: Anwendung nur auf Deutsch verfügbar

Für einen inklusiven Produktiveinsatz wären Accessibility-Audits und entsprechende Anpassungen erforderlich.

**Kostenmodell und soziale Gerechtigkeit:**

Die Anforderung eines persönlichen OpenAI API-Keys schafft eine finanzielle Barriere:
- Kosten von ca. €0.15-0.50 pro Lernplan-Generierung
- Notwendigkeit einer Kreditkarte für API-Account
- Potenzieller Ausschluss finanziell benachteiligter Studierender

Ein nachhaltiges Produktmodell müsste entweder:
1. Eine kostenlose Basis-Funktionalität ohne AI anbieten
2. Ein Fair-Use-Kontingent über institutionelle Lizenzen bereitstellen
3. Alternative, kostenlose LLM-Backends integrieren (z.B. lokale Modelle)

### 7.3.3 Zukünftige Verbesserungspotenziale

Aus den identifizierten Limitierungen ergeben sich mehrere Ansatzpunkte für Weiterentwicklungen:

**Technisch:**
- Backend-Service mit Datenbank-Persistenz
- Caching-Layer für API-Responses
- Progressive Web App für Offline-Funktionalität
- Chunking-Strategie für große Dokumente
- Batch-Processing für API-Calls

**Funktional:**
- Manuelle Anpassung generierter Pläne
- Import/Export in Standard-Kalenderformate (iCal)
- Reminder und Push-Benachrichtigungen
- Fortschritts-Tracking und Completion-Checkboxen
- Kollaborative Features für Lerngruppen

**Ethisch:**
- Umfassende Datenschutzerklärung und Consent-Management
- Explizite Disclaimer zu AI-Limitierungen
- Accessibility-Verbesserungen nach WCAG 2.1
- Mehrsprachige Unterstützung
- Self-Hosting-Option für datenschutzsensible Institutionen

Trotz der aufgeführten Limitierungen demonstriert der Prototyp erfolgreich das Potenzial KI-gestützter Werkzeuge für die akademische Selbstorganisation. Die identifizierten Einschränkungen sind bekannt und dokumentiert, bilden die Grundlage für iterative Verbesserungen in zukünftigen Versionen.
