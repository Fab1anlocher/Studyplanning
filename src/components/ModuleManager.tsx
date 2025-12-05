import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, BookOpen, Edit2, Trash2, FileText, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

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

export function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      name: 'Software Engineering',
      ects: 6,
      workload: 180,
      examDate: '2025-01-20',
      pdfName: 'software_engineering_HS24.pdf',
      assessments: [
        { id: '1', type: 'Semesterarbeit', weight: 40, format: 'Gruppenarbeit', deadline: '2024-12-20' },
        { id: '2', type: 'Schriftliche Prüfung', weight: 60, format: 'Open Book', deadline: '2025-01-20' },
      ],
    },
    {
      id: '2',
      name: 'Datenbanken',
      ects: 4,
      workload: 120,
      examDate: '2025-01-15',
      pdfName: 'datenbanken_HS24.pdf',
      assessments: [
        { id: '1', type: 'Projekt', weight: 50, format: 'Einzelarbeit', deadline: '2024-12-15' },
        { id: '2', type: 'Präsentation', weight: 50, format: 'Gruppenarbeit', deadline: '2025-01-15' },
      ],
    },
  ]);

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Mock PDF-Parsing - In der realen App würde hier die PDF analysiert
      // und an das Backend/LLM geschickt werden
      
      // Simuliere Extraktion nach kurzer Verzögerung
      setTimeout(() => {
        const mockModule: Module = {
          id: Date.now().toString(),
          name: 'Neues Modul',
          ects: 5,
          workload: 150,
          examDate: '2025-02-01',
          pdfName: file.name,
          assessments: [
            { id: '1', type: 'Schriftliche Prüfung', weight: 100, format: 'Einzelarbeit', deadline: '2025-02-01' },
          ],
        };
        
        setModules([...modules, mockModule]);
        setSelectedModule(mockModule);
        setIsUploadDialogOpen(false);
        setIsEditDialogOpen(true);
      }, 1000);
    }
  };

  const updateModule = (updatedModule: Module) => {
    setModules(modules.map(m => m.id === updatedModule.id ? updatedModule : m));
    setIsEditDialogOpen(false);
    setSelectedModule(null);
  };

  const deleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const totalECTS = modules.reduce((sum, m) => sum + m.ects, 0);
  const totalWorkload = modules.reduce((sum, m) => sum + m.workload, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Module</h2>
          <p className="text-gray-600">Verwalte deine Modulbeschreibungen</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="size-4 mr-2" />
              PDF hochladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modulbeschreibung hochladen</DialogTitle>
              <DialogDescription>
                Lade eine Modulbeschreibung als PDF hoch. Die relevanten Daten werden automatisch extrahiert.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-upload">PDF-Datei</Label>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <strong>Hinweis:</strong> Die App extrahiert automatisch ECTS, Workload, Prüfungsdaten und Leistungsnachweise aus dem PDF.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gesamt Module</CardDescription>
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
            <CardDescription>Gesamt Workload</CardDescription>
            <CardTitle className="text-gray-900">{totalWorkload}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Modulliste */}
      <div className="grid grid-cols-1 gap-4">
        {modules.map(module => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BookOpen className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">{module.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {module.pdfName && (
                        <>
                          <FileText className="size-3" />
                          {module.pdfName}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedModule(module);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteModule(module.id)}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">ECTS</div>
                  <div className="text-gray-900">{module.ects}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Workload</div>
                  <div className="text-gray-900">{module.workload}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Prüfungsdatum</div>
                  <div className="flex items-center gap-1 text-gray-900">
                    <Calendar className="size-3" />
                    {new Date(module.examDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-2">Leistungsnachweise</div>
                <div className="space-y-2">
                  {module.assessments.map(assessment => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-gray-900">{assessment.type}</div>
                          <div className="text-xs text-gray-600">{assessment.format}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{assessment.weight}%</Badge>
                        <div className="text-sm text-gray-600">
                          {new Date(assessment.deadline).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {modules.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="size-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Noch keine Module hochgeladen</p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="size-4 mr-2" />
                Erstes Modul hochladen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      {selectedModule && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modul bearbeiten</DialogTitle>
              <DialogDescription>
                Überprüfe und korrigiere die extrahierten Daten bei Bedarf.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="module-name">Modulname</Label>
                <Input
                  id="module-name"
                  value={selectedModule.name}
                  onChange={(e) => setSelectedModule({ ...selectedModule, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ects">ECTS</Label>
                  <Input
                    id="ects"
                    type="number"
                    value={selectedModule.ects}
                    onChange={(e) => setSelectedModule({ ...selectedModule, ects: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workload">Workload (h)</Label>
                  <Input
                    id="workload"
                    type="number"
                    value={selectedModule.workload}
                    onChange={(e) => setSelectedModule({ ...selectedModule, workload: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-date">Prüfungsdatum</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={selectedModule.examDate}
                    onChange={(e) => setSelectedModule({ ...selectedModule, examDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={() => updateModule(selectedModule)}>
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
