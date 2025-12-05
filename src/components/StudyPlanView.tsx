import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  topic: string;
  description: string;
  completed: boolean;
}

export function StudyPlanView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  // Mock-Daten für generierte Lernsessions
  const [studySessions] = useState<StudySession[]>([
    {
      id: '1',
      date: '2024-12-09',
      startTime: '09:00',
      endTime: '12:00',
      module: 'Software Engineering',
      topic: 'Design Patterns',
      description: 'Singleton, Factory und Observer Pattern durcharbeiten',
      completed: false,
    },
    {
      id: '2',
      date: '2024-12-11',
      startTime: '14:00',
      endTime: '17:00',
      module: 'Datenbanken',
      topic: 'SQL Queries',
      description: 'Komplexe JOIN-Abfragen üben, Übungsblatt 3 bearbeiten',
      completed: false,
    },
    {
      id: '3',
      date: '2024-12-13',
      startTime: '10:00',
      endTime: '13:00',
      module: 'Software Engineering',
      topic: 'Semesterarbeit',
      description: 'Kapitel 2 schreiben, Architekturdiagramm erstellen',
      completed: true,
    },
    {
      id: '4',
      date: '2024-12-16',
      startTime: '09:00',
      endTime: '12:00',
      module: 'Datenbanken',
      topic: 'Normalisierung',
      description: '1NF bis 3NF wiederholen, Beispiele durcharbeiten',
      completed: false,
    },
    {
      id: '5',
      date: '2024-12-18',
      startTime: '14:00',
      endTime: '17:00',
      module: 'Software Engineering',
      topic: 'Testing',
      description: 'Unit Tests schreiben, Code Coverage erhöhen',
      completed: false,
    },
  ]);

  const generatePlan = () => {
    setIsGenerating(true);
    
    // Simuliere API-Call zum LLM
    // In der realen App würde hier folgendes passieren:
    // 1. Alle Modul-Daten, Zeitfenster und Präferenzen sammeln
    // 2. JSON-Payload erstellen
    // 3. An OpenAI API mit Chain-of-Thought Prompt senden
    // 4. Generiertes JSON mit Lernsessions empfangen
    // 5. Sessions im State speichern und anzeigen
    
    setTimeout(() => {
      setIsGenerating(false);
      // Sessions würden hier aktualisiert werden
    }, 2000);
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date('2024-12-09'); // Mock-Datum
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return studySessions.filter(session => session.date === dateStr);
  };

  const weekDates = getWeekDates(currentWeek);
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Lernplan</h2>
          <p className="text-gray-600">Dein KI-generierter Semesterplan</p>
        </div>
        <Button onClick={generatePlan} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <RefreshCw className="size-4 mr-2 animate-spin" />
              Generiere...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              Plan generieren
            </>
          )}
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Sparkles className="size-6 text-purple-600 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="text-gray-900">
                <strong>KI-Optimierung</strong>
              </p>
              <p className="text-sm text-gray-700">
                Der Lernplan wird basierend auf deinen verfügbaren Zeitfenstern, Modulworkload und Prüfungsdaten optimiert. 
                Das LLM berücksichtigt dabei Deadlines, Gewichtungen und erstellt einen realistischen, umsetzbaren Plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="size-4 mr-2" />
            Kalenderansicht
          </TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Woche {currentWeek + 1}
                  </CardTitle>
                  <CardDescription>
                    {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })} - {' '}
                    {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentWeek(0)}>
                    Heute
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const sessions = getSessionsForDate(date);
                  const isToday = date.toDateString() === new Date('2024-12-09').toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[200px] border rounded-lg p-2 ${
                        isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="text-center mb-2">
                        <div className="text-xs text-gray-600">{weekDays[index]}</div>
                        <div className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {sessions.map(session => (
                          <div
                            key={session.id}
                            className={`p-2 rounded text-xs ${
                              session.module === 'Software Engineering'
                                ? 'bg-purple-100 border border-purple-300'
                                : 'bg-green-100 border border-green-300'
                            } ${session.completed ? 'opacity-50' : ''}`}
                          >
                            <div className="line-clamp-1 mb-1">
                              {session.startTime}
                            </div>
                            <div className="line-clamp-2">
                              {session.topic}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          {studySessions.map(session => (
            <Card key={session.id} className={session.completed ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-2 rounded-lg">
                      <Calendar className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">{session.topic}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {new Date(session.date).toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          day: '2-digit', 
                          month: 'long' 
                        })}
                        {' • '}
                        {session.startTime} - {session.endTime}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={session.completed ? 'secondary' : 'default'}>
                    {session.module}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{session.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Download className="size-4 mr-2" />
          Als PDF exportieren
        </Button>
      </div>
    </div>
  );
}
