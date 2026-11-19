import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductStatus } from '@prisma/client';

export class ProductController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, search, lowStockOnly, page, limit } = req.query;
      const result = await ProductService.listProducts({
        category: category as string,
        status: status as ProductStatus,
        search: search as string,
        lowStockOnly: lowStockOnly === 'true',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.status(200).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.adjustStock(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

