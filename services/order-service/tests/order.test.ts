import request from 'supertest';
import app from '../src/app';

describe('Order Controller Request Validation Tests', () => {
  it('should reject order creation without authentication token', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Acme Corp',
        customerEmail: 'buyer@acme.com',
        items: [{ productId: 'b43d526e-44aa-49c0-93fb-24816049a4ea', quantity: 2 }],
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should reject order creation with empty items array if token supplied', async () => {
    // Generate valid dummy jwt for schema testing
    const jwt = require('jsonwebtoken');
    const { config } = require('../src/config');
    const testToken = jwt.sign(
      { id: 'usr-1', email: 'test@pulsesupply.io', role: 'ADMIN' },
      config.jwt.secret
    );

    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        customerName: 'Hospital One',
        customerEmail: 'order@hospital.org',
        items: [],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should validate status change payload', async () => {
    const jwt = require('jsonwebtoken');
    const { config } = require('../src/config');
    const testToken = jwt.sign(
      { id: 'usr-1', email: 'test@pulsesupply.io', role: 'ADMIN' },
      config.jwt.secret
    );

    const response = await request(app)
      .patch('/api/v1/orders/123e4567-e89b-12d3-a456-426614174000/status')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        status: 'NON_EXISTENT_STATUS',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

