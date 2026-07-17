import { useEffect, useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux.js';
import apiClient from '../../shared/services/apiClient.js';
import { FileText, Calendar, Upload, Plus, Download, AlertCircle } from 'lucide-react';

interface Offering {
  _id: string;
  subject: { name: string; code: string };
  class: { name: string };
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  fileAttachmentUrl?: string;
  fileAttachmentName?: string;
  semesterOffering?: {
    subject: { name: string; code: string };
  };
  submissionStatus?: string; // Client calculated: Pending | Submitted | Late | Graded
  latestVersion?: {
    versionNumber: number;
    fileUrl: string;
    fileName: string;
    submittedAt: string;
    status: 'Submitted' | 'Late' | 'Graded';
    marksObtained?: number;
    feedback?: string;
  } | null;
  submission?: any;
}

interface StudentSubmission {
  _id: string;
  student: { name: string; email: string; rollNumber: string };
  currentVersion: number;
  versions: {
    versionNumber: number;
    fileUrl: string;
    fileName: string;
    submittedAt: string;
    status: 'Submitted' | 'Late' | 'Graded';
    marksObtained?: number;
    feedback?: string;
  }[];
  updatedAt: string;
}

export default function Assignments() {
  const { user, profile } = useAppSelector((state) => state.auth);

  // Common active view selectors
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Teacher actions
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [selectedVersionNum, setSelectedVersionNum] = useState(1);
  const [isPosting, setIsPosting] = useState(false);

  // Grade Form inputs
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Create Assignment inputs
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMarks, setNewMarks] = useState('');
  const [attUrl, setAttUrl] = useState('');
  const [attName, setAttName] = useState('');

  // Student actions
  const [uploadingFile, setUploadingFile] = useState(false);

  // Loading/Feedback alerts
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'danger';
    message: string;
  } | null>(null);

  // Load active offerings list
  useEffect(() => {
    async function loadOfferings() {
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
          // Students fetch consolidated list of all assignments directly
          const assRes = await apiClient.get(`/assignments/student/${profile._id}`);
          setAssignments(assRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load offerings list:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?._id) {
      loadOfferings();
    }
  }, [user, profile]);

  // Load assignments when selected class offering changes (Teacher)
  useEffect(() => {
    async function loadAssignments() {
      if (user?.role !== 'Teacher' || !selectedOfferingId) return;

      try {
        setLoading(true);
        setSelectedAssignment(null);
        setSelectedSubmission(null);
        const assRes = await apiClient.get(`/assignments/offering/${selectedOfferingId}`);
        setAssignments(assRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch class assignments:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, [selectedOfferingId, user]);

  // Load submissions list when active assignment is selected (Teacher)
  const fetchSubmissionsList = async (assignment: Assignment) => {
    try {
      setLoading(true);
      setSelectedAssignment(assignment);
      setSelectedSubmission(null);
      const subRes = await apiClient.get(`/assignments/${assignment._id}/submissions`);
      setSubmissions(subRes.data.data || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger file download helper using secure signed-url gateway
  const downloadAttachment = async (url: string, name: string) => {
    try {
      const res = await apiClient.post('/files/signed-url', { rawUrl: url });
      const signedUrl = res.data.data.signedUrl;

      // Programmatic download trigger
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download notes file:', err);
    }
  };

  // Upload Assignment Guide Template (Teacher)
  const handleGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setActionFeedback(null);
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAttUrl(uploadRes.data.data.fileUrl);
      setAttName(uploadRes.data.data.fileName);
      setActionFeedback({ type: 'success', message: 'Attachment uploaded successfully!' });
    } catch (err: any) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'File upload failed.',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Create Assignment (Teacher)
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionFeedback(null);
      const res = await apiClient.post('/assignments', {
        semesterOfferingId: selectedOfferingId,
        title: newTitle,
        description: newDesc,
        dueDate: newDueDate,
        totalMarks: Number(newMarks),
        fileAttachmentUrl: attUrl || undefined,
        fileAttachmentName: attName || undefined,
      });

      setAssignments((prev) => [...prev, res.data.data]);
      setIsPosting(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewMarks('');
      setAttUrl('');
      setAttName('');
      setActionFeedback({ type: 'success', message: 'New assignment posted successfully!' });
    } catch (err: any) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Failed to post assignment.',
      });
    }
  };

  // Upload Work Solution File (Student)
  const handleStudentSubmissionUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assignmentId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile?._id) return;

    try {
      setActionFeedback(null);
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      // 1. Post file to uploads destination
      const uploadRes = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. Submit file url references to database
      await apiClient.post('/assignments/submit', {
        assignmentId,
        studentId: profile._id,
        fileUrl: uploadRes.data.data.fileUrl,
        fileName: uploadRes.data.data.fileName,
      });

      // Refresh student assignments lists to reload submission statuses
      const assRes = await apiClient.get(`/assignments/student/${profile._id}`);
      setAssignments(assRes.data.data || []);

      // Update local detailed selector if active
      if (selectedAssignment?._id === assignmentId) {
        const updated = assRes.data.data.find((a: any) => a._id === assignmentId);
        setSelectedAssignment(updated || null);
      }

      setActionFeedback({ type: 'success', message: 'Assignment version submitted successfully!' });
    } catch (err: any) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Submission upload failed.',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Grading Feedbacks (Teacher)
  const handleGradeSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !selectedAssignment || !profile?._id) return;

    try {
      setActionFeedback(null);
      const res = await apiClient.patch(`/assignments/${selectedSubmission._id}/grade`, {
        versionNumber: selectedVersionNum,
        marksObtained: Number(gradeMarks),
        feedback: gradeFeedback,
        teacherId: profile._id,
      });

      // Reload submissions list
      const subRes = await apiClient.get(`/assignments/${selectedAssignment._id}/submissions`);
      setSubmissions(subRes.data.data || []);

      setSelectedSubmission(res.data.data);
      setGradeMarks('');
      setGradeFeedback('');
      setActionFeedback({
        type: 'success',
        message: `Submission version ${selectedVersionNum} graded successfully!`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Failed to submit grading.',
      });
    }
  };

  if (loading && offerings.length === 0 && assignments.length === 0) {
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
            Assignments Registrar
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? 'Post syllabus tasks, download solutions, and grade student reports.'
              : 'Submit class solutions and view grading comments.'}
          </p>
        </div>
        {isTeacher && !isPosting && (
          <button
            onClick={() => setIsPosting(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-primary/95"
          >
            <Plus className="h-4 w-4" />
            Post Assignment
          </button>
        )}
      </div>

      {actionFeedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-4 text-xs font-semibold ${
            actionFeedback.type === 'success'
              ? 'border-success/35 bg-success/10 text-success'
              : 'border-danger/35 bg-danger/10 text-danger'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {isTeacher ? (
        /* ==================== TEACHER PANEL ==================== */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left panel: Post assignment form or Roster List */}
          <div className="space-y-6 md:col-span-1">
            {isPosting ? (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    New Assignment Details
                  </h3>
                  <button
                    onClick={() => setIsPosting(false)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                      Subject Class
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
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Normalization Quiz"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                      Instructions
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the tasks..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                        Max Score Marks
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 50"
                        value={newMarks}
                        onChange={(e) => setNewMarks(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                      Upload Material Guide (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 transition hover:bg-muted/40">
                        <Upload className="h-4 w-4 text-muted" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {uploadingFile ? 'Uploading...' : attName || 'Select File...'}
                        </span>
                        <input
                          type="file"
                          onChange={handleGuideUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-primary/95"
                  >
                    Post Class Task
                  </button>
                </form>
              </div>
            ) : (
              /* Class selection & assignments list */
              <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    Filter Class Offering
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

                <div className="space-y-4">
                  <h3 className="border-b border-border pb-2 font-heading text-sm font-bold text-foreground">
                    Posted Tasks ({assignments.length})
                  </h3>
                  {assignments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No assignments posted for this offering yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((ass) => {
                        const isSelected = selectedAssignment?._id === ass._id;
                        return (
                          <div
                            key={ass._id}
                            onClick={() => fetchSubmissionsList(ass)}
                            className={`flex cursor-pointer flex-col justify-between rounded-lg border p-4 text-left transition hover:border-primary/45 ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-background'
                            }`}
                          >
                            <h4 className="font-heading text-sm font-semibold leading-tight text-foreground">
                              {ass.title}
                            </h4>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Due:{' '}
                                {new Date(ass.dueDate).toLocaleDateString()}
                              </span>
                              <span className="rounded bg-accent/10 px-2 py-0.5 font-bold text-accent">
                                {ass.totalMarks} Marks
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Area: submissions lists & grading details */}
          <div className="space-y-6 md:col-span-2">
            {!selectedAssignment ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
                Select a posted assignment task from the left list to review student submissions.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Submissions checklist */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-md mb-4 border-b border-border pb-3 font-heading font-bold text-foreground">
                    Submissions List
                  </h3>
                  {submissions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No student has submitted work for this task yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {submissions.map((sub) => {
                        const isSelected = selectedSubmission?._id === sub._id;

                        // Check status of latest version
                        const sortedVersions = [...sub.versions].sort(
                          (a, b) => b.versionNumber - a.versionNumber
                        );
                        const latest = sortedVersions[0];

                        let tagClass = 'bg-muted text-muted-foreground';
                        if (latest.status === 'Graded')
                          tagClass = 'bg-success/10 text-success border border-success/30';
                        else if (latest.status === 'Late')
                          tagClass = 'bg-danger/10 text-danger border border-danger/30';
                        else if (latest.status === 'Submitted')
                          tagClass = 'bg-warning/10 text-warning border border-warning/30';

                        return (
                          <div
                            key={sub._id}
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setSelectedVersionNum(sub.currentVersion);
                            }}
                            className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-3 transition hover:bg-muted/15 ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div>
                              <h4 className="font-heading text-sm font-semibold text-foreground">
                                {sub.student?.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Roll: {sub.student?.rollNumber} • v{sub.currentVersion}
                              </p>
                            </div>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${tagClass}`}
                            >
                              {latest.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submissions detailed view & grade inputs */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-md mb-4 border-b border-border pb-3 font-heading font-bold text-foreground">
                    Grading Desk
                  </h3>

                  {!selectedSubmission ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Select a student submission to evaluate.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Version selector bar */}
                      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2.5">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          Submission Version
                        </span>
                        <select
                          value={selectedVersionNum}
                          onChange={(e) => setSelectedVersionNum(Number(e.target.value))}
                          className="rounded border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
                        >
                          {selectedSubmission.versions.map((v) => (
                            <option key={v.versionNumber} value={v.versionNumber}>
                              Version {v.versionNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display detail of selected version */}
                      {(() => {
                        const ver = selectedSubmission.versions.find(
                          (v) => v.versionNumber === selectedVersionNum
                        );
                        if (!ver) return null;

                        return (
                          <div className="space-y-4">
                            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  File Attachment
                                </span>
                                <div className="mt-1 flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2">
                                  <span className="max-w-[150px] truncate text-xs font-semibold text-foreground">
                                    {ver.fileName}
                                  </span>
                                  <button
                                    onClick={() => downloadAttachment(ver.fileUrl, ver.fileName)}
                                    className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[10px] font-bold text-white transition duration-150 hover:bg-primary/95"
                                  >
                                    <Download className="h-3 w-3" /> Download
                                  </button>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Submit Status
                                </span>
                                <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] ${
                                      ver.status === 'Graded'
                                        ? 'bg-success/15 text-success'
                                        : ver.status === 'Late'
                                          ? 'bg-danger/15 text-danger'
                                          : 'bg-warning/15 text-warning'
                                    }`}
                                  >
                                    {ver.status}
                                  </span>
                                  <span className="font-sans text-muted-foreground">
                                    on {new Date(ver.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {ver.status === 'Graded' && (
                                <div className="mt-1 space-y-2 border-t border-border pt-3">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Score Marks
                                    </span>
                                    <h4 className="mt-0.5 font-heading text-lg font-bold text-foreground">
                                      {ver.marksObtained} / {selectedAssignment.totalMarks}
                                    </h4>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Teacher Feedback
                                    </span>
                                    <p className="mt-0.5 text-xs italic leading-relaxed text-muted-foreground">
                                      &ldquo;{ver.feedback}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Grade Submission Form */}
                            <div className="border-t border-border pt-4">
                              <h4 className="mb-3 font-heading text-sm font-bold text-foreground">
                                {ver.status === 'Graded' ? 'Update Evaluations' : 'Input Grades'}
                              </h4>
                              <form onSubmit={handleGradeSubmissionSubmit} className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Score Obtained (Max: {selectedAssignment.totalMarks})
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min={0}
                                    max={selectedAssignment.totalMarks}
                                    placeholder="e.g. 45"
                                    value={gradeMarks}
                                    onChange={(e) => setGradeMarks(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition focus:border-primary focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Feedback / Comments
                                  </label>
                                  <textarea
                                    required
                                    rows={3}
                                    placeholder="Provide comments..."
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition focus:border-primary focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="w-full rounded-md bg-accent py-2 text-xs font-bold text-white shadow-sm transition duration-150 hover:bg-accent/95"
                                >
                                  Submit Marks
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== STUDENT PANEL ==================== */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left panel: List of assignments */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-1">
            <h3 className="text-md border-b border-border pb-3 font-heading font-bold text-foreground">
              Task Checklist
            </h3>
            {assignments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No assignments listed.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((ass) => {
                  const isSelected = selectedAssignment?._id === ass._id;

                  let tagClass = 'bg-muted text-muted-foreground';
                  if (ass.submissionStatus === 'Graded')
                    tagClass = 'bg-success/10 text-success border border-success/30';
                  else if (ass.submissionStatus === 'Late')
                    tagClass = 'bg-danger/10 text-danger border border-danger/30';
                  else if (ass.submissionStatus === 'Submitted')
                    tagClass = 'bg-warning/10 text-warning border border-warning/30';
                  else if (ass.submissionStatus === 'Pending')
                    tagClass = 'bg-accent/15 text-accent border border-accent/25';

                  return (
                    <div
                      key={ass._id}
                      onClick={() => {
                        setSelectedAssignment(ass);
                        setActionFeedback(null);
                      }}
                      className={`flex cursor-pointer flex-col justify-between rounded-lg border p-4 text-left transition hover:border-primary/45 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background'
                      }`}
                    >
                      <div>
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${tagClass}`}
                        >
                          {ass.submissionStatus}
                        </span>
                        <h4 className="mt-2 line-clamp-2 font-heading text-sm font-semibold leading-tight text-foreground">
                          {ass.title}
                        </h4>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {ass.semesterOffering?.subject?.name}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-2.5 text-[10px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due:{' '}
                          {new Date(ass.dueDate).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-foreground">
                          {ass.totalMarks} Marks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right area: Details & Submission Hub */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
            {!selectedAssignment ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="mb-3 h-12 w-12 text-muted/60" />
                <p className="text-sm font-semibold">
                  Select a task from checklist to view requirements.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header info */}
                <div className="border-b border-border pb-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <h2 className="font-heading text-xl font-bold text-foreground">
                      {selectedAssignment.title}
                    </h2>
                    <span className="self-start whitespace-nowrap rounded bg-accent/15 px-3 py-1 text-xs font-bold text-accent sm:self-auto">
                      Max Score: {selectedAssignment.totalMarks} Marks
                    </span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Subject: {selectedAssignment.semesterOffering?.subject?.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Due Date:{' '}
                      {new Date(selectedAssignment.dueDate).toLocaleString()}
                    </span>
                  </p>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="mb-1.5 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Instructions / Description
                  </h4>
                  <p className="whitespace-pre-line rounded-lg border border-border bg-muted/20 p-4 font-sans text-sm leading-relaxed text-foreground">
                    {selectedAssignment.description}
                  </p>
                </div>

                {/* Guide Attachment */}
                {selectedAssignment.fileAttachmentUrl && (
                  <div>
                    <h4 className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Reference Material
                    </h4>
                    <div className="flex max-w-md items-center justify-between rounded-lg border border-border bg-background p-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="max-w-[200px] truncate text-xs font-semibold text-foreground">
                          {selectedAssignment.fileAttachmentName}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          downloadAttachment(
                            selectedAssignment.fileAttachmentUrl!,
                            selectedAssignment.fileAttachmentName!
                          )
                        }
                        className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted-foreground/15"
                      >
                        <Download className="h-3.5 w-3.5" /> Material
                      </button>
                    </div>
                  </div>
                )}

                {/* Submission Version History list */}
                {selectedAssignment.submission && (
                  <div>
                    <h4 className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Your Submission History
                    </h4>
                    <div className="space-y-3.5">
                      {selectedAssignment.submission.versions.map((v: any) => {
                        let badgeClass = 'bg-muted text-muted-foreground';
                        if (v.status === 'Graded')
                          badgeClass = 'bg-success/10 text-success border border-success/30';
                        else if (v.status === 'Late')
                          badgeClass = 'bg-danger/10 text-danger border border-danger/30';
                        else if (v.status === 'Submitted')
                          badgeClass = 'bg-warning/10 text-warning border border-warning/30';

                        return (
                          <div
                            key={v.versionNumber}
                            className="space-y-3 rounded-lg border border-border bg-background p-4"
                          >
                            <div className="flex flex-col justify-between gap-2 border-b border-border/50 pb-2.5 sm:flex-row sm:items-center">
                              <span className="text-xs font-bold text-foreground">
                                Version {v.versionNumber}
                              </span>
                              <div className="flex items-center gap-3 text-xs font-semibold">
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                                >
                                  {v.status}
                                </span>
                                <span className="font-sans text-muted-foreground">
                                  on {new Date(v.submittedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pl-2 text-xs font-medium">
                              <span className="max-w-[150px] truncate text-muted-foreground">
                                {v.fileName}
                              </span>
                              <button
                                onClick={() => downloadAttachment(v.fileUrl, v.fileName)}
                                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                <Download className="h-3 w-3" /> Download Submission File
                              </button>
                            </div>

                            {v.status === 'Graded' && (
                              <div className="mt-1 space-y-2 rounded border border-success/15 bg-success/5 p-3.5">
                                <div>
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-success">
                                    Grade Evaluation
                                  </span>
                                  <h4 className="text-md mt-0.5 font-heading font-bold text-foreground">
                                    {v.marksObtained} / {selectedAssignment.totalMarks} Marks
                                  </h4>
                                </div>
                                <div>
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-success">
                                    Feedback Note
                                  </span>
                                  <p className="mt-0.5 text-xs italic leading-relaxed text-muted-foreground">
                                    &ldquo;{v.feedback}&rdquo;
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Section (Student can upload files to submit or overwrite version) */}
                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {selectedAssignment.submission
                      ? 'Resubmit Work Solution (Upload new version)'
                      : 'Submit Work Solution'}
                  </h4>
                  <div className="max-w-md">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition hover:bg-muted/40">
                      <Upload className="h-5 w-5 text-muted" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        {uploadingFile
                          ? 'Uploading Solution...'
                          : 'Select work file (PDF, ZIP, DOCX)'}
                      </span>
                      <input
                        type="file"
                        onChange={(e) => handleStudentSubmissionUpload(e, selectedAssignment._id)}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Submitting does not overwrite previous files. A new version will be added to
                      the queue for the teacher to review.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
