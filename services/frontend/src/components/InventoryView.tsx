'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  AlertTriangle,
  PenLine,
  Tag,
  ArrowUpDown,
  TrendingDown,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../types';
import { AdjustStockModal } from './AdjustStockModal';

interface InventoryViewProps {
  products: Product[];
  onAdjustStock: (productId: string, quantity: number, reason: string) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, onAdjustStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchLow = !lowStockOnly || p.stockQuantity <= p.minStockThreshold;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchLow && matchSearch;
  });

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stockQuantity > p.minStockThreshold).length,
    lowStock: products.filter((p) => p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0).length,
    outOfStock: products.filter((p) => p.stockQuantity === 0).length,
    totalValuation: products.reduce((acc, p) => acc + p.unitPrice * p.stockQuantity, 0),
  };

  const getStockHealthClass = (product: Product) => {
    if (product.stockQuantity === 0) return 'text-red-400';
    if (product.stockQuantity <= product.minStockThreshold) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getStockBar = (product: Product) => {
    const healthyMax = product.minStockThreshold * 3;
    const fillPct = Math.min(100, (product.stockQuantity / healthyMax) * 100);
    const color =
      product.stockQuantity === 0
        ? 'bg-red-500'
        : product.stockQuantity <= product.minStockThreshold
        ? 'bg-amber-400'
        : 'bg-emerald-400';
    return { fillPct, color };
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Medical Devices':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'PPE & Consumables':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Surgical Supplies':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Diagnostics':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Valuation Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Inventory & Stock Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL relational stock tracking with BullMQ automated restock alert dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-slate-400">Total Stock Asset Value: </span>
            <strong className="text-emerald-400 font-mono font-bold">
              ₹{stats.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'Active SKUs', value: stats.total, color: 'text-blue-400', icon: Layers, bg: 'bg-blue-500/10' },
          { label: 'Healthy Stock', value: stats.inStock, color: 'text-emerald-400', icon: ShieldCheck, bg: 'bg-emerald-500/10' },
          { label: 'Low / Threshold', value: stats.lowStock, color: 'text-amber-400', icon: AlertTriangle, bg: 'bg-amber-500/10' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-400', icon: AlertCircle, bg: 'bg-red-500/10' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between shadow-lg"
            >
              <div>
                <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</div>
              </div>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by SKU, product name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
            lowStockOnly
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Low Stock Filter</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />SKU ID</span>
                </th>
                <th className="py-3 px-4">Clinical Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Health & Threshold</th>
                <th className="py-3 px-4 text-right">Unit Price (INR ₹)</th>
                <th className="py-3 px-4 text-right">Stock Valuation</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product, idx) => {
                const { fillPct, color } = getStockBar(product);
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{product.sku}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-100 font-semibold">{product.name}</div>
                      {product.isLowStock && product.stockQuantity > 0 && (
                        <div className="flex items-center gap-1 text-[10.5px] text-amber-400 mt-0.5 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Below safety threshold
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${getCategoryBadgeClass(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden w-24">
                          <div
                            className={`${color} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold text-xs ${getStockHealthClass(product)}`}>
                          {product.stockQuantity}
                          {product.stockQuantity === 0 && (
                            <span className="ml-1 text-red-400 font-bold">(0)</span>
                          )}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">/ min {product.minStockThreshold}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      ₹{product.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ₹{(product.unitPrice * product.stockQuantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsAdjustModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-blue-600 hover:border-blue-500 text-slate-300 hover:text-white text-[11px] font-semibold transition mx-auto shadow-sm"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        product={selectedProduct}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={onAdjustStock}
      />
    </div>
  );
};
