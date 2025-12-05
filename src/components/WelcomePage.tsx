import { Button } from './ui/button';
import { BookOpen, Calendar, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomePageProps {
  onNext: () => void;
}

export function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
              <BookOpen className="size-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl text-gray-900">StudyPlanner</h1>
          <p className="text-xl text-gray-600">
            Dein KI-gestützter Semesterplaner für ein erfolgreiches Studium
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="size-6 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Module hochladen</h3>
            <p className="text-sm text-gray-600">
              Lade deine Modulbeschreibungen hoch und wir extrahieren automatisch alle relevanten Daten
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="size-6 text-purple-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Zeitfenster planen</h3>
            <p className="text-sm text-gray-600">
              Trage deine verfügbaren Lernzeiten ein und wir optimieren deinen Wochenplan
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="size-6 text-orange-600" />
            </div>
            <h3 className="text-gray-900 mb-2">KI-Lernplan</h3>
            <p className="text-sm text-gray-600">
              Erhalte einen realistischen, KI-optimierten Lernplan basierend auf deinen Daten
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={onNext}
          >
            Loslegen
            <ArrowRight className="size-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-500">
            In nur 3 Schritten zu deinem persönlichen Semesterplan
          </p>
        </div>
      </div>
    </div>
  );
}
