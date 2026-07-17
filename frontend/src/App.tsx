import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './shared/services/store.js';
import { useAppDispatch, useAppSelector } from './shared/hooks/redux.js';
import { checkAuthSession, logoutUser, setLoggedOut } from './shared/services/authSlice.js';
import ProtectedRoute from './shared/components/ProtectedRoute.js';
import apiClient from './shared/services/apiClient.js';

// Auth Pages
import Login from './modules/auth/Login.js';
import ForgotPassword from './modules/auth/ForgotPassword.js';
import ResetPassword from './modules/auth/ResetPassword.js';

// Feature Views
import Dashboard from './modules/dashboard/Dashboard.js';
import Attendance from './modules/attendance/Attendance.js';
import Assignments from './modules/assignments/Assignments.js';
import Notes from './modules/notes/Notes.js';
import Results from './modules/results/Results.js';
import Timetable from './modules/timetable/Timetable.js';

// Lucide Icons
import {
  GraduationCap,
  LogOut,
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  BookOpen,
  Calendar,
  Award,
  Bell,
  Search,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, checkingSession } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  useEffect(() => {
    const handleLogout = () => {
      dispatch(setLoggedOut());
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [dispatch]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 animate-pulse font-heading text-sm font-medium tracking-tight text-muted-foreground">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/forgot-password"
        element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />}
      />
      <Route
        path="/reset-password/:token"
        element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleRedirectGate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['Teacher']}>
            <TeacherPortalLayout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentPortalLayout />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleRedirectGate() {
  const { user } = useAppSelector((state) => state.auth);
  if (user?.role === 'Teacher') {
    return <Navigate to="/teacher" replace />;
  }
  return <Navigate to="/student" replace />;
}

// ---------------- HEADER COMPONENT WITH SEARCH & NOTIFICATIONS POLLING ----------------
interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function PortalHeader({ portalName, badgeColor }: { portalName: string; badgeColor: string }) {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.auth);

  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Poll notifications every 30 seconds
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to poll notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/search?q=${searchQuery}`);
        setSearchResults(res.data.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search request failed:', err);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="shadow-xs relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Branding */}
      <div className="flex items-center gap-2.5">
        <div className="shadow-xs rounded-lg bg-primary p-1.5">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
          EduSphere ERP
        </span>
        <span
          className={`border-current/15 rounded border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badgeColor}`}
        >
          {portalName}
        </span>
      </div>

      {/* Center Debounced Search */}
      <div ref={searchRef} className="relative hidden w-72 md:block lg:w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search subjects, assignments, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground transition duration-150 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {showSearchDropdown && searchResults && (
          <div className="absolute left-0 right-0 top-11 max-h-96 space-y-3.5 overflow-y-auto rounded-lg border border-border bg-card p-3 text-left shadow-lg">
            {/* Subjects section */}
            {searchResults.subjects?.length > 0 && (
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Subjects
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {searchResults.subjects.map((sub: any) => (
                    <div
                      key={sub._id}
                      className="py-0.5 text-xs font-semibold text-foreground transition hover:text-primary"
                    >
                      {sub.name} ({sub.code})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Assignments section */}
            {searchResults.assignments?.length > 0 && (
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Assignments
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {searchResults.assignments.map((ass: any) => (
                    <div
                      key={ass._id}
                      className="py-0.5 text-xs font-semibold text-foreground transition hover:text-primary"
                    >
                      {ass.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Notes section */}
            {searchResults.notes?.length > 0 && (
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Course Notes
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {searchResults.notes.map((note: any) => (
                    <div
                      key={note._id}
                      className="py-0.5 text-xs font-semibold text-foreground transition hover:text-primary"
                    >
                      {note.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Teachers section */}
            {searchResults.teachers?.length > 0 && (
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Faculty Teachers
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {searchResults.teachers.map((teach: any) => (
                    <div
                      key={teach._id}
                      className="py-0.5 text-xs font-semibold text-foreground transition hover:text-primary"
                    >
                      {teach.name} • {teach.designation}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Students section */}
            {searchResults.students?.length > 0 && (
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Students Directory
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {searchResults.students.map((stud: any) => (
                    <div
                      key={stud._id}
                      className="py-0.5 text-xs font-semibold text-foreground transition hover:text-primary"
                    >
                      {stud.name} • Roll: {stud.rollNumber}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.values(searchResults).every((arr: any) => arr.length === 0) && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No results found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-danger" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-80 space-y-2.5 rounded-lg border border-border bg-card p-3 text-left shadow-lg">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 divide-y divide-border/60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markRead(n._id)}
                      className={`cursor-pointer py-2 text-xs transition hover:bg-muted/15 ${
                        !n.isRead ? 'font-semibold' : 'opacity-70'
                      }`}
                    >
                      <h5 className="text-foreground">{n.title}</h5>
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold leading-tight text-foreground">{profile?.name}</span>
            <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              {profile?.email}
            </span>
          </div>
          <button
            onClick={() => dispatch(logoutUser())}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition duration-150 hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- TEACHER WORKSPACE LAYOUT ----------------
function TeacherPortalLayout() {
  const location = useLocation();

  const navLinks = [
    { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/teacher/attendance', label: 'Attendance', icon: UserCheck },
    { path: '/teacher/assignments', label: 'Assignments', icon: FileSpreadsheet },
    { path: '/teacher/notes', label: 'Course Notes', icon: BookOpen },
    { path: '/teacher/results', label: 'Results Entry', icon: Award },
    { path: '/teacher/timetable', label: 'Time Table', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader portalName="Teacher Portal" badgeColor="bg-accent/10 text-accent" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
          <nav className="space-y-1 p-4 text-left">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.path === '/teacher'
                  ? location.pathname === '/teacher'
                  : location.pathname.startsWith(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'shadow-xs bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Central Router Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/results" element={<Results />} />
              <Route path="/timetable" element={<Timetable />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------- STUDENT WORKSPACE LAYOUT ----------------
function StudentPortalLayout() {
  const location = useLocation();

  const navLinks = [
    { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/attendance', label: 'Attendance logs', icon: UserCheck },
    { path: '/student/assignments', label: 'Assignments', icon: FileSpreadsheet },
    { path: '/student/notes', label: 'Study Notes', icon: BookOpen },
    { path: '/student/results', label: 'Grades sheets', icon: Award },
    { path: '/student/timetable', label: 'Class schedule', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader portalName="Student Portal" badgeColor="bg-success/10 text-success" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
          <nav className="space-y-1 p-4 text-left">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.path === '/student'
                  ? location.pathname === '/student'
                  : location.pathname.startsWith(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'shadow-xs bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Central Router Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/results" element={<Results />} />
              <Route path="/timetable" element={<Timetable />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
