import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './utils/errors';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';

const app: Application = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PulseSupply Enterprise Order & Auth API',
    endpoints: {
      health: '/healthz',
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      inventory: '/api/v1/inventory',
      analytics: '/api/v1/analytics',
    },
    timestamp: new Date().toISOString(),
  });
});

// Liveness & Readiness probe
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
  });
});

// Service API Route Mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Optional forwarder to Analytics Service (useful when deployed on PaaS like Render without Nginx)
const analyticsUrl = process.env.ANALYTICS_SERVICE_URL;
if (analyticsUrl) {
  app.use('/api/v1/analytics', async (req: Request, res: Response) => {
    try {
      const target = `${analyticsUrl.replace(/\/$/, '')}/api/v1/analytics${req.url}`;
      const response = await fetch(target, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: 'Analytics service unreachable', details: message });
    }
  });
}

// Catch 404s
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('The requested endpoint was not found on this service'));
});

// Centralized error handling
app.use(errorHandler);

export default app;

