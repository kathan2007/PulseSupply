import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Auth & Order Service - Authentication Integration Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@pulsesupply.io`,
    password: 'SecureTestPassword123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN' as const,
  };

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test-' } },
      });
      await prisma.$disconnect();
    } catch {
      // Ignored during test cleanup if database not accessible
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate request schema and reject short passwords', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid@example.com',
          password: '123',
          firstName: 'A',
          lastName: 'B',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /healthz', () => {
    it('should return 200 OK and healthy status', async () => {
      const response = await request(app).get('/healthz');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('order-service');
    });
  });

  describe('Protected Route Security', () => {
    it('should block unauthenticated access to /api/v1/orders', async () => {
      const response = await request(app).get('/api/v1/orders');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should block unauthenticated access to /api/v1/products', async () => {
      const response = await request(app).get('/api/v1/products');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

