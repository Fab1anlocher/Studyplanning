import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BookOpen, 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  Calendar,
  TrendingUp,
  Flame,
  Clock,
  Brain,
  Award,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import OpenAI from 'openai';
import { MODULE_GUIDE_SYSTEM_PROMPT, MODULE_GUIDE_USER_PROMPT } from '../prompts/moduleLearningGuide';

interface ModuleLearningGuideProps {
  module: any;
  studySessions: any[];
  onBack: () => void;
  apiKey: string;
}

interface GuideContent {
  overview: string;
  competencies: string[];
  learningStrategy: {
    method: string;
    explanation?: string;
    application?: string;
    reasoning: string;
    timeline: string;
  };
  weeklyPlan: {
    week: number;
    focus: string;
    tasks: string[];
  }[];
  exercises: string[];
  resources: {
    tools: string[];
  };
  examPrep: {
    assessmentType: string;
    deadline?: string;
    format?: string;
    fourWeeks: string[];
    twoWeeks: string[];
    oneWeek: string[];
    lastDay: string[];
  }[];
  tips: string[];
  commonMistakes: string[];
  successChecklist: string[];
}

export function ModuleLearningGuide({ module, studySessions, onBack, apiKey }: ModuleLearningGuideProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [guideContent, setGuideContent] = useState<GuideContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter sessions for this module
  const moduleSessions = studySessions.filter(s => s.module === module.name);
  const totalHours = moduleSessions.reduce((acc, session) => {
    const start = new Date(`2000-01-01 ${session.startTime}`);
    const end = new Date(`2000-01-01 ${session.endTime}`);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const generateGuide = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (!apiKey || apiKey.trim() === '') {
        setError('Kein API-Key vorhanden. Bitte API-Key eingeben.');
        setIsGenerating(false);
        return;
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      // Find exam date
      const examDate = module.assessments && module.assessments.length > 0 
        ? module.assessments[0].deadline 
        : null;

      // Import system prompt from separate file for easy editing by non-technical users
      const systemPrompt = MODULE_GUIDE_SYSTEM_PROMPT;

      // Import user prompt from separate file and replace variables
      const userPrompt = MODULE_GUIDE_USER_PROMPT
        .replace('{moduleName}', module.name)
        .replace('{ects}', module.ects?.toString() || 'N/A')
        .replace('{workload}', (module.workload || module.ects * 30)?.toString() || 'N/A')
        .replace(/{ects}/g, module.ects?.toString() || 'N/A')
        .replace(/{workload}/g, (module.workload || module.ects * 30)?.toString() || 'N/A')
        .replace(/{totalHours}/g, Math.round(totalHours).toString())
        .replace('{sessionCount}', moduleSessions.length.toString())
        .replace('{content}', module.content?.join(', ') || 'Keine Angabe')
        .replace('{competencies}', module.competencies?.join(', ') || 'Keine Angabe')
        .replace('{assessments}', module.assessments?.map((a: any) => `- ${a.type} (${a.weight}%) - ${a.format} - Termin: ${a.deadline || 'TBD'}`).join('\n') || 'Keine Angabe')
        .replace('{sessionExamples}', moduleSessions.slice(0, 5).map(s => `- ${s.date}: ${s.topic} (${s.startTime}-${s.endTime})`).join('\n') || 'Keine Sessions')
        .replace('{assessmentsList}', module.assessments?.map((a: any, idx: number) => `${idx + 1}. ${a.type} (${a.weight}%, ${a.format}) - Deadline: ${a.deadline || 'TBD'}`).join('\n') || 'Keine Assessments');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        setGuideContent(parsed);
      }
    } catch (error) {
      console.error('Fehler beim Generieren des Guides:', error);
      setError('Guide konnte nicht generiert werden. Bitte versuche es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="size-4" />
                </Button>
                <CardTitle className="text-2xl">{module.name}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Award className="size-4" />
                  {module.ects} ECTS
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {module.workload}h Workload
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  {moduleSessions.length} Sessions im Plan
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-4" />
                  {Math.round(totalHours)}h geplante Lernzeit
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Generate Button or Content */}
      {!guideContent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full">
                  <Brain className="size-12 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Erstelle deinen persönlichen Lernguide
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Die KI erstellt einen detaillierten A-Z Lernplan mit konkreten Übungen, 
                  Ressourcen, Strategien und Prüfungsvorbereitung - abgestimmt auf deinen Lernplan 
                  und die Modulinhalte.
                </p>
              </div>
              {error && (
                <Alert className="max-w-2xl mx-auto bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                size="lg"
                onClick={generateGuide}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="size-5 mr-2 animate-spin" />
                    Guide wird erstellt...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5 mr-2" />
                    Lernguide generieren
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Überblick
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{guideContent.overview}</p>
            </CardContent>
          </Card>

          {/* Competencies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Kompetenzen die du entwickelst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guideContent.competencies.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="size-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Strategy */}
          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-5 text-purple-600" />
                Deine Lernstrategie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className="bg-purple-600 mb-2">
                  {guideContent.learningStrategy.method}
                </Badge>
                {guideContent.learningStrategy.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-2 text-blue-900">Was ist das?</h4>
                    <p className="text-gray-700">{guideContent.learningStrategy.explanation}</p>
                  </div>
                )}
                {guideContent.learningStrategy.application && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold mb-2 text-green-900">Wie wendest du es in diesem Modul an?</h4>
                    <p className="text-gray-700">{guideContent.learningStrategy.application}</p>
                  </div>
                )}
                <div className="mt-3">
                  <h4 className="font-semibold mb-2">Warum diese Methode?</h4>
                  <p className="text-gray-700">{guideContent.learningStrategy.reasoning}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="size-4" />
                  Zeitplanung
                </h4>
                <p className="text-gray-700">{guideContent.learningStrategy.timeline}</p>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Wochenplan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guideContent.weeklyPlan.map((week, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Woche {week.week}</Badge>
                      <span className="font-semibold">{week.focus}</span>
                    </div>
                    <ul className="space-y-1 ml-4">
                      {week.tasks.map((task, taskIdx) => (
                        <li key={taskIdx} className="text-sm text-gray-600 list-disc">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exercises */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-5" />
                Konkrete Übungen ({guideContent.exercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {guideContent.exercises.map((exercise, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="font-semibold text-yellow-700 min-w-6">#{idx + 1}</span>
                    <span className="text-gray-700">{exercise}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Empfohlene Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guideContent.resources.tools.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">🛠️ Tools</h4>
                  <ul className="space-y-1 ml-4">
                    {guideContent.resources.tools.map((tool, idx) => (
                      <li key={idx} className="text-sm list-disc">{tool}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">Keine spezifischen Tools empfohlen.</p>
              )}
            </CardContent>
          </Card>

          {/* Exam Prep Timeline - Separate for each assessment */}
          {guideContent.examPrep.map((prep, prepIdx) => (
            <Card key={prepIdx} className="border-2 border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="size-5 text-red-600" />
                  Vorbereitung: {prep.assessmentType}
                </CardTitle>
                <CardDescription>
                  {prep.format && <Badge variant="outline" className="mr-2">{prep.format}</Badge>}
                  {prep.deadline && (() => {
                    try {
                      const date = new Date(prep.deadline);
                      if (isNaN(date.getTime())) return null;
                      return (
                        <span className="text-sm text-gray-600">
                          Deadline: {date.toLocaleDateString('de-DE', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">🔴 4 Wochen vorher</h4>
                  <ul className="space-y-1 ml-4">
                    {prep.fourWeeks.map((item, idx) => (
                      <li key={idx} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">🟡 2 Wochen vorher</h4>
                  <ul className="space-y-1 ml-4">
                    {prep.twoWeeks.map((item, idx) => (
                      <li key={idx} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-yellow-700">🟢 1 Woche vorher</h4>
                  <ul className="space-y-1 ml-4">
                    {prep.oneWeek.map((item, idx) => (
                      <li key={idx} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">🔵 Letzter Tag</h4>
                  <ul className="space-y-1 ml-4">
                    {prep.lastDay.map((item, idx) => (
                      <li key={idx} className="text-sm list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Tips & Common Mistakes */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-yellow-500" />
                  Lerntipps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guideContent.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  ⚠️ Häufige Fehler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guideContent.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-500">❌</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Success Checklist */}
          <Card className="border-2 border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Erfolgs-Checkliste
              </CardTitle>
              <CardDescription>
                Bist du bereit für die Prüfung? Checke alle Punkte ab!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guideContent.successChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <input type="checkbox" className="size-5 rounded border-gray-300" />
                    <label className="flex-1 cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={generateGuide}
              disabled={isGenerating}
            >
              <Sparkles className="size-4 mr-2" />
              Guide neu generieren
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
