# EduSphere ERP - Enterprise College Management System (v1.0)

EduSphere ERP is a production-ready, enterprise-grade College ERP platform designed for universities and higher-education institutions. It provides a Zoho-style user experience, role-based dashboards, secure JWT session management, weekly class timetables, daily attendance grids, assignments tracking with version history control, note libraries with signed Cloudinary private URL deliveries, and SGPA marks calculators.

---

## Technical Architecture Stack

* **Frontend**: React 19, TypeScript, Vite, React Router v7, Redux Toolkit, Axios interceptors.
* **Styling**: Vanilla CSS, Tailwind CSS, Lucide Icons, glassmorphic grids.
* **Backend**: Node.js, Express.js, TypeScript, TSX compilation.
* **Database**: MongoDB Atlas, Mongoose schemas, compound indexes.
* **Storage**: Multer file type filtering, Cloudinary private authenticated delivery (local mock folders fallback).

---

## Academic Tree Hierarchy Structure

The system enforces a clean separation between permanent syllabus structures and time-bound semester operations:

```
[Department] ➔ [Course] ➔ [Subject (Credits, Syllabus)]
      │
      └─➔ [Class Section] 
                 │
                 ▼ (Intersection offering of a subject in a semester class)
         [SemesterOffering] ◄─── [Semester (AcademicYear)]
          ├── Teacher Assignment
          └── Enrolled Students List
```

* **Semester Offering**: Connects a specific subject, class section, semester term, teacher, and student group. Uses compound indexing `(semester + subject + class)` to prevent duplicate registrations.

---

## Feature Modules Built

### 1. Authentication & Guarded Access
* **Access & Refresh JWTs**: Placed as secure, HTTP-only, SameSite cookies.
* **Axios Interceptor Queue**: Automatically intercepts `401 Unauthorized` responses on reload, calls the backend rotation endpoint, refreshes the tokens, and transparently completes the initial API requests.
* **Protected Routes Layout**: Restricts views by role. Manually tampering with URL paths (e.g., student attempting to browse `/teacher`) redirects the user automatically.

### 2. Daily Attendance Registrar
* **Grid Roster View (Teacher)**: Renders a matrix of student names and status toggle selectors (`Present`, `Absent`, `Leave`, `Late`) alongside comment inputs.
* **Bulk Write Upsert**: Saves attendance logs using single-query Mongo `bulkWrite` operations.
* **Student Dashboard Gauge**: Displays overall attendance rates as circular SVG progress bars.

### 3. Assignments (Version Control)
* **No File Overwrite**: Resubmitted assignments generate a new incremented version.
* **Evaluation Desk (Teacher)**: Teachers can view full submission histories, download specific versions, and record separate grades and feedback on each version.

### 4. Course Notes & Cloudinary Signed Links
* **Multer Guards**: Enforces 25MB limits and filters file extensions (PDF, DOCX, PPTX, ZIP, PNG, JPG, JPEG).
* **Signed Access URLs**: Notes are uploaded to Cloudinary as private authenticated assets. The backend download route verifies user enrollment before signing a short-lived URL.

### 5. Results & GPA marksheets (10.0 scale)
* **Indian University Grade Maps**:
  * `90 - 100` = `O` (10 GP) | `80 - 89` = `A+` (9 GP) | `70 - 79` = `A` (8 GP) | `60 - 69` = `B+` (7 GP) | `50 - 59` = `B` (6 GP) | `45 - 49` = `C` (5 GP) | `40 - 44` = `P` (4 GP) | `< 40` = `F` (0 GP).
* **SGPA Calculation**: Dynamic credits-hour weighted SGPA average returning complete transcript sheets.
* **Publish Gateway**: Gated by an `isPublished` visibility boolean.

### 6. Timetables & Notifications Polling
* **Timetables**: Weekly calendars mapped by room, day, and subject.
* **Notifications**: 30-second interval polling updating alert counters.
* **Global Search**: Debounced instant-search looking up subjects, teachers, notes, and students.

---

## Step-by-Step Run Guide

### 1. Database Configuration
Ensure the MongoDB Atlas URI and JWT secret credentials are configured in your `.env` file:
* **File Location**: `backend/.env`
* *Note: If Cloudinary keys are omitted, the system falls back to serving files locally using local routes.*

### 2. Install Dependencies
Run `npm install` inside both directories to install dependencies.

### 3. Database Seeding
Initialize the database collections and create the demo profiles:
```bash
cd "d:\EduSphere ERP\backend"
npm run seed
```

### 4. Start Development Servers
Open two terminal windows:
* **Terminal 1 (Backend)**:
  ```bash
  cd "d:\EduSphere ERP\backend"
  npm run dev
  ```
* **Terminal 2 (Frontend)**:
  ```bash
  cd "d:\EduSphere ERP\frontend"
  npm run dev
  ```

Navigate your browser to **`http://localhost:5173/`**.

---

## Demo Profiles

* **Teacher**: `teacher1@edusphere.edu` / `Password123`
* **Student**: `student1@edusphere.edu` / `Password123`
