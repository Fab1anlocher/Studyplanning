import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  completed: boolean;
}

interface StudyPlanGeneratorProps {
  onBack: () => void;
  modules: any[];
  timeSlots: any[];
}

export function StudyPlanGenerator({ onBack, modules, timeSlots }: StudyPlanGeneratorProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('gpt-4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  const generatePlan = () => {
    if (!apiKey) {
      alert('Bitte gib deinen OpenAI API-Key ein');
      return;
    }

    setIsGenerating(true);
    
    // Hier würde der echte API-Call passieren:
    // 1. JSON-Payload erstellen mit allen Daten
    // 2. Chain-of-Thought Prompt zusammenstellen
    // 3. OpenAI API aufrufen
    // 4. Generierte Lernsessions parsen und anzeigen
    
    setTimeout(() => {
      // Mock-Daten
      const mockSessions: StudySession[] = [
        {
          id: '1',
          date: '2024-12-09',
          startTime: '09:00',
          endTime: '12:00',
          module: modules[0]?.name || 'Software Engineering',
          topic: 'Design Patterns',
          description: 'Singleton, Factory und Observer Pattern durcharbeiten',
          completed: false,
        },
        {
          id: '2',
          date: '2024-12-11',
          startTime: '14:00',
          endTime: '17:00',
          module: modules[1]?.name || 'Datenbanken',
          topic: 'SQL Queries',
          description: 'Komplexe JOIN-Abfragen üben, Übungsblatt 3 bearbeiten',
          completed: false,
        },
        {
          id: '3',
          date: '2024-12-13',
          startTime: '10:00',
          endTime: '13:00',
          module: modules[0]?.name || 'Software Engineering',
          topic: 'Semesterarbeit',
          description: 'Kapitel 2 schreiben, Architekturdiagramm erstellen',
          completed: false,
        },
      ];
      
      setStudySessions(mockSessions);
      setPlanGenerated(true);
      setIsGenerating(false);
    }, 2000);
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date('2024-12-09');
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
              Gib deinen OpenAI API-Key ein, um deinen personalisierten KI-Lernplan zu erstellen
            </p>
          </div>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5" />
                OpenAI API-Konfiguration
              </CardTitle>
              <CardDescription>
                Dein API-Key wird nur lokal gespeichert und direkt an OpenAI gesendet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API-Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Du findest deinen API-Key in deinem{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Dashboard
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modell</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Empfohlen)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Module hochgeladen:</span>
                <span className="text-gray-900">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zeitfenster definiert:</span>
                <span className="text-gray-900">{timeSlots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gesamt ECTS:</span>
                <span className="text-gray-900">
                  {modules.reduce((sum, m) => sum + (m.ects || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Sparkles className="size-4" />
            <AlertDescription>
              Die KI analysiert deine Module, Deadlines und verfügbaren Zeiten, um einen optimalen, 
              realistischen Lernplan zu erstellen. Der Plan berücksichtigt Prüfungsdaten, Workload und Prioritäten.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Zurück
            </Button>
            <Button size="lg" onClick={generatePlan} disabled={isGenerating || !apiKey}>
              {isGenerating ? (
                <>
                  <RefreshCw className="size-5 mr-2 animate-spin" />
                  Generiere Plan...
                </>
              ) : (
                <>
                  <Sparkles className="size-5 mr-2" />
                  Lernplan erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-gray-900">Dein Lernplan</h2>
          <p className="text-gray-600">KI-optimiert und auf deine Bedürfnisse zugeschnitten</p>
        </div>

        {/* Success Message */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-500 p-2 rounded-full">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1">Plan erfolgreich erstellt!</h3>
                <p className="text-sm text-gray-700">
                  Dein persönlicher Lernplan wurde generiert. Er berücksichtigt {modules.length} Module, 
                  {timeSlots.length} Zeitfenster und alle Prüfungsdaten.
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
                    <CardTitle>Woche {currentWeek + 1}</CardTitle>
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
                              className="p-2 rounded text-xs bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-300"
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
              <Card key={session.id}>
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
                    <Badge>{session.module}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{session.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => setPlanGenerated(false)}>
            <RefreshCw className="size-4 mr-2" />
            Neu generieren
          </Button>
          <Button variant="outline">
            <Download className="size-4 mr-2" />
            Als PDF exportieren
          </Button>
        </div>
      </div>
    </div>
  );
}
