'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Layers,
  AlertTriangle,
  Zap,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  KPISummary,
  SalesTrendPoint,
  InventoryCategoryMetric,
  StockAlert,
  OrderVelocity,
} from '../types';

interface AnalyticsViewProps {
  kpis: KPISummary | null;
  salesTrends: SalesTrendPoint[];
  inventoryCategories: InventoryCategoryMetric[];
  stockAlerts: StockAlert[];
  velocity: OrderVelocity | null;
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
        <div className="font-bold text-white mb-1.5">{label}</div>
        <div className="text-emerald-400 font-mono font-semibold">
          Revenue: ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-blue-400 font-mono font-semibold">
          Orders: {payload[1]?.value} orders
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1">
        <div className="font-bold text-white">{payload[0].name}</div>
        <div className="text-emerald-400 font-mono font-semibold">
          Valuation: ₹{Number(payload[0].value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  kpis,
  salesTrends,
  inventoryCategories,
  stockAlerts,
  velocity,
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const totalInventoryVal = inventoryCategories.reduce((s, c) => s + c.valuation, 0);

  const metricsCards = [
    {
      title: 'Average Order Value (AOV)',
      value: `₹${(kpis?.average_order_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-blue-400',
      gradient: 'from-blue-500/10 to-transparent',
      badge: 'Calculated',
    },
    {
      title: 'Order Fulfillment Rate',
      value: `${(kpis?.fulfillment_rate || 0).toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/10 to-transparent',
      badge: 'Delivered / Total',
    },
    {
      title: '24h Ingestion Volume',
      value: `${velocity?.orders_last_24h || 0} orders`,
      icon: Zap,
      color: 'text-purple-400',
      gradient: 'from-purple-500/10 to-transparent',
      badge: 'Redis Stream',
    },
    {
      title: 'Catalog Asset Valuation',
      value: `₹${totalInventoryVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: Layers,
      color: 'text-amber-400',
      gradient: 'from-amber-500/10 to-transparent',
      badge: 'Real-Time Total',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Timeframe Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Analytics & Report Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Python FastAPI background calculation engine with Redis BullMQ worker queue
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['24h', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                timeframe === t
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-5 rounded-2xl bg-gradient-to-b ${card.gradient} bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                  {card.badge}
                </span>
              </div>
              <div className="mt-3 text-2xl font-black font-mono text-white tracking-tight">
                {card.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row 1: 7-Day Revenue Trend + Category Valuation Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Order Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Revenue & Ingestion Volume Trend</h3>
              <p className="text-xs text-slate-400">Daily gross revenue (INR ₹) vs incoming hospital order volume</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FastAPI Aggregated</span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue (INR ₹)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="order_count"
                  name="Order Volume"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#ordersGrad)"
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Valuation Donut */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Valuation Breakdown</h3>
            <p className="text-xs text-slate-400">Total assets by clinical category</p>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="valuation"
                  nameKey="category"
                >
                  {inventoryCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Assets</span>
              <span className="text-xs font-mono font-bold text-white">
                ₹{(totalInventoryVal / 100000).toFixed(1)}L
              </span>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
            {inventoryCategories.map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate max-w-[140px] font-medium">{cat.category}</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{(cat.valuation / 100000).toFixed(1)}L
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Category Volume + Live Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Volume Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Units On-Hand by Clinical Category</h3>
            <p className="text-xs text-slate-400">Total physical unit count residing in logistics hubs</p>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryCategories} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="total_stock" name="Units On-Hand" radius={[6, 6, 0, 0]}>
                  {inventoryCategories.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Alerts & Queue Velocity Stream */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">BullMQ Alerts Stream</h3>
              <p className="text-xs text-slate-400">Real-time low stock events</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1">
            {stockAlerts.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-xs text-center font-medium">
                No active threshold alerts.
              </div>
            ) : (
              stockAlerts.map((alert) => (
                <div
                  key={alert.product_id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] text-amber-400 font-bold">{alert.sku}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${
                        alert.status === 'OUT_OF_STOCK'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {alert.status === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium leading-tight truncate">{alert.name}</p>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Stock: <strong className="text-white">{alert.current_stock}</strong></span>
                    <span>Safety min: {alert.threshold}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Queue Velocity Metrics Block */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Orders Past Hour:</span>
              <span className="font-mono text-purple-400 font-bold">{velocity?.orders_last_hour || 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Past 24 Hours Intake:</span>
              <span className="font-mono text-blue-400 font-bold">{velocity?.orders_last_24h || 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Avg Ingestion Velocity:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {velocity?.average_velocity_per_hour?.toFixed(2) || '0.00'} / hr
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
