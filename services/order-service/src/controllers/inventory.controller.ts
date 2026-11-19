import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { prisma } from '../config/database';

export class InventoryController {
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProductService.getInventoryStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const movements = await prisma.stockMovement.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, sku: true, name: true, category: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: { movements },
      });
    } catch (error) {
      next(error);
    }
  }
}

