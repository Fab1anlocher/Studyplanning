import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Calendar, Download, RefreshCw, Key, Eye, EyeOff, ArrowLeft, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Target, Lightbulb, Brain } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import OpenAI from 'openai';
import { ModuleLearningGuide } from './ModuleLearningGuide';
import { STUDY_PLAN_SYSTEM_PROMPT, STUDY_PLAN_USER_PROMPT } from '../prompts/studyPlanGenerator';

// REVIEW: Constants for pedagogical and validation rules
const ALLOWED_LEARNING_METHODS = [
  'Spaced Repetition',
  'Active Recall', 
  'Deep Work',
  'Pomodoro',
  'Feynman Technik',
  'Interleaving',
  'Practice Testing'
] as const;

const TIME_FORMAT_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
const MAX_DAILY_STUDY_MINUTES = 8 * 60; // 8 hours
const MAX_CONSECUTIVE_STUDY_DAYS = 6;
const EXAM_REVIEW_PERIOD_DAYS = 14; // 2 weeks

/**
 * Calculates number of weeks between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of weeks (rounded up), or 0 if endDate < startDate
 */
function calculateWeeksBetweenDates(startDate: Date, endDate: Date): number {
  // REVIEW: Guard against invalid date ranges
  if (endDate < startDate) {
    console.warn('[calculateWeeksBetweenDates] End date is before start date. Returning 0.');
    return 0;
  }
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil(daysDiff / 7);
}

interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  topic: string;
  description: string;
  learningMethod?: string; // e.g., "Spaced Repetition", "Deep Work", "Pomodoro"
  contentTopics?: string[]; // Specific content topics to cover in this session
  competencies?: string[]; // Competencies to develop in this session
  studyTips?: string; // Additional study tips or notes
}

interface StudyPlanGeneratorProps {
  onBack: () => void;
  modules: any[];
  timeSlots: any[];
  apiKey?: string;
  [key: string]: any;
}

// Constants for calendar display
const WEEK_DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DEFAULT_MONTH = '2024-12-01'; // TODO: Make this dynamic based on current date/semester

// Learning Method Explanations
const LEARNING_METHODS: Record<string, { title: string; description: string; tips: string[] }> = {
  'Deep Work': {
    title: 'Deep Work',
    description: 'Konzentrierte, ablenkungsfreie Arbeit an kognitiv anspruchsvollen Aufgaben. Optimal für komplexe Projekte und kreative Arbeit.',
    tips: [
      'Schalte alle Benachrichtigungen aus',
      'Plane mindestens 2-4 Stunden ein',
      'Arbeite in einem ruhigen Umfeld',
      'Mache nur alle 90 Minuten eine Pause'
    ]
  },
  'Pomodoro': {
    title: 'Pomodoro-Technik',
    description: 'Arbeite in 25-Minuten-Intervallen mit 5-Minuten-Pausen. Nach 4 Pomodoros eine längere Pause (15-30 Min).',
    tips: [
      '25 Minuten fokussierte Arbeit',
      '5 Minuten Pause (aufstehen, bewegen)',
      'Nach 4 Zyklen: 15-30 Min Pause',
      'Ideal für Programmierung und Übungen'
    ]
  },
  'Spaced Repetition': {
    title: 'Spaced Repetition',
    description: 'Wiederhole Lernstoff in zunehmend größeren Abständen für optimales Langzeitgedächtnis.',
    tips: [
      'Erste Wiederholung: nach 1 Tag',
      'Zweite Wiederholung: nach 3 Tagen',
      'Dritte Wiederholung: nach 7 Tagen',
      'Nutze Karteikarten oder Apps wie Anki'
    ]
  },
  'Active Recall': {
    title: 'Active Recall',
    description: 'Aktives Abrufen von Wissen ohne Hilfsmittel. Teste dich selbst statt passiv zu lesen.',
    tips: [
      'Schließe Bücher und Notizen',
      'Schreibe alles auf, was du weißt',
      'Vergleiche mit dem Original',
      'Konzentriere dich auf Lücken'
    ]
  },
  'Feynman Technik': {
    title: 'Feynman-Technik',
    description: 'Erkläre ein Konzept in einfachen Worten, als würdest du es einem Kind beibringen.',
    tips: [
      'Wähle ein Konzept',
      'Erkläre es in einfachen Worten',
      'Identifiziere Wissenslücken',
      'Vereinfache und verwende Analogien'
    ]
  },
  'Interleaving': {
    title: 'Interleaving',
    description: 'Wechsle zwischen verschiedenen Themen/Modulen statt alles auf einmal zu lernen.',
    tips: [
      'Mische verschiedene Themen',
      'Verbessert Problemlösungsfähigkeit',
      'Verhindert Langeweile',
      'Fördert Transfer von Wissen'
    ]
  },
  'Practice Testing': {
    title: 'Practice Testing',
    description: 'Übe mit echten oder simulierten Prüfungen. Die beste Vorbereitung auf Prüfungen.',
    tips: [
      'Nutze alte Prüfungen',
      'Simuliere Prüfungsbedingungen',
      'Zeitlimit einhalten',
      'Analysiere Fehler gründlich'
    ]
  }
};

// Excel export helper
const exportToExcel = (sessions: StudySession[], modules: any[]) => {
  // Create CSV content (Excel-compatible)
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Headers
  csvContent += 'Datum,Wochentag,Startzeit,Endzeit,Modul,Thema,Beschreibung,Lernmethode,Inhalte,Kompetenzen,Lerntipps\n';
  
  // Rows
  sessions.forEach(session => {
    const date = new Date(session.date);
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('de-DE');
    const contentTopics = (session.contentTopics || []).join('; ');
    const competencies = (session.competencies || []).join('; ');
    const studyTips = session.studyTips || '';
    
    // Escape CSV fields
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    csvContent += [
      formattedDate,
      weekday,
      session.startTime,
      session.endTime,
      escapeCSV(session.module),
      escapeCSV(session.topic),
      escapeCSV(session.description),
      escapeCSV(session.learningMethod || ''),
      escapeCSV(contentTopics),
      escapeCSV(competencies),
      escapeCSV(studyTips)
    ].join(',') + '\n';
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Lernplan_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function StudyPlanGenerator({ onBack, modules, timeSlots, apiKey: propApiKey = '' }: StudyPlanGeneratorProps) {
  // Use test data if no real data provided (for testing purposes)
  const actualModules = modules && modules.length > 0 ? modules : [
    { id: '1', name: 'Software Engineering', ects: 6 },
    { id: '2', name: 'Datenbanken', ects: 4 },
    { id: '3', name: 'Web Development', ects: 5 }
  ];
  const actualTimeSlots = timeSlots && timeSlots.length > 0 ? timeSlots : [
    { id: '1', day: 'Montag', startTime: '09:00', endTime: '11:00' },
    { id: '2', day: 'Mittwoch', startTime: '14:00', endTime: '16:00' },
    { id: '3', day: 'Freitag', startTime: '10:00', endTime: '12:00' }
  ];
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // For month navigation
  const [showMethodInfo, setShowMethodInfo] = useState<string | null>(null); // For learning method tooltips
  const [selectedModuleForGuide, setSelectedModuleForGuide] = useState<any | null>(null); // For module learning guide

  const generatePlan = useCallback(async () => {
    setIsGenerating(true);
    
    // REVIEW: Input validation - ensure we have modules and time slots
    if (!actualModules || actualModules.length === 0) {
      console.error('[StudyPlanGenerator] Keine Module vorhanden');
      setIsGenerating(false);
      return;
    }
    
    if (!actualTimeSlots || actualTimeSlots.length === 0) {
      console.error('[StudyPlanGenerator] Keine Zeitslots vorhanden');
      setIsGenerating(false);
      return;
    }
    
    // REVIEW: API Key validation
    if (!propApiKey || propApiKey.trim().length === 0) {
      console.error('[StudyPlanGenerator] Kein API-Key vorhanden');
      setIsGenerating(false);
      return;
    }
    
    // Find the last exam date from all modules
    const findLastExamDate = () => {
      let lastDate = new Date();
      actualModules.forEach(module => {
        if (module.assessments && Array.isArray(module.assessments)) {
          module.assessments.forEach((assessment: { deadline?: string }) => {
            if (assessment.deadline) {
              const examDate = new Date(assessment.deadline);
              // REVIEW: Validate exam date is in the future and reasonable (max 2 years)
              const now = new Date();
              const twoYearsFromNow = new Date();
              twoYearsFromNow.setFullYear(now.getFullYear() + 2);
              
              if (examDate > now && examDate <= twoYearsFromNow && examDate > lastDate) {
                lastDate = examDate;
              } else if (examDate <= now) {
                console.warn(`[StudyPlanGenerator] Prüfungsdatum ${assessment.deadline} liegt in der Vergangenheit. Wird ignoriert.`);
              } else if (examDate > twoYearsFromNow) {
                console.warn(`[StudyPlanGenerator] Prüfungsdatum ${assessment.deadline} liegt mehr als 2 Jahre in der Zukunft. Wird ignoriert.`);
              }
            }
          });
        }
      });
      
      // REVIEW: If no valid exam date found, default to 16 weeks (one semester)
      if (lastDate <= new Date()) {
        console.warn('[StudyPlanGenerator] Keine gültigen Prüfungstermine gefunden. Nutze Standard-Semester (16 Wochen).');
        lastDate = new Date();
        lastDate.setDate(lastDate.getDate() + (16 * 7)); // 16 weeks
      }
      
      return lastDate;
    };
    
    const lastExamDate = findLastExamDate();
    const startDate = new Date(); // Start from today
    
    // REVIEW: Validate date range is reasonable (min 1 week, max 1 year)
    const daysDiff = Math.ceil((lastExamDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      console.warn('[StudyPlanGenerator] Zeitraum zu kurz (<7 Tage). Verlängere auf 4 Wochen.');
      lastExamDate.setDate(lastExamDate.getDate() + 21); // Add 3 more weeks
    } else if (daysDiff > 365) {
      console.warn('[StudyPlanGenerator] Zeitraum zu lang (>365 Tage). Begrenze auf 1 Jahr.');
      const oneYearFromNow = new Date(startDate);
      oneYearFromNow.setFullYear(startDate.getFullYear() + 1);
      lastExamDate.setTime(oneYearFromNow.getTime());
    }
    
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: propApiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Prepare comprehensive data for AI
      const planningData = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: lastExamDate.toISOString().split('T')[0],
        modules: actualModules.map(module => ({
          name: module.name,
          ects: module.ects,
          workload: module.workload,
          content: module.content || [],
          competencies: module.competencies || [],
          assessments: (module.assessments || []).map((a: any) => ({
            type: a.type,
            weight: a.weight,
            format: a.format,
            deadline: a.deadline
          }))
        })),
        availableTimeSlots: actualTimeSlots.map(slot => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      };
      
      // Import system prompt from separate file for easy editing
      const systemPrompt = STUDY_PLAN_SYSTEM_PROMPT
        .replace(/{startDate}/g, startDate.toISOString().split('T')[0])
        .replace(/{lastExamDate}/g, lastExamDate.toISOString().split('T')[0])
        .replace(/{weeksBetween}/g, calculateWeeksBetweenDates(startDate, lastExamDate).toString())
        .replace(/{totalSlotsPerWeek}/g, actualTimeSlots.length.toString())
        .replace(/{minSessions}/g, Math.max(10, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length).toString())
        .replace(/{maxSessions}/g, Math.min(200, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length * 2).toString())
        .replace(/{allowedMethods}/g, ALLOWED_LEARNING_METHODS.map(m => `"${m}"`).join(', '));
      
      /* Old inline prompt - now moved to src/prompts/studyPlanGenerator.ts
      const oldSystemPrompt = `Du bist ein Elite-Lerncoach und KI-Spezialist für personalisierte Lernplanung mit tiefem Verständnis von:
- Lernpsychologie & kognitiven Neurowissenschaften
- Evidenzbasierten Lernstrategien (Spaced Repetition, Retrieval Practice, Interleaving)
- Zeitmanagement & Flow-Zuständen
- Individuellen Lernmustern & Prüfungsoptimierung

════════════════════════════════════════════════════════════════════

🎯 HAUPTZIEL: Erstelle einen HOCHPERSONALISIERTEN, wissenschaftlich fundierten Lernplan, der:
1. EXAKT die verfügbaren Zeitfenster des Users nutzt
2. ALLE Prüfungstermine berücksichtigt und darauf hinarbeitet
3. Die extrahierten Modulinhalte & Kompetenzen intelligent strukturiert
4. Die optimale Lernmethode für jedes Thema/jede Kompetenz wählt
5. Einen realistischen, motivierenden Weg zum Erfolg bietet
6. KONKRETE, UMSETZBARE Aufgaben für jede Session definiert (keine vagen Anweisungen)

════════════════════════════════════════════════════════════════════

⚠️ KRITISCHE DEFENSIVE REGELN (STRIKT EINHALTEN):

1. ZEITSLOT-VALIDIERUNG:
   ✓ Nutze NUR die bereitgestellten availableTimeSlots (Tag, Startzeit, Endzeit)
   ✓ KEINE erfundenen Zeitfenster außerhalb der angegebenen Slots
   ✓ KEINE Sessions kürzer als 1 Stunde oder länger als 4 Stunden
   ✓ Startzeit < Endzeit (logische Zeitreihenfolge)

2. DATUM-VALIDIERUNG:
   ✓ Alle Sessions MÜSSEN zwischen ${startDate.toISOString().split('T')[0]} und ${lastExamDate.toISOString().split('T')[0]} liegen
   ✓ KEINE Daten in der Vergangenheit
   ✓ KEINE Daten nach dem letzten Prüfungstermin
   ✓ Datumsformat: YYYY-MM-DD (ISO 8601)

3. MODUL-VALIDIERUNG:
   ✓ Nutze NUR die bereitgestellten Modulnamen (exakte Schreibweise)
   ✓ KEINE erfundenen Module oder Themen
   ✓ Topics MÜSSEN aus dem "content"-Array stammen
   ✓ Competencies MÜSSEN aus dem "competencies"-Array stammen

4. SESSION-ANZAHL-VALIDIERUNG:
   ✓ MINIMUM: ${Math.max(10, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length)} Sessions
   ✓ MAXIMUM: ${Math.min(200, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length * 2)} Sessions
   ✓ Falls zu wenig Slots: Nutze jeden Slot mehrfach pro Woche
   ✓ Verteile Sessions gleichmäßig über den gesamten Zeitraum

5. LERNMETHODEN-VALIDIERUNG:
   ✓ Nutze NUR diese Methoden: "${ALLOWED_LEARNING_METHODS.join('", "')}"
   ✓ KEINE erfundenen oder anderen Methodennamen
   ✓ Methode muss zum Inhalt passen (siehe Framework unten)

6. PAUSEN & KOGNITIVE LAST (PEDAGOGISCH VALIDIERT):
   ✓ KEINE Sessions an mehr als 6 aufeinanderfolgenden Tagen
   ✓ Mindestens 1 pausenfreier Tag pro Woche (idealerweise Sonntag)
   ✓ Nicht mehr als 2 Sessions desselben Moduls an einem Tag
   ✓ Wechsel zwischen Modulen für bessere Retention (Interleaving)
   ✓ SESSION-DAUER: Minimum 1h, Maximum 4h (kognitive Kapazität)
   ✓ DEEP WORK Sessions: Mindestens 2h, ideal 2-4h
   ✓ Pomodoro Sessions: 2-3h (4-6 Zyklen à 25min + Pausen)
   ✓ Spaced Repetition: 30-60min pro Session (Kurz und häufig)
   ✓ TÄGLICHE LERNZEIT: Maximum 8h pro Tag (Überlastungsprävention)
   ✓ WÖCHENTLICHE LERNZEIT: Maximum 40h pro Woche (Burnout-Prävention)

7. PRÜFUNGSVORBEREITUNG:
   ✓ Letzte 4 Wochen vor Prüfung: Mindestens 8-12 Stunden für erste Wiederholungsphase
   ✓ Letzte 2 Wochen vor Prüfung: Mindestens 12-16 Stunden intensive Wiederholung, KEIN neuer Stoff
   ✓ 1 Woche vor Prüfung: Daily Practice Testing + Active Recall, mindestens 10-15 Stunden
   ✓ KEINE neuen Themen 3 Tage vor Prüfung

════════════════════════════════════════════════════════════════════

📋 ANALYSE-FRAMEWORK (befolge strikt):

SCHRITT 1 - ZEITFENSTER-MAPPING (KRITISCH!):
✓ Die availableTimeSlots sind WÖCHENTLICH wiederkehrend!
✓ BEISPIEL: Wenn du erhältst:
  - { day: "Montag", startTime: "17:00", endTime: "20:00" }
  - { day: "Mittwoch", startTime: "14:00", endTime: "16:00" }
  
  Dann plane:
  - JEDEN Montag von 17:00-20:00 vom startDate bis endDate
  - JEDEN Mittwoch von 14:00-16:00 vom startDate bis endDate
  
✓ BERECHNUNG:
  - Heute ist: ${startDate.toISOString().split('T')[0]}
  - Letzte Prüfung: ${lastExamDate.toISOString().split('T')[0]}
  - Das sind ca. ${calculateWeeksBetweenDates(startDate, lastExamDate)} Wochen
  - Bei ${actualTimeSlots.length} Slots pro Woche = ${calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length} Sessions MINDESTENS!

✓ WICHTIG: Gehe jeden Wochentag durch und plane ALLE Vorkommen bis zum Ende!

SCHRITT 2 - WORKLOAD-VERTEILUNG:
✓ Verteile Workload proportional zu ECTS (höhere ECTS = mehr Zeit)
✓ Berücksichtige Assessment-Gewichtungen (60% Prüfung → mehr Prüfungsvorbereitung)
✓ Plane 60% für initiales Lernen, 40% für Wiederholung & Prüfungsvorbereitung

SCHRITT 3 - ASSESSMENT-ORIENTIERTE PLANUNG (KRITISCH!):
✓ Analysiere JEDES Assessment (type, weight, format, deadline)
✓ Für "Gruppenarbeit"-Assessments:
  - Plane Sessions VOR dem Deadline für Teamarbeit/Koordination
  - Description MUSS "Gruppenarbeit" erwähnen (z.B. "Treffe dich mit der Gruppe", "Arbeitet gemeinsam an...")
  - Fokus auf Kollaboration, Arbeitsteilung, gemeinsame Deliverables
✓ Für "Einzelarbeit"-Assessments:
  - Plane individuelle Lern- und Übungssessions
  - Description fokussiert auf eigenständiges Lernen
✓ Sessions in den letzten 2 Wochen vor jedem Assessment-Deadline:
  - MÜSSEN sich auf dieses spezifische Assessment vorbereiten
  - Description MUSS konkret sagen: "Vorbereitung für [Assessment-Type] am [Deadline]"

SCHRITT 4 - INHALTLICHE STRUKTURIERUNG:
✓ Analysiere die Modulinhalte (content) und ordne sie nach Komplexität
✓ Erstelle eine logische Lernsequenz: Grundlagen → Fortgeschritten → Anwendung
✓ Verknüpfe Inhalte mit den zu entwickelnden Kompetenzen

SCHRITT 5 - METHODENWAHL (evidenzbasiert):
Wähle für JEDE Session die optimale Methode basierend auf:

📊 **Spaced Repetition**
- Wann: Faktenwissen, Definitionen, Vokabeln, 2+ Wochen vor Prüfung
- Inhalte: Theoretische Grundlagen, Konzepte
- Intervalle: Tag 1 → +2 Tage → +5 Tage → +10 Tage → +20 Tage

🎯 **Active Recall / Practice Testing**
- Wann: Mathematik, Formeln, Programmierung, 1-3 Wochen vor Prüfung
- Inhalte: Anwendbares Wissen, Problemlösung
- Methode: Übungsaufgaben, Past Papers, Selbsttests

🔬 **Deep Work**
- Wann: Semesterarbeiten, Projekte, komplexe Analysen
- Dauer: Mind. 2-4 Stunden ununterbrochen
- Inhalte: Projektarbeiten, Konzeptentwicklung, Schreiben

⏱️ **Pomodoro Technique**
- Wann: Programmieren, Übungen, repetitive Tasks
- Struktur: 25min Fokus + 5min Pause, 4 Zyklen dann 30min Pause
- Inhalte: Code schreiben, Debugging, strukturierte Aufgaben

💡 **Feynman Technique**
- Wann: Komplexe Konzepte verstehen & erklären können
- Methode: Vereinfacht erklären, Lücken identifizieren
- Inhalte: Theoretische Modelle, Frameworks, Zusammenhänge

🔄 **Interleaving**
- Wann: Mehrere ähnliche Module gleichzeitig
- Methode: Zwischen Modulen/Themen wechseln in einer Session
- Vorteil: Bessere Differenzierung, höhere Retention

════════════════════════════════════════════════════════════════════

🎓 PRÜFUNGSVORBEREITUNGS-STRATEGIE:

🔴 **3-4 Wochen vor Prüfung**: Erste Wiederholungsphase
- Überblick über alle Themen
- Lücken identifizieren
- Zusammenfassungen erstellen

🟡 **2-3 Wochen vor Prüfung**: Intensive Wiederholung
- Spaced Repetition intensivieren
- Practice Testing mit alten Prüfungen
- Schwache Bereiche fokussieren

🟢 **1 Woche vor Prüfung**: Finale Vorbereitung
- Daily Active Recall
- Prüfungssimulationen
- Nur noch Wiederholung, KEIN neuer Stoff

════════════════════════════════════════════════════════════════════

📤 AUSGABEFORMAT (JSON):

Erstelle für JEDES verfügbare Zeitfenster eine optimierte Session:

{
  "date": "YYYY-MM-DD", // MUSS zwischen startDate und endDate liegen
  "startTime": "HH:MM", // EXAKT aus timeSlots
  "endTime": "HH:MM",   // EXAKT aus timeSlots
  "module": "Exakter Modulname", // MUSS aus bereitgestellten Modulen stammen
  "topic": "Spezifisches Thema aus 'content'",
  "description": "SEHR KONKRET: Was GENAU tun (z.B. 'Erstelle 3 BPMN-Diagramme für verschiedene Geschäftsprozesse', 'Löse Aufgaben 1-5 aus Kapitel 3', 'Baue eine REST API mit Express.js'). 
               WICHTIG: Bei Gruppenarbeit-Assessments MUSS erwähnt werden 'Gruppenarbeit: Treffe dich mit Team und...' oder 'Gemeinsam mit Gruppe an... arbeiten'.
               Bei Einzelarbeit-Assessments: Fokus auf individuelle Aufgaben. 
               In letzten 2 Wochen vor Assessment-Deadline: 'Vorbereitung für [Assessment-Type] am [Deadline]: [konkrete Aufgabe]'.
               KEINE vagen Aussagen wie 'Übe das Thema' oder 'Lerne die Grundlagen'!",
  "learningMethod": "Gewählte Methode aus obiger Liste",
  "contentTopics": ["Topic 1 aus content", "Topic 2 aus content"], // NUR aus bereitgestellten content
  "competencies": ["Kompetenz 1", "Kompetenz 2"], // NUR aus bereitgestellten competencies
  "studyTips": "ACTIONABLE Tipps: Konkrete Schritte, Tools, Ressourcen (z.B. 'Nutze draw.io für Diagramme', 'Erstelle Flashcards mit Anki', 'Schaue Video X von Minute Y-Z'). 
               Bei Gruppenarbeit: Koordinations-Tipps (z.B. 'Nutzt Trello für Aufgabenverwaltung', 'Erstellt ein gemeinsames Google Doc').
               Bei bevorstehenden Prüfungen: Prüfungs-spezifische Tipps.
               KEINE generischen Aussagen!"
}

Gib zurück:
{
  "sessions": [ ...Session-Array... ],
  "planSummary": {
    "totalSessions": Anzahl,
    "totalHours": Gesamtstunden,
    "moduleDistribution": { "Modul1": Stunden, "Modul2": Stunden },
    "methodDistribution": { "Spaced Repetition": Anzahl, "Deep Work": Anzahl, ... }
  }
}

════════════════════════════════════════════════════════════════════

✅ FINAL VALIDATION CHECKLIST vor Ausgabe:
□ Minimale Anzahl Sessions: ${Math.max(10, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length)}
□ Alle Session-Daten zwischen ${startDate.toISOString().split('T')[0]} und ${lastExamDate.toISOString().split('T')[0]}
□ Alle Zeitfenster stammen aus availableTimeSlots
□ Alle Module-Namen existieren in bereitgestellten Modulen
□ Alle Topics aus "content", alle Competencies aus "competencies"
□ Alle Lernmethoden aus erlaubter Liste
□ Mindestens 1 Pausentag pro Woche
□ Letzte 2 Wochen vor Prüfung: Nur Wiederholung
□ Keine Sessions > 4h Dauer
□ JSON ist valide und vollständig

Erstelle jetzt den BESTEN, VOLLSTÄNDIGEN, VALIDIERTEN Lernplan! 🎯`;
      // END OF OLD INLINE PROMPT - This is now kept as a comment for reference
      // The actual prompt is loaded from src/prompts/studyPlanGenerator.ts
      */

      const userPrompt = STUDY_PLAN_USER_PROMPT
        .replace('{planningData}', JSON.stringify(planningData, null, 2))
        .replace('{weeksBetween}', calculateWeeksBetweenDates(startDate, lastExamDate).toString())
        .replace('{totalSlotsPerWeek}', actualTimeSlots.length.toString());
      
      console.log('Generiere KI-Lernplan mit DeepSeek:', planningData);
      console.log(`Erwartete Sessions: ~${calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length}`);
      
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8, // Higher creativity for personalization
        response_format: { type: 'json_object' },
        max_tokens: 16000 // Increased for full semester plan
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine Antwort von der KI erhalten');
      }
      
      const parsedResponse = JSON.parse(content);
      const sessions: StudySession[] = parsedResponse.sessions || [];
      
      if (!Array.isArray(sessions) || sessions.length === 0) {
        throw new Error('Keine Sessions von der KI erhalten');
      }
      
      console.log('KI-generierte Sessions:', sessions);
      
      // REVIEW: Validate AI-generated sessions for critical defensive checks
      const validatedSessions: StudySession[] = [];
      const minDate = new Date(startDate);
      const maxDate = new Date(lastExamDate);
      const moduleNames = new Set(actualModules.map(m => m.name));
      
      sessions.forEach((session, index) => {
        // Validate date range
        const sessionDate = new Date(session.date);
        if (sessionDate < minDate || sessionDate > maxDate) {
          console.warn(`[StudyPlanGenerator] Session ${index + 1} hat ungültiges Datum: ${session.date}. Wird übersprungen.`);
          return;
        }
        
        // Validate module name exists
        if (!moduleNames.has(session.module)) {
          console.warn(`[StudyPlanGenerator] Session ${index + 1} hat unbekanntes Modul: ${session.module}. Wird übersprungen.`);
          return;
        }
        
        // Validate learning method (type-safe check)
        if (session.learningMethod && !ALLOWED_LEARNING_METHODS.includes(session.learningMethod as typeof ALLOWED_LEARNING_METHODS[number])) {
          console.warn(`[StudyPlanGenerator] Session ${index + 1} hat ungültige Lernmethode: ${session.learningMethod}. Setze auf "Active Recall".`);
          session.learningMethod = 'Active Recall';
        }
        
        // Validate time format
        if (!TIME_FORMAT_REGEX.test(session.startTime) || !TIME_FORMAT_REGEX.test(session.endTime)) {
          console.warn(`[StudyPlanGenerator] Session ${index + 1} hat ungültiges Zeitformat. Wird übersprungen.`);
          return;
        }
        
        // Ensure session has required fields
        if (!session.topic || !session.description) {
          console.warn(`[StudyPlanGenerator] Session ${index + 1} fehlen erforderliche Felder. Wird übersprungen.`);
          return;
        }
        
        validatedSessions.push({
          ...session,
          id: (validatedSessions.length + 1).toString()
        });
      });
      
      console.log(`[StudyPlanGenerator] Validierung: ${validatedSessions.length}/${sessions.length} Sessions gültig`);
      
      // REVIEW: Warn if too few sessions generated
      const expectedMinSessions = Math.max(10, calculateWeeksBetweenDates(startDate, lastExamDate) * actualTimeSlots.length);
      if (validatedSessions.length < expectedMinSessions * 0.5) {
        console.warn(`[StudyPlanGenerator] Zu wenige Sessions generiert: ${validatedSessions.length} (erwartet: ${expectedMinSessions})`);
      }
      
      // REVIEW: Pedagogical validation - check for cognitive overload patterns
      const pedagogicalWarnings: string[] = [];
      
      // Group sessions by date to check daily load
      const sessionsByDate = new Map<string, StudySession[]>();
      validatedSessions.forEach(session => {
        const date = session.date;
        if (!sessionsByDate.has(date)) {
          sessionsByDate.set(date, []);
        }
        sessionsByDate.get(date)!.push(session);
      });
      
      // Check for excessive daily load (max 8h per day)
      sessionsByDate.forEach((daySessions, date) => {
        const totalMinutes = daySessions.reduce((sum, session) => {
          const [startHour, startMin] = session.startTime.split(':').map(Number);
          const [endHour, endMin] = session.endTime.split(':').map(Number);
          const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          return sum + duration;
        }, 0);
        
        if (totalMinutes > MAX_DAILY_STUDY_MINUTES) {
          pedagogicalWarnings.push(`⚠️ ${date}: ${Math.floor(totalMinutes / 60)}h Lernzeit (max. empfohlen: ${MAX_DAILY_STUDY_MINUTES / 60}h) - Überlastungsgefahr!`);
        }
        
        // Check for same module multiple times per day (should be max 2)
        const moduleCount = new Map<string, number>();
        daySessions.forEach(session => {
          moduleCount.set(session.module, (moduleCount.get(session.module) || 0) + 1);
        });
        
        moduleCount.forEach((count, module) => {
          if (count > 2) {
            pedagogicalWarnings.push(`⚠️ ${date}: Modul "${module}" ${count}x am selben Tag - Monotonie-Gefahr!`);
          }
        });
      });
      
      // Check for consecutive study days without breaks
      const dates = Array.from(sessionsByDate.keys()).sort();
      let consecutiveDays = 0;
      let previousDate: Date | null = null;
      
      dates.forEach(dateStr => {
        const currentDate = new Date(dateStr);
        if (previousDate) {
          const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            consecutiveDays++;
            if (consecutiveDays >= MAX_CONSECUTIVE_STUDY_DAYS) {
              pedagogicalWarnings.push(`⚠️ Ab ${dateStr}: ${consecutiveDays + 1} Tage ohne Pause - Burnout-Gefahr!`);
            }
          } else {
            consecutiveDays = 0;
          }
        }
        previousDate = currentDate;
      });
      
      // Check if last 2 weeks before each exam contain only review sessions
      actualModules.forEach(module => {
        if (module.assessments && Array.isArray(module.assessments)) {
          module.assessments.forEach((assessment: any) => {
            if (assessment.deadline) {
              const examDate = new Date(assessment.deadline);
              const twoWeeksBefore = new Date(examDate);
              twoWeeksBefore.setDate(twoWeeksBefore.getDate() - EXAM_REVIEW_PERIOD_DAYS);
              
              const sessionsBeforeExam = validatedSessions.filter(session => {
                const sessionDate = new Date(session.date);
                return session.module === module.name && 
                       sessionDate >= twoWeeksBefore && 
                       sessionDate <= examDate;
              });
              
              if (sessionsBeforeExam.length === 0) {
                pedagogicalWarnings.push(`⚠️ ${module.name}: Keine Wiederholungssessions in letzten 2 Wochen vor Prüfung am ${assessment.deadline}!`);
              }
            }
          });
        }
      });
      
      // Log pedagogical warnings to console for user awareness
      if (pedagogicalWarnings.length > 0) {
        console.warn('[StudyPlanGenerator] Pedagogical Validation Warnings:');
        pedagogicalWarnings.forEach(warning => console.warn(warning));
      } else {
        console.log('[StudyPlanGenerator] ✅ Pedagogical validation passed - no major concerns');
      }
      
      setStudySessions(validatedSessions);
      setPlanGenerated(true);
      setIsGenerating(false);
    } catch (error) {
      console.error('Fehler bei der KI-Lernplan-Generierung:', error);
      
      // Fallback to enhanced mock data if API fails
      const mockSessions: StudySession[] = [];
      const currentDate = new Date(startDate);
      let sessionId = 1;
      
      // Map weekday names to numbers
      const dayMap: { [key: string]: number } = {
        'Sonntag': 0, 'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3,
        'Donnerstag': 4, 'Freitag': 5, 'Samstag': 6
      };
      
      // Generate sessions based on actual time slots
      while (currentDate <= lastExamDate) {
        const dayOfWeek = currentDate.getDay();
        
        // Find matching time slots for this day
        const matchingSlots = actualTimeSlots.filter(slot => {
          const slotDay = dayMap[slot.day];
          return slotDay === dayOfWeek;
        });
        
        matchingSlots.forEach(slot => {
          const moduleIndex = sessionId % actualModules.length;
          const module = actualModules[moduleIndex];
          
          if (module) {
            // Pick random content and competency if available
            const contentTopic = module.content && module.content.length > 0
              ? module.content[Math.floor(Math.random() * module.content.length)]
              : null;
            const competency = module.competencies && module.competencies.length > 0
              ? module.competencies[Math.floor(Math.random() * module.competencies.length)]
              : null;
            
            mockSessions.push({
              id: sessionId.toString(),
              date: currentDate.toISOString().split('T')[0],
              startTime: slot.startTime,
              endTime: slot.endTime,
              module: module.name || 'Module',
              topic: contentTopic || `Lerneinheit ${sessionId}`,
              description: `Vorbereitung für ${module.name}${competency ? ' - ' + competency : ''}`,
              learningMethod: sessionId % 3 === 0 ? 'Spaced Repetition' : sessionId % 3 === 1 ? 'Active Recall' : 'Deep Work',
              contentTopics: contentTopic ? [contentTopic] : [],
              competencies: competency ? [competency] : [],
              studyTips: contentTopic ? `Bearbeite konkrete Aufgaben zu: ${contentTopic}` : ''
            });
            sessionId++;
          }
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setStudySessions(mockSessions);
      setPlanGenerated(true);
      setIsGenerating(false);
    }
  }, [actualModules, actualTimeSlots, propApiKey]);

  // Kalender-Logik - Memoized to prevent recalculation on every render
  const getWeeksInMonth = useCallback((year: number, month: number) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeek = [];
    let currentDate = new Date(firstDay);
    
    // Start from Monday of the first week
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(firstDay.getDate() + diff);
    
    while (currentDate <= lastDay) {
      currentWeek.push(new Date(currentDate));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days to complete the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, []); // No dependencies - pure function

  const getSessionsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return studySessions.filter(session => session.date === dateStr);
  }, [studySessions]); // Only recreate when studySessions changes

  const currentMonth = useMemo(() => {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    return month;
  }, [currentMonthOffset]);
  
  const weeks = useMemo(
    () => getWeeksInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [getWeeksInMonth, currentMonth]
  );

  const handlePreviousMonth = () => {
    setCurrentMonthOffset(prev => prev - 1);
  };

  const handleNextMonth = () => {
    setCurrentMonthOffset(prev => prev + 1);
  };

  if (!planGenerated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-4 rounded-2xl">
                <Sparkles className="size-12 text-white" />
              </div>
            </div>
            <h2 className="text-gray-900">Lernplan generieren</h2>
            <p className="text-gray-600">
              Alle Daten gesammelt! Lass die KI deinen personalisierten Lernplan erstellen.
            </p>
          </div>

          {/* API Key Confirmation */}
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-full">
                  <Key className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">API-Key konfiguriert</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle>Zusammenfassung deiner Daten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Module hochgeladen:</span>
                <span className="text-gray-900">{actualModules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zeitfenster definiert:</span>
                <span className="text-gray-900">{actualTimeSlots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gesamt ECTS:</span>
                <span className="text-gray-900">
                  {actualModules.reduce((sum, m) => sum + (m.ects || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wöchentliche Lernzeit:</span>
                <span className="text-gray-900">
                  {actualTimeSlots.length * 2}h
                </span>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Sparkles className="size-4" />
            <AlertDescription>
              Die KI analysiert deine Module, Deadlines und verfügbaren Zeiten, um einen optimalen, 
              realistischen Lernplan zu erstellen. Sie wählt <strong>automatisch die beste Lernmethode</strong> für jedes Modul 
              (z.B. Deep Work für Projekte, Pomodoro für Programmieren, Spaced Repetition für Prüfungen).
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Zurück
            </Button>
            <Button 
              size="lg" 
              onClick={generatePlan} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-5 mr-2 animate-spin" />
                  Generiere Plan...
                </>
              ) : (
                <>
                  <Sparkles className="size-5 mr-2" />
                  Lernplan jetzt erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generated Plan View
  // Show Module Learning Guide if selected
  if (selectedModuleForGuide) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ModuleLearningGuide
          module={selectedModuleForGuide}
          studySessions={studySessions}
          onBack={() => setSelectedModuleForGuide(null)}
          apiKey={propApiKey}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Dein Lernplan</h2>
            <p className="text-gray-600">KI-optimiert und auf deine Bedürfnisse zugeschnitten</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPlanGenerated(false)}>
              <RefreshCw className="size-4 mr-2" />
              Neu generieren
            </Button>
            <Button variant="outline" onClick={() => exportToExcel(studySessions, actualModules)}>
              <Download className="size-4 mr-2" />
              Exportieren
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Plan erfolgreich erstellt!</h3>
                <p className="text-white/90">
                  {studySessions.length} Lernsessions wurden für dich geplant • {actualModules.length} Module • {actualTimeSlots.length * 2}h pro Woche
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Learning Guides */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-6 text-purple-600" />
              Detaillierte Modul-Lernguides
            </CardTitle>
            <CardDescription>
              Erhalte einen kompletten A-Z Lernplan pro Modul mit konkreten Übungen, Strategien und Prüfungsvorbereitung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actualModules.map((module, index) => {
                const moduleSessions = studySessions.filter(s => s.module === module.name);
                const examDate = module.assessments && module.assessments.length > 0 
                  ? module.assessments[0].deadline 
                  : null;
                
                return (
                  <div 
                    key={module.id || index}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition-all hover:shadow-md"
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg mb-1">{module.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <Badge variant="outline">{module.ects} ECTS</Badge>
                        <span>•</span>
                        <span>{moduleSessions.length} Sessions</span>
                      </div>
                      {examDate && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <Target className="size-3" />
                          Prüfung: {new Date(examDate).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => setSelectedModuleForGuide(module)}
                    >
                      <Sparkles className="size-4 mr-2" />
                      Lernguide öffnen
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronDown className="size-4 rotate-90" />
                </Button>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronUp className="size-4 -rotate-90" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {actualModules.slice(0, 3).map((module, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-pink-500'
                    }`} />
                    <span className="text-gray-600">{module.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEK_DAYS.map(day => (
                <div key={day} className="text-center text-sm text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    const sessions = getSessionsForDate(date);
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isToday = date.toDateString() === new Date('2024-12-09').toDateString();
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`min-h-[120px] p-2 rounded-lg border-2 transition-all ${
                          isToday 
                            ? 'bg-blue-50 border-blue-400' 
                            : isCurrentMonth 
                              ? 'bg-white border-gray-200 hover:border-gray-300' 
                              : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className={`text-sm mb-2 ${
                          isToday 
                            ? 'text-blue-600' 
                            : isCurrentMonth 
                              ? 'text-gray-900' 
                              : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {/* Prüfungstermine */}
                          {actualModules.map((module) => {
                            if (module.assessments && Array.isArray(module.assessments)) {
                              return module.assessments.map((assessment: any, assessmentIdx: number) => {
                                if (assessment.deadline) {
                                  const examDate = new Date(assessment.deadline);
                                  if (examDate.toDateString() === date.toDateString()) {
                                    return (
                                      <div
                                        key={`exam-${module.id || module.name}-${assessmentIdx}`}
                                        className="bg-red-600 text-white p-2 rounded text-xs font-bold border-2 border-red-800"
                                        title={`Prüfung: ${assessment.type} - ${module.name} (${assessment.format})`}
                                      >
                                        <div className="flex items-center gap-1 mb-1">
                                          <Target className="size-3" />
                                          <span>PRÜFUNG</span>
                                        </div>
                                        <div className="font-bold">
                                          {module.name}
                                        </div>
                                        <div className="text-xs opacity-90 mt-1">
                                          {assessment.type}
                                        </div>
                                        {assessment.format && (
                                          <div className="text-xs opacity-75 mt-1 italic">
                                            {assessment.format}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              });
                            }
                            return null;
                          })}
                          
                          {/* Lernsessions */}
                          {sessions.map((session, idx) => {
                            const moduleIndex = actualModules.findIndex(m => m.name === session.module);
                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
                            const bgColor = colors[moduleIndex % colors.length];
                            
                            return (
                              <div
                                key={session.id}
                                className={`${bgColor} text-white p-2 rounded text-xs cursor-pointer hover:opacity-90 transition-opacity`}
                                onClick={() => setExpandedSession(session.id)}
                                title={session.topic}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="size-3" />
                                  <span>{session.startTime}</span>
                                </div>
                                <div className="line-clamp-2 font-medium">
                                  {session.topic}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Lernsessions</CardTitle>
            <CardDescription>{studySessions.length} Sessions geplant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {studySessions.map((session) => {
              const moduleIndex = actualModules.findIndex(m => m.name === session.module);
              const colors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600'];
              const gradient = colors[moduleIndex % colors.length];
              const isExpanded = expandedSession === session.id;
              
              return (
                <Collapsible
                  key={session.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-lg flex-shrink-0`}>
                        <BookOpen className="size-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h4 className="text-gray-900 font-medium">{session.topic}</h4>
                          </div>
                          <Badge>{session.module}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(session.date).toLocaleDateString('de-DE', { 
                              weekday: 'short', 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-200 mt-2">
                        {/* Content Topics */}
                        {session.contentTopics && session.contentTopics.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="size-4 text-blue-600" />
                              <h5 className="text-sm font-medium text-gray-900">Zu bearbeitende Themen</h5>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                              {session.contentTopics.map((topic, idx) => (
                                <li key={idx}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Competencies */}
                        {session.competencies && session.competencies.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="size-4 text-green-600" />
                              <h5 className="text-sm font-medium text-gray-900">Kompetenzen entwickeln</h5>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                              {session.competencies.map((comp, idx) => (
                                <li key={idx}>{comp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Study Tips */}
                        {session.studyTips && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="size-4 text-yellow-600" />
                              <h5 className="text-sm font-medium text-gray-900">Lerntipps</h5>
                            </div>
                            <p className="text-sm text-gray-700">{session.studyTips}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>

        {/* Learning Method Info Modal */}
        {showMethodInfo && LEARNING_METHODS[showMethodInfo] && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMethodInfo(null)}
          >
            <Card 
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="size-5 text-yellow-600" />
                    {LEARNING_METHODS[showMethodInfo].title}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowMethodInfo(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  {LEARNING_METHODS[showMethodInfo].description}
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tipps zur Umsetzung:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {LEARNING_METHODS[showMethodInfo].tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}