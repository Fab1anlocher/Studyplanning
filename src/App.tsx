import { useState } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { ApiKeyPage } from './components/ApiKeyPage';
import { ModuleUpload } from './components/ModuleUpload';
import { WeeklySchedule } from './components/WeeklySchedule';
import { StudyPlanGenerator } from './components/StudyPlanGenerator';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface Module {
  id: string;
  name: string;
  ects: number;
  workload: number;
  examDate: string;
  assessments: any[];
  pdfName?: string;
  extractedContent?: string;
}

// Props interface for step components
interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
  timeSlots: TimeSlot[];
  setTimeSlots: (slots: TimeSlot[]) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export default function App() {
  // For testing: Start at different steps based on URL params
  // ?test=true -> Step 4 (StudyPlanGenerator)
  // ?step=3 -> Step 3 (WeeklySchedule)
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'true';
  const testStep = urlParams.get('step');
  
  const initialStep = isTestMode ? 4 : (testStep ? parseInt(testStep) : 0);
  const hasTestData = isTestMode || testStep;
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [modules, setModules] = useState<Module[]>(hasTestData ? [
    { id: '1', name: 'Software Engineering', ects: 6, workload: 180, examDate: '2024-12-20', assessments: [] },
    { id: '2', name: 'Datenbanken', ects: 4, workload: 120, examDate: '2024-12-18', assessments: [] },
    { id: '3', name: 'Web Development', ects: 5, workload: 150, examDate: '2024-12-22', assessments: [] }
  ] : []);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [apiKey, setApiKey] = useState(hasTestData ? 'sk-test-123' : '');

  const steps = [
    { component: WelcomePage, title: 'Willkommen' },
    { component: ApiKeyPage, title: 'API-Key' },
    { component: ModuleUpload, title: 'Module hochladen' },
    { component: WeeklySchedule, title: 'Wochenplan' },
    { component: StudyPlanGenerator, title: 'Lernplan' },
  ];

  const CurrentComponent = steps[currentStep].component;

  const handleNext = () => {
    console.log('[Navigation] Navigating to next step from:', currentStep);
    console.log('[Navigation] Current state:', {
      modules: modules.length,
      timeSlots: timeSlots.length,
      apiKey: apiKey ? 'set' : 'not set'
    });
    
    // Validation before navigation
    if (currentStep === 3 && timeSlots.length === 0) {
      console.error('[Navigation] Cannot proceed: No time slots selected');
      return;
    }
    
    setCurrentStep(prev => {
      const next = prev + 1;
      console.log('[Navigation] Moving from step', prev, 'to step', next);
      return next;
    });
  };

  const handleBack = () => {
    console.log('[Navigation] Navigating to previous step from:', currentStep);
    setCurrentStep(prev => {
      const next = prev - 1;
      console.log('[Navigation] Moving from step', prev, 'to step', next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar - nur ab Step 2 anzeigen */}
      {currentStep >= 2 && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900">
                {steps[currentStep].title}
              </h3>
              <span className="text-sm text-gray-500">
                Schritt {currentStep - 1} von {steps.length - 2}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 2)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className={currentStep >= 2 ? 'pt-24' : ''}>
        <CurrentComponent
          onNext={handleNext}
          onBack={handleBack}
          modules={modules}
          setModules={setModules}
          timeSlots={timeSlots}
          setTimeSlots={setTimeSlots}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      </main>
    </div>
  );
}