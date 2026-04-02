import { afterEach, describe, expect, it } from 'vitest';
import { OrderResponse, OrderStatus, OrderType } from '../models/types.js';
import { orderStore } from './orderStore.js';

const makeOrder = (id: string, type: OrderType): OrderResponse => ({
  orderId: id,
  orderType: type,
  status: OrderStatus.EXECUTED,
  totalAmount: 100,
  executionDate: '2026-04-01',
  createdAt: new Date().toISOString(),
  stocks: [],
});

afterEach(() => orderStore.clear());

describe('orderStore', () => {
  it('saves and retrieves an order by id', () => {
    const order = makeOrder('abc', OrderType.BUY);
    orderStore.save(order);
    expect(orderStore.getById('abc')).toEqual(order);
  });

  it('returns undefined for unknown id', () => {
    expect(orderStore.getById('nope')).toBeUndefined();
  });

  it('returns all orders', () => {
    orderStore.save(makeOrder('1', OrderType.BUY));
    orderStore.save(makeOrder('2', OrderType.SELL));
    expect(orderStore.getAll()).toHaveLength(2);
  });

  it('filters by orderType', () => {
    orderStore.save(makeOrder('1', OrderType.BUY));
    orderStore.save(makeOrder('2', OrderType.SELL));
    orderStore.save(makeOrder('3', OrderType.BUY));
    expect(orderStore.getAll(OrderType.BUY)).toHaveLength(2);
    expect(orderStore.getAll(OrderType.SELL)).toHaveLength(1);
  });
});
