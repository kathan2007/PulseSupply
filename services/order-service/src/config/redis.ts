import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from './index';

export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected successfully');
});

redisClient.on('error', (err) => {
  console.warn('⚠️ Redis client warning/error:', err.message);
});

// BullMQ Queues for background asynchronous processing
export const ANALYTICS_EVENTS_QUEUE_NAME = 'analytics-events';
export const STOCK_ALERTS_QUEUE_NAME = 'stock-alerts';

export const analyticsQueue = new Queue(ANALYTICS_EVENTS_QUEUE_NAME, {
  connection: redisClient,
});

export const stockAlertQueue = new Queue(STOCK_ALERTS_QUEUE_NAME, {
  connection: redisClient,
});

