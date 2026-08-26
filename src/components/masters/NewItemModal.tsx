import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Package, 
  ChefHat, 
  Briefcase,
  Plus, 
  Trash2, 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  Check, 
  Tag, 
  Info,
  Scale,
  Folder
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterItem, ItemType, UnitOfMeasure, BOMIngredient } from '../../types';
import { SearchableDropdown } from '../ui/SearchableDropdown';
import { useItems, useCategories } from '../../hooks/useMasters';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: MasterItem | null;
  initialType?: ItemType;
}

const UNITS_OF_MEASURE: { value: UnitOfMeasure; label: string }[] = [
  { value: 'pcs', label: 'pcs' },
  { value: 'ml', label: 'ml' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'bottle', label: 'bottle' },
  { value: 'shot', label: 'shot' },
  { value: 'unit', label: 'unit' },
];

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  initialType = 'RESALE'
}) => {
  const { data: masterCategories = [] } = useCategories.useGetAll();
  const { data: masterItems = [] } = useItems.useGetAll();
  const createItemMut = useItems.useCreate();
  const updateItemMut = useItems.useUpdate();

  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>(initialType);
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>('pcs');
  const [costPriceUSD, setCostPriceUSD] = useState('');
  const [sellingPriceUSD, setSellingPriceUSD] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [showInPos, setShowInPos] = useState(true);
  const [bom, setBom] = useState<BOMIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Available raw ingredients for BOM (excluding the item itself and other recipes)
  const availableRawIngredients = useMemo(() => {
    return masterItems.filter(i => i.id !== itemToEdit?.id && i.type === 'RESALE');
  }, [masterItems, itemToEdit]);

  const categoryOptions = useMemo(() => {
    return masterCategories.map((cat) => ({
      value: cat.id,
      label: `${cat.name} (${cat.type})`,
      group: cat.type,
      isChild: !!cat.parentId,
      icon: <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
    }));
  }, [masterCategories]);

  // Computed BOM Cost
  const computedBOMCost = useMemo(() => {
    if (type !== 'RECIPE' || bom.length === 0) return 0;
    return bom.reduce((sum, ing) => {
      const raw = masterItems.find(m => m.id === ing.ingredientItemId);
      if (!raw) return sum + (ing.costEstimateUSD || 0);

      // Unit conversion cost estimation
      let unitCost = raw.costPriceUSD;
      if (raw.unit === 'kg' && ing.unit === 'g') unitCost = raw.costPriceUSD / 1000;
      if (raw.unit === 'g' && ing.unit === 'kg') unitCost = raw.costPriceUSD * 1000;

      return sum + (unitCost * ing.quantity);
    }, 0);
  }, [type, bom, masterItems]);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setType(itemToEdit.type);
      setCategoryId(itemToEdit.categoryId);
      setUnit(itemToEdit.unit);
      setCostPriceUSD(String(itemToEdit.costPriceUSD));
      setSellingPriceUSD(String(itemToEdit.sellingPriceUSD));
      setCurrentStock(String(itemToEdit.currentStock));
      setReorderThreshold(String(itemToEdit.reorderThreshold));
      setDescription(itemToEdit.description || '');
      setBarcode(itemToEdit.barcode || '');
      setIsAvailable(itemToEdit.isAvailable !== false);
      setShowInPos(itemToEdit.showInPos !== false);
      setBom(itemToEdit.bom || []);
    } else {
      setName('');
      setType(initialType);
      
      // Auto-pick suitable category based on initialType
      const defaultCat = initialType === 'EXPENSE'
        ? masterCategories.find(c => c.type === 'EXPENSE') || masterCategories[0]
        : masterCategories[0];
      setCategoryId(defaultCat?.id || '');

      setUnit('pcs');
      setCostPriceUSD('');
      setSellingPriceUSD('');
      setCurrentStock(initialType === 'RECIPE' ? '999' : initialType === 'EXPENSE' ? '0' : '10');
      setReorderThreshold(initialType === 'RECIPE' ? '0' : initialType === 'EXPENSE' ? '0' : '5');
      setDescription('');
      setBarcode('');
      setIsAvailable(true);
      setShowInPos(initialType === 'RECIPE' || initialType === 'RESALE');
      setBom([]);
    }
    setError(null);
  }, [itemToEdit, initialType, isOpen, masterCategories]);

  // Auto-update cost price when BOM changes if user hasn't explicitly overridden
  useEffect(() => {
    if (type === 'RECIPE' && computedBOMCost > 0) {
      setCostPriceUSD(computedBOMCost.toFixed(2));
    }
  }, [computedBOMCost, type]);

  if (!isOpen) return null;

  const handleAddBOMIngredient = () => {
    if (availableRawIngredients.length === 0) return;
    const defaultRaw = availableRawIngredients[0];
    const newIng: BOMIngredient = {
      ingredientItemId: defaultRaw.id,
      ingredientName: defaultRaw.name,
      quantity: 1,
      unit: defaultRaw.unit,
      costEstimateUSD: defaultRaw.costPriceUSD
    };
    setBom(prev => [...prev, newIng]);
  };

  const handleUpdateBOMIngredient = (index: number, updates: Partial<BOMIngredient>) => {
    setBom(prev => {
      const next = [...prev];
      const current = next[index];
      
      if (updates.ingredientItemId && updates.ingredientItemId !== current.ingredientItemId) {
        const raw = masterItems.find(m => m.id === updates.ingredientItemId);
        if (raw) {
          next[index] = {
            ...current,
            ingredientItemId: raw.id,
            ingredientName: raw.name,
            unit: raw.unit,
            costEstimateUSD: raw.costPriceUSD,
            ...updates
          };
          return next;
        }
      }

      next[index] = { ...current, ...updates };
      return next;
    });
  };

  const handleRemoveBOMIngredient = (index: number) => {
    setBom(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an item name.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const costNum = parseFloat(costPriceUSD) || 0;
    const sellNum = parseFloat(sellingPriceUSD) || 0;
    const stockNum = parseFloat(currentStock) || 0;
    const reorderNum = parseFloat(reorderThreshold) || 0;

    if (type === 'RECIPE' && bom.length === 0) {
      setError('Recipe items must have at least one ingredient in their Bill of Materials (BOM).');
      return;
    }

    const isExpense = type === 'EXPENSE';
    const isRecipe = type === 'RECIPE';

    const itemData = {
      name: name.trim(),
      type,
      categoryId,
      categoryName: masterCategories.find(c => c.id === categoryId)?.name || 'General',
      unit,
      costPriceUSD: costNum,
      sellingPriceUSD: (type === 'RAW' || type === 'RAW_MATERIAL') ? 0 : sellNum,
      currentStock: isExpense ? 0 : stockNum,
      reorderThreshold: isExpense ? 0 : reorderNum,
      isAvailable,
      showInPos,
      bom: isRecipe ? bom : undefined,
      description: description.trim() || undefined,
      barcode: barcode.trim() || undefined
    };

    if (itemToEdit) {
      updateItemMut.mutate({ id: itemToEdit.id, ...itemData });
    } else {
      createItemMut.mutate(itemData as any);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              type === 'RECIPE' ? 'bg-amber-700' : type === 'EXPENSE' ? 'bg-slate-700' : 'bg-primary'
            }`}>
              {type === 'RECIPE' ? <ChefHat className="w-5 h-5" /> : type === 'EXPENSE' ? <Briefcase className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                {itemToEdit ? 'Edit Master Item' : 'Create Master Item'}
              </h3>
              <p className="text-xs text-secondary">
                {type === 'RECIPE' 
                  ? 'Prepared dish with Bill of Materials ingredient deduction' 
                  : type === 'EXPENSE'
                  ? 'Non-stock operational overhead, utility, fuel, stationery, EPF/ETF or service'
                  : 'Resale item or raw ingredient with physical stock tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type Toggle: 4 Classifications */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Item Classification & Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('RAW')}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  type === 'RAW' || type === 'RAW_MATERIAL'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-white border-border text-secondary hover:text-text hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-[11px] font-bold">RAW STOCK</span>
                </div>
                <div className="text-[10px] opacity-80 leading-tight">Pantry ingredients bought, not sold on POS</div>
              </button>

              <button
                type="button"
                onClick={() => setType('RESALE')}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  type === 'RESALE'
                    ? 'bg-sky-50 border-sky-600 text-sky-900 shadow-xs'
                    : 'bg-white border-border text-secondary hover:text-text hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="text-[11px] font-bold">DIRECT RESALE</span>
                </div>
                <div className="text-[10px] opacity-80 leading-tight">Products bought & sold as-is on POS</div>
              </button>

              <button
                type="button"
                onClick={() => setType('RECIPE')}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  type === 'RECIPE'
                    ? 'bg-amber-50 border-amber-700 text-amber-900 shadow-xs'
                    : 'bg-white border-border text-secondary hover:text-text hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="text-[11px] font-bold">RECIPE (BOM)</span>
                </div>
                <div className="text-[10px] opacity-80 leading-tight">Prepared dish with ingredient deduction</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  const expCat = masterCategories.find(c => c.type === 'EXPENSE');
                  if (expCat) setCategoryId(expCat.id);
                }}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  type === 'EXPENSE'
                    ? 'bg-purple-50 border-purple-700 text-purple-900 shadow-xs'
                    : 'bg-white border-border text-secondary hover:text-text hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="text-[11px] font-bold">NON-STOCK EXP.</span>
                </div>
                <div className="text-[10px] opacity-80 leading-tight">Utilities, EPF, services, no inventory</div>
              </button>
            </div>
          </div>

          {/* Item Name & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Item / Service Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'EXPENSE' ? 'e.g. Electricity (CEB), Petrol 92 Octane, EPF/ETF, A4 Paper' : 'e.g. Grilled Chicken Breast, Coke Can, Ceylon Tea Leaves'}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Barcode / SKU (Optional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 5449000000996"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Master Category *
              </label>
              <SearchableDropdown
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Search category..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Unit of Measure *
              </label>
              <select
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              >
                {UNITS_OF_MEASURE.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Section (Dynamically adapted for EXPENSE vs RESALE vs RECIPE) */}
            <div className="p-4 rounded-xl bg-surface-muted/40 border border-border space-y-3">
              <div className="text-xs font-bold text-text uppercase tracking-wider flex items-center justify-between">
                <span>Financial Pricing & Margin</span>
                {type === 'RECIPE' && (
                  <span className="text-[11px] font-normal text-amber-800">
                    BOM Cost Estimate: <strong>${computedBOMCost.toFixed(2)}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                    Cost Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-secondary text-xs">$</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={costPriceUSD}
                      onChange={(e) => setCostPriceUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-border rounded-xl pl-7 pr-3 py-2 text-xs text-text font-mono focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                    Selling Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-secondary text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPriceUSD}
                      onChange={(e) => setSellingPriceUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-border rounded-xl pl-7 pr-3 py-2 text-xs text-text font-mono font-bold focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                    Gross Margin
                  </label>
                  <div className="py-2 px-3 rounded-xl bg-white border border-border text-xs font-mono font-bold text-primary flex items-center justify-between">
                    <span>
                      {parseFloat(sellingPriceUSD) > 0 && parseFloat(costPriceUSD) >= 0
                        ? `${(((parseFloat(sellingPriceUSD) - (parseFloat(costPriceUSD) || 0)) / parseFloat(sellingPriceUSD)) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </span>
                    <span className="text-[10px] font-normal text-secondary">
                      +${(Math.max(0, (parseFloat(sellingPriceUSD) || 0) - (parseFloat(costPriceUSD) || 0))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Stock & Reorder Threshold Alert (Only for RESALE & RECIPE, hidden for EXPENSE) */}
          {type !== 'EXPENSE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Current Stock Level ({unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text font-mono focus:outline-hidden focus:border-primary focus:bg-white transition"
                />
                <p className="text-[11px] text-secondary mt-1">
                  {type === 'RECIPE' ? 'Virtual indicator for prepared dishes.' : 'Physical count in pantry / kitchen storage.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Reorder Level (Low Stock Alert)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={reorderThreshold}
                  onChange={(e) => setReorderThreshold(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text font-mono focus:outline-hidden focus:border-primary focus:bg-white transition"
                />
                <p className="text-[11px] text-secondary mt-1">
                  Triggers visual low-stock warning when current stock falls at or below this level.
                </p>
              </div>
            </div>
          )}

          {/* BILL OF MATERIALS (BOM) BUILDER FOR RECIPE ITEMS */}
          {type === 'RECIPE' && (
            <div className="border border-amber-200 rounded-2xl bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Bill of Materials (BOM) — Ingredients Recipe
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddBOMIngredient}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <p className="text-[11px] text-amber-900/80">
                When this recipe item is ordered on the POS, the specified ingredient quantities will be automatically deducted from inventory in real-time.
              </p>

              {bom.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-amber-300 text-center text-xs text-amber-900/70">
                  No ingredients added yet. Click "+ Add Ingredient" to build the recipe formula.
                </div>
              ) : (
                <div className="space-y-2">
                  {bom.map((ing, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center gap-2 shadow-2xs">
                      {/* Ingredient Item Selector */}
                      <select
                        value={ing.ingredientItemId}
                        onChange={(e) => handleUpdateBOMIngredient(idx, { ingredientItemId: e.target.value })}
                        className="flex-1 bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-hidden focus:border-amber-700"
                      >
                        {availableRawIngredients.map((raw) => (
                          <option key={raw.id} value={raw.id}>
                            {raw.name} (${raw.costPriceUSD.toFixed(2)}/{raw.unit})
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={ing.quantity}
                        onChange={(e) => handleUpdateBOMIngredient(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="Qty"
                        className="w-20 bg-surface-muted border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text focus:outline-hidden"
                      />

                      {/* Unit */}
                      <select
                        value={ing.unit}
                        onChange={(e) => handleUpdateBOMIngredient(idx, { unit: e.target.value as UnitOfMeasure })}
                        className="w-24 bg-surface-muted border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-hidden"
                      >
                        {UNITS_OF_MEASURE.map((u) => (
                          <option key={u.value} value={u.value}>{u.value}</option>
                        ))}
                      </select>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBOMIngredient(idx)}
                        className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Description & Guest Menu Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavor notes, portion size, dietary notes, or storage instructions..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Toggles: Availability & POS Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted/40 border border-border">
              <div>
                <span className="text-xs font-bold text-text block">Active Item</span>
                <span className="text-[10px] text-secondary font-medium">General active status in catalog.</span>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-200/80">
              <div>
                <span className="text-xs font-bold text-amber-950 block">Show in POS Register</span>
                <span className="text-[10px] text-amber-800 font-medium">Display on POS cashier screen.</span>
              </div>
              <input
                type="checkbox"
                checked={showInPos}
                onChange={(e) => setShowInPos(e.target.checked)}
                className="w-4 h-4 accent-amber-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted border border-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Save Item' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
