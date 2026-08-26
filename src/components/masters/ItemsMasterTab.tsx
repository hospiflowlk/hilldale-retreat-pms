import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Package, 
  ChefHat, 
  Briefcase,
  Plus, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  TrendingUp, 
  SlidersHorizontal,
  Check,
  X,
  Scale,
  DollarSign,
  Download,
  Upload,
  FileSpreadsheet,
  MoreVertical,
  FileCode,
  FileJson
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterItem, ItemType } from '../../types';
import { NewItemModal } from './NewItemModal';
import { ImportItemsModal } from './ImportItemsModal';
import { BOMBuilderModal } from './BOMBuilderModal';
import { exportMasterItemsToExcel, exportMasterItemsToJSON, parseItemsFromJSON } from '../../utils/excelItemUtils';
import { useItems, useCategories } from '../../hooks/useMasters';

export const ItemsMasterTab: React.FC = () => {
  const { formatCurrency } = useApp();
  
  // React Query Hooks
  const { data: masterItems = [], isLoading } = useItems.useGetAll();
  const { data: masterCategories = [] } = useCategories.useGetAll();
  const deleteItemMut = useItems.useDelete();
  const deleteAllItemsMut = useItems.useDeleteAll();
  const createItemMut = useItems.useCreate();
  const updateItemMut = useItems.useUpdate();
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAll = () => {
    setActionError(null);
    if (masterItems.length === 0) return;
    if (window.confirm(`⚠️ DANGER ZONE: Are you sure you want to delete ALL ${masterItems.length} items from the master catalog? This action cannot be undone.`)) {
      const confirmText = window.prompt(`Type "DELETE ALL" to confirm wiping all ${masterItems.length} items:`);
      if (confirmText === 'DELETE ALL') {
        deleteAllItemsMut.mutate(undefined, {
          onError: (err: any) => setActionError(err.message || 'Failed to delete all items.')
        });
      }
    }
  };

  const handleJSONFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const jsonItems = await parseItemsFromJSON(file);
      if (window.confirm(`Found ${jsonItems.length} items in JSON backup. Do you want to import them into your master catalog?`)) {
        let count = 0;
        for (const item of jsonItems) {
          await createItemMut.mutateAsync({
            name: item.name,
            type: item.type,
            categoryName: item.categoryName,
            unit: item.unit,
            costPriceUSD: item.costPriceUSD,
            sellingPriceUSD: item.sellingPriceUSD,
            currentStock: item.currentStock,
            reorderThreshold: item.reorderThreshold,
            useInInvoices: item.useInInvoices,
            useInExpenses: item.useInExpenses,
            showInPos: item.showInPos,
            sortOrder: item.sortOrder,
            bom: item.bom,
            description: item.description,
            barcode: item.barcode,
            isAvailable: item.isAvailable !== false
          });
          count++;
        }
        alert(`Successfully imported ${count} items from JSON backup!`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to parse JSON backup file.');
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'RAW' | 'RESALE' | 'RECIPE' | 'EXPENSE' | 'LOW_STOCK'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBOMItemId, setExpandedBOMItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedRecipeForBOM, setSelectedRecipeForBOM] = useState<MasterItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<MasterItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Stock Adjustment Dialog State
  const [stockAdjustItem, setStockAdjustItem] = useState<MasterItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [sortBy, setSortBy] = useState<'EXCEL' | 'NAME_ASC' | 'CATEGORY' | 'PRICE_DESC' | 'STOCK_ASC'>('EXCEL');

  // KPI count metrics
  const rawCount = useMemo(() => masterItems.filter(i => i.type === 'RAW' || i.type === 'RAW_MATERIAL').length, [masterItems]);
  const resaleCount = useMemo(() => masterItems.filter(i => i.type === 'RESALE').length, [masterItems]);
  const recipeCount = useMemo(() => masterItems.filter(i => i.type === 'RECIPE').length, [masterItems]);
  const expenseCount = useMemo(() => masterItems.filter(i => i.type === 'EXPENSE').length, [masterItems]);

  const lowStockItems = useMemo(() => {
    return masterItems.filter(i => (i.type === 'RAW' || i.type === 'RESALE' || i.type === 'RAW_MATERIAL') && i.reorderThreshold > 0 && i.currentStock <= i.reorderThreshold);
  }, [masterItems]);

  const filteredItems = useMemo(() => {
    const matched = masterItems.filter(item => {
      // Type / Low Stock Filter
      if (activeFilterTab === 'RAW' && item.type !== 'RAW' && item.type !== 'RAW_MATERIAL') return false;
      if (activeFilterTab === 'RESALE' && item.type !== 'RESALE') return false;
      if (activeFilterTab === 'RECIPE' && item.type !== 'RECIPE') return false;
      if (activeFilterTab === 'EXPENSE' && item.type !== 'EXPENSE') return false;
      if (activeFilterTab === 'LOW_STOCK') {
        if ((item.type !== 'RAW' && item.type !== 'RESALE' && item.type !== 'RAW_MATERIAL') || item.reorderThreshold <= 0 || item.currentStock > item.reorderThreshold) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Enhanced Multi-Token Search Query
      if (searchQuery.trim()) {
        const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
        const targetString = [
          item.name,
          item.categoryName,
          item.type,
          item.barcode || '',
          item.description || '',
          item.unit || '',
          item.sellingPriceUSD ? `$${item.sellingPriceUSD}` : '',
          item.sortOrder?.toString() || '',
          item.showInPos ? 'pos' : 'hidden'
        ].join(' ').toLowerCase();

        return tokens.every(token => targetString.includes(token));
      }

      return true;
    });

    return matched.sort((a, b) => {
      if (sortBy === 'EXCEL') {
        return (a.sortOrder || 0) - (b.sortOrder || 0) || (parseInt(a.id) || 0) - (parseInt(b.id) || 0);
      }
      if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'CATEGORY') {
        return (a.categoryName || '').localeCompare(b.categoryName || '');
      }
      if (sortBy === 'PRICE_DESC') {
        return b.sellingPriceUSD - a.sellingPriceUSD;
      }
      if (sortBy === 'STOCK_ASC') {
        return a.currentStock - b.currentStock;
      }
      return 0;
    });
  }, [masterItems, activeFilterTab, selectedCategory, searchQuery, sortBy]);

  const handleDelete = (item: MasterItem) => {
    setActionError(null);
    if (window.confirm(`Are you sure you want to delete item "${item.name}"?`)) {
      deleteItemMut.mutate(item.id, {
        onError: (err: any) => setActionError(err.message || 'Failed to delete item.')
      });
    }
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustItem) return;
    const delta = parseFloat(adjustAmount);
    if (isNaN(delta) || delta === 0) return;

    updateItemMut.mutate({
      id: stockAdjustItem.id,
      currentStock: stockAdjustItem.currentStock + delta
    });
    setStockAdjustItem(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setActiveFilterTab('ALL')}
          className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${activeFilterTab === 'ALL' ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Items</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{masterItems.length}</div>
          <div className="text-[10px] text-secondary mt-0.5">Catalog definitions</div>
        </div>

        <div 
          onClick={() => setActiveFilterTab('RAW')}
          className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${activeFilterTab === 'RAW' ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Raw Stock</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-serif text-emerald-800">{rawCount}</div>
          <div className="text-[10px] text-secondary mt-0.5">Pantry ingredients</div>
        </div>

        <div 
          onClick={() => setActiveFilterTab('RESALE')}
          className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${activeFilterTab === 'RESALE' ? 'border-sky-600 ring-1 ring-sky-600/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Direct Resale</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-serif text-sky-800">{resaleCount}</div>
          <div className="text-[10px] text-secondary mt-0.5">Direct retail stock</div>
        </div>

        <div 
          onClick={() => setActiveFilterTab('RECIPE')}
          className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${activeFilterTab === 'RECIPE' ? 'border-amber-600 ring-1 ring-amber-600/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recipes (BOM)</span>
            <ChefHat className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-800">{recipeCount}</div>
          <div className="text-[10px] text-secondary mt-0.5">Auto-deducted dishes</div>
        </div>

        <div 
          onClick={() => setActiveFilterTab('EXPENSE')}
          className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${activeFilterTab === 'EXPENSE' ? 'border-purple-600 ring-1 ring-purple-600/20' : 'border-border'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Non-Stock Exp.</span>
            <Briefcase className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-xl font-bold font-serif text-purple-900">{expenseCount}</div>
          <div className="text-[10px] text-secondary mt-0.5">Utilities, EPF, services</div>
        </div>

        <div 
          onClick={() => setActiveFilterTab('LOW_STOCK')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-2xs ${
            lowStockItems.length > 0
              ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
              : 'bg-white border-border'
          }`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              lowStockItems.length > 0 ? 'text-rose-700' : 'text-secondary'
            }`}>
              Low Stock Alerts
            </span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-rose-600 animate-pulse' : 'text-secondary'}`} />
          </div>
          <div className={`text-xl font-bold font-serif ${
            lowStockItems.length > 0 ? 'text-rose-700' : 'text-text'
          }`}>
            {lowStockItems.length}
          </div>
          <div className="text-[10px] text-secondary mt-0.5">
            {lowStockItems.length > 0 ? 'Items below reorder point' : 'All stock healthy'}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* Redesigned Executive Control Panel & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3.5">
        {/* Tier 1: Search Input & Category Filter & Sort & Primary Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Left: Search Bar & Dropdowns */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full">
            {/* Search Input Box */}
            <div className="relative flex-1 w-full min-w-[240px]">
              <Search className="w-4 h-4 text-secondary/70 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by name, category, barcode, SKU, or notes..."
                className="w-full bg-surface-muted/60 border border-border rounded-xl pl-10 pr-9 py-2 text-xs text-text placeholder-secondary/60 focus:outline-hidden focus:border-primary focus:bg-white transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-secondary hover:text-text p-0.5 rounded-full hover:bg-border/60 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-surface-muted/60 border border-border rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-hidden focus:border-primary focus:bg-white cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Categories ({masterCategories.length})</option>
                {masterCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `└─ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order Selector */}
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto bg-surface-muted/60 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text focus:outline-hidden focus:border-primary focus:bg-white cursor-pointer shadow-2xs"
                title="Sort item display order"
              >
                <option value="EXCEL">🔢 Custom Order (Excel No.)</option>
                <option value="NAME_ASC">🔤 Name (A - Z)</option>
                <option value="CATEGORY">📁 Master Category</option>
                <option value="PRICE_DESC">💵 Price (High to Low)</option>
                <option value="STOCK_ASC">📦 Stock Level</option>
              </select>
            </div>
          </div>

          {/* Hidden JSON File Input */}
          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleJSONFileSelected}
            accept=".json"
            className="hidden"
          />

          {/* Right: Actions Menu (Export, Import, JSON Backup, Delete All) & New Item */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto w-full sm:w-auto justify-end">
            <div className="relative" ref={actionsRef}>
              <button
                type="button"
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-muted text-text border border-border transition cursor-pointer shadow-2xs flex items-center gap-2"
                title="Catalog Import, Export & Reset Options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Catalog Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-secondary" />
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-white border border-border rounded-2xl shadow-xl overflow-hidden py-1.5 space-y-0.5">
                  <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary/70">
                    Excel Spreadsheets
                  </div>
                  <button
                    onClick={() => { exportMasterItemsToExcel(filteredItems); setIsActionsOpen(false); }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-muted transition flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => { setIsImportModalOpen(true); setIsActionsOpen(false); }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-muted transition flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-sky-700" />
                    <span>Import Excel (.xlsx)</span>
                  </button>

                  <div className="h-px bg-border/60 my-1" />

                  <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary/70">
                    Full JSON Backup (Lossless)
                  </div>
                  <button
                    onClick={() => { exportMasterItemsToJSON(masterItems); setIsActionsOpen(false); }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-muted transition flex items-center gap-2 text-left cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span>Export Full Backup (.json)</span>
                  </button>
                  <button
                    onClick={() => { jsonInputRef.current?.click(); setIsActionsOpen(false); }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-muted transition flex items-center gap-2 text-left cursor-pointer"
                  >
                    <FileJson className="w-4 h-4 text-purple-600" />
                    <span>Import Full Backup (.json)</span>
                  </button>

                  <div className="h-px bg-border/60 my-1" />

                  <button
                    onClick={() => { handleDeleteAll(); setIsActionsOpen(false); }}
                    disabled={masterItems.length === 0}
                    className="w-full px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition flex items-center gap-2 text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete All Items</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setItemToEdit(null); setIsModalOpen(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Item</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Classification Filter Tabs & Live Result Count */}
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilterTab === 'ALL'
                  ? 'bg-text text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-text'
              }`}
            >
              All ({masterItems.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('RAW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === 'RAW'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-text'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Raw Stock ({rawCount})</span>
            </button>
            <button
              onClick={() => setActiveFilterTab('RESALE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === 'RESALE'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-text'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct Resale ({resaleCount})</span>
            </button>
            <button
              onClick={() => setActiveFilterTab('RECIPE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === 'RECIPE'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-text'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Recipes (BOM) ({recipeCount})</span>
            </button>
            <button
              onClick={() => setActiveFilterTab('EXPENSE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === 'EXPENSE'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-text'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Non-Stock Exp. ({expenseCount})</span>
            </button>
            <button
              onClick={() => setActiveFilterTab('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === 'LOW_STOCK'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-surface-muted text-secondary hover:text-rose-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock ({lowStockItems.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-secondary font-medium shrink-0 ml-auto hidden sm:inline">
            Showing <strong className="text-text font-mono">{filteredItems.length}</strong> of {masterItems.length} items
          </span>
        </div>
      </div>

      {/* Items Table / Directory */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-secondary uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-3 text-center w-10">#</th>
                <th className="py-3.5 px-4">Item & Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-secondary">
                    <Package className="w-8 h-8 mx-auto text-secondary/40 mb-2" />
                    <p className="font-semibold text-text">No master items found</p>
                    <p className="text-xs mt-0.5">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isRecipe = item.type === 'RECIPE';
                  const isExpense = item.type === 'EXPENSE';
                  const isLowStock = !isRecipe && !isExpense && item.reorderThreshold > 0 && item.currentStock <= item.reorderThreshold;
                  const isExpanded = expandedBOMItemId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`hover:bg-surface-muted/30 transition group ${
                        isLowStock ? 'bg-rose-50/30' : ''
                      }`}>
                        {/* Sequence No */}
                        <td className="py-3.5 px-3 text-center font-mono text-[11px] font-semibold text-secondary/70">
                          {item.sortOrder || (idx + 1)}
                        </td>
                        {/* Item Name & Barcode */}
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isRecipe ? 'bg-amber-100 text-amber-800' : isExpense ? 'bg-slate-100 text-slate-700' : 'bg-primary-light text-primary'
                            }`}>
                              {isRecipe ? <ChefHat className="w-4 h-4" /> : isExpense ? <Briefcase className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-bold text-text block leading-tight">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-secondary">
                                {item.barcode && <span className="font-mono">{item.barcode}</span>}
                                {item.barcode && <span>•</span>}
                                <span>{item.unit}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-surface-muted text-text font-medium text-[11px] border border-border/60">
                            {item.categoryName}
                          </span>
                        </td>

                        {/* Type & POS Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isRecipe ? (
                              <>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Recipe (BOM)
                                </span>
                                <button
                                  onClick={() => setSelectedRecipeForBOM(item)}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Configure Recipe Ingredients"
                                >
                                  <ChefHat className="w-3 h-3" />
                                  <span>BOM ({item.bom?.length || 0})</span>
                                </button>
                              </>
                            ) : isExpense ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Non-Stock Exp.
                              </span>
                            ) : item.type === 'RAW' || item.type === 'RAW_MATERIAL' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Raw Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                Direct Resale
                              </span>
                            )}

                            {item.showInPos !== false ? (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300" title="Visible in POS Register">
                                POS
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase bg-surface-muted text-secondary/60 border border-border" title="Hidden from POS Register">
                                Hidden
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-secondary whitespace-nowrap">
                          ${item.costPriceUSD.toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-text whitespace-nowrap">
                          {item.sellingPriceUSD > 0 ? `$${item.sellingPriceUSD.toFixed(2)}` : <span className="text-secondary/50 font-normal">—</span>}
                        </td>

                        {/* Stock Level */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isRecipe ? (
                            <span className="text-[11px] text-amber-800 font-medium">Auto-deducted</span>
                          ) : isExpense ? (
                            <span className="text-[11px] text-purple-600 font-medium">N/A (Expense)</span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono font-bold ${
                                  isLowStock ? 'text-rose-700' : 'text-text'
                                }`}>
                                  {item.currentStock} {item.unit}
                                </span>
                                {isLowStock && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                                    LOW
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-secondary">
                                Reorder @ {item.reorderThreshold} {item.unit}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {isRecipe && (
                              <button
                                onClick={() => setSelectedRecipeForBOM(item)}
                                className="px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-300 transition cursor-pointer flex items-center gap-1"
                                title="Build Recipe Ingredients"
                              >
                                <ChefHat className="w-3 h-3" />
                                <span>Edit Recipe</span>
                              </button>
                            )}
                            {!isRecipe && !isExpense && (
                              <button
                                onClick={() => setStockAdjustItem(item)}
                                className="px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary-light rounded-lg border border-primary/30 transition cursor-pointer"
                                title="Adjust Stock Quantity"
                              >
                                ± Stock
                              </button>
                            )}
                            <button
                              onClick={() => { setItemToEdit(item); setIsModalOpen(true); }}
                              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Bill of Materials (BOM) Sub-Row for Recipe items */}
                      {isRecipe && isExpanded && item.bom && (
                        <tr className="bg-amber-50/50 border-b border-amber-200">
                          <td colSpan={8} className="p-4 sm:px-8">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                  <ChefHat className="w-3.5 h-3.5" />
                                  Bill of Materials (BOM) — Automatic Stock Deduction Formula
                                </span>
                                <span>{item.bom.length} Ingredients</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {item.bom.map((ing, bIdx) => (
                                  <div key={bIdx} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                                    <div>
                                      <span className="font-semibold text-text block">{ing.ingredientName}</span>
                                      <span className="text-[10px] text-secondary font-mono">
                                        Qty: <strong>{ing.quantity} {ing.unit}</strong> per {item.unit}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-amber-800 font-bold">
                                      ≈ ${((ing.costEstimateUSD || 0) * ing.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      <NewItemModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setItemToEdit(null); }}
        itemToEdit={itemToEdit}
        initialType={activeFilterTab === 'RECIPE' ? 'RECIPE' : activeFilterTab === 'EXPENSE' ? 'EXPENSE' : 'RESALE'}
      />

      {/* Excel Bulk Import Modal */}
      <ImportItemsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Quick Stock Adjustment Dialog */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h4 className="font-serif font-bold text-sm text-text">
                  Stock Adjustment: {stockAdjustItem.name}
                </h4>
              </div>
              <button onClick={() => setStockAdjustItem(null)} className="p-1 text-secondary hover:text-text rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="p-4 space-y-3">
              <div className="p-3 bg-surface-muted rounded-xl text-xs flex justify-between">
                <span className="text-secondary">Current Physical Stock:</span>
                <span className="font-mono font-bold text-text">{stockAdjustItem.currentStock} {stockAdjustItem.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase mb-1">
                  Quantity Adjustment (+ to add stock, - to write off)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. +10 or -2.5"
                  className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs font-mono text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Kitchen wastage, physical inventory count, spoilage"
                  className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustItem(null)}
                  className="px-3.5 py-1.5 text-xs text-secondary hover:text-text border border-border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-primary text-white hover:bg-[#4d5541] rounded-xl shadow-xs"
                >
                  Save Stock Delta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOM Builder Modal for Recipe Items */}
      <BOMBuilderModal
        isOpen={!!selectedRecipeForBOM}
        onClose={() => setSelectedRecipeForBOM(null)}
        recipeItem={selectedRecipeForBOM}
      />
    </div>
  );
};
