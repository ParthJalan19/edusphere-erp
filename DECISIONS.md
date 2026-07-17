# Architecture Decisions - EduSphere ERP

This document outlines the core technical and design choices made during the development of **EduSphere ERP**.

---

## 1. Network & Database Connection
* **DNS SRV Workaround**: Node.js on some Windows environments fails to resolve MongoDB Atlas `mongodb+srv://` DNS SRV records due to OS-level lookup timing bugs. To bypass this, we query the Atlas TXT record to resolve the three underlying shard nodes and list them directly as a standard replica set connection string: `mongodb://node1,node2,node3/db?replicaSet=...`. This allows development to proceed securely with Atlas.

---

## 2. API Design & Security
* **Double HTTP-only Cookies**: We use JWTs for sessions. The Access Token (15m expiry) and Refresh Token (7d expiry) are placed in HTTP-only, secure, SameSite cookies to protect against XSS and CSRF.
* **Transparent Token Rotation**: Instead of forcing user logouts on expiry, the frontend interceptor captures `401` errors, calls `/auth/refresh` behind the scenes, updates the cookies, and finishes the initial user API call without UI lag.

---

## 3. Storage & Upload Delivery
* **Multer + Signed URL Fallback**: Files (course notes, assignments) are uploaded to Cloudinary as private, authenticated assets. To download, the backend verifies course enrollment permissions and returns a secure, short-lived (1-hour) signature.
* **Mock Local Fallback**: If Cloudinary API credentials are not set in `.env`, the controller saves files locally in `backend/uploads/` and routes download links to `/api/v1/files/download/:filename` stream, which keeps the app fully functional in local development without setup steps.

---

## 4. Performance & Scalability
* **MongoDB Bulk Write Operations**: Marking daily class attendance or recording students' exam scores is processed in a single query using MongoDB's native `bulkWrite()`. This reduces connection round-trips.
* **Pre-save Hooks vs. Controller Computations**: For results, calculations for GPA grade points and letters are computed in the Express controller prior to database upserts. This ensures consistency when using bulk writes (since standard Mongoose pre-save middleware does not trigger on bulk operations).

---

## 5. UI & State Management
* **Strict Unused-Locals Linting**: We structured React 19 pages to conform with the strict typescript compiler settings (`"noUnusedLocals": true`, `"noUnusedParameters": true`), which ensures clean bundle builds.
* **Custom SVG Circular Gauges**: Instead of pulling in heavy layout packages for attendance widgets, we built responsive SVG progress rings styled with Tailwind classes, maintaining zero external bundle dependencies.
