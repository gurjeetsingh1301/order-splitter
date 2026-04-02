import { Request, Response } from 'express';
import { CreateOrderRequest, OrderType } from '../models/types.js';
import { createOrder } from '../services/order.service.js';
import { orderStore } from '../store/orderStore.js';

export function postOrder(req: Request, res: Response): void {
  const order = createOrder(req.body as CreateOrderRequest);
  res.status(201).json(order);
}

export function getOrders(req: Request, res: Response): void {
  const { orderType } = req.query;
  let type: OrderType | undefined;
  if (orderType === 'BUY') type = OrderType.BUY;
  else if (orderType === 'SELL') type = OrderType.SELL;
  res.json(orderStore.getAll(type));
}

export function getOrderById(req: Request, res: Response): void {
  const order = orderStore.getById(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
}
