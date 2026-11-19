export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DISCONTINUED';
  isLowStock?: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface KPISummary {
  total_revenue: number;
  total_orders: number;
  active_products: number;
  low_stock_count: number;
  average_order_value: number;
  fulfillment_rate: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  order_count: number;
}

export interface InventoryCategoryMetric {
  category: string;
  product_count: number;
  total_stock: number;
  valuation: number;
}

export interface StockAlert {
  product_id: string;
  sku: string;
  name: string;
  current_stock: number;
  threshold: number;
  status: string;
}

export interface OrderVelocity {
  orders_last_hour: number;
  orders_last_24h: number;
  average_velocity_per_hour: number;
  peak_hour?: string;
}

