/**
 * ExecutionGuideView - Displays execution guide details for a session
 */

import { ExecutionGuide } from '../types/executionGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Target, Clock, Lightbulb, Wrench, Package, CheckCircle2 } from 'lucide-react';

interface ExecutionGuideViewProps {
  guide: ExecutionGuide;
  sessionInfo?: {
    topic: string;
    module: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

export function ExecutionGuideView({ guide, sessionInfo }: ExecutionGuideViewProps) {
  const totalMinutes = guide.agenda.reduce((sum, item) => sum + item.duration, 0);
  
  return (
    <div className="space-y-4">
      {/* Session Goal */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-5 text-blue-600" />
            Session-Ziel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{guide.sessionGoal}</p>
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-5 text-purple-600" />
            Ablaufplan ({totalMinutes} Minuten)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guide.agenda.map((item, index) => (
              <div key={index} className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.phase}</h4>
                  <Badge variant="outline" className="bg-white">
                    {item.duration} Min
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Method Ideas */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-5 text-orange-600" />
            Konkrete Vorgehensweisen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {guide.methodIdeas.map((idea, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 size-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-700 flex-1">{idea}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tools */}
      {guide.tools && guide.tools.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-5 text-green-600" />
              Tools & Materialien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {guide.tools.map((tool, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200">
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deliverable */}
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-5 text-pink-600" />
            Erwartetes Ergebnis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 font-medium">{guide.deliverable}</p>
        </CardContent>
      </Card>

      {/* Ready Check */}
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Erfolgs-Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{guide.readyCheck}</p>
        </CardContent>
      </Card>

      {/* Generated timestamp */}
      {guide.generatedAt && (
        <p className="text-xs text-gray-500 text-center">
          Generiert am {new Date(guide.generatedAt).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  );
}
