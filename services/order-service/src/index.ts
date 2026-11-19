import app from './app';
import { config } from './config';
import { connectDatabase, prisma } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 PulseSupply Order & Auth Service running on port ${config.port} [${config.env}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully terminating Order & Auth service...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await redisClient.quit();
        logger.info('Cleaned up Prisma and Redis connections. Exiting process.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown cleanup', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrapping error:', err);
  process.exit(1);
});

