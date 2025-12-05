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

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [apiKey, setApiKey] = useState('');

  const steps = [
    { component: WelcomePage, title: 'Willkommen' },
    { component: ApiKeyPage, title: 'API-Key' },
    { component: ModuleUpload, title: 'Module hochladen' },
    { component: WeeklySchedule, title: 'Wochenplan' },
    { component: StudyPlanGenerator, title: 'Lernplan' },
  ];

  const CurrentComponent = steps[currentStep].component;

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
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