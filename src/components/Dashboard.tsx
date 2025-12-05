import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, BookOpen, Clock, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from './ui/progress';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  // Mock-Daten für das Dashboard
  const stats = {
    totalModules: 5,
    completedTasks: 12,
    totalTasks: 45,
    weeklyHours: 18,
    nextDeadline: '15.12.2024',
  };

  const setupSteps = [
    { id: 1, title: 'Wochenplan erstellen', completed: false, tab: 'schedule' },
    { id: 2, title: 'Module hochladen', completed: false, tab: 'modules' },
    { id: 3, title: 'API-Key hinterlegen', completed: false, tab: 'settings' },
    { id: 4, title: 'Lernplan generieren', completed: false, tab: 'studyplan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Willkommen zurück!</h2>
        <p className="text-gray-600">Hier ist deine Semesterübersicht</p>
      </div>

      {/* Setup-Schritte */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-blue-600" />
            Erste Schritte
          </CardTitle>
          <CardDescription>
            Vervollständige diese Schritte, um deinen KI-Lernplan zu erstellen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {setupSteps.map((step) => (
            <div
              key={step.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <AlertCircle className="size-5 text-gray-400" />
                )}
                <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                  {step.title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(step.tab)}
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Module</CardDescription>
            <CardTitle className="text-gray-900">{stats.totalModules}</CardTitle>
          </CardHeader>
          <CardContent>
            <BookOpen className="size-4 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Fortschritt</CardDescription>
            <CardTitle className="text-gray-900">
              {stats.completedTasks}/{stats.totalTasks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.completedTasks / stats.totalTasks) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Wochenstunden</CardDescription>
            <CardTitle className="text-gray-900">{stats.weeklyHours}h</CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="size-4 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nächste Deadline</CardDescription>
            <CardTitle className="text-gray-900">{stats.nextDeadline}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className="size-4 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onNavigate('schedule')}
          >
            <Clock className="size-5 mr-3 text-blue-600" />
            <div className="text-left">
              <div>Wochenplan bearbeiten</div>
              <div className="text-xs text-gray-500">Lernzeiten eintragen</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onNavigate('modules')}
          >
            <BookOpen className="size-5 mr-3 text-purple-600" />
            <div className="text-left">
              <div>Modul hinzufügen</div>
              <div className="text-xs text-gray-500">PDF hochladen</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onNavigate('studyplan')}
          >
            <Sparkles className="size-5 mr-3 text-orange-600" />
            <div className="text-left">
              <div>Plan generieren</div>
              <div className="text-xs text-gray-500">KI-Lernplan erstellen</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
