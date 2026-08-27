import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './prisma';

const app = createApp();

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Connected to Relational Database successfully.');

    const server = app.listen(config.port, () => {
      logger.info(`🚀 School Management Backend running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`📡 API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`🏥 Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
