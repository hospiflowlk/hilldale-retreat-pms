import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  Calendar,
  DollarSign,
  Tag,
  User,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Account } from '../../types';

interface RecordTransactionModalProps {
  onClose: () => void;
  account: Account;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({ 
  onClose,
  account
}) => {
  const { recordDirectTransaction, settings } = useApp();

  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<string>('');
  const [payeeOrPayer, setPayeeOrPayer] = useState<string>('');
  const [category, setCategory] = useState<string>('Direct Cash Deposit');
  const [reference, setReference] = useState<string>(`DIR-${Date.now().toString().slice(-4)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const parsedAmount = parseFloat(amount) || 0;

  const incomeCategories = [
    'Direct Cash Deposit',
    'Owner / Partner Capital Infusion',
    'Bank Interest Income',
    'Direct Wire Deposit',
    'Miscellaneous Inflow'
  ];

  const expenseCategories = [
    'Bank Service / Maintenance Fees',
    'Cash Withdrawal / Vault Transfer',
    'Credit Card Annual Fee / Finance Charge',
    'Bank Loan Interest / Admin Fee',
    'Direct Miscellaneous Expense'
  ];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    recordDirectTransaction(
      account.id,
      type,
      parsedAmount,
      payeeOrPayer.trim() || (type === 'income' ? 'Direct Deposit' : 'Direct Disbursement'),
      category,
      date,
      reference.trim() || undefined,
      notes.trim() || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-xl max-w-md w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Direct Ledger Entry
            </span>
            <h2 className="text-xl font-bold font-serif text-text">
              Record Account Transaction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Account Badge */}
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">Account</span>
              <span className="text-sm font-bold text-text">{account.name}</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-border-focus">
              {account.currency} {account.balance.toLocaleString()}
            </span>
          </div>

          {/* Type Toggle: Money In / Money Out */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Transaction Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('Direct Cash Deposit');
                }}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  type === 'income'
                    ? 'bg-green-100 border-green-500 text-green-800 shadow-xs'
                    : 'bg-surface-muted border-border text-secondary hover:bg-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-green-600" />
                <span>Money In (Deposit / Credit)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('Bank Service / Maintenance Fees');
                }}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  type === 'expense'
                    ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-surface-muted border-border text-secondary hover:bg-white'
                }`}
              >
                <MinusCircle className="w-4 h-4 text-amber-700" />
                <span>Money Out (Charge / Debit)</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Transaction Amount ({account.currency}) <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-lg font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payee / Payer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              {type === 'income' ? 'Payer / Depositor' : 'Payee / Recipient'}
            </label>
            <input
              type="text"
              value={payeeOrPayer}
              onChange={(e) => setPayeeOrPayer(e.target.value)}
              placeholder={type === 'income' ? 'e.g. Resort Managing Director' : 'e.g. Commercial Bank Service Desk'}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Date and Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Ref / Voucher #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. DIR-102"
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly SMS alert charge from bank"
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
              <span>Record Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
