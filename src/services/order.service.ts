import crypto from 'crypto';
import { config } from '../config/index.js';
import { CreateOrderRequest, OrderResponse, OrderStatus, OrderType, StockOrder } from '../models/types.js';
import { orderStore } from '../store/orderStore.js';
import { getExecutionInfo } from '../utils/marketHours.js';
import { floorToDecimalPlaces, roundToDecimalPlaces } from '../utils/rounding.js';

export function createOrder(request: CreateOrderRequest): OrderResponse {
  const now = new Date();
  const { executionDate, status } = getExecutionInfo(now);

  const stocks: StockOrder[] = [];
  let runningTotal = 0;

  for (let i = 0; i < request.portfolio.length; i++) {
    const stock = request.portfolio[i];
    const isLast = i === request.portfolio.length - 1;

    let amount: number;
    if (isLast) {
      // Assign remainder to last stock so amounts sum exactly to totalAmount
      amount = Math.round((request.totalAmount - runningTotal) * 100) / 100;
    } else {
      amount = floorToDecimalPlaces((request.totalAmount * stock.allocationPercent) / 100, 2);
      runningTotal += amount;
    }

    const pricePerShare = stock.marketPrice ?? config.DEFAULT_STOCK_PRICE;
    const quantity = roundToDecimalPlaces(amount / pricePerShare, config.DECIMAL_PLACES);

    stocks.push({
      ticker: stock.ticker,
      allocationPercent: stock.allocationPercent,
      pricePerShare,
      amount,
      quantity,
    });
  }

  const order: OrderResponse = {
    orderId: crypto.randomUUID(),
    orderType: request.orderType as OrderType,
    status: status as OrderStatus,
    totalAmount: request.totalAmount,
    executionDate,
    createdAt: now.toISOString(),
    stocks,
  };

  orderStore.save(order);
  return order;
}
