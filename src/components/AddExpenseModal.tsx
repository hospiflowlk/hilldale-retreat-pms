import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Calendar,
  Search,
  Check,
  CreditCard,
  Landmark,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseLineItem, PaymentMethod, ExpenseCategory } from '../types';
import { useItems, useSuppliers } from '../hooks/useMasters';
import { SearchableDropdown } from './ui/SearchableDropdown';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: string; description: string }[] = [
  { id: 'kitchen_food', label: 'Kitchen - Food, Meats & Fresh Produce', icon: 'dYc', description: 'Groceries, poultry, seafood, dairy, vegetables' },
  { id: 'beverage_bar', label: 'Bar & Beverages - Liquors, Tea, Coffee', icon: 'dY?', description: 'Spirits, wines, Ceylon tea, barista coffee' },
  { id: 'utilities_energy', label: 'Utilities - Electricity & Power', icon: 's', description: 'CEB bills, solar maintenance, grid power' },
  { id: 'gas_fuel', label: 'Fuel & Gas - Diesel Generator & Kitchen LP Gas', icon: '>', description: 'Generator diesel, cooking gas cylinders' },
  { id: 'staff_payroll', label: 'Staff Payroll & Service Charge Pool', icon: 'dY`', description: 'Kitchen chefs, steward wages, service pool payout' },
  { id: 'maintenance', label: 'Chalet, Pool & Garden Maintenance', icon: 'dY>,?', description: 'Pool chlorine, carpentry, landscape upkeep' },
  { id: 'marketing', label: 'Marketing, OTA Commissions & Booking Fees', icon: 'dYO?', description: 'Booking.com commissions, ads, print' },
  { id: 'linens_amenities', label: 'Linens, Guest Amenities & Toiletries', icon: 'dY>?,?', description: 'Towels, bedsheets, organic toiletries' },
  { id: 'other', label: 'Sundry & General Operating Costs', icon: 'dY"', description: 'Stationery, transport, miscellaneous' },
];

export const AddExpenseModal: React.FC = () => {
  const { 
    isAddExpenseModalOpen, 
    setIsAddExpenseModalOpen, 
    addExpense, 
    settings, 
    accounts,
    expenses,
    editingExpenseId,
    setEditingExpenseId,
    deleteExpense,
    updateExpense
  } = useApp();

  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const { data: masterItems = [] } = useItems.useGetAll();

  const activeAccounts = accounts.filter(a => a.isActive);

  // Form State
  const [title, setTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'LKR'>('LKR');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<ExpenseLineItem[]>([
    { id: `item-${Date.now()}`, itemName: '', price: 0, quantity: 1, vatPercent: 0, total: 0 }
  ]);
  
  const [roundOff, setRoundOff] = useState<string>('0');
  
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [accountId, setAccountId] = useState<string>('');
  const [isInterBank, setIsInterBank] = useState<boolean>(false);
  const [chequeNumber, setChequeNumber] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);

  const [focusNewRowId, setFocusNewRowId] = useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    return activeAccounts.find(a => a.id === accountId);
  }, [activeAccounts, accountId]);

  useEffect(() => {
    if (editingExpenseId) {
      const exp = expenses.find(e => e.id === editingExpenseId);
      if (exp) {
        setTitle(exp.title);
        setSupplierId(exp.supplierId || '');
        setCurrency(exp.currency || 'LKR');
        setReference(exp.invoiceRef || '');
        setDate(exp.date);
        setNotes(exp.notes || '');
        setItems(exp.items && exp.items.length > 0 ? exp.items : [{ id: `item-${Date.now()}`, itemName: '', price: 0, quantity: 1, vatPercent: 0, total: 0 }]);
        setRoundOff(exp.roundOff ? String(exp.roundOff) : '0');
        setIsPaid(exp.status === 'PAID');
        setPaymentMethod(exp.paymentMethod || 'cash');
        setIsInterBank(Boolean(exp.isInterBank));
        setChequeNumber(exp.chequeNumber || '');
        if (exp.accountId) setAccountId(exp.accountId);
      }
    }
  }, [editingExpenseId, expenses]);

  useEffect(() => {
    if (focusNewRowId) {
      const el = document.getElementById(`dropdown-button-${focusNewRowId}`);
      if (el) {
        el.focus();
        setFocusNewRowId(null);
      }
    }
  }, [items.length, focusNewRowId]);

  // Set default account when isPaid is toggled
  useEffect(() => {
    if (isPaid && !accountId) {
      const defaultAcc = activeAccounts[0];
      if (defaultAcc) {
        setAccountId(defaultAcc.id);
        if (defaultAcc.type === 'cash') setPaymentMethod('cash');
        else if (defaultAcc.type === 'credit_card') setPaymentMethod('card');
        else setPaymentMethod('bank_transfer');
      }
    }
  }, [isPaid, accountId, activeAccounts]);

  const supplierOptions = useMemo(() => {
    return masterSuppliers.map(s => ({
      value: s.id,
      label: s.companyName,
    }));
  }, [masterSuppliers]);

  const masterItemOptions = useMemo(() => {
    return masterItems
      .filter(i => i.type === 'EXPENSE')
      .map(i => ({
        value: i.id,
        label: i.name,
        group: i.categoryName
      }));
  }, [masterItems]);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const roundOffNum = parseFloat(roundOff) || 0;
  const finalTotal = subtotal + roundOffNum;

  const amountUSD = currency === 'USD' ? finalTotal : finalTotal / settings.usdToLkrRate;
  const amountLKR = currency === 'LKR' ? finalTotal : finalTotal * settings.usdToLkrRate;

  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    setItems(prev => [
      ...prev,
      { id: newId, itemName: '', price: 0, quantity: 1, vatPercent: 0, total: 0 }
    ]);
    setFocusNewRowId(newId);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: keyof ExpenseLineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Auto fill item name if master item selected
      if (field === 'masterItemId' && value) {
        const found = masterItems.find(mi => mi.id === value);
        if (found) {
          updatedItem.itemName = found.name;
          updatedItem.price = currency === 'USD' ? found.costPriceUSD : found.costPriceUSD * settings.usdToLkrRate;
        }
      }

      // Recalculate total if price, qty or vat changes
      if (field === 'price' || field === 'quantity' || field === 'vatPercent' || field === 'masterItemId') {
        const p = updatedItem.price || 0;
        const q = updatedItem.quantity || 0;
        const v = updatedItem.vatPercent || 0;
        const lineTotalBeforeVat = p * q;
        updatedItem.total = lineTotalBeforeVat + (lineTotalBeforeVat * (v / 100));
      }

      return updatedItem;
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please provide an Expense Name.');
      return;
    }
    if (!supplierId) {
      setError('Please select a Supplier.');
      return;
    }
    if (isPaid && !accountId) {
      setError('Please select an account to pay from.');
      return;
    }
    
    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim() && !items[i].masterItemId) {
        setError(`Row ${i + 1} is missing an item name.`);
        return;
      }
      if (items[i].price <= 0 || items[i].quantity <= 0) {
        setError(`Row ${i + 1} must have a valid price and quantity.`);
        return;
      }
    }

    const selectedAcc = accounts.find(a => a.id === accountId);
    const supplier = masterSuppliers.find(s => s.id === supplierId);
    let calculatedFee = 0;
    if (isPaid && selectedAcc?.type === 'bank' && paymentMethod === 'bank_transfer' && isInterBank) {
      const principalNative = selectedAcc.currency === 'USD' ? amountUSD : amountLKR;
      if (selectedAcc.interBankFeeType === 'percent') {
        calculatedFee = Number(((principalNative * (selectedAcc.interBankTransferFee || 0)) / 100).toFixed(2));
      } else {
        calculatedFee = Number((selectedAcc.interBankTransferFee || 0).toFixed(2));
      }
    }

    const newExpense: Omit<Expense, 'id' | 'createdAt'> = {
      title,
      category: 'other', // Default fallback, could map based on items later
      amountUSD,
      amountLKR,
      date,
      vendor: supplier?.companyName || 'Unknown',
      supplierId,
      paymentMethod: isPaid && selectedAcc?.type === 'cash' ? 'cash' : paymentMethod,
      accountId: isPaid ? accountId : undefined,
      accountName: isPaid ? selectedAcc?.name : undefined,
      notes: notes.trim(),
      invoiceRef: reference.trim(),
      transferFee: calculatedFee > 0 ? calculatedFee : undefined,
      isInterBank: isPaid ? isInterBank : undefined,
      chequeNumber: isPaid && paymentMethod === 'cheque' ? chequeNumber.trim() : undefined,
      currency,
      items: items.map(i => ({ ...i })),
      subtotal,
      discount: 0,
      tax: items.reduce((sum, it) => sum + ((it.price * it.quantity) * (it.vatPercent / 100)), 0),
      roundOff: roundOffNum,
      finalTotal,
      status: isPaid ? 'PAID' : 'UNPAID'
    };

    if (editingExpenseId) {
      updateExpense(editingExpenseId, newExpense);
    } else {
      addExpense(newExpense);
    }
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setSupplierId('');
    setReference('');
    setNotes('');
    setItems([{ id: `item-${Date.now()}`, itemName: '', price: 0, quantity: 1, vatPercent: 0, total: 0 }]);
    setRoundOff('0');
    setIsPaid(false);
    setIsInterBank(false);
    setChequeNumber('');
    setError(null);
    setEditingExpenseId(null);
    setIsAddExpenseModalOpen(false);
  };

  if (!isAddExpenseModalOpen) return null;

  const currencySymbol = currency === 'USD' ? '$' : 'Rs';

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center md:p-4">
      <div className="bg-white md:border border-border md:rounded-xl shadow-xl w-full h-full md:h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-4 bg-white sticky top-0 z-10 shrink-0">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-surface-muted transition"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
          <h2 className="text-lg font-bold text-text flex-1">{editingExpenseId ? 'Edit Expense' : 'New Expense'}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-surface-muted transition text-secondary hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-6 flex flex-col md:flex-row gap-6">
          
          {/* Main Form Area */}
          <div className="flex-1 space-y-6">
            
            {/* Top Row Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-border shadow-xs">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-secondary mb-1">Expense Name *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-600 rounded-lg px-3 py-2 text-sm focus:outline-hidden"
                  placeholder="e.g. Monthly Restock"
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-secondary mb-1">Supplier *</label>
                <SearchableDropdown
                  options={supplierOptions}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Supplier (DB Only) *"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-secondary mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'LKR')}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden"
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-secondary mb-1">Reference #</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden"
                  placeholder="Reference #"
                />
              </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-secondary mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        if (items.length > 0) {
                          const firstItemId = items[0].id;
                          const el = document.getElementById(`dropdown-button-${firstItemId}`);
                          if (el) el.focus();
                        }
                      }
                    }}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl border border-border shadow-xs">
              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-text w-1/4 rounded-tl-xl">Item</th>
                      <th className="px-4 py-3 font-semibold text-text w-1/4">Note</th>
                      <th className="px-4 py-3 font-semibold text-text w-24">Price</th>
                      <th className="px-4 py-3 font-semibold text-text w-20">Qty</th>
                      <th className="px-4 py-3 font-semibold text-text w-20">VAT %</th>
                      <th className="px-4 py-3 font-semibold text-text w-24 text-right">Total</th>
                      <th className="px-4 py-3 w-12 rounded-tr-xl"></th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-muted/30">
                          <td className="px-4 py-2">
                            <SearchableDropdown
                              id={`dropdown-button-${item.id}`}
                              options={[...masterItemOptions, ...(item.itemName && !item.masterItemId ? [{ value: `CUSTOM_${item.id}`, label: item.itemName, group: 'Custom' }] : [])]}
                              value={item.masterItemId || (item.itemName ? `CUSTOM_${item.id}` : '')}
                              onChange={(val) => {
                                if (val.startsWith('CREATE_CUSTOM::')) {
                                  const text = val.replace('CREATE_CUSTOM::', '');
                                  handleUpdateItem(item.id, 'masterItemId', '');
                                  handleUpdateItem(item.id, 'itemName', text);
                                } else if (val.startsWith('CUSTOM_')) {
                                  // keep as is
                                } else {
                                  handleUpdateItem(item.id, 'masterItemId', val);
                                  handleUpdateItem(item.id, 'itemName', masterItems.find(i => i.id === val)?.name || '');
                                }
                              }}
                              placeholder="Search or add custom item..."
                              creatable={true}
                              onEnterSelectFocusId={`note-${item.id}`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              id={`note-${item.id}`}
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  document.getElementById(`price-${item.id}`)?.focus();
                                }
                              }}
                              className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden"
                              placeholder="Note (Optional)"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              id={`price-${item.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  document.getElementById(`qty-${item.id}`)?.focus();
                                }
                              }}
                              className="w-full bg-white border border-border rounded-lg px-2 py-2 text-xs text-right font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              id={`qty-${item.id}`}
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  document.getElementById(`vat-${item.id}`)?.focus();
                                }
                              }}
                              className="w-full bg-white border border-border rounded-lg px-2 py-2 text-xs text-center font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              id={`vat-${item.id}`}
                              type="number"
                              min="0"
                              value={item.vatPercent || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'vatPercent', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddItem();
                                }
                              }}
                              className="w-full bg-white border border-border rounded-lg px-2 py-2 text-xs text-right font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-mono font-bold text-text bg-surface-muted/30">
                            {currencySymbol} {item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-secondary hover:text-rose-600 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
              <div className="p-4 bg-surface-muted/30 border-t border-border rounded-b-xl">
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Item Row
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Totals */}
          <div className="w-full md:w-80 space-y-6 flex flex-col shrink-0">
            <div className="bg-[#F8F9FA] p-6 rounded-xl border border-border shadow-xs space-y-4">
              
              <div className="flex justify-between items-center text-sm font-semibold text-text">
                <span>Subtotal:</span>
                <span className="font-mono">{currencySymbol} {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm font-semibold text-text">
                <span>Round Off:</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={roundOff}
                  onChange={(e) => setRoundOff(e.target.value)}
                  className="w-24 bg-white border border-border rounded-lg px-2 py-1 text-right font-mono focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center text-base font-bold text-emerald-800">
                <span>Final Total:</span>
                <span className="font-mono">{currencySymbol} {finalTotal.toFixed(2)}</span>
              </div>

              <div className="pt-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note (Optional)"
                  rows={3}
                  className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-text">Status:</span>
                <button
                  onClick={() => setIsPaid(!isPaid)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPaid ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPaid ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPaid ? 'PAID' : 'UNPAID'}
                </span>
              </div>

              {isPaid && (
                <div className="pt-4 space-y-3.5 border-t border-border animate-in fade-in slide-in-from-top-2">
                  {/* Account Selector */}
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">
                      Paid From Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => {
                        const newAccId = e.target.value;
                        setAccountId(newAccId);
                        const acc = activeAccounts.find(a => a.id === newAccId);
                        if (acc) {
                          if (acc.type === 'cash') setPaymentMethod('cash');
                          else if (acc.type === 'credit_card') setPaymentMethod('card');
                          else if (acc.type === 'bank') setPaymentMethod('bank_transfer');
                        }
                      }}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="">Select Account...</option>
                      {activeAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type.toUpperCase()}) — {acc.currency === 'USD' ? '$' : 'Rs. '}{acc.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method Restrictions based on selected account */}
                  {selectedAccount?.type === 'cash' && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Wallet className="w-3.5 h-3.5 text-amber-700" />
                        <span>Cash Payment (Fixed for Cash Drawers)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">Restricted</span>
                    </div>
                  )}

                  {selectedAccount?.type === 'credit_card' && (
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                        <span>Corporate Card Charge</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-blue-200 px-1.5 py-0.5 rounded text-blue-900">Restricted</span>
                    </div>
                  )}

                  {selectedAccount?.type === 'bank' && (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-secondary">Bank Settlement Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank_transfer')}
                          className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            paymentMethod === 'bank_transfer' ? 'bg-emerald-600 text-white' : 'bg-white border border-border text-secondary hover:text-text'
                          }`}
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          <span>Bank Transfer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cheque')}
                          className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            paymentMethod === 'cheque' ? 'bg-emerald-600 text-white' : 'bg-white border border-border text-secondary hover:text-text'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cheque</span>
                        </button>
                      </div>

                      {/* Bank Transfer destination toggle */}
                      {paymentMethod === 'bank_transfer' && (
                        <div className="p-2.5 bg-surface-muted rounded-lg border border-border space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold text-secondary">
                            <span>Transfer Destination</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsInterBank(false)}
                              className={`p-1.5 rounded text-[11px] border text-left transition ${
                                !isInterBank ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' : 'border-border bg-white text-secondary'
                              }`}
                            >
                              <span>Same Bank (Free)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsInterBank(true)}
                              className={`p-1.5 rounded text-[11px] border text-left transition ${
                                isInterBank ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' : 'border-border bg-white text-secondary'
                              }`}
                            >
                              <span>Other Bank (+Fee)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'cheque' && (
                        <div>
                          <label className="block text-[11px] font-bold text-secondary mb-1">Cheque Leaf #</label>
                          <input
                            type="text"
                            value={chequeNumber}
                            onChange={(e) => setChequeNumber(e.target.value)}
                            placeholder="e.g. CHQ-84912"
                            className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="mt-auto">
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-[#006A4E] hover:bg-[#005942] text-white font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-5 h-5" />
                SAVE EXPENSE
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
