# Production Deployment Guide

## 1. Production Architecture Recommendation

- **Backend Runtime**: Node.js in Docker / Kubernetes / Google Cloud Run / AWS ECS.
- **Database**: Managed PostgreSQL (Cloud SQL / AWS RDS) or High-Availability MySQL.
- **Frontend Hosting**: Static CDN edge (Cloudflare Pages, Vercel, AWS CloudFront + S3, Nginx).
- **Reverse Proxy**: Nginx or Traefik with TLS termination, Rate-limiting, and Web Application Firewall (WAF).

---

## 2. PostgreSQL Configuration

To switch Prisma from SQLite to PostgreSQL in production:

1. In `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://dbuser:StrongPassword@postgres-host:5432/school_mgmt?schema=public&sslmode=require"
   ```
3. Run migrations on the production cluster:
   ```bash
   npx prisma migrate deploy
   ```

---

## 3. Production Environment Variables Checklist

Ensure these variables are injected securely via your cloud secret manager:
- `PORT`: Production listening port (`5000` or `8080`)
- `NODE_ENV`: `production`
- `DATABASE_URL`: Production PostgreSQL connection string
- `JWT_ACCESS_SECRET`: 64+ char random cryptographically secure string
- `JWT_REFRESH_SECRET`: 64+ char random cryptographically secure string
- `CORS_ORIGIN`: Exact production frontend domain (e.g. `https://portal.school.edu`)
- `BCRYPT_SALT_ROUNDS`: `12`
- `MAX_LOGIN_ATTEMPTS`: `5`
- `LOCKOUT_DURATION_MINUTES`: `15`

---

## 4. Production Build Steps

**Backend**:
```bash
cd backend
npm run build
npm start # runs node dist/index.js
```

**Frontend**:
```bash
cd frontend
npm run build # outputs optimized assets to dist/
```
Deploy the `dist/` directory to your static web server or CDN.
