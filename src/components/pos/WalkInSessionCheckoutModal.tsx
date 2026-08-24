import React, { useState } from 'react';
import { X, CreditCard, Banknote, Building2, Wallet, CheckCircle2, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePOS } from '../../hooks/usePOS';
import { useAccounts } from '../../hooks/useAccounts';
import { PaymentMethod } from '../../types';

interface WalkInSessionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const WalkInSessionCheckoutModal: React.FC<WalkInSessionCheckoutModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const { settings } = useApp();
  const { checkoutWalkInSession } = usePOS();
  const { walkInSessions, orders } = usePOS();
  const { accounts } = useAccounts();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  if (!isOpen) return null;

  const session = walkInSessions.find(s => s.id === sessionId);
  if (!session) return null;

  // Active child orders for this walk-in session
  const sessionOrders = orders.filter(o => o.sessionId === sessionId && o.status !== 'cancelled' && o.status !== 'paid');
  const posBalance = sessionOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const subtotal = sessionOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const serviceCharge = sessionOrders.reduce((sum, o) => sum + o.serviceChargeAmount, 0);
  const discount = sessionOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const tax = sessionOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalItemsCount = sessionOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  const activeAccounts = accounts.filter(a => a.isActive);

  // Set default account based on payment method
  React.useEffect(() => {
    if (paymentMethod === 'cash') {
      const cashAcc = activeAccounts.find(a => a.type === 'cash');
      if (cashAcc) setSelectedAccountId(cashAcc.id);
    } else if (paymentMethod === 'card' || paymentMethod === 'bank_transfer') {
      const bankAcc = activeAccounts.find(a => a.type === 'bank');
      if (bankAcc) setSelectedAccountId(bankAcc.id);
    }
  }, [paymentMethod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkoutWalkInSession(sessionId);
    onClose();
  };

  const getChange = () => {
    if (paymentMethod === 'cash' && cashGiven > posBalance) {
      return Number((cashGiven - posBalance).toFixed(2));
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-text/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-text flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border bg-surface-muted flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-white">
                Final Bill Settlement
              </span>
              <span className="font-mono text-xs text-secondary">{session.id}</span>
            </div>
            <h2 className="text-xl font-bold text-text font-serif">Checkout Walk-In Tab</h2>
            <p className="text-xs text-secondary-dark">{session.guestName} • {session.location || 'Walk-in Table'} • {session.numberOfGuests} Guests</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Bill Summary Breakdown */}
          <div className="bg-surface-muted p-4 rounded-2xl border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs text-secondary pb-2 border-b border-border/60">
              <span className="font-medium">Orders Attached:</span>
              <span className="font-bold text-text">{sessionOrders.length} tickets ({totalItemsCount} items)</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-secondary">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">${(Number(subtotal) || 0).toFixed(2)}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Service Charge ({(settings.defaultServiceChargeRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono font-medium">${(Number(serviceCharge) || 0).toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-${(Number(discount) || 0).toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Tax:</span>
                  <span className="font-mono font-medium">${(Number(tax) || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Amount Due</span>
              <div className="text-2xl font-bold font-mono text-primary-dark">
                ${(Number(posBalance) || 0).toFixed(2)}
                <span className="text-xs font-normal text-secondary ml-1 font-sans">
                  (Rs. {(posBalance * settings.usdToLkrRate).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'card' ? 'bg-primary-light border-primary ring-1 ring-primary shadow-sm text-primary font-bold' : 'bg-white border-border text-secondary hover:border-secondary'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Credit / Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cash' ? 'bg-primary-light border-primary ring-1 ring-primary shadow-sm text-primary font-bold' : 'bg-white border-border text-secondary hover:border-secondary'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3 rounded-xl border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'bank_transfer' ? 'bg-primary-light border-primary ring-1 ring-primary shadow-sm text-primary font-bold' : 'bg-white border-border text-secondary hover:border-secondary'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Bank Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'card' && selectedAccountId.includes('wallet') ? 'bg-primary-light border-primary ring-1 ring-primary shadow-sm text-primary font-bold' : 'bg-white border-border text-secondary hover:border-secondary'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-xs">Digital / Mobile Pay</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered Input */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2 bg-surface-muted p-3.5 rounded-2xl border border-border animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">Cash Tendered ($)</label>
              <input
                type="number"
                min={posBalance}
                step="0.01"
                value={cashGiven || ''}
                onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                placeholder={`Min $${(Number(posBalance) || 0).toFixed(2)}`}
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-base font-mono font-bold text-text focus:border-primary focus:outline-none"
              />
              {getChange() > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span>Change to return to guest:</span>
                  <span className="font-mono text-sm">${getChange().toFixed(2)} (Rs. {(getChange() * settings.usdToLkrRate).toLocaleString()})</span>
                </div>
              )}
            </div>
          )}

          {/* Deposit Account */}
          {activeAccounts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">Deposit Revenue To Treasury Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none"
                required
              >
                <option value="">Select Treasury Account</option>
                {activeAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency} • Balance: {acc.currency === 'USD' ? '$' : 'Rs.'}{acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Settle Button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-[#4d5541] text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm text-xs uppercase tracking-wider"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Settle & Post Master Invoice (${(Number(posBalance) || 0).toFixed(2)})</span>
          </button>
        </form>
      </div>
    </div>
  );
};