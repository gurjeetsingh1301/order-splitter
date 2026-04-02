import { OrderResponse, OrderType } from '../models/types.js';

const store = new Map<string, OrderResponse>();

export const orderStore = {
  save(order: OrderResponse): void {
    store.set(order.orderId, order);
  },

  getById(orderId: string): OrderResponse | undefined {
    return store.get(orderId);
  },

  getAll(orderType?: OrderType): OrderResponse[] {
    const orders = Array.from(store.values());
    if (orderType) {
      return orders.filter(o => o.orderType === orderType);
    }
    return orders;
  },

  clear(): void {
    store.clear();
  },
};
