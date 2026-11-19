'use client';

import React, { useState } from 'react';
import { Product } from '../types';
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateOrderModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    customerEmail: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
  }) => Promise<void>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  products,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (selectedItems.length > 1) {
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
    }
  };

  const updateItemRow = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  // Calculate live total amount
  const totalAmount = selectedItems.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    return sum + (prod ? prod.unitPrice * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMsg('Please enter customer name and valid email address.');
      return;
    }

    if (selectedItems.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMsg('All line items must select a product with quantity at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        notes: notes.trim() || undefined,
        items: selectedItems,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-semibold text-white">Create Enterprise Supply Order</h3>
            <p className="text-xs text-slate-400">Atomic inventory reservation & queue dispatch</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Hospital / Facility Name (India)</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Apollo Super Speciality Hospital (Bengaluru)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Procurement Email</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="procurement@apollohospitals.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Order Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name} (₹{p.unitPrice.toLocaleString('en-IN')}) [Stock: {p.stockQuantity}]
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      max={selectedProd ? selectedProd.stockQuantity : 9999}
                      value={item.quantity}
                      onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs text-white text-center focus:outline-none focus:border-blue-500"
                    />

                    <div className="w-28 text-right text-xs font-mono text-emerald-400 font-medium">
                      ₹{((selectedProd?.unitPrice || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={selectedItems.length <= 1}
                      className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Order Notes & Logistics Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Expedited cold-chain freight requested"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Total Calculation Display */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Estimated Total (INR ₹):</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Actions */}
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Reserving Stock...' : 'Confirm & Dispatch Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

