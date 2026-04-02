import { z } from 'zod';

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderStatus {
  EXECUTED = 'EXECUTED',
  SCHEDULED = 'SCHEDULED',
}

export interface StockAllocation {
  ticker: string;
  allocationPercent: number;
  marketPrice?: number;
}

export interface CreateOrderRequest {
  portfolio: StockAllocation[];
  totalAmount: number;
  orderType: OrderType;
}

export interface StockOrder {
  ticker: string;
  allocationPercent: number;
  pricePerShare: number;
  amount: number;
  quantity: number;
}

export interface OrderResponse {
  orderId: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  executionDate: string;
  createdAt: string;
  stocks: StockOrder[];
}

export const CreateOrderSchema = z.object({
  portfolio: z
    .array(
      z.object({
        ticker: z.string().min(1),
        allocationPercent: z.number().positive(),
        marketPrice: z.number().positive().optional(),
      })
    )
    .min(1, 'Portfolio must contain at least one stock')
    .refine(
      (stocks) => {
        // Use integer-cents arithmetic: multiply each percent by 100, sum, compare to 10000
        const total = stocks.reduce((sum, s) => sum + Math.round(s.allocationPercent * 100), 0);
        return total === 10000;
      },
      { message: 'Allocation percentages must sum to exactly 100' }
    ),
  totalAmount: z.number().positive(),
  orderType: z.nativeEnum(OrderType),
});
