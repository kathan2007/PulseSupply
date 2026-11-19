import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3, 'SKU must be at least 3 characters').toUpperCase(),
    name: z.string().min(2, 'Product name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    unitPrice: z.number().positive('Unit price must be greater than 0'),
    costPrice: z.number().nonnegative('Cost price cannot be negative'),
    stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative').default(0),
    minStockThreshold: z.number().int().nonnegative('Threshold must be non-negative').default(10),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.string().min(1).optional(),
    unitPrice: z.number().positive().optional(),
    costPrice: z.number().nonnegative().optional(),
    minStockThreshold: z.number().int().nonnegative().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DISCONTINUED']).optional(),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    quantity: z.number().int().refine((val) => val !== 0, 'Adjustment quantity cannot be zero'),
    type: z.enum(['RESTOCK', 'ORDER_DEDUCTION', 'RETURN', 'ADJUSTMENT']),
    reason: z.string().min(3, 'Adjustment reason or reference note is required'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>['body'];

