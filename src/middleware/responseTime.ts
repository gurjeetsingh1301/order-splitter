import { NextFunction, Request, Response } from 'express';

export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    console.log(`[${req.method} ${req.path}] ${ms.toFixed(2)}ms`);
  });

  next();
}
