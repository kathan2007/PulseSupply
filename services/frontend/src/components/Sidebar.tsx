'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  LineChart,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'orders' | 'inventory' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'orders' | 'inventory' | 'analytics') => void;
  orderCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  orderCount = 0,
  lowStockCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Command',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'orders',
      label: 'Orders & Fulfillment',
      icon: ShoppingCart,
      badge: orderCount > 0 ? orderCount : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: LineChart,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight leading-none">PulseSupply</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">
                Healthcare Logistics · India
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Operations & Supply
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border border-blue-500/30 shadow-md shadow-blue-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 group-hover:text-slate-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
