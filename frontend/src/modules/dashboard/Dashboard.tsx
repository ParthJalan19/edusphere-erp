import { useEffect, useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux.js';
import apiClient from '../../shared/services/apiClient.js';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Offering {
  _id: string;
  subject: { name: string; code: string; credits: number };
  class: { name: string };
  students: string[];
}

interface TimetableSlot {
  _id: string;
  semesterOffering: {
    subject: { name: string; code: string };
    class: { name: string };
    teacher: { name: string };
  };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard() {
  const { user, profile } = useAppSelector((state) => state.auth);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [stats, setStats] = useState({
    attendanceRate: 85,
    pendingAssignments: 0,
    publishedGradesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        if (user?.role === 'Teacher' && profile?._id) {
          // Load teacher offerings
          const offRes = await apiClient.get(`/academic/offerings?teacherId=${profile._id}`);
          setOfferings(offRes.data.data.offerings || []);

          // Load teacher timetable
          const ttRes = await apiClient.get('/timetable');
          setTimetable(ttRes.data.data || []);
        } else if (user?.role === 'Student' && profile?._id) {
          // Load student offerings
          const offRes = await apiClient.get(`/academic/offerings?studentId=${profile._id}`);
          setOfferings(offRes.data.data.offerings || []);

          // Load student timetable
          const ttRes = await apiClient.get('/timetable');
          setTimetable(ttRes.data.data || []);

          // Load student attendance stats
          const attRes = await apiClient.get(`/attendance/student/${profile._id}`);
          // Load student assignment stats
          const assRes = await apiClient.get(`/assignments/student/${profile._id}`);
          // Load grades marks count
          const grRes = await apiClient.get(`/results/student/${profile._id}`);

          const pendingCount = assRes.data.data.filter(
            (a: any) => a.submissionStatus === 'Pending'
          ).length;

          const gradesCount = grRes.data.data.reduce(
            (acc: number, val: any) => acc + (val.results?.length || 0),
            0
          );

          setStats({
            attendanceRate: attRes.data.data.percentage || 100,
            pendingAssignments: pendingCount,
            publishedGradesCount: gradesCount,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard logs:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?._id) {
      loadDashboardData();
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isTeacher = user?.role === 'Teacher';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Welcome back
            </span>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {profile?.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isTeacher
                ? `${profile?.designation} • Employee ID: ${profile?.employeeId}`
                : `Course: B.Tech CSE • Roll Number: ${profile?.rollNumber}`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-sm md:self-auto">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Academic Term: 2026 Odd Semester</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isTeacher ? (
          <>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Classes
                  </p>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    {offerings.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-success/10 p-3 text-success">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Enrolled Students
                  </p>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    {offerings.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3 text-accent">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Avg Attendance Rate
                  </p>
                  <h3 className="font-heading text-2xl font-bold text-foreground">92.4%</h3>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall Attendance
                </p>
                <h3 className="mt-1 font-heading text-2xl font-bold text-foreground">
                  {stats.attendanceRate}%
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Min required is 75% for exam clearance
                </p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="text-muted/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={stats.attendanceRate >= 75 ? 'text-success' : 'text-danger'}
                    strokeDasharray={`${stats.attendanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-warning/10 p-3 text-warning">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pending Assignments
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {stats.pendingAssignments}
                  </h3>
                  <p className="text-xs text-muted-foreground">Tasks waiting for submission</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-success/10 p-3 text-success">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Grades Published
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {stats.publishedGradesCount} Subjects
                  </h3>
                  <p className="text-xs text-muted-foreground">Verified marks ready to view</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left main area: Classes / Timetable */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              {isTeacher ? 'Your Active Subjects & Classes' : 'Your Enrolled Courses'}
            </h2>

            {offerings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No active subjects mapped in this semester.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {offerings.map((off) => (
                  <div
                    key={off._id}
                    className="shadow-xs group flex flex-col justify-between rounded-lg border border-border bg-background p-4 transition hover:border-primary/45"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {off.subject?.code}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {off.subject?.credits} Credits
                        </span>
                      </div>
                      <h4 className="mt-2 line-clamp-1 font-heading text-sm font-semibold text-foreground transition group-hover:text-primary">
                        {off.subject?.name}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Section: {off.class?.name}
                      </p>
                    </div>
                    {isTeacher && (
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-medium text-muted-foreground">
                        <span>{off.students?.length || 0} Enrolled Students</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted transition group-hover:text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Timetable */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Weekly Class Schedule
            </h2>

            {timetable.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No timetable schedule configured.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {timetable.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex flex-col justify-between gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted text-foreground">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {DAYS[slot.dayOfWeek].substring(0, 3)}
                        </span>
                        <span className="-mt-0.5 font-heading text-xs font-bold">
                          {slot.startTime}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-semibold text-foreground">
                          {slot.semesterOffering?.subject?.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {slot.semesterOffering?.subject?.code} •{' '}
                          {slot.semesterOffering?.class?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-start pl-14 text-xs font-medium text-muted-foreground sm:self-auto sm:pl-0">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted" /> {slot.startTime} -{' '}
                        {slot.endTime}
                      </span>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {slot.room}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Announcements / Alerts */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground">
              <AlertCircle className="h-5 w-5 text-primary" />
              Notifications Panel
            </h2>

            <div className="space-y-3.5">
              <div className="relative overflow-hidden rounded-lg border border-border/80 bg-muted/65 p-3.5 text-xs">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
                <h4 className="font-bold text-foreground">ERP Scaffolding Active</h4>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  EduSphere ERP v1.0 is successfully running. Database linked to cluster Atlas.
                </p>
                <span className="mt-2 block text-[10px] font-medium text-muted-foreground/80">
                  Just now
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-3.5 text-xs">
                <h4 className="font-bold text-foreground">Academic Calender Updated</h4>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Mid-semester exams are scheduled to begin from the second week of October 2026.
                </p>
                <span className="mt-2 block text-[10px] font-medium text-muted-foreground/80">
                  2 days ago
                </span>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-3.5 text-xs">
                <h4 className="font-bold text-foreground">
                  Cloudinary File Storage FALLBACK Active
                </h4>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Local uploads mode is active. Server uploads folders will hold notes and
                  submission pdfs safely.
                </p>
                <span className="mt-2 block text-[10px] font-medium text-muted-foreground/80">
                  4 days ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
