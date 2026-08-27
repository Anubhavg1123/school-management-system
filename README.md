# School Management System (Classes 1 – 10)

A real-world, production-ready **School Management System** designed specifically for Primary, Middle, and Secondary school education (Classes 1 through 10). Backed by normalized relational database schemas, multi-tier RBAC/PBAC governance, permanent 5-digit sequential Campus IDs, flexible timetable scheduling, real-time student roll call, and institutional administration.

---

## 🌟 Core Architectural Features

1. **School Product Scope (Class 1 – 10 Only)**:
   - Eliminates higher-education/college hierarchies (zero departments, zero HODs).
   - Administrative/Office staff creates actual classes (Class 1 to Class 10) as student admissions occur.
   - Manual section creation (e.g. `Class 1-A`, `Class 1-B`) with custom student capacities and Class Coordinator assignments.

2. **Student Identity & Admissions**:
   - **Permanent 5-Digit Campus ID**: Automatically generated sequential ID (`00001`, `00002`...) that stays permanent across promotions, transfers, and academic years.
   - **Academic Year Enrollment Number**: Configurable prefix and sequence per academic year cycle (e.g. Prefix `26` + `0001` = `260001`).
   - **Parent/Guardian Intake**: Mandatory guardian WhatsApp number and alternate emergency contact.

3. **Flexible School Timetable**:
   - Configurable school operating hours (e.g. 08:00 AM to 02:00 PM).
   - Custom time slots with dynamic start/end times, labels, and categories (Teaching, Break, Assembly, Activity).
   - Hard 3-way conflict prevention (Faculty, Section, Room) with instant collision detection.

4. **Attendance & Class Coordinator Governance**:
   - **Faculty Roll Call**: Allows `PRESENT` and `ABSENT` only.
   - **Class Coordinator Authority**: Permitted to submit legitimate `SCHOOL ACTIVITY / ACADEMIC BYPASS` for official school activities (sports, competitions, school duties) strictly for their assigned class and section.

5. **Institutional Roles & RBAC**:
   - **Principal / Super Admin**: Institutional executive command, user approvals, role assignments, fee oversight, examinations, notices, and audit logging.
   - **Academic Office**: Admissions intake, class/section management, student records, fee collection, and timetable scheduling.
   - **Faculty**: Roll call, timetable, syllabus assignments, and marks entry.
   - **Non-Faculty (Security, Driver, Attender)**: Dedicated mobile and desktop workflows for gate logging, fleet fuel/odometer tracking, and assisted operations.
   - **Student & Guardian**: Child academic progress, attendance tracking, fee receipts, notices, and parent-teacher meeting (PTM) scheduling.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm / yarn / pnpm

### 1. Backend Setup
```bash
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```
Backend API will be live at `http://localhost:5000/api`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web portal will be live at `http://localhost:5173`.

### 3. Running Integration Tests
```bash
cd backend
npm test
```
Executes 21 test suites (235+ integration tests) with 100% pass rate.

---

## 🔑 Initial Super Administrator Credentials (First-Time Setup)
- **Email**: `principal@school.edu`
- **Password**: `Admin@SecurePassword2026!`
- **Role**: `Principal / Super Administrator`

---

## 🌐 Production Deployment

### Database Configuration (MongoDB Atlas / PostgreSQL / SQLite)
Configure the connection in your production environment:
```env
DATABASE_URL="postgresql://user:pass@host:5432/school_db?schema=public&sslmode=require"
PORT=5000
NODE_ENV=production
JWT_ACCESS_SECRET="<64-byte-random-secret>"
JWT_REFRESH_SECRET="<64-byte-random-secret>"
CORS_ORIGIN="https://your-school-domain.vercel.app"
```

### Vercel Deployment
Deploy the frontend directly to Vercel using the included `vercel.json`:
```bash
vercel --prod
```

---

## 📁 Repository Structure
```
school-management-system/
├── backend/
│   ├── prisma/             # Relational Prisma schema, migrations, seed script
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth, RBAC, Rate-limit, Security guards
│   │   ├── routes/         # Express REST API routes
│   │   ├── services/       # Core business logic & transaction engines
│   │   └── types/          # TypeScript interfaces
│   └── tests/              # 21 Vitest integration test suites
├── frontend/
│   ├── src/
│   │   ├── api/            # API client modules
│   │   ├── components/     # Reusable UI library (Card, Modal, Button, Badge)
│   │   ├── context/        # Auth and notification context providers
│   │   ├── pages/          # Role-tailored dashboards and management screens
│   │   └── types/          # Shared frontend types
│   └── index.html
├── vercel.json             # Vercel deployment and SPA routing rules
└── README.md
```
