# 🔍 TIEFE ANALYSE: Two-Prompt Architecture

## PROBLEM-STATEMENT
Die App generiert ungültige Daten: Sessions mit Daten vor `startDate` oder nach `lastExamDate`, zu wenige Sessions, Module ohne Sessions.

---

## 1️⃣ DATA FLOW ANALYSE

### Input (StudyPlanGenerator.tsx)
```
startDate = new Date()  // HEUTE!  ⚠️ PROBLEM!
lastExamDate = letzte Prüfung + 21 Tage
timeSlots = [
  { day: "Montag", startTime: "17:00", endTime: "20:00" },
  { day: "Freitag", startTime: "14:00", endTime: "16:00" },
  ...
]

planningData = {
  startDate: "2025-12-16",       // HEUTE in ISO Format
  endDate: "2026-04-02",         // + 21 Tage nach letzter Prüfung
  modules: [...],
  availableTimeSlots: [...]
}
```

### DISTRIBUTION PROMPT (PROMPT 1)
**Input:**
- `{planningData}` - Komplette Modulinformationen
- `{weeksBetween}` - Anzahl Wochen (z.B. 16)
- `{totalSlotsPerWeek}` - Slots pro Woche (z.B. 5)

**Output (distribution):**
```json
{
  "distribution": [
    {
      "weekNumber": 1,
      "slots": [
        {
          "dayOfWeek": "Montag",
          "startTime": "09:00",
          "endTime": "11:00",
          "module": "Modulname"
        }
      ]
    }
  ]
}
```

**Problem:** Der Prompt generiert `dayOfWeek` ("Montag") aber **NICHT das echte Datum**!

### SCHEDULING PROMPT (PROMPT 2)
**Input:**
- `{planningData}` - Gleiche Daten wie PROMPT 1
- `{distribution}` - Output aus PROMPT 1

**Expected Output:**
```json
{
  "sessions": [
    {
      "date": "YYYY-MM-DD",        // Soll errechnet werden aus weekNumber + dayOfWeek
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "module": "Modulname",
      ...
    }
  ]
}
```

**Problem:** Der Prompt soll `date` berechnen, aber:
- GPT hat die Berechnung nicht richtig verstanden
- `dayOfWeek` ist Deutsch ("Montag"), nicht Englisch oder numerisch
- Die Beispiel-Berechnung ist ungenau

---

## 2️⃣ KRITISCHE FEHLER IDENTIFIZIERT

### ❌ FEHLER 1: startDate = TODAY ist FALSCH
```typescript
// StudyPlanGenerator.tsx Line 438
const startDate = new Date();  // ← HEUTE!
```

**Problem:**
- Wenn heute = 2025-12-16
- Und erste Slot = Montag 09:00
- Aber heute ist Dienstag
- Dann gibt es KEINE Montag-Session diese Woche!

**Sollte sein:** Nächster Montag oder nächster Slot-Tag

### ❌ FEHLER 2: Distribution gibt dayOfWeek (Deutsch) zurück
DISTRIBUTION-Prompt Output:
```json
{
  "dayOfWeek": "Montag",  // ← Problem: Deutsch, keine Nummer!
  "startTime": "09:00"
}
```

SCHEDULING-Prompt erwartet zu berechnen:
```
date = startDate + ((weekNumber - 1) * 7) + (dayOfWeek_offset)
```

Aber wie ordnet GPT "Montag" zu 0, "Dienstag" zu 1, etc.? **Nicht konsistent!**

### ❌ FEHLER 3: Distribution gibt Zeitfenster vor, die nicht existent sind
**Input zu DISTRIBUTION:**
```json
"availableTimeSlots": [
  { "day": "Montag", "startTime": "17:00", "endTime": "20:00" },
  { "day": "Freitag", "startTime": "14:00", "endTime": "16:00" }
]
```

**Output von DISTRIBUTION (FALSCH):**
```json
{
  "dayOfWeek": "Montag",
  "startTime": "09:00",   // ← NICHT in availableTimeSlots!
  "endTime": "11:00"
}
```

Der Prompt sagt "Nutze die TimeSlots" aber GPT generiert andere Zeiten!

### ❌ FEHLER 4: Keine Session-Validierung in Distribution
DISTRIBUTION gibt "Modulverteilung" zurück, aber:
- Überprüft nicht ob alle Slots gefüllt sind
- Überprüft nicht ob Datums-Grenzen eingehalten werden
- Gibt nur Wochenübersicht, nicht konkrete Daten

### ❌ FEHLER 5: Datum-Berechnung ist zu vage im Scheduling Prompt
```
date = startDate + ((weekNumber - 1) * 7) + (dayOfWeek_offset)
```

Aber GPT weiß nicht:
- Ist `startDate` ISO Format oder JavaScript Date?
- Wie wird "Montag" zu numerischem Offset?
- Was wenn `startDate` nicht Montag ist?

---

## 3️⃣ LÖSUNGS-VORSCHLÄGE

### 🔧 LÖSUNG 1: StartDate auf nächsten Slot-Tag setzen
```typescript
// Berechne nächsten vorhandenen Slot-Tag
const daysUntilNextSlot = berechneNächstenSlotTag(new Date(), actualTimeSlots);
const startDate = new Date();
startDate.setDate(startDate.getDate() + daysUntilNextSlot);
```

### 🔧 LÖSUNG 2: Distribution soll KONKRETE Daten zurückgeben
**Neuer Output-Format:**
```json
{
  "distribution": [
    {
      "date": "2025-12-22",      // Konkretes Datum!
      "startTime": "09:00",
      "endTime": "11:00",
      "module": "Modulname"
    }
  ]
}
```

**Vorteil:** Kein Rechenverfahren nötig, Scheduling kann direkt verwenden!

### 🔧 LÖSUNG 3: Distribution soll VALIDIERUNG machen
- Prüfe ob alle TimeSlots genutzt werden
- Prüfe ob Daten innerhalb des Zeitraums liegen
- Prüfe ob Module nicht nach Deadline eingeplant werden
- Gib Warnungen aus wenn Validierung fehlschlägt

### 🔧 LÖSUNG 4: Scheduling soll einfacher werden
Wenn Distribution bereits KONKRETE Daten liefert:
- Scheduling braucht nur noch Details hinzufügen (topic, description, learningMethod)
- Keine komplexe Datums-Berechnung mehr
- Weniger Fehlerquellen

### 🔧 LÖSUNG 5: Validierung im Frontend verstärken
```typescript
// Nach Scheduling Response:
validatedSessions.forEach(session => {
  if (new Date(session.date) < minDate) {
    // ← Setzt nie durch weil Distribution falsche Daten macht
  }
});
```

---

## 4️⃣ ARCHITEKTUR-REDESIGN

### AKTUELL (FEHLERHAFT):
```
Distribution-Prompt
├─ Input: planningData, weeksBetween, totalSlotsPerWeek
├─ Output: Wochenübersicht mit dayOfWeek (Deutsch)
└─ Problem: Keine konkreten Daten

Scheduling-Prompt
├─ Input: planningData, distribution
├─ Aufgabe: Datum berechnen aus weekNumber + dayOfWeek
└─ Problem: GPT rechnet falsch, gibt ungültige Daten
```

### BESSER:
```
Distribution-Prompt
├─ Input: planningData, weeksBetween, totalSlotsPerWeek
├─ Output: Konkrete Slot-Liste mit Daten & Zeiten
└─ Benefit: Vollständig validiert

Scheduling-Prompt
├─ Input: planningData, distribution (mit echten Daten)
├─ Aufgabe: Details hinzufügen (topic, method, etc.)
└─ Benefit: Einfacher, weniger Fehler
```

---

## 5️⃣ KONKRETE ÄNDERUNGEN

### ÄNDERUNG 1: Distribution-Prompt Update
```typescript
// Statt dayOfWeek: "Montag" → Konkretes Datum
AUSGABEFORMAT: {
  "distribution": [
    {
      "date": "2025-12-22",        // ISO 8601
      "startTime": "09:00",        // Aus availableTimeSlots!
      "endTime": "11:00",
      "module": "Modulname"
    }
  ],
  "validationReport": {
    "totalSlots": 50,
    "slotsCovered": 50,
    "allTimeSlotsBelongToAvailable": true,
    "datesWithinBounds": true
  }
}
```

### ÄNDERUNG 2: Scheduling wird simpler
```typescript
// Nicht mehr: "berechne Datum aus weekNumber + dayOfWeek"
// Sondern: "nutze das Datum aus der Distribution"

AUFGABE:
1. Für JEDEN Slot aus distribution:
   - Kopiere date, startTime, endTime
   - Füge topic, description, learningMethod hinzu
2. Verwende planningData nur noch für Inhalte
```

### ÄNDERUNG 3: Validierung stärken
```typescript
// Frontend-Validierung aktualisieren:
if (new Date(session.date) < new Date(planningData.startDate)) {
  // Wenn das noch vorkommt = Distribution hat Fehler gemacht
  // → Neu generieren statt zu skippen
}
```

---

## 6️⃣ WARUM DAS BESSER IST

| Aspekt | Aktuell | Besser |
|--------|---------|--------|
| **Distribution Output** | Wochenübersicht (vage) | Konkrete Slot-Liste |
| **Datum-Berechnung** | Im Scheduling-Prompt (Fehleranfällig) | In Distribution-Prompt (direkter) |
| **Validierung** | Im Frontend (zu spät) | In Distribution (früh) |
| **Scheduling Komplexität** | Hoch (rechnen + details) | Niedrig (nur details) |
| **Fehlerquellen** | 5+ | 2 |

---

## 7️⃣ IMPLEMENTIERUNGS-REIHENFOLGE

1. **PROMPT 1 Update:** Distribution gibt konkrete Daten zurück
2. **PROMPT 2 Update:** Scheduling nutzt die konkreten Daten
3. **Parsing Update:** Anpassung an neues Format
4. **Validierung:** Strengere Frontend-Prüfung
5. **Testen:** Mit verschiedenen Inputs (small, large, edge cases)

---

## ⚠️ KRITISCHE ERKENNTNISSE

1. **Architektur-Fehler:** Zwei Prompts teilen sich Responsibilities zu vage
2. **Ausgabe-Format:** Distribution-Output ist zu abstrakt für Scheduling-Input
3. **Fehler-Kaskade:** Fehler in PROMPT 1 führen zu ungültigen Sessions in PROMPT 2
4. **Validierung zu spät:** Frontend-Validierung kann Distribution-Fehler nicht korrigieren

---

## 📋 NÄCHSTE SCHRITTE

- [ ] Distribution-Prompt umschreiben: Konkrete Daten statt Wochenübersicht
- [ ] Scheduling-Prompt vereinfachen: Nur noch Details-Hinzufügung
- [ ] Neues Output-Format testen mit konkretem Beispiel
- [ ] Frontend-Validierung anpassen
- [ ] Vollständigen Flow testen (small content, dann large)
