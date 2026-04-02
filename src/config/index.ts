import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DEFAULT_STOCK_PRICE: parseFloat(process.env.DEFAULT_STOCK_PRICE ?? '100'),
  DECIMAL_PLACES: parseInt(process.env.DECIMAL_PLACES ?? '3', 10),
};
