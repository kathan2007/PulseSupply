'use client';

import React, { useState } from 'react';
import { Product } from '../types';
import { X, ArrowUpDown, AlertCircle } from 'lucide-react';

interface AdjustStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productId: string, quantity: number, reason: string) => Promise<void>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [units, setUnits] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier Shipment Receipt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const calculatedNewStock =
    adjustmentType === 'ADD'
      ? product.stockQuantity + units
      : Math.max(0, product.stockQuantity - units);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (units <= 0) {
      setErrorMsg('Please specify a positive unit quantity.');
      return;
    }

    if (adjustmentType === 'DEDUCT' && units > product.stockQuantity) {
      setErrorMsg(`Cannot deduct ${units} units; currently on hand: ${product.stockQuantity}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const delta = adjustmentType === 'ADD' ? units : -units;
      await onSubmit(product.id, delta, reason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Stock adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-semibold text-white">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-400 font-mono">{product.sku} - {product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Action Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('ADD');
                  setReason('Supplier Shipment Receipt');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                  adjustmentType === 'ADD'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                + Restock / Inbound
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('DEDUCT');
                  setReason('Damaged / Expired stock write-off');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                  adjustmentType === 'DEDUCT'
                    ? 'bg-red-600/20 border-red-500 text-red-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                - Deduct / Audit Write-off
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity to Adjust</label>
            <input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Adjustment Reason / Reference</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Current vs New Stock Summary */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Current Stock:</span>
              <span className="font-mono text-white font-semibold text-sm">{product.stockQuantity} units</span>
            </div>
            <div className="flex items-center text-slate-600">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Projected Stock:</span>
              <span className={`font-mono font-semibold text-sm ${
                calculatedNewStock <= product.minStockThreshold ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {calculatedNewStock} units
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

