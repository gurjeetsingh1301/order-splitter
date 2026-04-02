import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../app.js';
import { orderStore } from '../store/orderStore.js';

const request = supertest(app);

afterEach(() => orderStore.clear());

describe('POST /api/v1/orders', () => {
  it('creates a valid BUY order and returns 201', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [
        { ticker: 'AAPL', allocationPercent: 60 },
        { ticker: 'TSLA', allocationPercent: 40 },
      ],
      totalAmount: 100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.orderType).toBe('BUY');
    expect(res.body.stocks).toHaveLength(2);
  });

  it('creates a valid SELL order', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 500,
      orderType: 'SELL',
    });

    expect(res.status).toBe(201);
    expect(res.body.orderType).toBe('SELL');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request.post('/api/v1/orders').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when allocations do not sum to 100', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [
        { ticker: 'AAPL', allocationPercent: 60 },
        { ticker: 'TSLA', allocationPercent: 30 },
      ],
      totalAmount: 100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('Allocation percentages must sum to exactly 100');
  });

  it('returns 400 for negative totalAmount', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: -100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty portfolio', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [],
      totalAmount: 100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(400);
  });

  it('child order amounts sum exactly to totalAmount', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [
        { ticker: 'A', allocationPercent: 33 },
        { ticker: 'B', allocationPercent: 33 },
        { ticker: 'C', allocationPercent: 34 },
      ],
      totalAmount: 100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(201);
    const total = res.body.stocks.reduce((sum: number, s: any) => sum + s.amount, 0);
    expect(Math.round(total * 100) / 100).toBe(100);
  });

  it('uses provided marketPrice for quantity calculation', async () => {
    const res = await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'TSLA', allocationPercent: 100, marketPrice: 200 }],
      totalAmount: 100,
      orderType: 'BUY',
    });

    expect(res.status).toBe(201);
    expect(res.body.stocks[0].pricePerShare).toBe(200);
    expect(res.body.stocks[0].quantity).toBe(0.5);
  });
});

describe('GET /api/v1/orders', () => {
  it('returns empty array when no orders exist', async () => {
    const res = await request.get('/api/v1/orders');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all orders', async () => {
    await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 100,
      orderType: 'BUY',
    });
    await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'TSLA', allocationPercent: 100 }],
      totalAmount: 200,
      orderType: 'SELL',
    });

    const res = await request.get('/api/v1/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by orderType=BUY', async () => {
    await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 100,
      orderType: 'BUY',
    });
    await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'TSLA', allocationPercent: 100 }],
      totalAmount: 200,
      orderType: 'SELL',
    });

    const res = await request.get('/api/v1/orders?orderType=BUY');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].orderType).toBe('BUY');
  });
});

describe('GET /api/v1/orders/:orderId', () => {
  it('returns the order when found', async () => {
    const createRes = await request.post('/api/v1/orders').send({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 100,
      orderType: 'BUY',
    });

    const { orderId } = createRes.body;
    const res = await request.get(`/api/v1/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(orderId);
  });

  it('returns 404 when order not found', async () => {
    const res = await request.get('/api/v1/orders/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });
});
