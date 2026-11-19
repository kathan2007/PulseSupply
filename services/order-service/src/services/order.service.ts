import { prisma } from '../config/database';
import { NotFoundError, BadRequestError, InsufficientStockError } from '../utils/errors';
import { CreateOrderInput, UpdateOrderStatusInput } from '../validators/order.validator';
import { QueueService } from './queue.service';
import { OrderStatus, MovementType, Prisma } from '@prisma/client';

export class OrderService {
  /**
   * Creates an order atomically: validates stock, reserves inventory, creates records
   */
  public static async createOrder(data: CreateOrderInput) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${today}-${randomHex}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch all requested products and verify stock availability
      const productIds = data.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestError('One or more product IDs in the order do not exist');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let calculatedTotal = new Prisma.Decimal(0);
      const itemsToCreate: Array<{
        productId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
      }> = [];

      const lowStockProductsToAlert: Array<{
        id: string;
        sku: string;
        name: string;
        currentStock: number;
        threshold: number;
      }> = [];

      // 2. Validate and deduct stock
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;

        if (product.stockQuantity < item.quantity) {
          throw new InsufficientStockError(product.id, item.quantity, product.stockQuantity);
        }

        const itemTotal = product.unitPrice.mul(item.quantity);
        calculatedTotal = calculatedTotal.add(itemTotal);

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          totalPrice: itemTotal,
        });

        const newStock = product.stockQuantity - item.quantity;

        // Deduct inventory
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newStock },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: MovementType.ORDER_DEDUCTION,
            quantity: -item.quantity,
            previousStock: product.stockQuantity,
            newStock,
            referenceId: orderNumber,
          },
        });

        // Track if threshold reached
        if (newStock <= product.minStockThreshold) {
          lowStockProductsToAlert.push({
            id: product.id,
            sku: product.sku,
            name: product.name,
            currentStock: newStock,
            threshold: product.minStockThreshold,
          });
        }
      }

      // 3. Create the order with its order items
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          status: OrderStatus.CONFIRMED,
          totalAmount: calculatedTotal,
          notes: data.notes,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      return { order, lowStockProductsToAlert };
    });

    // 4. Publish background analytics & alert events
    await QueueService.publishOrderCreated({
      id: newOrder.order.id,
      orderNumber: newOrder.order.orderNumber,
      totalAmount: Number(newOrder.order.totalAmount),
      itemsCount: newOrder.order.items.length,
      customerEmail: newOrder.order.customerEmail,
    });

    for (const alert of newOrder.lowStockProductsToAlert) {
      await QueueService.publishLowStockAlert(alert);
    }

    return {
      ...newOrder.order,
      totalAmount: Number(newOrder.order.totalAmount),
      items: newOrder.order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    };
  }

  /**
   * Updates order lifecycle status with automatic inventory rollback on cancellation
   */
  public static async updateOrderStatus(id: string, data: UpdateOrderStatusInput) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundError(`Order with ID '${id}' not found`);
    }

    if (existing.status === data.status) {
      return existing;
    }

    // If order is being cancelled, restore inventory
    const updated = await prisma.$transaction(async (tx) => {
      if (data.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
        for (const item of existing.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const previousStock = product.stockQuantity;
            const newStock = previousStock + item.quantity;

            await tx.product.update({
              where: { id: product.id },
              data: { stockQuantity: newStock },
            });

            await tx.stockMovement.create({
              data: {
                productId: product.id,
                type: MovementType.RETURN,
                quantity: item.quantity,
                previousStock,
                newStock,
                referenceId: `CANCELLED_${existing.orderNumber}`,
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: data.status as OrderStatus },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true },
              },
            },
          },
        },
      });
    });

    // Notify queue
    await QueueService.publishOrderStatusChanged(
      updated.id,
      updated.orderNumber,
      existing.status,
      updated.status
    );

    return {
      ...updated,
      totalAmount: Number(updated.totalAmount),
      items: updated.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    };
  }

  public static async listOrders(query: {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true, category: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, category: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID '${id}' not found`);
    }

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    };
  }
}

