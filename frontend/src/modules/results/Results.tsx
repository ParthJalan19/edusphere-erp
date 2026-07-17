import { useEffect, useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux.js';
import apiClient from '../../shared/services/apiClient.js';
import { AlertCircle, TrendingUp, Sparkles } from 'lucide-react';

interface Offering {
  _id: string;
  subject: { name: string; code: string; credits: number };
  class: { name: string };
  students: { _id: string; name: string; email: string; rollNumber: string }[];
}

interface StudentGradeInput {
  studentId: string;
  name: string;
  rollNumber: string;
  internalMarks: string;
  externalMarks: string;
}

interface SemesterMarksheet {
  semesterId: string;
  semesterName: string;
  results: {
    _id: string;
    subjectName: string;
    subjectCode: string;
    credits: number;
    internalMarks: number;
    externalMarks: number;
    totalMarks: number;
    gradeLetter: string;
    gradePoint: number;
  }[];
  totalCredits: number;
  sgpa: number;
}

const getGradeLetter = (total: number) => {
  if (total >= 90) return 'O';
  if (total >= 80) return 'A+';
  if (total >= 70) return 'A';
  if (total >= 60) return 'B+';
  if (total >= 50) return 'B';
  if (total >= 45) return 'C';
  if (total >= 40) return 'P';
  return 'F';
};

export default function Results() {
  const { user, profile } = useAppSelector((state) => state.auth);

  // Teacher states
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [gradeInputs, setGradeInputs] = useState<StudentGradeInput[]>([]);
  const [isClassPublished, setIsClassPublished] = useState(false);

  // Student states
  const [marksheets, setMarksheets] = useState<SemesterMarksheet[]>([]);

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
          const res = await apiClient.get(`/results/student/${profile._id}`);
          setMarksheets(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load results metadata:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?._id) {
      loadInitialData();
    }
  }, [user, profile]);

  // Load class grades for active offering (Teacher)
  useEffect(() => {
    async function loadGrades() {
      if (user?.role !== 'Teacher' || !selectedOfferingId) return;

      try {
        setLoading(true);
        setFeedback(null);

        // 1. Fetch class students
        const offRes = await apiClient.get(`/academic/offerings/${selectedOfferingId}`);
        const enrolledStudents = offRes.data.data.students || [];

        // 2. Fetch existing results
        const gradesRes = await apiClient.get(`/results/offering/${selectedOfferingId}`);
        const existingGrades = gradesRes.data.data || [];

        // Check if results are published for this offering
        const published = existingGrades.some((g: any) => g.isPublished);
        setIsClassPublished(published);

        // 3. Map to inputs
        const inputs: StudentGradeInput[] = enrolledStudents.map((stud: any) => {
          const grade = existingGrades.find((g: any) => g.student?._id === stud._id);
          return {
            studentId: stud._id,
            name: stud.name,
            rollNumber: stud.rollNumber,
            internalMarks: grade ? String(grade.internalMarks) : '',
            externalMarks: grade ? String(grade.externalMarks) : '',
          };
        });

        setGradeInputs(inputs);
      } catch (err) {
        console.error('Failed to fetch class roster grades:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, [selectedOfferingId, user]);

  const handleInternalChange = (studentId: string, val: string) => {
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 40)) return;
    setGradeInputs((prev) =>
      prev.map((g) => (g.studentId === studentId ? { ...g, internalMarks: val } : g))
    );
  };

  const handleExternalChange = (studentId: string, val: string) => {
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 60)) return;
    setGradeInputs((prev) =>
      prev.map((g) => (g.studentId === studentId ? { ...g, externalMarks: val } : g))
    );
  };

  // Submit bulk grades (Teacher)
  const submitGrades = async () => {
    try {
      setSubmitting(true);
      setFeedback(null);

      // Validate inputs are filled
      const records = gradeInputs.map((g) => {
        if (g.internalMarks === '' || g.externalMarks === '') {
          throw new Error('Please fill in both internal and external marks for all students.');
        }
        return {
          studentId: g.studentId,
          internalMarks: Number(g.internalMarks),
          externalMarks: Number(g.externalMarks),
        };
      });

      await apiClient.post('/results/bulk', {
        semesterOfferingId: selectedOfferingId,
        records,
      });

      setFeedback({ type: 'success', message: 'Marks successfully saved/updated in database!' });
    } catch (err: any) {
      setFeedback({
        type: 'danger',
        message: err.message || err.response?.data?.error?.message || 'Failed to submit marks.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Publish results (Teacher)
  const handlePublish = async () => {
    try {
      setSubmitting(true);
      setFeedback(null);

      await apiClient.patch('/results/publish', {
        semesterOfferingId: selectedOfferingId,
      });

      setIsClassPublished(true);
      setFeedback({
        type: 'success',
        message: 'Results published successfully! Students can now view their marks and GPAs.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Failed to publish results.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && offerings.length === 0 && marksheets.length === 0) {
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
            Grades Registrar
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? 'Enter assessment scores and publish exam results.'
              : 'Access your term marks and GPA transcripts.'}
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
        /* ==================== TEACHER GRADES GRID ==================== */
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Class / Subject
              </label>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
              >
                {offerings.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.subject?.name} ({o.class?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={submitGrades}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/95 disabled:opacity-65"
              >
                Save Draft Marks
              </button>

              <button
                onClick={handlePublish}
                disabled={submitting || isClassPublished}
                className="rounded-lg border border-success/35 bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-success/95 disabled:opacity-60"
              >
                {isClassPublished ? 'Results Published' : 'Publish Results'}
              </button>
            </div>
          </div>

          {gradeInputs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No students enrolled in this offering section.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-background">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3.5">Roll Number</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5 text-center">Internal Score (Max 40)</th>
                    <th className="px-6 py-3.5 text-center">External Score (Max 60)</th>
                    <th className="px-6 py-3.5 text-center">Total Marks (100)</th>
                    <th className="px-6 py-3.5 text-center">Grade Letter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {gradeInputs.map((input) => {
                    const internal = Number(input.internalMarks) || 0;
                    const external = Number(input.externalMarks) || 0;
                    const total = internal + external;
                    const hasValues = input.internalMarks !== '' && input.externalMarks !== '';
                    const gl = hasValues ? getGradeLetter(total) : '-';

                    return (
                      <tr key={input.studentId} className="transition hover:bg-muted/15">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-foreground">
                          {input.rollNumber}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{input.name}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-center">
                            <input
                              type="text"
                              value={input.internalMarks}
                              onChange={(e) =>
                                handleInternalChange(input.studentId, e.target.value)
                              }
                              placeholder="0"
                              className="w-16 rounded border border-border bg-background py-1 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-center">
                            <input
                              type="text"
                              value={input.externalMarks}
                              onChange={(e) =>
                                handleExternalChange(input.studentId, e.target.value)
                              }
                              placeholder="0"
                              className="w-16 rounded border border-border bg-background py-1 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-foreground">
                          {hasValues ? total : '-'}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold ${
                              gl === 'O' || gl === 'A+' || gl === 'A'
                                ? 'bg-success/10 text-success'
                                : gl === 'F'
                                  ? 'bg-danger/10 text-danger'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {gl}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ==================== STUDENT GRADES SHEET ==================== */
        <div className="space-y-6">
          {marksheets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              No results have been published for your profile yet.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* SGPA Trends visual charts */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-2.5 font-heading text-sm font-bold text-foreground">
                    <TrendingUp className="h-4.5 w-4.5 text-primary" /> SGPA Performance Index
                  </h3>
                  <div className="space-y-4">
                    {marksheets.map((sheet) => (
                      <div key={sheet.semesterId} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {sheet.semesterName}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full border border-border bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${sheet.sgpa * 10}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-heading text-sm font-extrabold text-foreground">
                            {sheet.sgpa}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-t border-border bg-muted/35 p-3 pt-4">
                  <Sparkles className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
                    SGPA represents Semester Grade Point Average. Mapped dynamically based on
                    credit-hour weights and a 10.0 grading scale.
                  </p>
                </div>
              </div>

              {/* Detailed marksheets list */}
              <div className="space-y-6 lg:col-span-2">
                {marksheets.map((sheet) => (
                  <div
                    key={sheet.semesterId}
                    className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-md font-heading font-bold text-foreground">
                        {sheet.semesterName} Marksheet
                      </h3>
                      <span className="rounded border border-success/35 bg-success/15 px-3 py-1 text-xs font-bold text-success">
                        SGPA: {sheet.sgpa} / 10.0
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border bg-background">
                      <table className="w-full min-w-[500px] border-collapse text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Subject Name</th>
                            <th className="px-4 py-3 text-center">Credits</th>
                            <th className="px-4 py-3 text-center">Internal (40)</th>
                            <th className="px-4 py-3 text-center">External (60)</th>
                            <th className="px-4 py-3 text-center">Total (100)</th>
                            <th className="px-4 py-3 text-center">Grade Letter</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {sheet.results.map((r) => (
                            <tr key={r._id} className="transition hover:bg-muted/10">
                              <td className="px-4 py-3 font-mono font-bold text-foreground">
                                {r.subjectCode}
                              </td>
                              <td className="px-4 py-3 font-medium text-foreground">
                                {r.subjectName}
                              </td>
                              <td className="px-4 py-3 text-center">{r.credits}</td>
                              <td className="px-4 py-3 text-center">{r.internalMarks}</td>
                              <td className="px-4 py-3 text-center">{r.externalMarks}</td>
                              <td className="px-4 py-3 text-center font-bold text-foreground">
                                {r.totalMarks}
                              </td>
                              <td className="px-4 py-3 text-center font-mono">
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                                    r.gradeLetter === 'O' ||
                                    r.gradeLetter === 'A+' ||
                                    r.gradeLetter === 'A'
                                      ? 'bg-success/10 text-success'
                                      : r.gradeLetter === 'F'
                                        ? 'bg-danger/10 text-danger'
                                        : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {r.gradeLetter}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
