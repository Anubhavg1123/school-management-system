# Development Setup & Local Execution Guide

## 1. Prerequisites

- **Node.js**: v18.0.0+ (Tested on v24.13.1)
- **npm**: 9.0.0+ (Tested on 11.8.0)
- **Git**

---

## 2. Quick Start Installation

1. **Clone or Navigate to Project Root**:
   ```bash
   cd "C:\Users\ANUBHAV J GORAGUDDI\.gemini\antigravity\scratch\school-management-system"
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Initialize SQLite database and run migrations
   npm run prisma:migrate
   # Seed default system roles, permissions, settings and Principal account
   npm run prisma:seed
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 3. Running in Development Mode

Run the Backend server (starts on `http://localhost:5000`):
```bash
cd backend
npm run dev
```

Run the Frontend development server (starts on `http://localhost:5173`):
```bash
cd frontend
npm run dev
```

---

## 4. Running Automated Tests

Run backend integration test suite:
```bash
cd backend
npm test
```

---

## 5. Default Administrator Credentials

Upon running `npm run prisma:seed`, the initial Super Administrator account is provisioned:
- **Email**: `principal@school.edu`
- **Username**: `principal`
- **Password**: `Admin@SecurePassword2026!`
- **Role**: `SUPER_ADMIN`
