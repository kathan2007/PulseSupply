'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { OrdersView } from '../components/OrdersView';
import { InventoryView } from '../components/InventoryView';
import { AnalyticsView } from '../components/AnalyticsView';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { api } from '../lib/api';
import {
  Product,
  Order,
  OrderStatus,
  KPISummary,
  SalesTrendPoint,
  InventoryCategoryMetric,
  StockAlert,
  OrderVelocity,
} from '../types';

type TabType = 'dashboard' | 'orders' | 'inventory' | 'analytics';

const TAB_HEADERS: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Command Center',
    subtitle: 'Real-time telemetry, revenue metrics, and automated stock monitoring',
  },
  orders: {
    title: 'Orders & Supply Pipeline',
    subtitle: 'Atomic inventory reservation with BullMQ task queue ingestion',
  },
  inventory: {
    title: 'Clinical Inventory Ledger',
    subtitle: 'Real-time catalog synchronized via PostgreSQL and Prisma ORM',
  },
  analytics: {
    title: 'Analytics & Reporting Engine',
    subtitle: 'Python FastAPI background calculation engine with Redis BullMQ worker',
  },
};

export default function PulseSupplyApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Core Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrendPoint[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategoryMetric[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [velocity, setVelocity] = useState<OrderVelocity | null>(null);

  const addToast = (title: string, message?: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        prods,
        ords,
        kpiData,
        trends,
        cats,
        alerts,
        vel,
      ] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getKPIs(),
        api.getSalesTrends(),
        api.getInventoryCategories(),
        api.getStockAlerts(),
        api.getVelocity(),
      ]);

      setProducts(prods);
      setOrders(ords);
      setKpis(kpiData);
      setSalesTrends(trends);
      setInventoryCategories(cats);
      setStockAlerts(alerts);
      setVelocity(vel);
    } catch (err) {
      console.error('Error fetching PulseSupply data:', err);
      addToast('Data Sync Failed', 'Could not reach backend microservices. Fallback active.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleCreateOrder = async (data: Parameters<typeof api.createOrder>[0]) => {
    try {
      const newOrder = await api.createOrder(data);
      setOrders((prev) => [newOrder, ...prev]);

      // Refresh inventory and KPIs
      const [updatedProducts, updatedKpis, updatedAlerts] = await Promise.all([
        api.getProducts(),
        api.getKPIs(),
        api.getStockAlerts(),
      ]);
      setProducts(updatedProducts);
      setKpis(updatedKpis);
      setStockAlerts(updatedAlerts);

      addToast(
        'Order Dispatched & Stock Reserved',
        `Order ${newOrder.orderNumber} created for ${newOrder.customerName} (₹${newOrder.totalAmount.toLocaleString('en-IN')})`,
        'success'
      );
    } catch (err: any) {
      addToast('Order Creation Failed', err.message || 'Stock reservation error', 'error');
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

      // Refresh KPIs and inventory so dashboard telemetry updates immediately
      const [updatedProducts, updatedKpis, updatedAlerts] = await Promise.all([
        api.getProducts(),
        api.getKPIs(),
        api.getStockAlerts(),
      ]);
      setProducts(updatedProducts);
      setKpis(updatedKpis);
      setStockAlerts(updatedAlerts);

      // If status changed to CANCELLED, inventory was rolled back
      if (status === 'CANCELLED') {
        addToast(
          'Order Cancelled',
          `Order ${updatedOrder.orderNumber} cancelled. Inventory stock automatically restored.`,
          'info'
        );
      } else if (status === 'SHIPPED') {
        addToast(
          'Order Dispatched & In Transit',
          `Order ${updatedOrder.orderNumber} dispatched. Revenue locked at ₹${updatedOrder.totalAmount.toLocaleString('en-IN')}.`,
          'success'
        );
      } else {
        addToast(
          'Status Updated',
          `Order ${updatedOrder.orderNumber} transitioned to ${status}`,
          'success'
        );
      }
    } catch (err: any) {
      addToast('Status Update Failed', err.message, 'error');
    }
  };

  const handleAdjustStock = async (productId: string, quantity: number, reason: string) => {
    try {
      const updated = await api.adjustStock(productId, quantity, reason);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      const updatedAlerts = await api.getStockAlerts();
      setStockAlerts(updatedAlerts);

      const direction = quantity > 0 ? `+${quantity} Restocked` : `${quantity} Deducted`;
      addToast(
        'Stock Ledger Updated',
        `${updated.sku} adjusted: ${direction}. Current stock: ${updated.stockQuantity} units.`,
        'success'
      );
    } catch (err: any) {
      addToast('Stock Adjustment Failed', err.message, 'error');
      throw err;
    }
  };

  const handleQuickSimulateOrder = async () => {
    const activeProds = products.filter((p) => p.stockQuantity > 0);
    if (activeProds.length === 0) {
      addToast('Simulation Skipped', 'No catalog items currently have available stock.', 'warning');
      return;
    }

    const randomProd = activeProds[Math.floor(Math.random() * activeProds.length)];
    const indianFacilities = [
      'Manipal Hospital (Hebbal, Bengaluru)',
      'Medanta - The Medicity (Gurugram)',
      'Sir Ganga Ram Hospital (New Delhi)',
      'Ruby Hall Clinic (Pune)',
      'Apollo Speciality Hospital (Chennai)',
    ];
    const customer = indianFacilities[Math.floor(Math.random() * indianFacilities.length)];

    await handleCreateOrder({
      customerName: customer,
      customerEmail: `procurement@${customer.toLowerCase().split(' ')[0]}.org`,
      items: [{ productId: randomProd.id, quantity: 1 }],
      notes: 'Live telemetry queue simulation trigger',
    });
  };

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockThreshold);
  const header = TAB_HEADERS[activeTab];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Modern Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCount={orders.length}
        lowStockCount={lowStockProducts.length}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Dynamic Header */}
        <Header
          title={header.title}
          subtitle={header.subtitle}
          onRefresh={fetchAllData}
          isLoading={isLoading}
          onQuickSimulateOrder={handleQuickSimulateOrder}
          onOpenCreateOrder={() => setIsCreateModalOpen(true)}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <div className="text-base font-bold text-white tracking-tight">
                    Connecting to PulseSupply Microservices
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Establishing connection to PostgreSQL, FastAPI & Redis BullMQ...
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  kpis={kpis}
                  velocity={velocity}
                  recentOrders={orders}
                  lowStockProducts={lowStockProducts}
                  onNavigateToOrders={() => setActiveTab('orders')}
                  onNavigateToInventory={() => setActiveTab('inventory')}
                  onNavigateToAnalytics={() => setActiveTab('analytics')}
                  onQuickSimulateOrder={handleQuickSimulateOrder}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersView
                  orders={orders}
                  products={products}
                  onCreateOrder={handleCreateOrder}
                  onUpdateStatus={handleUpdateOrderStatus}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  products={products}
                  onAdjustStock={handleAdjustStock}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  kpis={kpis}
                  salesTrends={salesTrends}
                  inventoryCategories={inventoryCategories}
                  stockAlerts={stockAlerts}
                  velocity={velocity}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Global Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products.filter((p) => p.stockQuantity > 0 && p.status === 'ACTIVE')}
        onSubmit={handleCreateOrder}
      />
    </div>
  );
}
