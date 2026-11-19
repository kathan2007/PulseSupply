import { analyticsQueue, stockAlertQueue } from '../config/redis';
import { logger } from '../utils/logger';

export class QueueService {
  /**
   * Publishes an order creation event to BullMQ queue for analytics consumption
   */
  public static async publishOrderCreated(order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    itemsCount: number;
    customerEmail: string;
  }): Promise<void> {
    try {
      await analyticsQueue.add('order.created', {
        eventType: 'ORDER_CREATED',
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemsCount: order.itemsCount,
        customerEmail: order.customerEmail,
        timestamp: new Date().toISOString(),
      }, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
      logger.info(`Dispatched 'order.created' event for order ${order.orderNumber}`);
    } catch (err: unknown) {
      logger.warn('Failed to dispatch order.created event to Redis Queue', (err as Error).message);
    }
  }

  /**
   * Publishes an order status update event
   */
  public static async publishOrderStatusChanged(
    orderId: string,
    orderNumber: string,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      await analyticsQueue.add('order.status_changed', {
        eventType: 'ORDER_STATUS_CHANGED',
        orderId,
        orderNumber,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      }, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
      logger.info(`Dispatched 'order.status_changed' for ${orderNumber} -> ${newStatus}`);
    } catch (err: unknown) {
      logger.warn('Failed to dispatch order status change to Redis Queue', (err as Error).message);
    }
  }

  /**
   * Publishes a low stock alert event when stock dips below minStockThreshold
   */
  public static async publishLowStockAlert(product: {
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    threshold: number;
  }): Promise<void> {
    try {
      await stockAlertQueue.add('stock.low', {
        eventType: 'LOW_STOCK_ALERT',
        productId: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: product.currentStock,
        threshold: product.threshold,
        timestamp: new Date().toISOString(),
      }, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
      logger.warn(`Dispatched 'stock.low' alert for SKU ${product.sku} (Stock: ${product.currentStock}, Min: ${product.threshold})`);
    } catch (err: unknown) {
      logger.warn('Failed to dispatch low stock alert to Redis Queue', (err as Error).message);
    }
  }
}

