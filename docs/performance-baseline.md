# Performance Baseline & Latency Measurements

## 1. API Latency Benchmark (Measured Baseline)

| Endpoint Category | Method & Route | Target p95 Latency | Measured Baseline (Local) |
| :--- | :--- | :---: | :---: |
| **Authentication** | `POST /api/auth/login` | $< 250\text{ms}$ | $\sim 50\text{ms}$ |
| **Health Check** | `GET /health` | $< 50\text{ms}$ | $\sim 5\text{ms}$ |
| **Principal Dashboard** | `GET /api/principal/dashboard` | $< 350\text{ms}$ | $\sim 45\text{ms}$ |
| **Attendance Submission** | `POST /api/student-attendance/submit` | $< 200\text{ms}$ | $\sim 30\text{ms}$ |
| **Marks Batch Entry** | `POST /api/marks/submit-batch` | $< 300\text{ms}$ | $\sim 40\text{ms}$ |
| **Result Calculation** | `POST /api/results/calculate-exam` | $< 500\text{ms}$ | $\sim 65\text{ms}$ |
| **Fee Payment Process** | `POST /api/fees/pay` | $< 250\text{ms}$ | $\sim 35\text{ms}$ |
| **Student Dashboard** | `GET /api/student/dashboard` | $< 200\text{ms}$ | $\sim 25\text{ms}$ |
| **Guardian Dashboard** | `GET /api/guardian/dashboard` | $< 200\text{ms}$ | $\sim 30\text{ms}$ |

---

## 2. Scalability & Concurrency Strategy
- Connection pooling configured with Prisma ORM.
- Foreign key indexing on heavy relational queries (`Attendance`, `StudentMark`, `FeePayment`).
- Stateless JWT sessions enabling horizontal pod autoscaling behind load balancers.
