import { prisma } from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { CreateProductInput, UpdateProductInput, StockAdjustmentInput } from '../validators/product.validator';
import { QueueService } from './queue.service';
import { MovementType, ProductStatus, Prisma } from '@prisma/client';

export class ProductService {
  public static async listProducts(query: {
    category?: string;
    status?: ProductStatus;
    search?: string;
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Format Decimal fields to numbers for clean API responses
    const formatted = items.map((p) => ({
      ...p,
      unitPrice: Number(p.unitPrice),
      costPrice: Number(p.costPrice),
      isLowStock: p.stockQuantity <= p.minStockThreshold,
    }));

    return {
      items: query.lowStockOnly ? formatted.filter((p) => p.isLowStock) : formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return {
      ...product,
      unitPrice: Number(product.unitPrice),
      costPrice: Number(product.costPrice),
      isLowStock: product.stockQuantity <= product.minStockThreshold,
    };
  }

  public static async createProduct(data: CreateProductInput) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku.toUpperCase() },
    });

    if (existingSku) {
      throw new ConflictError(`Product SKU '${data.sku.toUpperCase()}' is already in use`);
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: data.sku.toUpperCase(),
          name: data.name,
          description: data.description,
          category: data.category,
          unitPrice: data.unitPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          minStockThreshold: data.minStockThreshold,
          status: 'ACTIVE',
        },
      });

      if (data.stockQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: MovementType.RESTOCK,
            quantity: data.stockQuantity,
            previousStock: 0,
            newStock: data.stockQuantity,
            referenceId: 'INITIAL_STOCK_CREATION',
          },
        });
      }

      return created;
    });

    return {
      ...product,
      unitPrice: Number(product.unitPrice),
      costPrice: Number(product.costPrice),
      isLowStock: product.stockQuantity <= product.minStockThreshold,
    };
  }

  public static async updateProduct(id: string, data: UpdateProductInput) {
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        minStockThreshold: data.minStockThreshold,
        status: data.status,
      },
    });

    return {
      ...updated,
      unitPrice: Number(updated.unitPrice),
      costPrice: Number(updated.costPrice),
      isLowStock: updated.stockQuantity <= updated.minStockThreshold,
    };
  }

  public static async adjustStock(id: string, adjustment: StockAdjustmentInput) {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      const previousStock = product.stockQuantity;
      const newStock = previousStock + adjustment.quantity;

      if (newStock < 0) {
        throw new BadRequestError(
          `Cannot deduct ${Math.abs(adjustment.quantity)} units; current available stock is ${previousStock}`
        );
      }

      const updated = await tx.product.update({
        where: { id },
        data: { stockQuantity: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          type: adjustment.type as MovementType,
          quantity: adjustment.quantity,
          previousStock,
          newStock,
          referenceId: adjustment.reason,
        },
      });

      return { updated, movement };
    });

    // Check low stock condition and trigger background queue event
    if (result.updated.stockQuantity <= result.updated.minStockThreshold) {
      await QueueService.publishLowStockAlert({
        id: result.updated.id,
        sku: result.updated.sku,
        name: result.updated.name,
        currentStock: result.updated.stockQuantity,
        threshold: result.updated.minStockThreshold,
      });
    }

    return {
      product: {
        ...result.updated,
        unitPrice: Number(result.updated.unitPrice),
        costPrice: Number(result.updated.costPrice),
        isLowStock: result.updated.stockQuantity <= result.updated.minStockThreshold,
      },
      movement: result.movement,
    };
  }

  public static async getInventoryStats() {
    // Prisma cannot compare two columns in the same row via its standard API.
    // We use $queryRaw for the cross-column comparison (stockQuantity <= minStockThreshold).
    const [totalProducts, outOfStockProducts, lowStockResult] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'ACTIVE', stockQuantity: 0 } }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM "Product"
        WHERE status = 'ACTIVE'
          AND "stockQuantity" > 0
          AND "stockQuantity" <= "minStockThreshold"
      `,
    ]);

    const lowStockProducts = Number(lowStockResult[0]?.count || 0);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
    };
  }
}

