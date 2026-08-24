import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, Check, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAccounts } from '../../hooks/useAccounts';
import { MasterSupplier, SupplierPurchaseInvoice, PaymentMethod } from '../../types';

interface RecordSupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: MasterSupplier | null;
}

export const RecordSupplierPaymentModal: React.FC<RecordSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  supplier
}) => {
  const { supplierPurchases, recordSupplierPayment, settings } = useApp();
  const { accounts } = useAccounts();

  const activeAccounts = accounts.filter(a => a.isActive);
  const unpaidInvoices = supplier 
    ? supplierPurchases.filter(p => p.supplierId === supplier.id && p.status !== 'PAID')
    : [];

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmountUSD, setPaymentAmountUSD] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isInterBank, setIsInterBank] = useState<boolean>(false);
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unpaidInvoices.length > 0) {
      setSelectedInvoiceId(unpaidInvoices[0].id);
      setPaymentAmountUSD(String(unpaidInvoices[0].balanceOwedUSD));
    } else if (supplier && supplier.currentBalanceOwedUSD > 0) {
      setPaymentAmountUSD(String(supplier.currentBalanceOwedUSD));
    } else {
      setSelectedInvoiceId('');
      setPaymentAmountUSD('');
    }

    // Default account
    const bankAcc = activeAccounts.find(a => a.type === 'bank') || activeAccounts[0];
    if (bankAcc) {
      setSelectedAccountId(bankAcc.id);
    }

    setDate(new Date().toISOString().split('T')[0]);
    setReference(`PAY-${Date.now().toString().slice(-4)}`);
    setNotes('');
    setError(null);
  }, [supplier, isOpen]);

  // When selected invoice changes, pre-fill its balance
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const matched = unpaidInvoices.find(p => p.id === invId);
    if (matched) {
      setPaymentAmountUSD(String(matched.balanceOwedUSD));
    }
  };

  if (!isOpen || !supplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmountUSD);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select a funding bank or cash treasury account.');
      return;
    }

    // If an invoice is selected, settle against it
    let targetInvId = selectedInvoiceId;
    if (!targetInvId && unpaidInvoices.length > 0) {
      targetInvId = unpaidInvoices[0].id;
    }

    if (!targetInvId) {
      setError('No open purchase invoices found to apply payment against.');
      return;
    }

    const targetAcc = accounts.find(a => a.id === selectedAccountId);

    let settleNotes = notes.trim();
    if (paymentMethod === 'bank_transfer' && targetAcc?.type === 'bank' && isInterBank) {
      const amountNative = targetAcc.currency === 'USD' ? amount : Math.round(amount * settings.usdToLkrRate);
      let feeAmount = 0;
      if (targetAcc.interBankFeeType === 'percent') {
        feeAmount = Number(((amountNative * (targetAcc.interBankTransferFee || 0)) / 100).toFixed(2));
      } else {
        feeAmount = Number((targetAcc.interBankTransferFee || 0).toFixed(2));
      }
      if (feeAmount > 0) {
        const feeLabel = `${targetAcc.currency === 'USD' ? '$' : 'Rs. '}${feeAmount}`;
        settleNotes = settleNotes ? `${settleNotes} [Inter-bank fee: ${feeLabel}]` : `Inter-bank fee: ${feeLabel}`;
      }
    }

    recordSupplierPayment(targetInvId, {
      date,
      amountUSD: amount,
      amountLKR: Math.round(amount * settings.usdToLkrRate),
      paymentMethod,
      accountId: selectedAccountId,
      accountName: targetAcc?.name,
      reference: reference.trim() || undefined,
      notes: settleNotes || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                Record Supplier Payment
              </h3>
              <p className="text-xs text-secondary">
                Disburse funds to {supplier.companyName}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Supplier Owed Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-900 block">Total Balance Owed</span>
              <span className="text-xs font-semibold text-amber-950">{supplier.companyName}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-serif font-bold text-amber-900">${supplier.currentBalanceOwedUSD.toFixed(2)}</span>
              <span className="text-[10px] text-amber-800 block font-mono">Rs. {(supplier.currentBalanceOwedUSD * settings.usdToLkrRate).toLocaleString()}</span>
            </div>
          </div>

          {/* Supplier Bank Details */}
          {supplier.bankDetails && (
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-[10px] uppercase font-bold text-sky-900 block mb-1">Supplier Bank Details</span>
              <p className="text-xs text-sky-950 whitespace-pre-wrap leading-relaxed">
                {supplier.bankDetails}
              </p>
            </div>
          )}

          {/* Target Purchase Invoice Selection */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Apply Payment Against Invoice *
            </label>
            {unpaidInvoices.length === 0 ? (
              <div className="p-3 rounded-xl bg-surface-muted border border-border text-xs text-secondary italic">
                No unpaid invoices logged for this supplier.
              </div>
            ) : (
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              >
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    Invoice #{inv.invoiceNumber} — Balance Due: ${inv.balanceOwedUSD.toFixed(2)} (Date: {inv.date})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Payment Amount (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-secondary font-bold text-xs">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paymentAmountUSD}
                onChange={(e) => setPaymentAmountUSD(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface-muted border border-border rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
            {parseFloat(paymentAmountUSD) > 0 && (
              <p className="text-[11px] text-secondary mt-1 font-mono">
                Equivalent: <strong>LKR {Math.round(parseFloat(paymentAmountUSD) * settings.usdToLkrRate).toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* Funding Account Selection */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Funding Account *
            </label>
            <select
              required
              value={selectedAccountId}
              onChange={(e) => {
                const newAccId = e.target.value;
                setSelectedAccountId(newAccId);
                const acc = activeAccounts.find(a => a.id === newAccId);
                if (acc) {
                  if (acc.type === 'cash') setPaymentMethod('cash');
                  else if (acc.type === 'credit_card') setPaymentMethod('card');
                  else if (acc.type === 'bank') setPaymentMethod('bank_transfer');
                }
              }}
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition font-semibold"
            >
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()}) — {acc.currency === 'USD' ? '$' : 'Rs. '}{acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Restrictions */}
          {(() => {
            const curAcc = activeAccounts.find(a => a.id === selectedAccountId);
            if (curAcc?.type === 'cash') {
              return (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-bold">Cash Outflow (Fixed for Drawer Accounts)</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-200 px-2 py-0.5 rounded">Restricted</span>
                </div>
              );
            }
            if (curAcc?.type === 'credit_card') {
              return (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                  <span className="font-bold">Corporate VISA / Debit Card Payment</span>
                  <span className="text-[10px] font-bold uppercase bg-blue-200 px-2 py-0.5 rounded">Restricted</span>
                </div>
              );
            }
            if (curAcc?.type === 'bank') {
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-border bg-surface-muted text-text hover:bg-white'
                      }`}
                    >
                      Bank Transfer (EFT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cheque')}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        paymentMethod === 'cheque'
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-border bg-surface-muted text-text hover:bg-white'
                      }`}
                    >
                      Cheque Payment
                    </button>
                  </div>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="p-3 bg-surface-muted rounded-xl border border-border space-y-2">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                        Transfer Destination (Bank Charges)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsInterBank(false)}
                          className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                            !isInterBank
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                              : 'border-border bg-white text-secondary'
                          }`}
                        >
                          <div>Same Bank</div>
                          <span className="text-[10px] text-emerald-700 font-normal">No Transfer Fee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsInterBank(true)}
                          className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                            isInterBank
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                              : 'border-border bg-white text-secondary'
                          }`}
                        >
                          <div>Other Bank</div>
                          <span className="text-[10px] text-emerald-700 font-normal">
                            +{curAcc.interBankFeeType === 'percent' ? `${curAcc.interBankTransferFee || 0}%` : `${curAcc.currency === 'USD' ? '$' : 'Rs.'}${curAcc.interBankTransferFee || 50}`} Fee
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Payment Date
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
                Transaction Ref / Cheque #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TXN-KEELLS-AUG18"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Settlement Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full settlement for batch delivery #48 via Commercial Bank online"
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Disburse & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
