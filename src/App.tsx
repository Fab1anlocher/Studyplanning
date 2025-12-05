import { useState } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { ModuleUpload } from './components/ModuleUpload';
import { WeeklySchedule } from './components/WeeklySchedule';
import { StudyPlanGenerator } from './components/StudyPlanGenerator';
import { Progress } from './components/ui/progress';

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [modules, setModules] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const steps = [
    { id: 0, title: 'Willkommen', component: WelcomePage },
    { id: 1, title: 'Module hochladen', component: ModuleUpload },
    { id: 2, title: 'Wochenplan erstellen', component: WeeklySchedule },
    { id: 3, title: 'Lernplan generieren', component: StudyPlanGenerator },
  ];

  const CurrentComponent = steps[currentStep].component;
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {currentStep > 0 && (
        <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Schritt {currentStep} von {steps.length - 1}</span>
                <span className="text-gray-900">{steps[currentStep].title}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      )}

      <main className={currentStep > 0 ? 'pt-24' : ''}>
        <CurrentComponent
          onNext={() => setCurrentStep(currentStep + 1)}
          onBack={() => setCurrentStep(currentStep - 1)}
          modules={modules}
          setModules={setModules}
          timeSlots={timeSlots}
          setTimeSlots={setTimeSlots}
        />
      </main>
    </div>
  );
}