# Changelog - EduSphere ERP

All notable changes to the **EduSphere ERP** project are documented here.

---

## [1.0.0] - 2026-07-17

### Added
* **Academic Tree Structure**: Mongoose schemas and models for `AcademicYear`, `Semester`, `Department`, `Course`, `Subject` (with credits), `Class`, and the intersection `SemesterOffering` class assignment mapping.
* **Daily Attendance Registrar**: Bulk upsert controllers using Mongoose `bulkWrite()`. Built teacher student-grid marking sheets and student circular attendance meters.
* **Assignments Hub**: Version-controlled submission schemas and files upload controllers supporting multiple versions and version grading.
* **Notes Library**: Multer file uploads with Cloudinary authenticated storage and secure signed-URL proxy downloads (with a local folder fallback if credentials are unset).
* **Grades & SGPA marksheet**: Real-time grade point boundary mapping, unpublished/published visibility gates (`isPublished`), and credit-weighted SGPA dynamic calculation.
* **Timetable & Polling Alerts**: Weekly schedule calendars, database-backed notifications, and 30-second interval query poll timers.
* **Global Debounced Search**: A navbar instant search querying academic databases securely.
* **Project Documentation**: Created `README.md`, `DECISIONS.md`, and `CHANGELOG.md` guides.
