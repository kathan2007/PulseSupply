import { z } from 'zod';

const orderItemInputSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
});

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    customerEmail: z.string().email('Valid customer email is required'),
    items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one product item'),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

export const queryOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];

