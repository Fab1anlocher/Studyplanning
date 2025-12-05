import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, BookOpen, FileText, Calendar, ArrowRight, ArrowLeft, Check, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Module {
  id: string;
  name: string;
  ects: number;
  workload: number;
  examDate: string;
  assessments: Assessment[];
  pdfName?: string;
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
}

export function ModuleUpload({ onNext, onBack, modules, setModules }: ModuleUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newModules: Module[] = [];
    const fileNames: string[] = [];

    // Simuliere das Hochladen und Parsen mehrerer PDFs
    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf') {
        fileNames.push(file.name);
        
        // Mock: Verschiedene Module mit verschiedenen Assessment-Typen
        const mockModule: Module = {
          id: Date.now().toString() + Math.random(),
          name: file.name.replace('.pdf', '').replace(/_/g, ' '),
          ects: Math.floor(Math.random() * 3) + 4, // 4-6 ECTS
          workload: (Math.floor(Math.random() * 3) + 4) * 30, // 120-180h
          examDate: '',
          pdfName: file.name,
          assessments: generateMockAssessments(),
        };
        
        newModules.push(mockModule);
      }
    });

    setModules([...modules, ...newModules]);
    setUploadedFiles([...uploadedFiles, ...fileNames]);
    
    // Nach Upload direkt zur Review-Ansicht
    if (newModules.length > 0) {
      setTimeout(() => setShowReview(true), 500);
    }
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

  const deleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
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
              />
              
              <label htmlFor="pdf-upload">
                <Button size="lg" asChild>
                  <span className="cursor-pointer">
                    <Upload className="size-5 mr-2" />
                    Modulbeschreibungen hochladen
                  </span>
                </Button>
              </label>
              
              <p className="text-sm text-gray-500 mt-4">
                Du kannst mehrere PDFs gleichzeitig hochladen
              </p>
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
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Zurück
            </Button>
            <Button 
              onClick={() => setShowReview(true)} 
              disabled={modules.length === 0}
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
                        <Badge variant="secondary">{module.ects} ECTS</Badge>
                        <Badge variant="secondary">{module.workload}h</Badge>
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-900">Leistungsnachweise</h4>
                    <span className="text-sm text-gray-600">
                      {module.assessments.filter(a => a.deadline).length} von {module.assessments.length} Deadlines gesetzt
                    </span>
                  </div>
                  
                  {module.assessments.map((assessment, assessmentIndex) => (
                    <div 
                      key={assessment.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        assessment.deadline 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-orange-50 border-orange-300 border-dashed'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-1 flex items-center justify-center">
                          {assessment.deadline ? (
                            <div className="bg-green-500 rounded-full p-1">
                              <Check className="size-4 text-white" />
                            </div>
                          ) : (
                            <div className="bg-orange-500 text-white rounded-full size-6 flex items-center justify-center text-xs">
                              !
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-3">
                          <div className="text-gray-900">{assessment.type}</div>
                          <div className="text-xs text-gray-600">{assessment.format}</div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Badge variant="secondary">{assessment.weight}%</Badge>
                        </div>
                        
                        <div className="md:col-span-6">
                          <div className="space-y-1">
                            <Label htmlFor={`deadline-${assessment.id}`} className="text-xs">
                              Abgabedatum *
                            </Label>
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-gray-400" />
                              <Input
                                id={`deadline-${assessment.id}`}
                                type="date"
                                value={assessment.deadline}
                                onChange={(e) => updateAssessmentDeadline(module.id, assessment.id, e.target.value)}
                                className={!assessment.deadline ? 'border-orange-400' : 'border-green-400'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
            />
            <label htmlFor="pdf-upload-more">
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  <Upload className="size-4 mr-2" />
                  Weitere Module hochladen
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
