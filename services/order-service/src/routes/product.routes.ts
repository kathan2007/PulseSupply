import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from '../validators/product.validator';

const router = Router();

// Public / Authenticated read routes
router.get('/', authenticateJWT, ProductController.list);
router.get('/:id', authenticateJWT, ProductController.getById);

// Staff / Manager / Admin mutation routes
router.post(
  '/',
  authenticateJWT,
  authorizeRole(['ADMIN', 'MANAGER']),
  validateRequest(createProductSchema),
  ProductController.create
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole(['ADMIN', 'MANAGER']),
  validateRequest(updateProductSchema),
  ProductController.update
);

router.post(
  '/:id/stock-adjust',
  authenticateJWT,
  authorizeRole(['ADMIN', 'MANAGER', 'STAFF']),
  validateRequest(stockAdjustmentSchema),
  ProductController.adjustStock
);

export default router;

