import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Calendar, Download, RefreshCw, Key, Eye, EyeOff, ArrowLeft, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  topic: string;
  description: string;
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

  const generatePlan = useCallback(() => {
    setIsGenerating(true);
    
    // Find the last exam date from all modules
    const findLastExamDate = () => {
      let lastDate = new Date();
      actualModules.forEach(module => {
        if (module.assessments && Array.isArray(module.assessments)) {
          module.assessments.forEach((assessment: any) => {
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
    
    // Hier würde der echte API-Call passieren:
    // const MODEL = 'gpt-4'; // Vom Developer konfiguriert
    // const payload = { modules, timeSlots, startDate, lastExamDate };
    // const systemPrompt = `Du bist ein KI-Lernplan-Generator. Analysiere die Module und erstelle einen optimalen Lernplan.
    // Der Plan soll vom ${startDate.toISOString()} bis zum ${lastExamDate.toISOString()} gehen.
    // Wähle für jedes Modul automatisch die beste Lernmethode basierend auf:
    // - Projekten → Deep Work
    // - Mathematik/Statistik → Active Recall  
    // - Prüfungen → Spaced Repetition
    // - Programmieren → Pomodoro
    // - Gruppenarbeit → Interleaving
    // - Standard → Feynman Technik`;
    // const response = await openai.chat.completions.create({
    //   model: MODEL,
    //   messages: [
    //     { role: "system", content: systemPrompt }, 
    //     { role: "user", content: JSON.stringify(payload) }
    //   ],
    //   headers: {
    //     'Authorization': `Bearer ${propApiKey}`
    //   }
    // });
    // const sessions = JSON.parse(response.choices[0].message.content);
    
    setTimeout(() => {
      // Generate mock sessions from start date to last exam date
      const mockSessions: StudySession[] = [];
      const currentDate = new Date(startDate);
      let sessionId = 1;
      
      // Generate sessions distributed across the time period
      while (currentDate <= lastExamDate) {
        // Add sessions based on timeSlots (for simplicity, add 2-3 sessions per week)
        const dayOfWeek = currentDate.getDay();
        
        // Add sessions on Monday, Wednesday, and Friday
        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
          const moduleIndex = Math.floor(Math.random() * actualModules.length);
          const module = actualModules[moduleIndex];
          
          if (module) {
            mockSessions.push({
              id: sessionId.toString(),
              date: currentDate.toISOString().split('T')[0],
              startTime: dayOfWeek === 1 ? '09:00' : dayOfWeek === 3 ? '14:00' : '10:00',
              endTime: dayOfWeek === 1 ? '11:00' : dayOfWeek === 3 ? '16:00' : '12:00',
              module: module.name || 'Module',
              topic: `Lerneinheit ${sessionId}`,
              description: `Vorbereitung für ${module.name}`,
            });
            sessionId++;
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setStudySessions(mockSessions);
      setPlanGenerated(true);
      setIsGenerating(false);
    }, 2500);
  }, [actualModules]);

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

  const currentMonth = useMemo(() => new Date(DEFAULT_MONTH), []);
  const weeks = useMemo(
    () => getWeeksInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [getWeeksInMonth, currentMonth]
  );

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
            <Button variant="outline">
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
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </CardTitle>
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
                                className={`${bgColor} text-white p-2 rounded text-xs`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="size-3" />
                                  <span>{session.startTime}</span>
                                </div>
                                <div className="line-clamp-2">
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
          <CardContent className="space-y-2">
            {studySessions.map((session) => {
              const moduleIndex = actualModules.findIndex(m => m.name === session.module);
              const colors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600'];
              const gradient = colors[moduleIndex % colors.length];
              
              return (
                <div key={session.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className={`bg-gradient-to-br ${gradient} p-3 rounded-lg flex-shrink-0`}>
                    <BookOpen className="size-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-gray-900">{session.topic}</h4>
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
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}