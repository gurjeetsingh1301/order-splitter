import { Router } from 'express';
import orderRoutes from './order.routes.js';

const router = Router();

router.use('/orders', orderRoutes);

export default router;
