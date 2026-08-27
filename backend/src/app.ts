import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import apiRouter from './routes';
import healthRouter from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/request-id';
import { sendError } from './utils/response';
import { enforceProductionStartupValidation } from './utils/config-validator';

export const createApp = () => {
  // Validate production configuration
  enforceProductionStartupValidation();

  const app = express();

  // Request correlation tracking
  app.use(requestIdMiddleware);

  // Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", config.security.corsOrigin],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [config.security.corsOrigin, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
      exposedHeaders: ['x-request-id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
  }

  // Health and Liveness Probes
  app.use(healthRouter);
  app.use(`${config.apiPrefix}`, healthRouter);

  // Mount Main API routes
  app.use(config.apiPrefix, apiRouter);

  // 404 Handler
  app.use((req, res) => {
    sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
