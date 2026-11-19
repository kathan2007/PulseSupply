import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_development_secret_not_for_prod_123456789',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://pulsegateway:pulsesupply_secure_pass_2026@localhost:5432/pulsesupply_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  corsOrigin: process.env.ORDER_SERVICE_CORS_ORIGIN || '*',
};

