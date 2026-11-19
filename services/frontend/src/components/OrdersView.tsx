'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  CheckCircle,
  Truck,
  Clock,
  RotateCcw,
  Package,
  ArrowUpDown,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { Product } from '../types';
import { CreateOrderModal } from './CreateOrderModal';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  onCreateOrder: (data: any) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products,
  onCreateOrder,
  onUpdateStatus,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const statusOptions = [
    { value: 'ALL', label: 'All Orders', count: orders.length },
    { value: 'CONFIRMED', label: 'Confirmed', count: orders.filter((o) => o.status === 'CONFIRMED').length },
    { value: 'PROCESSING', label: 'Processing', count: orders.filter((o) => o.status === 'PROCESSING').length },
    { value: 'SHIPPED', label: 'Shipped', count: orders.filter((o) => o.status === 'SHIPPED').length },
    { value: 'DELIVERED', label: 'Delivered', count: orders.filter((o) => o.status === 'DELIVERED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: orders.filter((o) => o.status === 'CANCELLED').length },
  ];

  const nextStatuses: Record<string, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700 text-slate-300">Pending</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30"><RotateCcw className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Order Fulfillment Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Atomic stock reservation ledger with BullMQ background queue dispatch
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Supply Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-blue-700/60 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, hospital or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />Order ID</span>
                </th>
                <th className="py-3 px-4">Facility Name & Procurement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total (INR ₹)</th>
                <th className="py-3 px-4 text-center">Lifecycle Advancement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span className="text-sm">No orders found matching your criteria</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${
                          isExpanded ? 'bg-slate-800/30' : ''
                        }`}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-400 font-bold">{order.orderNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.id, order.orderNumber);
                              }}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                              title="Copy order number"
                            >
                              {copiedId === order.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-semibold">{order.customerName}</div>
                          <div className="text-[10.5px] text-slate-500 font-mono">{order.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          <div className="flex items-center gap-1">
                            <span>{order.items.length} line(s)</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {nextStatuses[order.status]?.map((ns) => (
                              <button
                                key={ns}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(order.id, ns);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition shadow-sm ${
                                  ns === 'CANCELLED'
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                                    : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                                }`}
                              >
                                → {ns}
                              </button>
                            ))}
                            {nextStatuses[order.status]?.length === 0 && (
                              <span className="text-[10.5px] text-slate-500 font-mono">Terminal State</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expandable Order Detail View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-slate-800/80">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-6 py-4 bg-slate-950/70 space-y-3"
                              >
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                  <span>Breakdown for {order.orderNumber}</span>
                                  {order.notes && (
                                    <span className="italic text-slate-300">
                                      Logistics Note: {order.notes}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-blue-400 font-bold">{item.product?.sku}</span>
                                        <span className="text-white font-medium">{item.product?.name}</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-medium">
                                          {item.product?.category}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-6 font-mono text-xs">
                                        <span className="text-slate-400">Qty: <strong className="text-white">{item.quantity}</strong></span>
                                        <span className="text-slate-400">@ ₹{item.unitPrice.toLocaleString('en-IN')}</span>
                                        <span className="text-emerald-400 font-bold">
                                          = ₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products.filter((p) => p.stockQuantity > 0 && p.status === 'ACTIVE')}
        onSubmit={onCreateOrder}
      />
    </div>
  );
};
