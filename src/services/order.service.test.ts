import { afterEach, describe, expect, it } from 'vitest';
import { OrderType } from '../models/types.js';
import { orderStore } from '../store/orderStore.js';
import { createOrder } from './order.service.js';

afterEach(() => orderStore.clear());

describe('createOrder', () => {
  it('correctly splits a 2-stock portfolio', () => {
    const order = createOrder({
      portfolio: [
        { ticker: 'AAPL', allocationPercent: 60 },
        { ticker: 'TSLA', allocationPercent: 40 },
      ],
      totalAmount: 100,
      orderType: OrderType.BUY,
    });

    expect(order.stocks).toHaveLength(2);
    expect(order.stocks[0].ticker).toBe('AAPL');
    expect(order.stocks[0].amount).toBe(60);
    expect(order.stocks[1].ticker).toBe('TSLA');
    expect(order.stocks[1].amount).toBe(40);
  });

  it('uses default price of 100 when no marketPrice provided', () => {
    const order = createOrder({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 100,
      orderType: OrderType.BUY,
    });

    expect(order.stocks[0].pricePerShare).toBe(100);
    expect(order.stocks[0].quantity).toBe(1);
  });

  it('uses provided marketPrice override', () => {
    const order = createOrder({
      portfolio: [{ ticker: 'TSLA', allocationPercent: 100, marketPrice: 200 }],
      totalAmount: 100,
      orderType: OrderType.BUY,
    });

    expect(order.stocks[0].pricePerShare).toBe(200);
    expect(order.stocks[0].quantity).toBe(0.5);
  });

  it('stock amounts sum exactly to totalAmount', () => {
    const order = createOrder({
      portfolio: [
        { ticker: 'A', allocationPercent: 33 },
        { ticker: 'B', allocationPercent: 33 },
        { ticker: 'C', allocationPercent: 34 },
      ],
      totalAmount: 100,
      orderType: OrderType.BUY,
    });

    const total = order.stocks.reduce((sum, s) => sum + s.amount, 0);
    expect(Math.round(total * 100) / 100).toBe(100);
  });

  it('persists order in store', () => {
    const order = createOrder({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 100,
      orderType: OrderType.SELL,
    });

    expect(orderStore.getById(order.orderId)).toEqual(order);
  });

  it('handles BUY and SELL order types', () => {
    const buyOrder = createOrder({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 50,
      orderType: OrderType.BUY,
    });
    const sellOrder = createOrder({
      portfolio: [{ ticker: 'AAPL', allocationPercent: 100 }],
      totalAmount: 50,
      orderType: OrderType.SELL,
    });

    expect(buyOrder.orderType).toBe(OrderType.BUY);
    expect(sellOrder.orderType).toBe(OrderType.SELL);
  });
});
