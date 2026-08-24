import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Trash2, Check, DollarSign, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterSupplier, SupplierPurchaseItem, UnitOfMeasure } from '../../types';

interface RecordSupplierPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplier?: MasterSupplier | null;
}

import { useSuppliers, useItems } from '../../hooks/useMasters';

export const RecordSupplierPurchaseModal: React.FC<RecordSupplierPurchaseModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplier
}) => {
  const { recordSupplierPurchase, settings } = useApp();
  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const { data: masterItems = [] } = useItems.useGetAll();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<SupplierPurchaseItem[]>([]);
  const [taxUSD, setTaxUSD] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSupplier) {
      setSupplierId(preselectedSupplier.id);
    } else if (masterSuppliers.length > 0) {
      setSupplierId(masterSuppliers[0].id);
    }
    const rndNum = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}-${rndNum}`);
    setDate(new Date().toISOString().split('T')[0]);
    
    // Default due date +14 days
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setDueDate(due.toISOString().split('T')[0]);
    
    setItems([]);
    setTaxUSD('0.00');
    setNotes('');
    setError(null);
  }, [preselectedSupplier, isOpen, masterSuppliers]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    if (masterItems.length === 0) return;
    const defaultItem = masterItems[0];
    const newItem: SupplierPurchaseItem = {
      itemId: defaultItem.id,
      itemName: defaultItem.name,
      quantity: 10,
      unit: defaultItem.unit,
      unitCostUSD: defaultItem.costPriceUSD || 1.0,
      totalCostUSD: (defaultItem.costPriceUSD || 1.0) * 10
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItemRow = (index: number, updates: Partial<SupplierPurchaseItem>) => {
    setItems(prev => {
      const next = [...prev];
      const current = next[index];

      if (updates.itemId && updates.itemId !== current.itemId) {
        const itemObj = masterItems.find(m => m.id === updates.itemId);
        if (itemObj) {
          const qty = updates.quantity !== undefined ? updates.quantity : current.quantity;
          const cost = updates.unitCostUSD !== undefined ? updates.unitCostUSD : itemObj.costPriceUSD;
          next[index] = {
            ...current,
            itemId: itemObj.id,
            itemName: itemObj.name,
            unit: itemObj.unit,
            unitCostUSD: cost,
            quantity: qty,
            totalCostUSD: Number((qty * cost).toFixed(2))
          };
          return next;
        }
      }

      const qty = updates.quantity !== undefined ? updates.quantity : current.quantity;
      const cost = updates.unitCostUSD !== undefined ? updates.unitCostUSD : current.unitCostUSD;
      next[index] = {
        ...current,
        ...updates,
        quantity: qty,
        unitCostUSD: cost,
        totalCostUSD: Number((qty * cost).toFixed(2))
      };
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotalUSD = items.reduce((sum, i) => sum + i.totalCostUSD, 0);
  const taxNum = parseFloat(taxUSD) || 0;
  const totalAmountUSD = Number((subtotalUSD + taxNum).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Please enter a supplier invoice / bill number.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one line item to the purchase invoice.');
      return;
    }

    const supplier = masterSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    recordSupplierPurchase({
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      invoiceNumber: invoiceNumber.trim(),
      date,
      dueDate: dueDate || undefined,
      items,
      subtotalUSD,
      taxUSD: taxNum,
      totalAmountUSD,
      amountPaidUSD: 0,
      balanceOwedUSD: totalAmountUSD,
      status: 'UNPAID',
      paymentHistory: [],
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-800 text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                Record Supplier Purchase (AP Bill)
              </h3>
              <p className="text-xs text-secondary">
                Log vendor bills, credit purchases, and auto-restock inventory
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

          {/* Supplier & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Supplier / Vendor *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              >
                {masterSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} (${s.currentBalanceOwedUSD.toFixed(2)} owed)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Vendor Bill / Invoice # *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. KFP-INV-84920"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Invoice Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Purchase / Invoice Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Credit Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Purchase Line Items */}
          <div className="border border-border rounded-2xl p-4 bg-surface-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                Purchased Items & Inventory Restocking
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-[#4d5541] transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-secondary">
                No items added yet. Click "+ Add Item" to specify purchased goods.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((row, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-border flex items-center gap-2 shadow-2xs">
                    {/* Item Selector */}
                    <select
                      value={row.itemId}
                      onChange={(e) => handleUpdateItemRow(idx, { itemId: e.target.value })}
                      className="flex-1 bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-hidden"
                    >
                      {masterItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={row.quantity}
                      onChange={(e) => handleUpdateItemRow(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Qty"
                      className="w-20 bg-surface-muted border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text focus:outline-hidden"
                    />

                    {/* Unit Cost */}
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-[10px] text-secondary">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCostUSD}
                        onChange={(e) => handleUpdateItemRow(idx, { unitCostUSD: parseFloat(e.target.value) || 0 })}
                        placeholder="Cost"
                        className="w-full bg-surface-muted border border-border rounded-lg pl-5 pr-2 py-1.5 text-xs font-mono text-text focus:outline-hidden"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-20 text-right font-mono font-bold text-xs text-text">
                      ${row.totalCostUSD.toFixed(2)}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Summary */}
            {items.length > 0 && (
              <div className="pt-2 border-t border-border flex justify-end">
                <div className="text-right space-y-1">
                  <div className="text-xs text-secondary">
                    Subtotal: <span className="font-mono font-bold text-text">${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="text-sm font-bold text-text">
                    Total AP Debt: <span className="font-mono text-amber-900">${totalAmountUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Purchase Order Notes & Delivery Receipt #
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in good order at kitchen warehouse, PO #8491"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Purchase Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
