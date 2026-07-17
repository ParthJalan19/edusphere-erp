import { useEffect, useState } from 'react';
import apiClient from '../../shared/services/apiClient.js';
import { Calendar, Clock, MapPin, AlertCircle, BookOpen } from 'lucide-react';

interface TimetableSlot {
  _id: string;
  semesterOffering: {
    subject: { name: string; code: string };
    class: { name: string };
    teacher: { name: string };
  };
  dayOfWeek: number; // 1 to 7
  startTime: string;
  endTime: string;
  room: string;
}

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/timetable');
        setSlots(res.data.data || []);
      } catch (err: any) {
        console.error('Failed to load weekly schedule:', err);
        setError(err.response?.data?.error?.message || 'Failed to load schedule.');
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/35 bg-danger/10 p-4 text-xs font-semibold text-danger">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  // Group slots by day
  const slotsByDay: Record<number, TimetableSlot[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };

  slots.forEach((slot) => {
    if (slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek].push(slot);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Weekly Time Table
        </h1>
        <p className="text-sm text-muted-foreground">
          Weekly slot schedules, room locations, and active subject offering classes.
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No class schedules have been assigned.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5] as const).map((dayNum) => {
            const daySlots = slotsByDay[dayNum];
            return (
              <div
                key={dayNum}
                className="flex min-h-[300px] flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-2.5 font-heading text-sm font-bold text-foreground">
                    <Calendar className="h-4.5 w-4.5 text-primary" /> {DAYS[dayNum]}
                  </h3>

                  {daySlots.length === 0 ? (
                    <div className="py-12 text-center text-xs italic text-muted-foreground">
                      No classes scheduled.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {daySlots.map((slot) => (
                        <div
                          key={slot._id}
                          className="shadow-2xs space-y-2 rounded-lg border border-border bg-background p-3.5 transition hover:border-primary/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {slot.semesterOffering?.subject?.code}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Class: {slot.semesterOffering?.class?.name}
                            </span>
                          </div>

                          <h4 className="line-clamp-1 font-heading text-xs font-bold leading-tight text-foreground">
                            {slot.semesterOffering?.subject?.name}
                          </h4>

                          <div className="flex flex-col gap-1 pt-1 text-[10px] font-medium text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> Room {slot.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" /> Teacher:{' '}
                              {slot.semesterOffering?.teacher?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
