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
  moduleFocus: {
    coreIdea: string;
    highImpactAreas: string[];
    lowerPriorityAreas: string[];
  };
  howThisModuleIsUsuallyTested: {
    examLogic: string;
    whatExaminersCareAbout: string;
    whatMattersLess: string;
  };
  learningStrategyForThisModule: {
    whereToStart: string;
    howToUseStudyTime: string[];
    ifYouFallBehind: string[];
  };
  connectionToStudyPlan: {
    howToUseSessions: string;
    signalsToAdjustPlan: string[];
  };
  readinessCheck: {
    mustBeAbleToDo: string[];
    selfAssessment: string[];
  };
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

      // Import user prompt from separate file and replace variables (using global flag for consistency)
      const userPrompt = MODULE_GUIDE_USER_PROMPT
        .replace(/{moduleName}/g, module.name)
        .replace(/{ects}/g, module.ects?.toString() || 'N/A')
        .replace(/{workload}/g, (module.workload || module.ects * 30)?.toString() || 'N/A')
        .replace(/{totalHours}/g, Math.round(totalHours).toString())
        .replace(/{sessionCount}/g, moduleSessions.length.toString())
        .replace(/{content}/g, module.content?.join(', ') || 'Keine Angabe')
        .replace(/{competencies}/g, module.competencies?.join(', ') || 'Keine Angabe')
        .replace(/{assessments}/g, module.assessments?.map((a: any) => `- ${a.type} (${a.weight}%) - ${a.format} - Termin: ${a.deadline || 'TBD'}`).join('\n') || 'Keine Angabe')
        .replace(/{sessionExamples}/g, moduleSessions.slice(0, 5).map(s => `- ${s.date}: ${s.topic} (${s.startTime}-${s.endTime})`).join('\n') || 'Keine Sessions')
        .replace(/{assessmentsList}/g, module.assessments?.map((a: any, idx: number) => `${idx + 1}. ${a.type} (${a.weight}%, ${a.format}) - Deadline: ${a.deadline || 'TBD'}`).join('\n') || 'Keine Assessments');

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
        try {
          const parsed = JSON.parse(content);
          
          // Try to normalize field names (AI sometimes uses slightly different names)
          const normalized: any = {
            moduleFocus: parsed.moduleFocus || parsed.module_focus || parsed.ModuleFocus || {},
            howThisModuleIsUsuallyTested: parsed.howThisModuleIsUsuallyTested || parsed.how_this_module_is_usually_tested || parsed.examInfo || {},
            learningStrategyForThisModule: parsed.learningStrategyForThisModule || parsed.learning_strategy_for_this_module || parsed.learningStrategy || {},
            connectionToStudyPlan: parsed.connectionToStudyPlan || parsed.connection_to_study_plan || {},
            readinessCheck: parsed.readinessCheck || parsed.readiness_check || {}
          };
          
          // Validate that required fields exist to prevent white screen
          if (!normalized.moduleFocus.coreIdea && !normalized.moduleFocus.highImpactAreas) {
            console.error('Guide JSON fehlt moduleFocus Felder:', parsed);
            setError('Der generierte Guide hat ein ungültiges Format. Bitte erneut versuchen. (Fehlende moduleFocus Daten)');
            return;
          }
          
          // Set defaults for moduleFocus
          normalized.moduleFocus.coreIdea = normalized.moduleFocus.coreIdea || 'Keine Kernidee generiert';
          normalized.moduleFocus.highImpactAreas = Array.isArray(normalized.moduleFocus.highImpactAreas) ? normalized.moduleFocus.highImpactAreas : [];
          normalized.moduleFocus.lowerPriorityAreas = Array.isArray(normalized.moduleFocus.lowerPriorityAreas) ? normalized.moduleFocus.lowerPriorityAreas : [];
          
          // Set defaults for howThisModuleIsUsuallyTested
          normalized.howThisModuleIsUsuallyTested.examLogic = normalized.howThisModuleIsUsuallyTested.examLogic || 'Keine Prüfungslogik generiert';
          normalized.howThisModuleIsUsuallyTested.whatExaminersCareAbout = normalized.howThisModuleIsUsuallyTested.whatExaminersCareAbout || '';
          normalized.howThisModuleIsUsuallyTested.whatMattersLess = normalized.howThisModuleIsUsuallyTested.whatMattersLess || '';
          
          // Set defaults for learningStrategyForThisModule
          normalized.learningStrategyForThisModule.whereToStart = normalized.learningStrategyForThisModule.whereToStart || 'Starte mit den Grundlagen';
          normalized.learningStrategyForThisModule.howToUseStudyTime = Array.isArray(normalized.learningStrategyForThisModule.howToUseStudyTime) ? normalized.learningStrategyForThisModule.howToUseStudyTime : [];
          normalized.learningStrategyForThisModule.ifYouFallBehind = Array.isArray(normalized.learningStrategyForThisModule.ifYouFallBehind) ? normalized.learningStrategyForThisModule.ifYouFallBehind : [];
          
          // Set defaults for connectionToStudyPlan
          normalized.connectionToStudyPlan.howToUseSessions = normalized.connectionToStudyPlan.howToUseSessions || '';
          normalized.connectionToStudyPlan.signalsToAdjustPlan = Array.isArray(normalized.connectionToStudyPlan.signalsToAdjustPlan) ? normalized.connectionToStudyPlan.signalsToAdjustPlan : [];
          
          // Set defaults for readinessCheck
          normalized.readinessCheck.mustBeAbleToDo = Array.isArray(normalized.readinessCheck.mustBeAbleToDo) ? normalized.readinessCheck.mustBeAbleToDo : [];
          normalized.readinessCheck.selfAssessment = Array.isArray(normalized.readinessCheck.selfAssessment) ? normalized.readinessCheck.selfAssessment : [];
          
          setGuideContent(normalized);
        } catch (parseError) {
          console.error('JSON Parse Fehler:', parseError, 'Content:', content);
          setError('Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.');
        }
      } else {
        setError('Keine Antwort von der KI erhalten.');
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
          {/* Module Focus - Core Idea */}
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-blue-600" />
                Modul-Fokus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🎯 Kernidee</h4>
                <p className="text-gray-700">{guideContent.moduleFocus.coreIdea}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-green-700">✅ High-Impact Bereiche</h4>
                <ul className="space-y-1 ml-4">
                  {guideContent.moduleFocus.highImpactAreas.map((area, idx) => (
                    <li key={idx} className="text-sm list-disc text-gray-700">{area}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-500">⬇️ Weniger Priorität</h4>
                <ul className="space-y-1 ml-4">
                  {guideContent.moduleFocus.lowerPriorityAreas.map((area, idx) => (
                    <li key={idx} className="text-sm list-disc text-gray-500">{area}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How This Module Is Usually Tested */}
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-5 text-purple-600" />
                Wie wird dieses Modul geprüft?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📝 Prüfungslogik</h4>
                <p className="text-gray-700">{guideContent.howThisModuleIsUsuallyTested.examLogic}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-green-700">✅ Worauf Prüfer achten</h4>
                <p className="text-gray-700">{guideContent.howThisModuleIsUsuallyTested.whatExaminersCareAbout}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-500">⬇️ Was weniger zählt</h4>
                <p className="text-gray-500">{guideContent.howThisModuleIsUsuallyTested.whatMattersLess}</p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Strategy */}
          <Card className="border-2 border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-5 text-green-600" />
                Deine Lernstrategie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🚀 Womit starten?</h4>
                <p className="text-gray-700">{guideContent.learningStrategyForThisModule.whereToStart}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">⏰ So nutzt du deine Lernzeit</h4>
                <ul className="space-y-2">
                  {guideContent.learningStrategyForThisModule.howToUseStudyTime.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">⚡ Wenn du in Zeitnot gerätst</h4>
                <ul className="space-y-1 ml-4">
                  {guideContent.learningStrategyForThisModule.ifYouFallBehind.map((tip, idx) => (
                    <li key={idx} className="text-sm list-disc text-gray-700">{tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Connection to Study Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Verbindung zum Lernplan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📅 So nutzt du deine Sessions</h4>
                <p className="text-gray-700">{guideContent.connectionToStudyPlan.howToUseSessions}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">⚠️ Warnsignale für Plananpassung</h4>
                <ul className="space-y-1 ml-4">
                  {guideContent.connectionToStudyPlan.signalsToAdjustPlan.map((signal, idx) => (
                    <li key={idx} className="text-sm list-disc text-gray-700">{signal}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Readiness Check */}
          <Card className="border-2 border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Bereitschafts-Check
              </CardTitle>
              <CardDescription>
                Bist du bereit für die Prüfung? Checke alle Punkte ab!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Das musst du können</h4>
                <div className="space-y-2">
                  {guideContent.readinessCheck.mustBeAbleToDo.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <input type="checkbox" className="size-5 rounded border-gray-300" />
                      <label className="flex-1 cursor-pointer">{item}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">🤔 Selbsteinschätzung</h4>
                <ul className="space-y-2">
                  {guideContent.readinessCheck.selfAssessment.map((question, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <span className="text-yellow-600">❓</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
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
