import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { createOrderSchema, updateOrderStatusSchema, queryOrdersSchema } from '../validators/order.validator';

const router = Router();

router.get('/', authenticateJWT, validateRequest(queryOrdersSchema), OrderController.list);
router.get('/:id', authenticateJWT, OrderController.getById);

router.post(
  '/',
  authenticateJWT,
  validateRequest(createOrderSchema),
  OrderController.create
);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRole(['ADMIN', 'MANAGER', 'STAFF']),
  validateRequest(updateOrderStatusSchema),
  OrderController.updateStatus
);

export default router;

