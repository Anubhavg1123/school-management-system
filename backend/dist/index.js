"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./prisma");
const app = (0, app_1.createApp)();
const startServer = async () => {
    try {
        // Verify database connection
        await prisma_1.prisma.$connect();
        logger_1.logger.info('Connected to Relational Database successfully.');
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info(`🚀 School Management Backend running in ${config_1.config.nodeEnv} mode on port ${config_1.config.port}`);
            logger_1.logger.info(`📡 API endpoint: http://localhost:${config_1.config.port}${config_1.config.apiPrefix}`);
            logger_1.logger.info(`🏥 Health check: http://localhost:${config_1.config.port}${config_1.config.apiPrefix}/health`);
        });
        const shutdown = async () => {
            logger_1.logger.info('Shutting down server gracefully...');
            server.close(async () => {
                await prisma_1.prisma.$disconnect();
                logger_1.logger.info('Database disconnected. Process terminated.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger_1.logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};
startServer();
