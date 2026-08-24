import React from 'react';
import { 
  Layers, 
  Package, 
  Building2, 
  Users, 
  FolderTree, 
  Globe, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MastersSubTab } from '../../types';
import { ItemsMasterTab } from './ItemsMasterTab';
import { SuppliersMasterTab } from './SuppliersMasterTab';
import { CustomersMasterTab } from './CustomersMasterTab';
import { CategoriesMasterTab } from './CategoriesMasterTab';
import { BusinessSourcesTab } from './BusinessSourcesTab';
import { useItems, useSuppliers, useCustomers, useCategories, useBusinessSources } from '../../hooks/useMasters';

export const MastersView: React.FC = () => {
  const { mastersSubTab, setMastersSubTab } = useApp();

  const { data: masterItems = [] } = useItems.useGetAll();
  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const { data: masterCustomers = [] } = useCustomers.useGetAll();
  const { data: masterCategories = [] } = useCategories.useGetAll();
  const { data: masterBusinessSources = [] } = useBusinessSources.useGetAll();

  const lowStockCount = masterItems.filter(i => i.type === 'RESALE' && (i.reorderThreshold ?? 0) > 0 && (i.currentStock ?? 0) <= (i.reorderThreshold ?? 0)).length;

  const SUB_TABS: { id: MastersSubTab; label: string; icon: React.FC<{ className?: string }>; count?: number; badgeVariant?: 'alert' | 'neutral' }[] = [
    { 
      id: 'items', 
      label: 'Items & BOM', 
      icon: Package, 
      count: masterItems.length,
      badgeVariant: lowStockCount > 0 ? 'alert' : 'neutral'
    },
    { 
      id: 'suppliers', 
      label: 'Suppliers & AP Ledger', 
      icon: Building2, 
      count: masterSuppliers.length 
    },
    { 
      id: 'customers', 
      label: 'Customers & CRM', 
      icon: Users, 
      count: masterCustomers.length 
    },
    { 
      id: 'categories', 
      label: 'Categories (P&L)', 
      icon: FolderTree, 
      count: masterCategories.length 
    },
    { 
      id: 'sources', 
      label: 'Business Sources', 
      icon: Globe, 
      count: masterBusinessSources.length 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Core Reference Data & Catalogs
          </span>
          <h2 className="text-2xl font-bold font-serif text-text">
            Masters Management
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Single source of truth for items (with BOM & stock deduction), suppliers & AP ledgers, customer CRM, P&L category trees, and channel sources.
          </p>
        </div>

        {/* Low stock alert badge if any */}
        {lowStockCount > 0 && (
          <div className="text-xs bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-rose-800 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">{lowStockCount} Items Low in Stock</span>
              <span className="text-[11px] block text-rose-700">Check Items & BOM for restocking</span>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="border-b border-border bg-white rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mastersSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setMastersSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-text hover:bg-surface-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.badgeVariant === 'alert' && lowStockCount > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-surface-muted text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Sub-Tab Content */}
      <div>
        {mastersSubTab === 'items' && <ItemsMasterTab />}
        {mastersSubTab === 'suppliers' && <SuppliersMasterTab />}
        {mastersSubTab === 'customers' && <CustomersMasterTab />}
        {mastersSubTab === 'categories' && <CategoriesMasterTab />}
        {mastersSubTab === 'sources' && <BusinessSourcesTab />}
      </div>
    </div>
  );
};
