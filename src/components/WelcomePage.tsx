import { Button } from './ui/button';
import { GraduationCap, Upload, Calendar, Brain, Sparkles, Target, Zap, ArrowRight } from 'lucide-react';

interface WelcomePageProps {
  onNext: () => void;
  [key: string]: any;
}

export function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 rounded-3xl shadow-2xl">
            <GraduationCap className="size-20 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4 mb-12">
          <h1 className="text-gray-900 leading-tight">
            StudyPlanner
          </h1>
          <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
            Plane dein Semester realistisch und effizient mit KI-Unterstützung
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 cursor-pointer">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl mb-4 inline-flex transition-transform duration-300 hover:rotate-6">
              <Upload className="size-8 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2">Module hochladen</h3>
            <p className="text-sm text-gray-600">
              Lade deine Modulbeschreibungen als PDFs hoch und extrahiere automatisch alle Daten
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 cursor-pointer">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl mb-4 inline-flex transition-transform duration-300 hover:rotate-6">
              <Calendar className="size-8 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2">Wochenplan erstellen</h3>
            <p className="text-sm text-gray-600">
              Markiere deine verfügbaren Lernzeiten in einem visuellen Grid
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 cursor-pointer">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-xl mb-4 inline-flex transition-transform duration-300 hover:rotate-6">
              <Brain className="size-8 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2">KI-Lernplan</h3>
            <p className="text-sm text-gray-600">
              Die KI wählt automatisch die beste Lernmethode für jedes Modul
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="text-gray-700">KI-gestützt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
              <Target className="size-5 text-white" />
            </div>
            <span className="text-gray-700">Realistisch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-lg">
              <Zap className="size-5 text-white" />
            </div>
            <span className="text-gray-700">Effizient</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={onNext}
          className="h-16 text-xl px-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all"
        >
          Jetzt starten
          <ArrowRight className="size-6 ml-2" />
        </Button>

      </div>
    </div>
  );
}