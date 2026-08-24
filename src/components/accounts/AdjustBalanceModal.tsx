import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Check, 
  AlertCircle, 
  Calendar,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Account } from '../../types';

interface AdjustBalanceModalProps {
  onClose: () => void;
  account: Account;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({ 
  onClose,
  account
}) => {
  const { adjustAccountBalance } = useApp();

  const [newBalance, setNewBalance] = useState<string>(String(account.balance));
  const [reason, setReason] = useState<string>('End-of-month bank statement balance reconciliation');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const parsedNewBalance = parseFloat(newBalance) || 0;
  const delta = parsedNewBalance - account.balance;

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedNewBalance)) return;

    adjustAccountBalance(account.id, parsedNewBalance, reason.trim(), date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-xl max-w-md w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Audit & Reconciliation
            </span>
            <h2 className="text-xl font-bold font-serif text-text flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <span>Reconcile / Adjust Balance</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdjust} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Target Account
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">{account.name}</span>
              <span className="text-xs font-mono font-bold text-primary uppercase bg-primary-light px-2 py-0.5 rounded-md border border-border-focus">
                {account.currency}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Recorded System Balance: <span className="font-mono font-bold text-text">{account.currency} {account.balance.toLocaleString()}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Actual Reconciled Balance ({account.currency}) <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-lg font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Delta Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border text-xs font-mono">
            <span className="text-secondary font-sans font-semibold">Adjustment Delta:</span>
            <span className={`font-bold ${
              delta > 0 ? 'text-green-700' : delta < 0 ? 'text-amber-700' : 'text-secondary'
            }`}>
              {delta > 0 ? `+${account.currency} ${delta.toLocaleString()}` : delta < 0 ? `-${account.currency} ${Math.abs(delta).toLocaleString()}` : 'No Change (0.00)'}
            </span>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Reconciliation Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Audit Reason / Reconciliation Note <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical Cash Count verification, Bank Interest Credit adjustment"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
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
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
