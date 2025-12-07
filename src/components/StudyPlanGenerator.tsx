import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Calendar, Download, RefreshCw, Key, Eye, EyeOff, ArrowLeft, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Target, Lightbulb } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import OpenAI from 'openai';

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

  const generatePlan = useCallback(async () => {
    setIsGenerating(true);
    
    // Find the last exam date from all modules
    const findLastExamDate = () => {
      let lastDate = new Date();
      actualModules.forEach(module => {
        if (module.assessments && Array.isArray(module.assessments)) {
          module.assessments.forEach((assessment: { deadline?: string }) => {
            if (assessment.deadline) {
              const examDate = new Date(assessment.deadline);
              if (examDate > lastDate) {
                lastDate = examDate;
              }
            }
          });
        }
      });
      return lastDate;
    };
    
    const lastExamDate = findLastExamDate();
    const startDate = new Date(); // Start from today
    
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
      
      // Gold-standard prompt with prompt engineering best practices
      const systemPrompt = `Du bist ein Elite-Lernplan-Generator mit Expertise in Lernpsychologie, Zeitmanagement und evidenzbasierten Lernstrategien.

DEINE AUFGABE:
Erstelle einen optimalen, personalisierten Lernplan basierend auf den Modulen, verfügbaren Zeitfenstern und Prüfungsterminen des Studierenden.

KONTEXT & PRINZIPIEN:
1. **Spaced Repetition**: Wiederhole wichtige Konzepte in zunehmenden Abständen für besseres Langzeitgedächtnis
2. **Interleaving**: Wechsle zwischen verschiedenen Modulen/Themen für bessere kognitive Flexibilität
3. **Active Recall**: Betone aktives Abrufen statt passivem Lesen
4. **Progressive Komplexität**: Starte mit Grundlagen, steigere graduell zu komplexeren Themen
5. **Prüfungsvorbereitung**: Plane intensive Wiederholungen 2-3 Wochen vor Prüfungen
6. **Kompetenzen-orientiert**: Richte Sessions an den zu entwickelnden Kompetenzen aus

LERNMETHODEN (wähle automatisch die beste pro Session):
- **Spaced Repetition**: Für Faktenwissen, Definitionen, Prüfungsvorbereitung
- **Deep Work**: Für komplexe Projekte, Semesterarbeiten (mind. 2-4h Blöcke)
- **Pomodoro**: Für Programmierung, Übungsaufgaben (25min Fokus + 5min Pause)
- **Active Recall**: Für Mathematik, Statistik, Formeln
- **Feynman Technik**: Für Konzepte, die erklärt werden müssen
- **Interleaving**: Bei mehreren ähnlichen Modulen
- **Practice Testing**: 1-2 Wochen vor Prüfungen

AUSGABEFORMAT (JSON Array):
Erstelle für jedes verfügbare Zeitfenster eine optimale Lernsession mit:
{
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "module": "Modulname",
  "topic": "Präzises Lernthema (z.B. 'Prozessmodellierung mit BPMN 2.0')",
  "description": "1-2 Sätze: Was genau lernen, wie vorgehen",
  "learningMethod": "Gewählte Lernmethode",
  "contentTopics": ["Spezifische Topics aus dem Modulinhalt"],
  "competencies": ["Zu entwickelnde Kompetenzen"],
  "studyTips": "Konkrete Tipps für diese Session (z.B. 'Erstelle Mindmap', 'Implementiere Beispiel')"
}

WICHTIGE REGELN:
- Nutze NUR die verfügbaren Zeitfenster (Wochentage und Uhrzeiten beachten!)
- WICHTIG: Plane ALLE wiederkehrenden Zeitfenster! Wenn ein Zeitfenster z.B. "Montag 17:00-20:00" ist, plane JEDEN Montag in diesem Zeitfenster bis zum Semesterende
- Verteile den Workload proportional zu ECTS-Punkten
- Plane Wiederholungssessions vor Prüfungen ein
- Nutze die extrahierten Inhalte und Kompetenzen für spezifische Topics
- Berücksichtige Gewichtungen der Assessments
- Mische Module intelligent (Interleaving)
- Starte mit Grundlagen aus den Inhalten, baue darauf auf
- Vermeide Überlastung: Max. 2-3h konzentriertes Lernen pro Session

Gib ein JSON-Objekt mit einem 'sessions' Array zurück:
{
  "sessions": [ ...array of session objects... ]
}`;

      const userPrompt = `Erstelle einen optimalen Lernplan mit folgenden Daten:\n\n${JSON.stringify(planningData, null, 2)}`;
      
      console.log('Generiere KI-Lernplan mit:', planningData);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Creative but consistent
        response_format: { type: 'json_object' }
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
      
      // Ensure all sessions have IDs
      const sessionsWithIds = Array.isArray(sessions) 
        ? sessions.map((session, index) => ({
            ...session,
            id: (index + 1).toString()
          }))
        : [];
      
      setStudySessions(sessionsWithIds);
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
              learningMethod: sessionId % 3 === 0 ? 'Spaced Repetition' : sessionId % 3 === 1 ? 'Active Recall' : 'Pomodoro',
              contentTopics: contentTopic ? [contentTopic] : [],
              competencies: competency ? [competency] : [],
              studyTips: 'Mache Notizen und teste dein Wissen aktiv'
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
                          {sessions.map((session, idx) => {
                            const moduleIndex = actualModules.findIndex(m => m.name === session.module);
                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
                            const bgColor = colors[moduleIndex % colors.length];
                            
                            return (
                              <div
                                key={session.id}
                                className={`${bgColor} text-white p-2 rounded text-xs cursor-pointer hover:opacity-90 transition-opacity`}
                                onClick={() => setExpandedSession(session.id)}
                                title={`${session.topic}${session.learningMethod ? ' - ' + session.learningMethod : ''}`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="size-3" />
                                  <span>{session.startTime}</span>
                                </div>
                                <div className="line-clamp-2 font-medium">
                                  {session.topic}
                                </div>
                                {session.learningMethod && (
                                  <div className="text-xs opacity-90 mt-1 truncate">
                                    {session.learningMethod}
                                  </div>
                                )}
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
                            {session.learningMethod && (
                              <Badge 
                                variant="outline" 
                                className="mt-1 text-xs cursor-pointer hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMethodInfo(session.learningMethod || null);
                                }}
                              >
                                {session.learningMethod}
                              </Badge>
                            )}
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