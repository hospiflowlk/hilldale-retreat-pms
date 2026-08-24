import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  Landmark, 
  Wallet, 
  CreditCard, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAccounts } from '../hooks/useAccounts';
import { Expense, PaymentMethod } from '../types';

interface SettleExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SettleExpenseModal: React.FC<SettleExpenseModalProps> = ({
  expense,
  isOpen,
  onClose
}) => {
  const { updateExpense, settings } = useApp();
  const { accounts } = useAccounts();
  const activeAccounts = accounts.filter(a => a.isActive);

  const [accountId, setAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [isInterBank, setIsInterBank] = useState<boolean>(false);
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    return activeAccounts.find(a => a.id === accountId);
  }, [activeAccounts, accountId]);

  useEffect(() => {
    if (expense) {
      setDate(new Date().toISOString().split('T')[0]);
      setReference(expense.invoiceRef || `SETTLE-${Date.now().toString().slice(-4)}`);
      setNotes('');
      setError(null);
      setIsInterBank(false);
      setChequeNumber('');

      // Default payment account (prefer bank or first active)
      const defaultAcc = activeAccounts.find(a => a.type === 'bank') || activeAccounts[0];
      if (defaultAcc) {
        setAccountId(defaultAcc.id);
        if (defaultAcc.type === 'cash') {
          setPaymentMethod('cash');
        } else if (defaultAcc.type === 'credit_card') {
          setPaymentMethod('credit_card');
        } else {
          setPaymentMethod('bank_transfer');
        }
      }
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  // Currency & Amounts
  const totalLKR = Math.round((Number(expense.amountUSD) || 0) * settings.usdToLkrRate);
  const totalUSD = (Number(expense.amountUSD) || 0).toFixed(2);
  const isUSDAccount = selectedAccount?.currency === 'USD';
  const principalNative = isUSDAccount ? Number(totalUSD) : totalLKR;

  // Inter-Bank Transfer Fee configuration
  const defaultBankFee = isUSDAccount ? 15 : 50;
  const configuredFee = (selectedAccount?.interBankTransferFee !== undefined && selectedAccount.interBankTransferFee > 0)
    ? selectedAccount.interBankTransferFee
    : defaultBankFee;
  const feeType = selectedAccount?.interBankFeeType || 'flat';

  // Calculate Inter-Bank Transfer Fee if Other Bank is selected
  let calculatedFee = 0;
  if (selectedAccount?.type === 'bank' && paymentMethod === 'bank_transfer' && isInterBank) {
    if (feeType === 'percent') {
      calculatedFee = Number(((principalNative * configuredFee) / 100).toFixed(2));
    } else {
      calculatedFee = Number(configuredFee.toFixed(2));
    }
  }

  const totalBankOutflow = Number((principalNative + calculatedFee).toFixed(2));

  const handleAccountSelect = (accId: string) => {
    setAccountId(accId);
    const acc = activeAccounts.find(a => a.id === accId);
    if (acc) {
      if (acc.type === 'cash') {
        setPaymentMethod('cash');
        setIsInterBank(false);
      } else if (acc.type === 'credit_card') {
        setPaymentMethod('credit_card');
        setIsInterBank(false);
      } else if (acc.type === 'bank') {
        if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'cheque') {
          setPaymentMethod('bank_transfer');
        }
      }
    }
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Please select a payment account to settle from.');
      return;
    }

    if (!selectedAccount) {
      setError('Selected account is invalid.');
      return;
    }

    if (selectedAccount.type === 'cash' && paymentMethod !== 'cash') {
      setError('Cash accounts only support Cash settlement.');
      return;
    }

    if (selectedAccount.type === 'bank' && paymentMethod !== 'bank_transfer' && paymentMethod !== 'cheque') {
      setError('Bank accounts support Bank Transfer or Cheque settlement only.');
      return;
    }

    if (paymentMethod === 'cheque' && !chequeNumber.trim()) {
      setError('Please enter the Cheque Number for cheque payment.');
      return;
    }

    let settleNotes = notes.trim();
    if (paymentMethod === 'bank_transfer' && isInterBank && calculatedFee > 0) {
      const feeLabel = `${selectedAccount.currency === 'USD' ? '$' : 'Rs. '}${calculatedFee}`;
      settleNotes = settleNotes 
        ? `${settleNotes} (Inter-bank transfer fee: ${feeLabel})`
        : `Inter-bank transfer fee: ${feeLabel}`;
    }

    updateExpense(expense.id, {
      status: 'PAID',
      paymentMethod,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      date: date || expense.date,
      invoiceRef: reference.trim() || expense.invoiceRef,
      transferFee: calculatedFee > 0 ? calculatedFee : undefined,
      isInterBank,
      chequeNumber: paymentMethod === 'cheque' ? chequeNumber.trim() : undefined,
      notes: settleNotes 
        ? `${expense.notes ? expense.notes + ' | ' : ''}Settled: ${settleNotes}`
        : expense.notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-[#FAF8F5] border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center text-green-700 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Settle Expense Bill</h3>
              <p className="text-xs text-secondary">Record payment & update treasury ledger</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-surface-muted text-secondary hover:text-text flex items-center justify-center transition cursor-pointer border border-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="p-5 bg-primary/5 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Vendor / Description
            </span>
            <h4 className="font-bold text-sm text-text">{expense.vendor}</h4>
            <p className="text-xs text-secondary truncate max-w-xs">{expense.title}</p>
            {expense.invoiceRef && (
              <span className="text-[11px] font-mono text-secondary">Ref: {expense.invoiceRef}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Bill Amount Due
            </span>
            <div className="text-lg font-bold font-serif text-primary">
              Rs. {totalLKR.toLocaleString()}
            </div>
            <p className="text-[11px] text-secondary font-mono">≈ ${totalUSD} USD</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmSettle} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                Payment Account <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-secondary">Options adapt to selected account</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
              {activeAccounts.map(acc => {
                const isSelected = accountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleAccountSelect(acc.id)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary-light/50 ring-2 ring-primary/20' 
                        : 'border-border bg-white hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: acc.color || '#5A634D' }}
                      >
                        {acc.type === 'bank' && <Landmark className="w-4 h-4" />}
                        {acc.type === 'cash' && <Wallet className="w-4 h-4" />}
                        {acc.type === 'credit_card' && <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-white border border-border text-secondary">
                            {acc.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-secondary font-mono">
                          Balance: {acc.currency === 'USD' ? '$' : 'Rs. '}{acc.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method - Only available options based on selected account */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary font-medium cursor-pointer"
              >
                {selectedAccount?.type === 'cash' && (
                  <option value="cash">Cash</option>
                )}

                {selectedAccount?.type === 'bank' && (
                  <>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </>
                )}

                {selectedAccount?.type === 'credit_card' && (
                  <option value="credit_card">Credit Card</option>
                )}

                {selectedAccount?.type === 'loan' && (
                  <option value="other">Loan Draw / Direct</option>
                )}
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Bank Transfer Destination (Same Bank vs Different Bank) */}
          {selectedAccount?.type === 'bank' && paymentMethod === 'bank_transfer' && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-border space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                  Transfer Destination (Bank Charge Rule)
                </span>
                <span className="text-[10px] text-secondary font-mono">
                  Configured: {feeType === 'percent' ? `${configuredFee}%` : `${selectedAccount.currency === 'USD' ? '$' : 'Rs. '}${configuredFee}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInterBank(false)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    !isInterBank
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-border bg-white text-secondary hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className={`w-4 h-4 ${!isInterBank ? 'text-emerald-700' : 'text-secondary'}`} />
                    <span>Same Bank</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                    Free (No Fee)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInterBank(true)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isInterBank
                      ? 'border-primary bg-primary-light/50 text-primary shadow-xs ring-2 ring-primary/20'
                      : 'border-border bg-white text-secondary hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Landmark className={`w-4 h-4 ${isInterBank ? 'text-primary' : 'text-secondary'}`} />
                    <span>Different Bank</span>
                  </div>
                  <span className="text-[10px] text-primary font-semibold mt-1">
                    +{feeType === 'percent' ? `${configuredFee}%` : `${selectedAccount.currency === 'USD' ? '$' : 'Rs. '}${configuredFee}`} Fee
                  </span>
                </button>
              </div>

              {/* Breakdown when Inter-Bank fee applies */}
              {isInterBank && (
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5 font-mono shadow-2xs">
                  <div className="flex justify-between text-secondary">
                    <span>Principal Bill Due:</span>
                    <span>{selectedAccount.currency === 'USD' ? '$' : 'Rs. '}{principalNative.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>Different Bank Charge:</span>
                    <span>+{selectedAccount.currency === 'USD' ? '$' : 'Rs. '}{calculatedFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-text font-bold pt-1.5 border-t border-border text-[13px]">
                    <span>Total Bank Outflow:</span>
                    <span className="text-primary">{selectedAccount.currency === 'USD' ? '$' : 'Rs. '}{totalBankOutflow.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cheque Number Field */}
          {selectedAccount?.type === 'bank' && paymentMethod === 'cheque' && (
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                Cheque Leaf Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                placeholder="e.g. CHQ-0094812"
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary font-mono font-bold"
              />
            </div>
          )}

          {/* Reference # */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-9482 or Cheque #..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Settlement Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
              Settlement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Settled via SLIPS online banking..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-surface-muted text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Settle Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
