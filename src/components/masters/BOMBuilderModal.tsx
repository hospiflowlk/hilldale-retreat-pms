import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CookingPot, DollarSign, Scale, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { MasterItem, BOMIngredient, UnitOfMeasure } from '../../types';
import { useItems } from '../../hooks/useMasters';

interface BOMBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeItem: MasterItem | null;
}

export const BOMBuilderModal: React.FC<BOMBuilderModalProps> = ({
  isOpen,
  onClose,
  recipeItem,
}) => {
  const { data: allItems = [] } = useItems.useGetAll();
  const updateItemMut = useItems.useUpdate();

  // Ingredients usable in BOM (RAW and RESALE items)
  const availableIngredients = allItems.filter(
    i => i.id !== recipeItem?.id && (i.type === 'RAW' || i.type === 'RESALE' || i.type === 'RAW_MATERIAL')
  );

  const [ingredients, setIngredients] = useState<BOMIngredient[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (recipeItem && recipeItem.bom) {
      setIngredients(recipeItem.bom);
    } else {
      setIngredients([]);
    }
  }, [recipeItem]);

  if (!isOpen || !recipeItem) return null;

  const handleAddIngredient = () => {
    if (availableIngredients.length === 0) return;
    const firstIng = availableIngredients[0];
    setIngredients(prev => [
      ...prev,
      {
        ingredientItemId: firstIng.id,
        ingredientName: firstIng.name,
        quantity: 1,
        unit: firstIng.unit || 'pcs',
        costEstimateUSD: firstIng.costPriceUSD || 0,
      },
    ]);
  };

  const handleIngredientChange = (index: number, field: keyof BOMIngredient, value: any) => {
    setIngredients(prev => {
      const updated = [...prev];
      if (field === 'ingredientItemId') {
        const selected = availableIngredients.find(i => i.id === value);
        if (selected) {
          updated[index] = {
            ...updated[index],
            ingredientItemId: selected.id,
            ingredientName: selected.name,
            unit: selected.unit || 'pcs',
            costEstimateUSD: selected.costPriceUSD || 0,
          };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate Total Recipe Cost
  const totalRecipeCost = ingredients.reduce((sum, ing) => {
    const item = availableIngredients.find(i => i.id === ing.ingredientItemId);
    const unitCost = item ? item.costPriceUSD : (ing.costEstimateUSD || 0);
    return sum + unitCost * ing.quantity;
  }, 0);

  const sellingPrice = recipeItem.sellingPriceUSD || 0;
  const marginUSD = sellingPrice - totalRecipeCost;
  const marginPercent = sellingPrice > 0 ? (marginUSD / sellingPrice) * 100 : 0;

  const handleSaveBOM = async () => {
    setIsSaving(true);
    setSuccessMsg(false);

    try {
      await updateItemMut.mutateAsync({
        id: recipeItem.id,
        costPriceUSD: parseFloat(totalRecipeCost.toFixed(2)),
        bom: ingredients,
      });

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save BOM:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <CookingPot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-text">
                Recipe & Bill of Materials (BOM)
              </h3>
              <p className="text-xs text-secondary">
                Configure ingredient portioning for <span className="font-semibold text-text">{recipeItem.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-text rounded-xl hover:bg-surface-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-surface-muted border border-border">
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Est. Cost / Portion</span>
              <span className="text-xl font-bold font-serif text-amber-700">
                ${totalRecipeCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Selling Price</span>
              <span className="text-xl font-bold font-serif text-text">
                ${sellingPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Est. Gross Margin</span>
              <span className={`text-xl font-bold font-serif ${marginUSD >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                ${marginUSD.toFixed(2)} ({marginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Ingredient Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Raw Ingredients List ({ingredients.length})
              </h4>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-surface-muted/30">
                <CookingPot className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-text">No ingredients added to recipe yet</p>
                <p className="text-xs text-secondary mt-1">
                  Click "Add Ingredient" above to select raw materials for portion deduction.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => {
                  const rawItem = availableIngredients.find(i => i.id === ing.ingredientItemId);
                  const unitCost = rawItem ? rawItem.costPriceUSD : (ing.costEstimateUSD || 0);
                  const lineTotal = unitCost * ing.quantity;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-white hover:border-primary/40 transition"
                    >
                      {/* Ingredient Dropdown */}
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-bold text-secondary uppercase block mb-1">
                          Raw Ingredient Item
                        </label>
                        <select
                          value={ing.ingredientItemId}
                          onChange={e => handleIngredientChange(idx, 'ingredientItemId', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          {availableIngredients.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} (${item.costPriceUSD.toFixed(2)} / {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-28">
                        <label className="text-[10px] font-bold text-secondary uppercase block mb-1">
                          Qty / Portion
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={ing.quantity}
                          onChange={e => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs text-text font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Unit */}
                      <div className="w-20">
                        <label className="text-[10px] font-bold text-secondary uppercase block mb-1">
                          Unit
                        </label>
                        <span className="text-xs font-semibold text-secondary block py-1.5 uppercase">
                          {ing.unit}
                        </span>
                      </div>

                      {/* Line Cost */}
                      <div className="w-28 text-right">
                        <label className="text-[10px] font-bold text-secondary uppercase block mb-1">
                          Line Cost
                        </label>
                        <span className="text-xs font-bold text-text block py-1.5">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center justify-between bg-surface-muted/30">
          <div className="text-xs text-secondary">
            {successMsg && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Recipe saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text border border-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveBOM}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] disabled:opacity-50 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save BOM Recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
