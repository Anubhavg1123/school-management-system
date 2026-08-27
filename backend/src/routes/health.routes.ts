import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();
const startTime = Date.now();

// 1. Full Health Check (DB connectivity, uptime, memory)
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'UP';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'DOWN';
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const status = dbStatus === 'UP' ? 'healthy' : 'degraded';
  const statusCode = dbStatus === 'UP' ? 200 : 503;

  return res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
});

// 2. Readiness Probe (Traffic Routing Check)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'READY', message: 'Application ready to receive traffic' });
  } catch (error) {
    return res.status(503).json({ status: 'NOT_READY', message: 'Database connection unavailable' });
  }
});

// 3. Liveness Probe (Process Health Check)
router.get('/live', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'ALIVE', uptime: Math.floor((Date.now() - startTime) / 1000) });
});

export default router;
