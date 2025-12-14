/**
 * WeekDetailView - Dedicated view for a single week with all its sessions
 * and execution guides
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Zap, 
  RefreshCw,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { ExecutionGuideView } from './ExecutionGuideView';
import { generateWeekElaboration, formatDateISO } from '../services/weekElaborationService';
import { saveExecutionGuides, getExecutionGuide, hasExecutionGuide } from '../services/executionGuideStorage';
import { toast } from 'sonner';

interface StudySession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  topic: string;
  description: string;
  learningMethod?: string;
  contentTopics?: string[];
  competencies?: string[];
  studyTips?: string;
}

interface WeekDetailViewProps {
  weekStartDate: Date;
  sessions: StudySession[];
  modules: any[];
  apiKey: string;
  onBack: () => void;
}

export function WeekDetailView({ 
  weekStartDate, 
  sessions, 
  modules, 
  apiKey,
  onBack 
}: WeekDetailViewProps) {
  const [isElaborating, setIsElaborating] = useState(false);
  const [elaborationError, setElaborationError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekStartStr = weekStartDate.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const weekEndStr = weekEnd.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'long' 
  });

  // Check if week is already elaborated
  const isElaborated = sessions.every(s => hasExecutionGuide(s.id));

  const handleElaborate = async () => {
    console.log('[WeekDetailView] Starting elaboration...');
    setIsElaborating(true);
    setElaborationError(null);

    try {
      // Prepare module data with exam information
      const moduleData = modules.map(module => ({
        name: module.name,
        content: module.content || [],
        competencies: module.competencies || [],
        teachingMethods: module.teachingMethods || [],
        assessments: (module.assessments || []).map((a: any) => ({
          type: a.type,
          weight: a.weight,
          format: a.format,
          deadline: a.deadline,
          tools: a.tools || []
        })),
        examDate: module.examDate
      }));

      const request = {
        week: {
          startDate: formatDateISO(weekStartDate),
          endDate: formatDateISO(weekEnd)
        },
        sessions: sessions.map(s => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          module: s.module,
          topic: s.topic,
          description: s.description,
          learningMethod: s.learningMethod,
          contentTopics: s.contentTopics,
          competencies: s.competencies
        })),
        moduleData: moduleData
      };

      const response = await generateWeekElaboration(request, apiKey);
      saveExecutionGuides(response.executionGuides);

      setIsElaborating(false);
      toast.success('Woche erfolgreich ausgearbeitet!', {
        description: `${response.executionGuides.length} Sessions wurden mit Execution Guides angereichert.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('[WeekDetailView] Error:', error);
      setElaborationError(error instanceof Error ? error.message : 'Fehler beim Ausarbeiten');
      setIsElaborating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="size-4 mr-2" />
              Zurück zum Kalender
            </Button>
            <h2 className="text-gray-900">Woche: {weekStartStr} - {weekEndStr}</h2>
            <p className="text-gray-600">
              {sessions.length} Sessions geplant
              {isElaborated && (
                <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                  <CheckCircle2 className="size-3 mr-1" />
                  Ausgearbeitet
                </Badge>
              )}
            </p>
          </div>

          {!isElaborated && (
            <Button
              size="lg"
              onClick={handleElaborate}
              disabled={isElaborating}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {isElaborating ? (
                <>
                  <RefreshCw className="size-5 mr-2 animate-spin" />
                  Wird ausgearbeitet...
                </>
              ) : (
                <>
                  <Zap className="size-5 mr-2" />
                  Woche jetzt ausarbeiten
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info Alert */}
        {!isElaborated && (
          <Alert className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <Lightbulb className="size-4 text-orange-600" />
            <AlertDescription>
              <strong>Woche ausarbeiten:</strong> Erstelle detaillierte Execution Guides für alle 
              Sessions dieser Woche. Du erhältst konkrete Ablaufpläne, Methodenvorschläge, Tools 
              und Erfolgskriterien für jede Session.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {elaborationError && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              <strong>Fehler:</strong> {elaborationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Week Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Wochen-Übersicht</CardTitle>
            <CardDescription>Alle geplanten Sessions dieser Woche</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session, idx) => {
                const moduleIndex = modules.findIndex(m => m.name === session.module);
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600'
                ];
                const gradient = colors[moduleIndex % colors.length];
                const hasGuide = hasExecutionGuide(session.id);
                const guide = hasGuide ? getExecutionGuide(session.id) : null;
                const isExpanded = expandedSession === session.id;

                return (
                  <Card 
                    key={session.id} 
                    className={`border-2 ${hasGuide ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}
                  >
                    <CardContent className="pt-6">
                      {/* Session Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`bg-gradient-to-br ${gradient} p-3 rounded-lg flex-shrink-0`}>
                          <BookOpen className="size-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{session.topic}</h4>
                              <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{session.module}</Badge>
                              {hasGuide && (
                                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                                  <Zap className="size-3 mr-1" />
                                  Ausgearbeitet
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-4" />
                              {new Date(session.date).toLocaleDateString('de-DE', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: 'long' 
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" />
                              {session.startTime} - {session.endTime}
                            </span>
                            {session.learningMethod && (
                              <Badge variant="outline">{session.learningMethod}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Execution Guide */}
                      {hasGuide && guide && (
                        <div className="mt-4">
                          {!isExpanded ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedSession(session.id)}
                              className="w-full"
                            >
                              <Zap className="size-4 mr-2" />
                              Execution Guide anzeigen
                            </Button>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                  <Zap className="size-4 text-orange-600" />
                                  Execution Guide
                                </h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedSession(null)}
                                >
                                  Einklappen
                                </Button>
                              </div>
                              <div className="border-t pt-4">
                                <ExecutionGuideView
                                  guide={guide}
                                  sessionInfo={{
                                    topic: session.topic,
                                    module: session.module,
                                    date: session.date,
                                    startTime: session.startTime,
                                    endTime: session.endTime
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Placeholder if not elaborated */}
                      {!hasGuide && (
                        <Alert className="bg-gray-50 border-gray-200 mt-4">
                          <AlertDescription className="text-sm text-gray-600">
                            Execution Guide noch nicht erstellt. Klicke oben auf "Woche jetzt ausarbeiten" 
                            um einen detaillierten Plan für diese Session zu generieren.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
