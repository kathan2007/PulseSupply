'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'info' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const type = toast.type || 'success';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 ${
                type === 'success'
                  ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                  : type === 'warning'
                  ? 'bg-slate-900/95 border-amber-500/30 text-white'
                  : type === 'error'
                  ? 'bg-slate-900/95 border-red-500/30 text-white'
                  : 'bg-slate-900/95 border-blue-500/30 text-white'
              }`}
            >
              {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-100">{toast.title}</div>
                {toast.message && (
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-500 hover:text-slate-300 p-0.5 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

