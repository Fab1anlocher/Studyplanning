import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export function WeeklySchedule() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', day: 'Montag', startTime: '09:00', endTime: '12:00' },
    { id: '2', day: 'Mittwoch', startTime: '14:00', endTime: '17:00' },
    { id: '3', day: 'Freitag', startTime: '10:00', endTime: '13:00' },
  ]);
  
  const [newSlot, setNewSlot] = useState({
    day: 'Montag',
    startTime: '09:00',
    endTime: '10:00',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addTimeSlot = () => {
    const slot: TimeSlot = {
      id: Date.now().toString(),
      ...newSlot,
    };
    setTimeSlots([...timeSlots, slot]);
    setIsDialogOpen(false);
    setNewSlot({ day: 'Montag', startTime: '09:00', endTime: '10:00' });
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const getSlotsByDay = (day: string) => {
    return timeSlots.filter(slot => slot.day === day).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Wochenplan</h2>
          <p className="text-gray-600">Definiere deine verfügbaren Lernzeiten</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Zeitfenster hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Zeitfenster</DialogTitle>
              <DialogDescription>
                Füge ein verfügbares Zeitfenster für deine Lernsessions hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="day">Wochentag</Label>
                <Select value={newSlot.day} onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}>
                  <SelectTrigger id="day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Von</Label>
                  <Select value={newSlot.startTime} onValueChange={(value) => setNewSlot({ ...newSlot, startTime: value })}>
                    <SelectTrigger id="start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(hour => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Bis</Label>
                  <Select value={newSlot.endTime} onValueChange={(value) => setNewSlot({ ...newSlot, endTime: value })}>
                    <SelectTrigger id="end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(hour => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={addTimeSlot}>Hinzufügen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DAYS.map(day => {
          const daySlots = getSlotsByDay(day);
          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900">{day}</CardTitle>
                <CardDescription>
                  {daySlots.length === 0 ? 'Keine Zeitfenster' : `${daySlots.length} Zeitfenster`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {daySlots.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Noch keine Zeitfenster definiert
                  </div>
                ) : (
                  daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-2 bg-blue-600 rounded-full" />
                        <span className="text-gray-900">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(slot.id)}
                      >
                        <X className="size-4 text-gray-500" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-700">
            <strong>Tipp:</strong> Diese Zeitfenster werden vom KI-Planer genutzt, um deine Lernsessions optimal zu verteilen. 
            Je mehr Flexibilität du angibst, desto besser kann der Plan angepasst werden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
