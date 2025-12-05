import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Key, Eye, EyeOff, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useState } from 'react';

interface ApiKeyPageProps {
  onNext: () => void;
  onBack: () => void;
  apiKey?: string;
  setApiKey?: (key: string) => void;
  [key: string]: any;
}

export function ApiKeyPage({ onNext, onBack, apiKey = '', setApiKey }: ApiKeyPageProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleContinue = () => {
    if (!apiKey) {
      alert('Bitte gib deinen OpenAI API-Key ein, um fortzufahren.');
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        <Card className="border-2 border-blue-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100 text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Key className="size-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl mb-2">OpenAI API-Key</CardTitle>
            <CardDescription className="text-base">
              Verbinde deinen OpenAI Account, um KI-gestützte Lernpläne zu erstellen
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-8">
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="size-4 text-blue-600" />
              <AlertDescription>
                <strong>Deine Daten bleiben sicher:</strong> Der API-Key wird nur lokal gespeichert und direkt an OpenAI gesendet.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="api-key" className="text-base text-gray-900">
                OpenAI API-Key *
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey?.(e.target.value)}
                  className="h-14 pr-12 text-base"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6 space-y-4">
              <p className="text-gray-900">
                <strong>Wo finde ich meinen API-Key?</strong>
              </p>
              <ol className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white size-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5">1</span>
                  <span className="text-gray-700 pt-0.5">
                    Gehe zu{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white size-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5">2</span>
                  <span className="text-gray-700 pt-0.5">Klicke auf &quot;Create new secret key&quot;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white size-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5">3</span>
                  <span className="text-gray-700 pt-0.5">Kopiere den Key und füge ihn oben ein</span>
                </li>
              </ol>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onBack}
                className="flex-1 h-14"
              >
                <ArrowLeft className="size-5 mr-2" />
                Zurück
              </Button>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!apiKey}
                className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Weiter
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          StudyPlanner nutzt GPT-4 für die beste Planqualität
        </p>

      </div>
    </div>
  );
}
