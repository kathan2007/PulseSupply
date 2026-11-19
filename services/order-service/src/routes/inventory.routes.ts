import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticateJWT, InventoryController.getStats);
router.get(
  '/movements',
  authenticateJWT,
  authorizeRole(['ADMIN', 'MANAGER']),
  InventoryController.getStockMovements
);

export default router;

