import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.updateOrderStatus(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = req.query;
      const result = await OrderService.listOrders({
        status: status as OrderStatus,
        search: search as string,
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
      const order = await OrderService.getOrderById(req.params.id);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
}

