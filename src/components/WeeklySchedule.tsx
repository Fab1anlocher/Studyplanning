import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight, ArrowLeft, Clock, Info } from 'lucide-react';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleProps {
  onNext: () => void;
  onBack: () => void;
  timeSlots: TimeSlot[];
  setTimeSlots: (slots: TimeSlot[]) => void;
  [key: string]: any; // Accept any other props
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Zeitblöcke von 6 Uhr bis 23 Uhr (2-Stunden-Blöcke)
// Jeder Block repräsentiert eine 2-stündige Lerneinheit
const TIME_BLOCKS = [
  { start: '06:00', end: '08:00', label: '6-8' },
  { start: '08:00', end: '10:00', label: '8-10' },
  { start: '10:00', end: '12:00', label: '10-12' },
  { start: '12:00', end: '14:00', label: '12-14' },
  { start: '14:00', end: '16:00', label: '14-16' },
  { start: '16:00', end: '18:00', label: '16-18' },
  { start: '18:00', end: '20:00', label: '18-20' },
  { start: '20:00', end: '22:00', label: '20-22' },
  { start: '22:00', end: '23:59', label: '22-24' }, // Verwende 23:59 statt 24:00 für korrektes Zeitformat
];

export function WeeklySchedule({ onNext, onBack, timeSlots, setTimeSlots }: WeeklyScheduleProps) {
  console.log('[WeeklySchedule] Component rendered with', timeSlots.length, 'time slots');
  
  /**
   * Prüft, ob ein bestimmter Zeitblock bereits ausgewählt ist
   * @param day - Wochentag (z.B. "Montag")
   * @param startTime - Startzeit im Format "HH:MM"
   * @param endTime - Endzeit im Format "HH:MM"
   * @returns true wenn der Block ausgewählt ist, sonst false
   */
  const isBlockSelected = useCallback((day: string, startTime: string, endTime: string) => {
    return timeSlots.some(
      slot => slot.day === day && slot.startTime === startTime && slot.endTime === endTime
    );
  }, [timeSlots]);

  /**
   * Togglet einen Zeitblock (fügt hinzu oder entfernt)
   * Wenn der Block bereits ausgewählt ist, wird er entfernt
   * Wenn er nicht ausgewählt ist, wird er hinzugefügt
   */
  const toggleBlock = useCallback((day: string, startTime: string, endTime: string) => {
    console.log('[WeeklySchedule] Toggling block:', { day, startTime, endTime });
    
    const existingSlot = timeSlots.find(
      slot => slot.day === day && slot.startTime === startTime && slot.endTime === endTime
    );

    if (existingSlot) {
      // Remove block
      const newSlots = timeSlots.filter(slot => slot.id !== existingSlot.id);
      console.log('[WeeklySchedule] Removing block. New count:', newSlots.length);
      setTimeSlots(newSlots);
    } else {
      // Add block
      const newSlot: TimeSlot = {
        id: Date.now().toString() + Math.random(),
        day,
        startTime,
        endTime,
      };
      const newSlots = [...timeSlots, newSlot];
      console.log('[WeeklySchedule] Adding block. New count:', newSlots.length);
      setTimeSlots(newSlots);
    }
  }, [timeSlots, setTimeSlots]);

  /**
   * Wählt alle Zeitblöcke für einen bestimmten Tag aus
   * Entfernt zuerst alle bestehenden Blöcke für diesen Tag,
   * dann fügt alle verfügbaren Zeitblöcke hinzu
   */
  const selectAllForDay = useCallback((day: string) => {
    console.log('[WeeklySchedule] Selecting all blocks for', day);
    // Remove all blocks for this day first
    const filtered = timeSlots.filter(slot => slot.day !== day);
    
    // Add all time blocks for this day
    const newSlots = TIME_BLOCKS.map(block => ({
      id: Date.now().toString() + Math.random(),
      day,
      startTime: block.start,
      endTime: block.end,
    }));
    
    const finalSlots = [...filtered, ...newSlots];
    console.log('[WeeklySchedule] New total slots:', finalSlots.length);
    setTimeSlots(finalSlots);
  }, [timeSlots, setTimeSlots]);

  const clearAllForDay = useCallback((day: string) => {
    console.log('[WeeklySchedule] Clearing all blocks for', day);
    const newSlots = timeSlots.filter(slot => slot.day !== day);
    console.log('[WeeklySchedule] New total slots:', newSlots.length);
    setTimeSlots(newSlots);
  }, [timeSlots, setTimeSlots]);

  const isDayFullySelected = useCallback((day: string) => {
    return TIME_BLOCKS.every(block => 
      isBlockSelected(day, block.start, block.end)
    );
  }, [isBlockSelected]);

  const getDayBlockCount = useCallback((day: string) => {
    return timeSlots.filter(slot => slot.day === day).length;
  }, [timeSlots]);

  const handleNextClick = useCallback(() => {
    console.log('[WeeklySchedule] Next button clicked. TimeSlots:', timeSlots.length);
    if (timeSlots.length === 0) {
      console.warn('[WeeklySchedule] Cannot proceed - no time slots selected');
      return;
    }
    console.log('[WeeklySchedule] Calling onNext handler');
    onNext();
  }, [timeSlots, onNext]);

  const handleBackClick = useCallback(() => {
    console.log('[WeeklySchedule] Back button clicked');
    onBack();
  }, [onBack]);

  const selectWeekdayMornings = useCallback(() => {
    console.log('[WeeklySchedule] Selecting weekday mornings preset');
    const weekdayMornings: TimeSlot[] = [];
    ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].forEach(day => {
      weekdayMornings.push({
        id: Date.now().toString() + Math.random(),
        day,
        startTime: '08:00',
        endTime: '10:00',
      });
    });
    console.log('[WeeklySchedule] Setting', weekdayMornings.length, 'slots');
    setTimeSlots(weekdayMornings);
  }, [setTimeSlots]);

  const selectAfternoons = useCallback(() => {
    console.log('[WeeklySchedule] Selecting afternoons preset');
    const afternoons: TimeSlot[] = [];
    ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].forEach(day => {
      afternoons.push({
        id: Date.now().toString() + Math.random(),
        day,
        startTime: '14:00',
        endTime: '16:00',
      });
      afternoons.push({
        id: Date.now().toString() + Math.random(),
        day,
        startTime: '16:00',
        endTime: '18:00',
      });
    });
    console.log('[WeeklySchedule] Setting', afternoons.length, 'slots');
    setTimeSlots(afternoons);
  }, [setTimeSlots]);

  const selectWeekendIntensive = useCallback(() => {
    console.log('[WeeklySchedule] Selecting weekend intensive preset');
    const weekends: TimeSlot[] = [];
    ['Samstag', 'Sonntag'].forEach(day => {
      TIME_BLOCKS.slice(2, 7).forEach(block => {
        weekends.push({
          id: Date.now().toString() + Math.random(),
          day,
          startTime: block.start,
          endTime: block.end,
        });
      });
    });
    console.log('[WeeklySchedule] Setting', weekends.length, 'slots');
    setTimeSlots(weekends);
  }, [setTimeSlots]);

  const totalHours = timeSlots.length * 2; // Jeder Block = 2 Stunden

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-gray-900">Wochenplan erstellen</h2>
          <p className="text-gray-600">
            Klicke auf die Zeitblöcke, in denen du Zeit zum Lernen hast
          </p>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <div className="text-3xl text-gray-900">{timeSlots.length}</div>
                <div className="text-sm text-gray-600">Zeitblöcke ausgewählt</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-3xl text-gray-900">{totalHours}h</div>
                <div className="text-sm text-gray-600">Lernzeit pro Woche</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Deine Woche</CardTitle>
                <CardDescription>
                  Klicke auf Zeitblöcke um sie auszuwählen oder abzuwählen
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="size-4" />
                Jeder Block = 2 Stunden
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with day names */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div className="text-sm text-gray-600">Zeit</div>
                  {DAYS.map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-gray-900 mb-1 hidden lg:block">{day}</div>
                      <div className="text-gray-900 mb-1 lg:hidden">{DAY_SHORT[index]}</div>
                      <div className="text-xs text-gray-600 mb-2">
                        {getDayBlockCount(day)} Blöcke
                      </div>
                      {isDayFullySelected(day) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearAllForDay(day)}
                          className="w-full text-xs h-7"
                        >
                          Alle löschen
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllForDay(day)}
                          className="w-full text-xs h-7"
                        >
                          Ganzer Tag
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time blocks grid */}
                <div className="space-y-2">
                  {TIME_BLOCKS.map(block => (
                    <div key={block.start} className="grid grid-cols-8 gap-2">
                      <div className="text-sm text-gray-600 flex items-center justify-center py-4">
                        {block.label}
                      </div>
                      {DAYS.map(day => {
                        const selected = isBlockSelected(day, block.start, block.end);
                        return (
                          <button
                            key={`${day}-${block.start}`}
                            onClick={() => toggleBlock(day, block.start, block.end)}
                            className={`
                              py-4 rounded-lg border-2 transition-all duration-200 
                              hover:scale-105 active:scale-95
                              ${selected 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-600 shadow-lg' 
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `}
                          >
                            {selected && (
                              <div className="text-white text-xs">✓</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Selection Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellauswahl</CardTitle>
            <CardDescription>Wähle eine Vorlage und passe sie bei Bedarf an</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4"
                onClick={selectWeekdayMornings}
              >
                <div className="text-left">
                  <div>Morgens unter der Woche</div>
                  <div className="text-xs text-gray-500">Mo-Fr, 8-10 Uhr</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4"
                onClick={selectAfternoons}
              >
                <div className="text-left">
                  <div>Nachmittags</div>
                  <div className="text-xs text-gray-500">Mo-Fr, 14-18 Uhr</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4"
                onClick={selectWeekendIntensive}
              >
                <div className="text-left">
                  <div>Wochenende intensiv</div>
                  <div className="text-xs text-gray-500">Sa-So, 10-20 Uhr</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Tip */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Tipp:</strong> Wähle realistische Zeitfenster aus. Die KI plant deine Lernsessions 
                automatisch in diese Zeitblöcke ein und berücksichtigt dabei Deadlines und Prioritäten.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Validation Warning */}
        {timeSlots.length === 0 && (
          <Card className="bg-orange-50 border-orange-300">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  <strong>Hinweis:</strong> Bitte wähle mindestens einen Zeitblock aus, um fortzufahren. 
                  Du kannst auch eine Schnellauswahl-Vorlage verwenden.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft className="size-4 mr-2" />
            Zurück
          </Button>
          
          <Button 
            onClick={handleNextClick} 
            disabled={timeSlots.length === 0}
          >
            Weiter ({timeSlots.length} Slots)
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}