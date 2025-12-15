import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, BookOpen, FileText, Calendar, ArrowRight, ArrowLeft, Check, Trash2, Edit2, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { extractTextFromPDF } from '../services/pdfExtractor';
import { processModulePDF } from '../services/aiModuleExtractor';

interface Module {
  id: string;
  name: string;
  ects: number;
  workload: number;
  examDate: string;
  assessments: Assessment[];
  pdfName?: string;
  extractedContent?: string; // Raw PDF content
  content?: string[];  // Inhalte/Themen des Moduls
  competencies?: string[];  // Lernziele/Kompetenzen
}

interface Assessment {
  id: string;
  type: string;
  weight: number;
  format: string;
  deadline: string;
}

interface ModuleUploadProps {
  onNext: () => void;
  onBack: () => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
  apiKey?: string; // API Key wird von App.tsx übergeben
  [key: string]: any; // Accept any other props
}

export function ModuleUpload({ onNext, onBack, modules, setModules, apiKey = '' }: ModuleUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [expandedCompetencies, setExpandedCompetencies] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // API-Key Validierung
    if (!apiKey || apiKey.trim() === '') {
      setError('Bitte gib zuerst einen gültigen OpenAI API-Key ein.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const newModules: Module[] = [];
    const fileNames: string[] = [];
    const totalFiles = files.length;
    let processedFiles = 0;

    try {
      // Verarbeite alle PDFs nacheinander
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          console.warn(`Datei ${file.name} ist keine PDF und wird übersprungen`);
          continue;
        }

        processedFiles++;
        setProcessingStatus(`Verarbeite ${file.name} (${processedFiles}/${totalFiles})...`);

        try {
          // 1. PDF-Text extrahieren
          setProcessingStatus(`Lese PDF ${processedFiles}/${totalFiles}: ${file.name}...`);
          const pdfText = await extractTextFromPDF(file);

          // 2. KI-Analyse durchführen
          setProcessingStatus(`KI analysiert ${processedFiles}/${totalFiles}: ${file.name}...`);
          const result = await processModulePDF(file, pdfText, apiKey);

          // 3. Modul-Objekt erstellen
          const newModule: Module = {
            id: Date.now().toString() + Math.random(),
            name: result.moduleData.title,
            ects: result.moduleData.ects,
            workload: result.moduleData.workload,
            examDate: '',
            pdfName: file.name,
            extractedContent: result.extractedContent,
            content: result.moduleData.content || [],
            competencies: result.moduleData.competencies || [],
            assessments: result.moduleData.assessments.map((assessment, index) => ({
              id: Date.now().toString() + index,
              type: assessment.type,
              weight: assessment.weight,
              format: assessment.format,
              deadline: ''
            }))
          };

          newModules.push(newModule);
          fileNames.push(file.name);
        } catch (fileError) {
          console.error(`Detaillierter Fehler beim Verarbeiten von ${file.name}:`, fileError);
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unbekannter Fehler';
          setError(`Fehler bei ${file.name}: ${errorMessage}`);
          // Fahre mit der nächsten Datei fort
          continue;
        }
      }

      // Aktualisiere den Zustand mit allen neuen Modulen
      if (newModules.length > 0) {
        setModules([...modules, ...newModules]);
        setUploadedFiles([...uploadedFiles, ...fileNames]);
        
        // Zur Review-Ansicht wechseln
        setTimeout(() => {
          setShowReview(true);
          setIsProcessing(false);
          setProcessingStatus('');
        }, 500);
      } else {
        setIsProcessing(false);
        setProcessingStatus('');
        if (!error) {
          setError('Keine PDFs konnten erfolgreich verarbeitet werden.');
        }
      }
    } catch (err) {
      console.error('Fehler beim Verarbeiten der Dateien:', err);
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten');
      setIsProcessing(false);
      setProcessingStatus('');
    }

    // Reset file input
    event.target.value = '';
  };

  const generateMockAssessments = (): Assessment[] => {
    const assessmentTypes = [
      { type: 'Schriftliche Prüfung', format: 'Einzelarbeit', weight: 60 },
      { type: 'Semesterarbeit', format: 'Gruppenarbeit', weight: 40 },
      { type: 'Präsentation', format: 'Gruppenarbeit', weight: 30 },
      { type: 'Reflexion', format: 'Einzelarbeit', weight: 20 },
      { type: 'Projekt', format: 'Gruppenarbeit', weight: 50 },
      { type: 'Mündliche Prüfung', format: 'Einzelarbeit', weight: 40 },
    ];

    // Zufällig 1-3 Assessments auswählen
    const numAssessments = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...assessmentTypes].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numAssessments);
    
    return selected.map((assessment, index) => ({
      id: Date.now().toString() + index,
      type: assessment.type,
      format: assessment.format,
      weight: assessment.weight,
      deadline: '', // Muss vom User ausgefüllt werden
    }));
  };

  const dismissError = () => {
    setError(null);
  };

  const updateModuleName = (moduleId: string, name: string) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, name } : m));
  };

  const updateAssessmentDeadline = (moduleId: string, assessmentId: string, deadline: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          assessments: m.assessments.map(a => 
            a.id === assessmentId ? { ...a, deadline } : a
          )
        };
      }
      return m;
    }));
  };

  const updateAssessmentWeight = (moduleId: string, assessmentId: string, weight: number) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          assessments: m.assessments.map(a => 
            a.id === assessmentId ? { ...a, weight } : a
          )
        };
      }
      return m;
    }));
  };

  const updateModuleECTS = (moduleId: string, ects: number) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, ects } : m));
  };

  const updateModuleWorkload = (moduleId: string, workload: number) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, workload } : m));
  };

  const deleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const deleteAssessment = (moduleId: string, assessmentId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        // Ensure at least one assessment remains
        if (m.assessments.length > 1) {
          return {
            ...m,
            assessments: m.assessments.filter(a => a.id !== assessmentId)
          };
        }
      }
      return m;
    }));
  };

  const updateAssessmentType = (moduleId: string, assessmentId: string, type: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          assessments: m.assessments.map(a => 
            a.id === assessmentId ? { ...a, type } : a
          )
        };
      }
      return m;
    }));
  };

  const updateAssessmentFormat = (moduleId: string, assessmentId: string, format: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          assessments: m.assessments.map(a => 
            a.id === assessmentId ? { ...a, format } : a
          )
        };
      }
      return m;
    }));
  };

  const updateContentTopic = (moduleId: string, index: number, value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId && m.content) {
        const newContent = [...m.content];
        newContent[index] = value;
        return { ...m, content: newContent };
      }
      return m;
    }));
  };

  const deleteContentTopic = (moduleId: string, index: number) => {
    setModules(modules.map(m => {
      if (m.id === moduleId && m.content) {
        return {
          ...m,
          content: m.content.filter((_, i) => i !== index)
        };
      }
      return m;
    }));
  };

  const addContentTopic = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          content: [...(m.content || []), 'Neues Thema']
        };
      }
      return m;
    }));
  };

  const updateCompetency = (moduleId: string, index: number, value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId && m.competencies) {
        const newCompetencies = [...m.competencies];
        newCompetencies[index] = value;
        return { ...m, competencies: newCompetencies };
      }
      return m;
    }));
  };

  const deleteCompetency = (moduleId: string, index: number) => {
    setModules(modules.map(m => {
      if (m.id === moduleId && m.competencies) {
        return {
          ...m,
          competencies: m.competencies.filter((_, i) => i !== index)
        };
      }
      return m;
    }));
  };

  const addCompetency = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          competencies: [...(m.competencies || []), 'Neue Kompetenz']
        };
      }
      return m;
    }));
  };

  const addAssessment = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        const newAssessment: Assessment = {
          id: Date.now().toString() + Math.random(),
          type: 'Schriftliche Prüfung',
          weight: 0,
          format: 'Einzelarbeit',
          deadline: ''
        };
        return {
          ...m,
          assessments: [...m.assessments, newAssessment]
        };
      }
      return m;
    }));
  };

  const allDeadlinesSet = modules.every(module => 
    module.assessments.every(assessment => assessment.deadline !== '')
  );

  const totalECTS = modules.reduce((sum, m) => sum + m.ects, 0);
  const totalWorkload = modules.reduce((sum, m) => sum + m.workload, 0);
  const totalAssessments = modules.reduce((sum, m) => sum + m.assessments.length, 0);

  if (!showReview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-gray-900">Module hochladen</h2>
            <p className="text-gray-600">
              Lade alle deine Modulbeschreibungen als PDF hoch. Die KI extrahiert automatisch alle wichtigen Daten.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-900 font-medium">Fehler beim Verarbeiten</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={dismissError}>
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="size-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">PDFs werden verarbeitet...</p>
                    <p className="text-sm text-blue-700 mt-1">{processingStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Area */}
          <Card className="border-dashed border-2 border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl mb-6">
                <Upload className="size-12 text-white" />
              </div>
              
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              
              <label htmlFor="pdf-upload">
                <Button size="lg" asChild disabled={isProcessing}>
                  <span className="cursor-pointer">
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-5 mr-2 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <Upload className="size-5 mr-2" />
                        Modulbeschreibungen hochladen
                      </>
                    )}
                  </span>
                </Button>
              </label>
              
              <p className="text-sm text-gray-500 mt-4">
                Du kannst mehrere PDFs gleichzeitig hochladen
              </p>
              {!apiKey && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ Bitte gib zuerst einen OpenAI API-Key ein
                </p>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Files Preview */}
          {modules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hochgeladene Module ({modules.length})</CardTitle>
                <CardDescription>
                  Klicke auf &quot;Weiter&quot; um die extrahierten Daten zu überprüfen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {modules.map(module => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-blue-600" />
                      <div>
                        <div className="text-gray-900">{module.pdfName}</div>
                        <div className="text-xs text-gray-600">
                          {module.assessments.length} Leistungsnachweise extrahiert
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{module.ects} ECTS</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack} disabled={isProcessing}>
              <ArrowLeft className="size-4 mr-2" />
              Zurück
            </Button>
            <Button 
              onClick={() => setShowReview(true)} 
              disabled={modules.length === 0 || isProcessing}
            >
              Weiter zur Überprüfung
              <ArrowRight className="size-4 ml-2" />
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
          <h2 className="text-gray-900">Daten überprüfen</h2>
          <p className="text-gray-600">
            Überprüfe die extrahierten Daten und füge die Abgabedaten für alle Leistungsnachweise hinzu
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Module</CardDescription>
              <CardTitle className="text-gray-900">{modules.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Gesamt ECTS</CardDescription>
              <CardTitle className="text-gray-900">{totalECTS}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Workload</CardDescription>
              <CardTitle className="text-gray-900">{totalWorkload}h</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Leistungsnachweise</CardDescription>
              <CardTitle className="text-gray-900">{totalAssessments}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* All Modules with Assessments */}
        <div className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <BookOpen className="size-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-600">Modul {moduleIndex + 1}</span>
                      </div>
                      <Input
                        value={module.name}
                        onChange={(e) => updateModuleName(module.id, e.target.value)}
                        className="mb-2 bg-white"
                      />
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {module.pdfName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">ECTS:</Label>
                          <Input
                            type="number"
                            value={module.ects}
                            onChange={(e) => updateModuleECTS(module.id, parseInt(e.target.value) || 0)}
                            className="h-7 w-16 text-sm"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Workload:</Label>
                          <Input
                            type="number"
                            value={module.workload}
                            onChange={(e) => updateModuleWorkload(module.id, parseInt(e.target.value) || 0)}
                            className="h-7 w-20 text-sm"
                            min="1"
                          />
                          <span className="text-xs">h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteModule(module.id)}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Content/Topics Section - Collapsible and Editable */}
                  {module.content && module.content.length > 0 && (
                    <Collapsible
                      open={expandedContent === module.id}
                      onOpenChange={() => setExpandedContent(expandedContent === module.id ? null : module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full mb-2">
                          <BookOpen className="size-4 mr-2" />
                          Inhalte & Themen ({module.content.length})
                          {expandedContent === module.id ? <ChevronUp className="size-4 ml-auto" /> : <ChevronDown className="size-4 ml-auto" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="bg-blue-50 p-4 rounded-lg mb-4 space-y-2">
                          {module.content.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={item}
                                onChange={(e) => updateContentTopic(module.id, index, e.target.value)}
                                className="bg-white text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContentTopic(module.id, index)}
                              >
                                <Trash2 className="size-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => addContentTopic(module.id)}
                          >
                            + Thema hinzufügen
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  {/* Competencies Section - Collapsible and Editable */}
                  {module.competencies && module.competencies.length > 0 && (
                    <Collapsible
                      open={expandedCompetencies === module.id}
                      onOpenChange={() => setExpandedCompetencies(expandedCompetencies === module.id ? null : module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full mb-4">
                          <CheckCircle2 className="size-4 mr-2" />
                          Lernziele & Kompetenzen ({module.competencies.length})
                          {expandedCompetencies === module.id ? <ChevronUp className="size-4 ml-auto" /> : <ChevronDown className="size-4 ml-auto" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="bg-green-50 p-4 rounded-lg mb-4 space-y-2">
                          {module.competencies.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={item}
                                onChange={(e) => updateCompetency(module.id, index, e.target.value)}
                                className="bg-white text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCompetency(module.id, index)}
                              >
                                <Trash2 className="size-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => addCompetency(module.id)}
                          >
                            + Kompetenz hinzufügen
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-900">Leistungsnachweise</h4>
                    <span className="text-sm text-gray-600">
                      {module.assessments.filter(a => a.deadline).length} von {module.assessments.length} Deadlines gesetzt
                    </span>
                  </div>
                  
                  {module.assessments.map((assessment, assessmentIndex) => (
                    <div 
                      key={assessment.id}
                      className={`p-5 rounded-xl border-2 transition-all shadow-sm ${
                        assessment.deadline 
                          ? 'bg-white border-green-400 shadow-green-100' 
                          : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400 border-dashed shadow-orange-100'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-1 flex items-center justify-center">
                          {assessment.deadline ? (
                            <div className="bg-green-600 rounded-full p-1.5 shadow-md">
                              <Check className="size-5 text-white" />
                            </div>
                          ) : (
                            <div className="bg-orange-600 text-white rounded-full size-8 flex items-center justify-center text-sm font-bold shadow-md">
                              !
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-3">
                          <div className="space-y-2">
                            <div className="relative group">
                              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Prüfungstyp</Label>
                              <Input
                                value={assessment.type}
                                onChange={(e) => updateAssessmentType(module.id, assessment.id, e.target.value)}
                                className="text-sm font-semibold bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="z.B. Schriftliche Prüfung"
                              />
                            </div>
                            <div className="relative group">
                              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Format</Label>
                              <Input
                                value={assessment.format}
                                onChange={(e) => updateAssessmentFormat(module.id, assessment.id, e.target.value)}
                                className="text-sm bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="z.B. Einzelarbeit"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-gray-700 mb-1 block">Gewichtung</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={assessment.weight}
                                onChange={(e) => updateAssessmentWeight(module.id, assessment.id, parseInt(e.target.value) || 0)}
                                className="h-9 w-20 text-sm font-bold bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm font-semibold text-gray-700">%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-6">
                          <div className="space-y-1">
                            <Label htmlFor={`deadline-${assessment.id}`} className="text-xs font-semibold text-gray-700 mb-1 block">
                              Prüfungsdatum * {!assessment.deadline && <span className="text-orange-600">(Erforderlich)</span>}
                            </Label>
                            <div 
                              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border-2 transition-all cursor-pointer hover:border-blue-400" 
                              style={{
                                borderColor: assessment.deadline ? '#22c55e' : '#fb923c'
                              }}
                              onClick={() => {
                                const input = document.getElementById(`deadline-${assessment.id}`) as HTMLInputElement;
                                if (input) input.showPicker?.();
                              }}
                            >
                              <Calendar className="size-5 flex-shrink-0" style={{
                                color: assessment.deadline ? '#16a34a' : '#ea580c'
                              }} />
                              <Input
                                id={`deadline-${assessment.id}`}
                                type="date"
                                value={assessment.deadline}
                                onChange={(e) => updateAssessmentDeadline(module.id, assessment.id, e.target.value)}
                                className="flex-1 text-sm font-semibold border-0 focus:ring-0 p-0 bg-transparent cursor-pointer"
                                style={{ minWidth: '200px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Assessment Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => addAssessment(module.id)}
                  >
                    <Calendar className="size-4 mr-2" />
                    Weitere Prüfung hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add more modules option */}
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <input
              type="file"
              id="pdf-upload-more"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
            <label htmlFor="pdf-upload-more">
              <Button variant="outline" asChild disabled={isProcessing}>
                <span className="cursor-pointer">
                  {isProcessing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Wird verarbeitet...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 mr-2" />
                      Weitere Module hochladen
                    </>
                  )}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* Validation Message */}
        {!allDeadlinesSet && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 text-center">
                <strong>Hinweis:</strong> Bitte füge für alle Leistungsnachweise ein Abgabedatum hinzu, um fortzufahren.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            <ArrowLeft className="size-4 mr-2" />
            Zurück zum Upload
          </Button>
          <Button onClick={onNext} disabled={!allDeadlinesSet}>
            {allDeadlinesSet ? (
              <>
                Weiter
                <ArrowRight className="size-4 ml-2" />
              </>
            ) : (
              <>
                Alle Deadlines eingeben
                <ArrowRight className="size-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}