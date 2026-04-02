import { Router } from 'express';
import { getOrderById, getOrders, postOrder } from '../controllers/order.controller.js';
import { validate } from '../middleware/validateRequest.js';
import { CreateOrderSchema } from '../models/types.js';

const router = Router();

router.post('/', validate(CreateOrderSchema), postOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);

export default router;
