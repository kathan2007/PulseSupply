'use client';

import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Sparkles,
  Command,
  PlusCircle,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isLoading: boolean;
  onQuickSimulateOrder?: () => void;
  onOpenCreateOrder?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isLoading,
  onQuickSimulateOrder,
  onOpenCreateOrder,
}) => {
  return (
    <header className="h-16 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title & Path */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
          <span className="text-slate-600">/</span>
          <span className="text-[11px] text-slate-400 font-medium">India Region (BLR / DEL)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Simulate Button */}
        {onQuickSimulateOrder && (
          <button
            onClick={onQuickSimulateOrder}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold shadow-sm transition"
            title="Simulate a real-time hospital order dispatching BullMQ background jobs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Order Flow</span>
          </button>
        )}

        {/* Quick Create Order Button */}
        {onOpenCreateOrder && (
          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Order</span>
          </button>
        )}

        {/* Refresh Sync */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          title="Force Sync State Across Microservices"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* TLS Certificate Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono font-medium text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SSL 256-BIT</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white/10">
            PS
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">Priya Sharma</div>
            <div className="text-[10px] text-amber-400 font-medium leading-none">Operations Lead · India</div>
          </div>
        </div>
      </div>
    </header>
  );
};
