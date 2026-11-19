'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle,
  Truck,
  RotateCcw,
  Zap,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { KPISummary, Order, Product, OrderVelocity } from '../types';

interface DashboardViewProps {
  kpis: KPISummary | null;
  velocity: OrderVelocity | null;
  recentOrders: Order[];
  lowStockProducts: Product[];
  onNavigateToOrders: () => void;
  onNavigateToInventory: () => void;
  onNavigateToAnalytics: () => void;
  onQuickSimulateOrder?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  velocity,
  recentOrders,
  lowStockProducts,
  onNavigateToOrders,
  onNavigateToInventory,
  onNavigateToAnalytics,
  onQuickSimulateOrder,
}) => {
  const kpiCards = [
    {
      title: 'Gross Revenue (INR)',
      value: kpis ? `₹${kpis.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00',
      change: '+18.4% this quarter',
      icon: DollarSign,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      border: 'border-emerald-500/20',
      badge: 'Aggregated',
    },
    {
      title: 'Fulfilled Orders',
      value: kpis ? kpis.total_orders.toString() : '0',
      change: `${velocity?.orders_last_24h || 0} orders processed past 24h`,
      icon: Package,
      color: 'text-blue-400',
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      border: 'border-blue-500/20',
      badge: 'Atomic TX',
    },
    {
      title: 'Catalog SKUs',
      value: kpis ? kpis.active_products.toString() : '0',
      change: '100% active ledger sync',
      icon: TrendingUp,
      color: 'text-indigo-400',
      gradient: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
      border: 'border-indigo-500/20',
      badge: 'Prisma ORM',
    },
    {
      title: 'Critical Stock Alerts',
      value: kpis ? kpis.low_stock_count.toString() : '0',
      change: lowStockProducts.length > 0 ? 'Requires immediate restock' : 'All thresholds optimal',
      icon: AlertTriangle,
      color: lowStockProducts.length > 0 ? 'text-amber-400' : 'text-slate-400',
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
      border: lowStockProducts.length > 0 ? 'border-amber-500/30' : 'border-slate-800',
      badge: 'BullMQ',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3" /> Delivered</span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"><Truck className="w-3 h-3" /> In Transit</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30"><Clock className="w-3 h-3" /> Processing</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Confirmed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30"><RotateCcw className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Telemetry Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-purple-950/50 border border-blue-500/20 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
            <Zap className="w-6 h-6 animate-pulse text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Real-Time Ingestion Queue Active
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                BullMQ Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current intake velocity:{' '}
              <span className="text-white font-mono font-semibold">
                {velocity?.average_velocity_per_hour || 0} orders / hr
              </span>
              . Peak traffic window: <span className="text-slate-300">{velocity?.peak_hour || '14:00 - 15:00 IST'}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {onQuickSimulateOrder && (
            <button
              onClick={onQuickSimulateOrder}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <span>Simulate Order Dispatch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onNavigateToAnalytics}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 transition flex items-center gap-1"
          >
            <span>Telemetry</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.25 }}
              className={`p-5 rounded-2xl bg-gradient-to-b ${card.gradient} bg-slate-900/60 border ${card.border} backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300 shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-slate-800/80 text-slate-300 border border-slate-700/50">
                  {card.badge}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  {card.value}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                  <span className={card.color}>{card.change}</span>
                </div>
              </div>

              {/* Background ambient watermarks */}
              <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-20 h-20 text-white" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Orders (2 Cols) + Low Stock Watch (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Supply Orders Table */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Healthcare Supply Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live order queue processed by Express & Prisma</p>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Fulfillment View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-3.5">Order ID</th>
                  <th className="py-3 px-3.5">Hospital / Facility</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Total (INR ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No active orders found in the database.
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3.5 font-mono text-blue-400 font-bold">{order.orderNumber}</td>
                      <td className="py-3 px-3.5">
                        <div className="text-slate-200 font-medium">{order.customerName}</div>
                        <div className="text-[10.5px] text-slate-500 font-mono">{order.customerEmail}</div>
                      </td>
                      <td className="py-3 px-3.5">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Watchlist */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">Stock Watchlist</h3>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 text-xs text-center font-medium">
                All catalog items meet or exceed minimum safety stock levels.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-2 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10.5px] text-amber-400 font-bold">{p.sku}</span>
                      <p className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{p.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {p.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>

                  {/* Stock progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (p.stockQuantity / (p.minStockThreshold * 2)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>On hand: <strong className="text-white">{p.stockQuantity}</strong> units</span>
                    <span>Safety min: {p.minStockThreshold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
