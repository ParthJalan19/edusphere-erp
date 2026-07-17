import { useEffect, useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux.js';
import apiClient from '../../shared/services/apiClient.js';
import { Calendar, FileText, Plus, Download, AlertCircle, Search, Upload } from 'lucide-react';

interface Offering {
  _id: string;
  subject: { name: string; code: string };
  class: { name: string };
}

interface NoteRecord {
  _id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  teacher?: {
    name: string;
  };
}

export default function Notes() {
  const { user, profile } = useAppSelector((state) => state.auth);

  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [notes, setNotes] = useState<NoteRecord[]>([]);

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Create notes inputs
  const [noteTitle, setNoteTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

  // Loading indicators
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(
    null
  );

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
          const offRes = await apiClient.get(`/academic/offerings?studentId=${profile._id}`);
          const offs = offRes.data.data.offerings || [];
          setOfferings(offs);
          if (offs.length > 0) {
            setSelectedOfferingId(offs[0]._id);
          }
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

  // Load notes for class offering
  useEffect(() => {
    async function loadNotes() {
      if (!selectedOfferingId) return;
      try {
        setLoading(true);
        setFeedback(null);
        const notesRes = await apiClient.get(`/files/offering/${selectedOfferingId}`);
        setNotes(notesRes.data.data || []);
      } catch (err) {
        console.error('Failed to load notes list:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [selectedOfferingId]);

  // File Upload (Teacher)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFeedback(null);
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFileUrl(res.data.data.fileUrl);
      setFileName(res.data.data.fileName);
      setFeedback({ type: 'success', message: 'File successfully uploaded to repository!' });
    } catch (err: any) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'File upload failed.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Add notes record in DB
  const handleAddNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferingId || !profile?._id || !fileUrl) return;

    try {
      setFeedback(null);
      setSubmitting(true);
      const res = await apiClient.post('/files/notes', {
        semesterOfferingId: selectedOfferingId,
        teacherId: profile._id,
        title: noteTitle,
        fileUrl,
        fileName,
      });

      setNotes((prev) => [res.data.data, ...prev]);
      setNoteTitle('');
      setFileUrl('');
      setFileName('');
      setFeedback({ type: 'success', message: 'Class note posted successfully!' });
    } catch (err: any) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error?.message || 'Failed to post note record.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Note Download via signed-url proxy
  const handleDownload = async (notesUrl: string, notesName: string) => {
    try {
      const res = await apiClient.post('/files/signed-url', { rawUrl: notesUrl });
      const signedUrl = res.data.data.signedUrl;

      // Programmatic download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', notesName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download notes file:', err);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && offerings.length === 0 && notes.length === 0) {
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
            Subject Notes Library
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? 'Upload notes, PDFs, or PPTs for student download.'
              : 'Access notes and course syllabus uploaded by your teachers.'}
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Selection filter and Upload notes (Teacher only) */}
        <div className="space-y-6 md:col-span-1">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="border-b border-border pb-2 font-heading text-sm font-bold text-foreground">
              Filter Options
            </h3>
            <div>
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
          </div>

          {isTeacher && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 border-b border-border pb-2 font-heading text-sm font-bold text-foreground">
                Post Study Notes
              </h3>
              <form onSubmit={handleAddNotes} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DBMS Normalization Slides"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                    Upload Attachment
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 transition hover:bg-muted/40">
                      <Upload className="h-4 w-4 text-muted" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {uploading ? 'Uploading File...' : fileName || 'Choose material...'}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !fileUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-primary/95 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {submitting ? 'Adding...' : 'Post Note Material'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Search and Files list */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-heading text-lg font-bold text-foreground">Library Archive</h3>
            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground transition focus:border-primary focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No course notes found for this subject class.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredNotes.map((n) => (
                <div
                  key={n._id}
                  className="shadow-2xs flex flex-col justify-between rounded-lg border border-border bg-background p-4 transition hover:border-primary/45"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded bg-primary/10 p-2 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="line-clamp-2 font-heading text-sm font-semibold leading-tight text-foreground">
                        {n.title}
                      </h4>
                      <p className="mt-1 max-w-[200px] truncate text-[10px] text-muted-foreground">
                        File: {n.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {new Date(n.createdAt).toLocaleDateString()}
                      {n.teacher?.name && ` • By ${n.teacher.name.split(' ')[1]}`}
                    </span>
                    <button
                      onClick={() => handleDownload(n.fileUrl, n.fileName)}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
