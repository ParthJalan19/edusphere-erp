import { useEffect, useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux.js';
import apiClient from '../../shared/services/apiClient.js';
import {
  Calendar as CalendarIcon,
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

interface Offering {
  _id: string;
  subject: { name: string; code: string; credits: number };
  class: { name: string };
  students: { _id: string; name: string; email: string; rollNumber: string }[];
}

interface StudentRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
  remarks: string;
}

interface AttendanceLog {
  _id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
  remarks?: string;
  semesterOffering: {
    subject: { name: string; code: string };
  };
}

export default function Attendance() {
  const { user, profile } = useAppSelector((state) => state.auth);

  // Teacher states
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);

  // Student states
  const [studentStats, setStudentStats] = useState<{
    percentage: number;
    total: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
    records: AttendanceLog[];
  } | null>(null);

  // Common states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(
    null
  );

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        if (user?.role === 'Teacher' && profile?._id) {
          const offRes = await apiClient.get(`/academic/offerings?teacherId=${profile._id}`);
          const offs = offRes.data.data.offerings || [];
          setOfferings(offs);
          if (offs.length > 0) {
            setSelectedOfferingId(offs[0]._id);
          }
        } else if (user?.role === 'Student' && profile?._id) {
          const attRes = await apiClient.get(`/attendance/student/${profile._id}`);
          setStudentStats(attRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load attendance logs:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?._id) {
      loadInitialData();
    }
  }, [user, profile]);

  // Load roster / existing attendance when offering or date changes (Teacher)
  useEffect(() => {
    async function loadRoster() {
      if (user?.role !== 'Teacher' || !selectedOfferingId) return;

      try {
        setLoading(true);
        setFeedback(null);

        // 1. Fetch full roster details of offering
        const offRes = await apiClient.get(`/academic/offerings/${selectedOfferingId}`);
        const enrolledStudents = offRes.data.data.students || [];

        // 2. Fetch marked attendance for this date (if any)
        const attRes = await apiClient.get(
          `/attendance/offering/${selectedOfferingId}?date=${attendanceDate}`
        );
        const markedLogs = attRes.data.data || [];

        // 3. Map students to their marked or default state
        const records: StudentRecord[] = enrolledStudents.map((stud: any) => {
          const marked = markedLogs.find((log: any) => log.student?._id === stud._id);
          return {
            studentId: stud._id,
            name: stud.name,
            rollNumber: stud.rollNumber,
            status: marked ? marked.status : 'Present',
            remarks: marked ? marked.remarks || '' : '',
          };
        });

        setStudentRecords(records);
      } catch (err) {
        console.error('Failed to fetch class roster:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRoster();
  }, [selectedOfferingId, attendanceDate, user]);

  const handleStatusChange = (
    studentId: string,
    status: 'Present' | 'Absent' | 'Leave' | 'Late'
  ) => {
    setStudentRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  const submitAttendance = async () => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await apiClient.post('/attendance', {
        semesterOfferingId: selectedOfferingId,
        date: attendanceDate,
        records: studentRecords,
      });
      setFeedback({ type: 'success', message: 'Attendance records successfully saved!' });
    } catch (err: any) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Failed to submit attendance.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && offerings.length === 0 && !studentStats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isTeacher = user?.role === 'Teacher';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Attendance Registrar
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? 'Mark class attendance and update student reports.'
              : 'Monitor your academic attendance logs and clearance percentages.'}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-4 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-success/35 bg-success/10 text-success'
              : 'border-danger/35 bg-danger/10 text-danger'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{feedback.message}</span>
        </div>
      )}

      {isTeacher ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Controls Bar */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Class / Subject
              </label>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {offerings.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.subject?.name} ({o.class?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attendance Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  max={new Date().toISOString().substring(0, 10)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              </div>
            </div>
          </div>

          {/* Roster Table */}
          {studentRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No students are currently enrolled in this subject class.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border bg-background">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-3.5">Roll Number</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {studentRecords.map((rec) => (
                      <tr key={rec.studentId} className="transition hover:bg-muted/15">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-foreground">
                          {rec.rollNumber}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{rec.name}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {(['Present', 'Absent', 'Late', 'Leave'] as const).map((status) => {
                              const isActive = rec.status === status;
                              let btnClass =
                                'border border-border text-muted-foreground hover:bg-muted';

                              if (isActive) {
                                if (status === 'Present')
                                  btnClass = 'bg-success text-white border-success';
                                else if (status === 'Absent')
                                  btnClass = 'bg-danger text-white border-danger';
                                else if (status === 'Late')
                                  btnClass = 'bg-warning text-white border-warning';
                                else if (status === 'Leave')
                                  btnClass = 'bg-accent text-white border-accent';
                              }

                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(rec.studentId, status)}
                                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition duration-100 ${btnClass}`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <input
                            type="text"
                            placeholder="Add comment..."
                            value={rec.remarks}
                            onChange={(e) => handleRemarksChange(rec.studentId, e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={submitAttendance}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-primary/95 disabled:opacity-60"
                >
                  <UserCheck className="h-4 w-4" />
                  {submitting ? 'Saving Records...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Student Panel */
        studentStats && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Stats Summary Column */}
            <div className="space-y-6 md:col-span-1">
              <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Term Average
                </h3>
                <div className="relative mb-4 h-28 w-28">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path
                      className="text-muted/20"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={studentStats.percentage >= 75 ? 'text-success' : 'text-danger'}
                      strokeDasharray={`${studentStats.percentage}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-2xl font-bold text-foreground">
                      {studentStats.percentage}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span>Clears minimum required (75%)</span>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h4 className="mb-4 font-heading text-sm font-bold text-foreground">
                  Class Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-success/15 bg-success/5 p-3.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Present
                    </span>
                    <h5 className="mt-0.5 font-heading text-xl font-bold text-success">
                      {studentStats.present}
                    </h5>
                  </div>
                  <div className="rounded-lg border border-danger/15 bg-danger/5 p-3.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Absent
                    </span>
                    <h5 className="mt-0.5 font-heading text-xl font-bold text-danger">
                      {studentStats.absent}
                    </h5>
                  </div>
                  <div className="rounded-lg border border-warning/15 bg-warning/5 p-3.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Late
                    </span>
                    <h5 className="mt-0.5 font-heading text-xl font-bold text-warning">
                      {studentStats.late}
                    </h5>
                  </div>
                  <div className="rounded-lg border border-accent/15 bg-accent/5 p-3.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Leave
                    </span>
                    <h5 className="mt-0.5 font-heading text-xl font-bold text-accent">
                      {studentStats.leave}
                    </h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Logs Column */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Attendance Log Records
              </h3>

              {studentStats.records.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No attendance records logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border bg-background">
                  <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Subject</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {studentStats.records.map((log) => {
                        let statusColor = 'bg-success/10 text-success border border-success/30';
                        if (log.status === 'Absent')
                          statusColor = 'bg-danger/10 text-danger border border-danger/30';
                        else if (log.status === 'Late')
                          statusColor = 'bg-warning/10 text-warning border border-warning/30';
                        else if (log.status === 'Leave')
                          statusColor = 'bg-accent/10 text-accent border border-accent/30';

                        return (
                          <tr key={log._id} className="transition hover:bg-muted/10">
                            <td className="whitespace-nowrap px-6 py-3.5 font-medium text-foreground">
                              {new Date(log.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-3.5 font-medium text-foreground">
                              {log.semesterOffering?.subject?.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-center">
                              <span
                                className={`rounded px-2.5 py-0.5 text-xs font-bold ${statusColor}`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="max-w-[200px] truncate px-6 py-3.5 text-xs text-muted-foreground">
                              {log.remarks || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
