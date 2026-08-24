import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Check, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  TrendingDown,
  Repeat,
  FileSpreadsheet,
  Wallet,
  Landmark,
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAccounts } from '../../hooks/useAccounts';
import { Account } from '../../types';

interface TransferFundsModalProps {
  onClose: () => void;
  preselectedFromAccountId?: string;
  preselectedToAccountId?: string;
}

export const TransferFundsModal: React.FC<TransferFundsModalProps> = ({ 
  onClose,
  preselectedFromAccountId,
  preselectedToAccountId
}) => {
  const { transferFunds, settings, formatCurrency } = useApp();
  const { accounts } = useAccounts();

  const activeAccounts = accounts.filter(a => a.isActive);

  const [fromAccountId, setFromAccountId] = useState<string>(
    preselectedFromAccountId || 
    activeAccounts.find(a => (a.type === 'cash' || a.type === 'bank') && a.balance > 0)?.id || 
    activeAccounts[0]?.id || ''
  );

  const [toAccountId, setToAccountId] = useState<string>(() => {
    if (preselectedToAccountId && preselectedToAccountId !== preselectedFromAccountId) {
      return preselectedToAccountId;
    }
    const other = activeAccounts.find(a => a.id !== (preselectedFromAccountId || activeAccounts[0]?.id));
    return other?.id || '';
  });

  const [amount, setAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>(String(settings.usdToLkrRate));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>(`TRF-${Date.now().toString().slice(-5)}`);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(exchangeRate) || settings.usdToLkrRate;

  // Calculate destination target amount
  let computedTargetAmount = 0;
  if (fromAcc && toAcc && parsedAmount > 0) {
    if (fromAcc.currency === toAcc.currency) {
      computedTargetAmount = parsedAmount;
    } else if (fromAcc.currency === 'USD' && toAcc.currency === 'LKR') {
      computedTargetAmount = Math.round(parsedAmount * parsedRate);
    } else if (fromAcc.currency === 'LKR' && toAcc.currency === 'USD') {
      computedTargetAmount = Number((parsedAmount / parsedRate).toFixed(2));
    }
  }

  // Auto-switch toAccountId if it matches fromAccountId
  useEffect(() => {
    if (fromAccountId === toAccountId) {
      const nextAcc = activeAccounts.find(a => a.id !== fromAccountId);
      if (nextAcc) {
        setToAccountId(nextAcc.id);
      }
    }
  }, [fromAccountId]);

  // Swap From & To accounts helper
  const handleSwapAccounts = () => {
    if (!toAcc) return;
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const quickNotesPresets = [
    'Daily POS Cash Drawer deposit into Commercial Bank',
    'Petty Cash Float replenishment',
    'Corporate Credit Card Bill Settlement',
    'Term Loan Principal & Interest Payment',
    'Inter-bank liquidity rebalancing'
  ];

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAcc || !toAcc) {
      setError('Please select both source and destination accounts.');
      return;
    }

    if (fromAcc.id === toAcc.id) {
      setError('Source and Destination accounts must be different.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }

    // Check if source has sufficient funds (for cash/bank)
    if ((fromAcc.type === 'cash' || fromAcc.type === 'bank') && parsedAmount > fromAcc.balance) {
      setError(`Insufficient funds in source account. ${fromAcc.name} only has ${fromAcc.currency} ${fromAcc.balance.toLocaleString()} available.`);
      return;
    }

    const result = transferFunds({
      fromAccountId,
      toAccountId,
      amount: parsedAmount,
      targetAmount: computedTargetAmount,
      exchangeRate: parsedRate,
      date,
      reference,
      notes: notes.trim() || undefined
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Transfer failed. Please check parameters.');
    }
  };

  const getAccountIcon = (type?: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-3.5 h-3.5 text-primary" />;
      case 'cash': return <Wallet className="w-3.5 h-3.5 text-secondary" />;
      case 'credit_card': return <CreditCard className="w-3.5 h-3.5 text-amber-700" />;
      case 'loan': return <Building className="w-3.5 h-3.5 text-rose-700" />;
      default: return <Landmark className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-2xl max-w-lg w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Treasury Operations & Double-Entry Accounting
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-text flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              <span>Transfer Funds Between Accounts</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Visual Route (From -> Swap Button -> To) */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2.5">
              {/* From Account */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                    {getAccountIcon(fromAcc?.type)}
                    <span>Source (From)</span>
                  </label>
                </div>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl p-2 text-xs font-semibold text-text focus:outline-hidden focus:border-primary shadow-2xs"
                >
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency} {a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                {fromAcc && (
                  <div className="text-[10px] text-secondary flex items-center justify-between px-1">
                    <span>Avail: <strong className="text-text">{fromAcc.currency} {fromAcc.balance.toLocaleString()}</strong></span>
                    <span className="capitalize text-[9px] bg-surface-muted px-1.5 py-0.2 rounded font-medium">{fromAcc.type.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center sm:pt-4">
                <button
                  type="button"
                  onClick={handleSwapAccounts}
                  title="Swap Source and Destination"
                  className="p-2 rounded-xl bg-white border border-border text-primary hover:bg-primary-light hover:text-text transition shadow-2xs cursor-pointer"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* To Account */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                    {getAccountIcon(toAcc?.type)}
                    <span>Destination (To)</span>
                  </label>
                </div>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl p-2 text-xs font-semibold text-text focus:outline-hidden focus:border-primary shadow-2xs"
                >
                  {activeAccounts.filter(a => a.id !== fromAccountId).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency} {a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
                {toAcc && (
                  <div className="text-[10px] text-secondary flex items-center justify-between px-1">
                    <span>Balance: <strong className="text-text">{toAcc.currency} {toAcc.balance.toLocaleString()}</strong></span>
                    <span className="font-semibold text-[9px] text-primary bg-primary-light/50 px-1.5 py-0.2 rounded">
                      {toAcc.type === 'credit_card' || toAcc.type === 'loan' ? 'Debt Reduction' : 'Asset Inflow'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount to Transfer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                Transfer Amount ({fromAcc?.currency || 'LKR'}) <span className="text-primary">*</span>
              </label>
              {fromAcc && fromAcc.balance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(fromAcc.balance))}
                  className="text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Transfer Full Available:</span>
                  <span className="font-mono">{fromAcc.currency} {fromAcc.balance.toLocaleString()}</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-xl font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white shadow-2xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-secondary">
                {fromAcc?.currency || 'LKR'}
              </div>
            </div>
          </div>

          {/* Cross-Currency Exchange Rate Conversion Box */}
          {fromAcc && toAcc && fromAcc.currency !== toAcc.currency && (
            <div className="p-3.5 rounded-xl bg-primary-light/40 border border-border-focus space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Cross-Currency Forex Conversion</span>
                </span>
                <span className="text-[10px] text-secondary">System Rate: Rs. {settings.usdToLkrRate} / $1 USD</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text whitespace-nowrap">Conversion Rate (LKR per USD):</label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-32 bg-white border border-border-focus rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="text-xs font-bold text-text flex items-center justify-between pt-1.5 border-t border-border-focus/50 font-mono">
                <span>Destination Receives:</span>
                <span className="text-sm font-bold text-primary">
                  {toAcc.currency === 'USD' ? `$${(Number(computedTargetAmount) || 0).toFixed(2)} USD` : `Rs. ${(Number(computedTargetAmount) || 0).toLocaleString()} LKR`}
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Double-Entry Journal Preview */}
          {fromAcc && toAcc && parsedAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-border space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-secondary uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                  <span>Automatic Journal Entries Preview</span>
                </span>
                <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                  Double Entry Balanced
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono border-t border-border pt-2">
                {/* Outflow Leg */}
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-border/60">
                  <div>
                    <span className="font-bold text-rose-700 block">Credit (Money Out): {fromAcc.name}</span>
                    <span className="text-[10px] text-secondary font-sans">
                      Balance: {fromAcc.currency} {fromAcc.balance.toLocaleString()} → <strong className="text-text">{(fromAcc.balance - parsedAmount).toLocaleString()}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-700">
                    -{fromAcc.currency === 'USD' ? '$' : 'Rs. '}{parsedAmount.toLocaleString()}
                  </span>
                </div>

                {/* Inflow Leg */}
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-border/60">
                  <div>
                    <span className="font-bold text-green-700 block">Debit (Money In): {toAcc.name}</span>
                    <span className="text-[10px] text-secondary font-sans">
                      Balance: {toAcc.currency} {toAcc.balance.toLocaleString()} → <strong className="text-primary">
                        {toAcc.type === 'credit_card' || toAcc.type === 'loan'
                          ? (Math.max(0, toAcc.balance - computedTargetAmount)).toLocaleString()
                          : (toAcc.balance + computedTargetAmount).toLocaleString()}
                      </strong>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-700">
                    +{toAcc.currency === 'USD' ? '$' : 'Rs. '}{computedTargetAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Date and Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Transfer Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Reference / Voucher #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TRF-9021"
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Notes & Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block">
              Transfer Purpose / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Daily POS Cash Drawer deposit into Commercial Bank Current Account"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickNotesPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(preset)}
                  className="text-[10px] bg-[#FAF8F5] hover:bg-primary-light text-secondary-dark hover:text-text px-2 py-0.5 rounded-md border border-border transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Record Transfer & Journal Entries</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
