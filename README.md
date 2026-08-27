# St. Lawrence Academy — Production School Management System

> **Production-Oriented Institutional Management Platform — Phase 1 Foundation**

This project is a real, production-ready school/college management system backed by normalized relational databases and authenticated REST APIs with zero mock data.

---

## 🌟 Highlights

- **Multi-Role Dashboards**: Specialized UI shells for **Principal**, **Academic Office**, **HOD**, **Faculty**, and **Non-Faculty Staff**.
- **Multi-Tier Registration & Approvals**: Public applicant requests require higher authority review before account activation.
- **Account Security & Lockout Guard**: 5 failed login attempts trigger a 15-minute lockout with audit alerts.
- **Role & Permission Governance**: Dual-layer RBAC and PBAC enforced on every protected backend route with role-spoofing prevention.
- **Attendance Foundation**: Biometric / Web check-in & check-out with automatic late-arrival calculation and correction workflows.
- **Audit Ledger**: Comprehensive audit logging of all sensitive administrative and operational actions.
- **Automated Tests**: 100% passing Vitest + Supertest integration suite.

---

## 🚀 Quick Start

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

### 3. Run Automated Tests
```bash
cd backend
npm test
```

---

## 🔑 Default Initial Super Administrator
- **Email**: `principal@school.edu`
- **Username**: `principal`
- **Password**: `Admin@SecurePassword2026!`
- **Role**: `Principal / Super Administrator`

---

## 📚 Documentation
- [Technical Architecture](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/architecture.md)
- [Database Schema](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/database.md)
- [API Reference](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/api.md)
- [Authentication Architecture](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/authentication.md)
- [Roles & Permissions (RBAC/PBAC)](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/roles-and-permissions.md)
- [Development Setup](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/development-setup.md)
- [Production Deployment](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/deployment.md)
- [Project Status & Roadmap](file:///C:/Users/ANUBHAV%20J%20GORAGUDDI/.gemini/antigravity/scratch/school-management-system/docs/project-status.md)
