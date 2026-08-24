import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Wallet, 
  CreditCard, 
  Building, 
  Plus, 
  ArrowRightLeft, 
  Scale, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Download, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Receipt,
  MoreVertical,
  ShieldCheck,
  Percent,
  Layers,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAccounts } from '../../hooks/useAccounts';
import { Account, AccountType, AccountTransaction } from '../../types';
import { TransferFundsModal } from './TransferFundsModal';
import { NewAccountModal } from './NewAccountModal';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { RecordTransactionModal } from './RecordTransactionModal';

export const AccountsView: React.FC = () => {
  const {
    settings,
    formatCurrency,
    isNewAccountModalOpen,
    setIsNewAccountModalOpen,
    accountModalInitialType,
    setAccountModalInitialType,
    isTransferModalOpen,
    setIsTransferModalOpen,
    accountToEdit,
    setAccountToEdit,
    accountForAdjustment,
    setAccountForAdjustment,
    isAdjustBalanceModalOpen,
    setIsAdjustBalanceModalOpen,
    isRecordTxModalOpen,
    setIsRecordTxModalOpen,
  } = useApp();

  const {
    accounts,
    transactions: accountTransactions,
    deleteAccount,
  } = useAccounts();

  const deleteAccountTransaction = (id: string) => {};
  const clearAllAccountTransactions = () => {};

  const accountSummaryMetrics = useMemo(() => {
    const usdRate = Number(settings?.usdToLkrRate) || 305;
    
    let totalCashAndBankLKR = 0;
    let totalCreditCardLiabilityLKR = 0;
    let totalLoanLiabilityLKR = 0;

    (accounts || []).forEach(acc => {
      if (!acc.isActive) return;
      const balInLKR = acc.currency === 'USD' ? (Number((Number(acc.balance) || 0)) || 0) * usdRate : (Number((Number(acc.balance) || 0)) || 0);
      if (acc.type === 'cash' || acc.type === 'bank') {
        totalCashAndBankLKR += balInLKR;
      } else if (acc.type === 'credit_card') {
        totalCreditCardLiabilityLKR += balInLKR;
      } else if (acc.type === 'loan') {
        totalLoanLiabilityLKR += balInLKR;
      }
    });

    const netLiquidityLKR = totalCashAndBankLKR - totalCreditCardLiabilityLKR - totalLoanLiabilityLKR;
    const netLiquidityUSD = netLiquidityLKR / usdRate;
    const totalCashAndBankUSD = totalCashAndBankLKR / usdRate;
    const totalCreditCardLiabilityUSD = totalCreditCardLiabilityLKR / usdRate;
    const totalLoanLiabilityUSD = totalLoanLiabilityLKR / usdRate;

    return {
      totalCashAndBankLKR,
      totalCashAndBankUSD,
      totalCreditCardLiabilityLKR,
      totalCreditCardLiabilityUSD,
      totalLoanLiabilityLKR,
      totalLoanLiabilityUSD,
      netLiquidityLKR,
      netLiquidityUSD,
    };
  }, [accounts, settings]);

  const [accountForRecordTx, setAccountForRecordTx] = useState<Account | null>(null);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | AccountType>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_month' | 'last_month'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [preselectedTransferFromId, setPreselectedTransferFromId] = useState<string | undefined>(undefined);

  // In-App Deletion & Feedback States
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isConfirmClearAllTxOpen, setIsConfirmClearAllTxOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleOpenTransfer = (fromAccountId?: string) => {
    setPreselectedTransferFromId(fromAccountId);
    setIsTransferModalOpen(true);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (selectedTypeFilter !== 'all' && acc.type !== selectedTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchBank = (acc.bankName || '').toLowerCase().includes(q);
        const matchNum = (acc.accountNumber || '').toLowerCase().includes(q);
        return matchName || matchBank || matchNum;
      }
      return true;
    });
  }, [accounts, selectedTypeFilter, searchQuery]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.slice(0, 7);
    
    // Calculate last month string
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const lastYearMonth = d.toISOString().slice(0, 7);

    return accountTransactions.filter(tx => {
      // Account filter
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) {
        return false;
      }
      // Type filter
      if (selectedTypeFilter !== 'all') {
        const acc = accounts.find(a => a.id === tx.accountId);
        if (acc && acc.type !== selectedTypeFilter) return false;
      }
      // Tx Type filter
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) {
        return false;
      }
      // Date filter
      if (dateFilter === 'today' && tx.date !== todayStr) return false;
      if (dateFilter === 'this_month' && !tx.date.startsWith(currentYearMonth)) return false;
      if (dateFilter === 'last_month' && !tx.date.startsWith(lastYearMonth)) return false;

      // Text query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAcc = tx.accountName.toLowerCase().includes(q);
        const matchPayee = (tx.payeeOrPayer || '').toLowerCase().includes(q);
        const matchCategory = (tx.category || '').toLowerCase().includes(q);
        const matchRef = (tx.reference || '').toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        return matchAcc || matchPayee || matchCategory || matchRef || matchNotes;
      }

      return true;
    });
  }, [accountTransactions, selectedAccountId, selectedTypeFilter, txTypeFilter, dateFilter, searchQuery, accounts]);

  const handleAccountCreatedOrUpdated = (account: Account, isEdit: boolean) => {
    setSelectedTypeFilter('all');
    setSearchQuery('');
    setFeedbackToast({
      text: isEdit 
        ? `Financial account "${account.name}" updated successfully.` 
        : `Financial account "${account.name}" created and added to treasury ledger successfully.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleOpenAddAccount = (type?: AccountType) => {
    setAccountModalInitialType(type || 'bank');
    setAccountToEdit(null);
    setIsNewAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setAccountToEdit(acc);
    setIsNewAccountModalOpen(true);
  };

  const handleAdjustBalance = (acc: Account) => {
    setAccountForAdjustment(acc);
    setIsAdjustBalanceModalOpen(true);
  };

  const handleRecordDirectTx = (acc: Account) => {
    setAccountForRecordTx(acc);
    setIsRecordTxModalOpen(true);
  };

  const handleDeleteAccount = (acc: Account) => {
    setAccountToDelete(acc);
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const deletedName = accountToDelete.name;
    deleteAccount(accountToDelete.id);
    setFeedbackToast({
      text: `Financial account "${deletedName}" has been successfully removed.`,
      type: 'success'
    });
    setAccountToDelete(null);
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4 text-primary" />
            <span>Hilldale Retreat Financial Suite</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-text">
            Accounts & Treasury Management
          </h1>
          <p className="text-xs text-secondary-dark mt-0.5">
            Real-time multi-currency bank accounts, cash drawers, corporate credit cards & liability debt tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-open-transfer-funds"
            onClick={() => handleOpenTransfer()}
            className="px-4 py-2 bg-surface-muted hover:bg-border text-text font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-border flex items-center gap-1.5 shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => handleOpenAddAccount('bank')}
            className="px-4 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackToast.text}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-gray-500 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Liquidity */}
        <div className="bg-white p-4.5 rounded-2xl border border-border shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Net Liquid Position
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-serif text-text tracking-tight">
            Rs. {accountSummaryMetrics.netLiquidityLKR.toLocaleString()}
          </div>
          <div className="text-xs font-mono font-semibold text-primary mt-0.5">
            ${accountSummaryMetrics.netLiquidityUSD.toLocaleString()} USD
          </div>
          <p className="text-[10px] text-secondary mt-2 border-t border-border/60 pt-1.5 flex justify-between">
            <span>Cash & Bank Assets less All Liabilities</span>
          </p>
        </div>

        {/* 2. Total Cash & Bank Assets */}
        <div className="bg-white p-4.5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Cash & Banks (Assets)
            </span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-serif text-green-800 tracking-tight">
            Rs. {accountSummaryMetrics.totalCashAndBankLKR.toLocaleString()}
          </div>
          <div className="text-xs font-mono font-semibold text-green-700 mt-0.5">
            ${accountSummaryMetrics.totalCashAndBankUSD.toLocaleString()} USD
          </div>
          <p className="text-[10px] text-secondary mt-2 border-t border-border/60 pt-1.5">
            {accounts.filter(a => (a.type === 'cash' || a.type === 'bank') && a.isActive).length} Active bank accounts & drawers
          </p>
        </div>

        {/* 3. Credit Card Outstandings */}
        <div className="bg-white p-4.5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Credit Card Liabilities
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-serif text-amber-800 tracking-tight">
            Rs. {accountSummaryMetrics.totalCreditCardLiabilityLKR.toLocaleString()}
          </div>
          <div className="text-xs font-mono font-semibold text-amber-700 mt-0.5">
            ${accountSummaryMetrics.totalCreditCardLiabilityUSD.toLocaleString()} USD
          </div>
          <p className="text-[10px] text-secondary mt-2 border-t border-border/60 pt-1.5">
            Outstanding revolving card charges
          </p>
        </div>

        {/* 4. Term Loans & Borrowings */}
        <div className="bg-white p-4.5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Loan & Borrowing Debt
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-serif text-rose-800 tracking-tight">
            Rs. {accountSummaryMetrics.totalLoanLiabilityLKR.toLocaleString()}
          </div>
          <div className="text-xs font-mono font-semibold text-rose-700 mt-0.5">
            ${accountSummaryMetrics.totalLoanLiabilityUSD.toLocaleString()} USD
          </div>
          <p className="text-[10px] text-secondary mt-2 border-t border-border/60 pt-1.5">
            Remaining commercial principal debt
          </p>
        </div>
      </div>

      {/* Account Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'All Accounts', count: accounts.length, icon: Layers },
            { id: 'bank', label: 'Bank Accounts', count: accounts.filter(a => a.type === 'bank').length, icon: Landmark },
            { id: 'cash', label: 'Cash & Drawers', count: accounts.filter(a => a.type === 'cash').length, icon: Wallet },
            { id: 'credit_card', label: 'Credit Cards', count: accounts.filter(a => a.type === 'credit_card').length, icon: CreditCard },
            { id: 'loan', label: 'Loans & Debt', count: accounts.filter(a => a.type === 'loan').length, icon: Building },
          ].map(tab => {
            const isSelected = selectedTypeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white border border-border text-secondary-dark hover:text-text hover:bg-surface-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-secondary-light text-primary' : 'bg-surface-muted text-secondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddAccount(selectedTypeFilter === 'all' ? 'bank' : selectedTypeFilter)}
            className="text-xs font-bold text-primary hover:text-[#4d5541] flex items-center gap-1 bg-primary-light/60 px-3 py-1.5 rounded-xl border border-border-focus transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New {selectedTypeFilter === 'all' ? 'Account' : selectedTypeFilter.replace('_', ' ')}</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-border-focus p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto shadow-2xs">
              <Landmark className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold font-serif text-text">
                {accounts.length === 0 ? 'No Financial Accounts Registered' : 'No Accounts Found in this Filter'}
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                {accounts.length === 0 
                  ? 'Add your primary commercial bank accounts, front desk cash drawers, credit cards, or term loans to track balances and reconcile payments.' 
                  : `No accounts matching category "${selectedTypeFilter}" or search query "${searchQuery}".`}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenAddAccount('bank')}
                className="px-4 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddAccount('cash')}
                className="px-4 py-2 bg-surface-muted hover:bg-primary-light text-primary font-bold text-xs uppercase tracking-wider rounded-xl border border-border-focus transition cursor-pointer flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Add Cash Drawer</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddAccount('credit_card')}
                className="px-4 py-2 bg-surface-muted hover:bg-primary-light text-primary font-bold text-xs uppercase tracking-wider rounded-xl border border-border-focus transition cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Add Credit Card</span>
              </button>
            </div>
          </div>
        ) : (
          filteredAccounts.map(account => {
          const isAsset = account.type === 'cash' || account.type === 'bank';
          const isCreditCard = account.type === 'credit_card';
          const isLoan = account.type === 'loan';

          const cardLimit = account.creditLimit || 0;
          const cardUtilization = cardLimit > 0 ? Math.min(100, Math.round((account.balance / cardLimit) * 100)) : 0;
          const availableCredit = Math.max(0, cardLimit - account.balance);

          const originalLoan = account.initialLoanAmount || (account.balance * 1.3);
          const loanPaidPct = originalLoan > 0 ? Math.min(100, Math.max(0, Math.round(((originalLoan - account.balance) / originalLoan) * 100))) : 0;

          return (
            <div 
              key={account.id}
              className={`bg-white rounded-2xl border transition-all duration-150 p-5 shadow-xs flex flex-col justify-between ${
                account.isActive ? 'border-border hover:shadow-md' : 'border-dashed border-border-focus opacity-75'
              }`}
            >
              <div>
                {/* Card Top: Type, Currency Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold"
                      style={{ backgroundColor: account.color || '#5A634D' }}
                    >
                      {account.type === 'bank' && <Landmark className="w-4 h-4" />}
                      {account.type === 'cash' && <Wallet className="w-4 h-4" />}
                      {account.type === 'credit_card' && <CreditCard className="w-4 h-4" />}
                      {account.type === 'loan' && <Building className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block leading-tight">
                        {account.type === 'credit_card' ? 'Credit Card' : account.type === 'loan' ? 'Term Debt' : account.type === 'cash' ? 'Cash Box' : 'Bank Account'}
                      </span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {account.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!account.isActive && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Inactive
                      </span>
                    )}
                    <button
                      onClick={() => handleEditAccount(account)}
                      title="Edit Account Details"
                      className="p-1.5 text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account)}
                      title="Delete Account"
                      className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Account Name & Bank */}
                <div className="mb-3">
                  <h3 className="text-base font-bold font-serif text-text leading-snug line-clamp-1">
                    {account.name}
                  </h3>
                  <div className="text-xs text-secondary mt-0.5 flex items-center gap-2 font-mono">
                    {account.bankName && <span>{account.bankName}</span>}
                    {account.accountNumber && (
                      <span className="bg-surface-muted px-1.5 py-0.5 rounded text-[11px] text-text">
                        {account.accountNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Balance Display */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-border/80 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-0.5">
                    {isAsset ? 'Available Balance' : 'Outstanding Balance Owed'}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className={`text-xl font-bold font-mono ${
                      isAsset 
                        ? 'text-text' 
                        : isCreditCard 
                          ? 'text-amber-800' 
                          : 'text-rose-800'
                    }`}>
                      {account.currency === 'USD' ? '$' : 'Rs. '}
                      {account.balance.toLocaleString()}
                    </div>
                    <span className="text-xs font-mono text-secondary">
                      {account.currency === 'LKR' 
                        ? `$${Math.round(account.balance / settings.usdToLkrRate).toLocaleString()} USD`
                        : `Rs. ${Math.round(account.balance * settings.usdToLkrRate).toLocaleString()} LKR`}
                    </span>
                  </div>

                  {/* Credit Card Utilization Bar */}
                  {isCreditCard && cardLimit > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/60">
                      <div className="flex justify-between text-[10px] text-secondary mb-1 font-mono">
                        <span>Limit: Rs. {cardLimit.toLocaleString()}</span>
                        <span>Avail: Rs. {availableCredit.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            cardUtilization > 80 ? 'bg-red-500' : cardUtilization > 50 ? 'bg-amber-500' : 'bg-primary'
                          }`}
                          style={{ width: `${cardUtilization}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-secondary mt-1">
                        <span>{cardUtilization}% Utilized</span>
                        {account.dueDate && <span>Due: {account.dueDate}</span>}
                      </div>
                    </div>
                  )}

                  {/* Loan Repayment Progress */}
                  {isLoan && (
                    <div className="mt-2.5 pt-2 border-t border-border/60">
                      <div className="flex justify-between text-[10px] text-secondary mb-1 font-mono">
                        <span>Repaid: {loanPaidPct}%</span>
                        {account.interestRate && <span>APR: {account.interestRate}%</span>}
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${loanPaidPct}%` }}
                        />
                      </div>
                      {account.monthlyPayment && (
                        <div className="text-[9px] text-secondary mt-1 flex justify-between font-mono">
                          <span>Monthly EMI: Rs. {account.monthlyPayment.toLocaleString()}</span>
                          {account.dueDate && <span>Due: {account.dueDate}</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Bank Account Fee & Commission Indicators */}
                  {account.type === 'bank' && (account.interBankTransferFee !== undefined || account.cardCommissionPercent !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap gap-1.5 text-[10px] text-secondary">
                      {account.interBankTransferFee !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-border/80 font-mono">
                          Inter-Bank: {account.interBankFeeType === 'percent' ? `${account.interBankTransferFee}%` : `${account.currency === 'USD' ? '$' : 'Rs. '}${account.interBankTransferFee}`}
                        </span>
                      )}
                      {account.cardCommissionPercent !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-border/80 font-mono">
                          Card Comm: {account.cardCommissionPercent}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {account.description && (
                  <p className="text-[11px] text-secondary italic mb-3 line-clamp-2">
                    "{account.description}"
                  </p>
                )}
              </div>

              {/* Quick Action Buttons for Account */}
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-border">
                <button
                  onClick={() => handleOpenTransfer(account.id)}
                  title={`Transfer from ${account.name}`}
                  className="px-1.5 py-1.5 bg-surface-muted hover:bg-primary-light text-primary text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Transfer</span>
                </button>

                <button
                  onClick={() => handleRecordDirectTx(account)}
                  title="Record direct debit/credit entry"
                  className="px-1.5 py-1.5 bg-surface-muted hover:bg-border text-text text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <PlusCircle className="w-3 h-3 text-primary" />
                  <span>Entry</span>
                </button>

                <button
                  onClick={() => handleAdjustBalance(account)}
                  title="Reconcile balance against bank statement"
                  className="px-1.5 py-1.5 bg-surface-muted hover:bg-border text-text text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <Scale className="w-3 h-3 text-secondary" />
                  <span>Reconcile</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedAccountId(account.id);
                    const el = document.getElementById('account-ledger-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title="View ledger journal for this account"
                  className="px-1.5 py-1.5 bg-primary-light/70 hover:bg-primary-light text-primary text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5"
                >
                  <FileText className="w-3 h-3" />
                  <span>Ledger</span>
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Account Master Ledger & Transaction Journal Section */}
      <div id="account-ledger-section" className="bg-white rounded-2xl border border-border shadow-xs p-6 space-y-4">
        {/* Ledger Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Double-Entry Financial Journal
            </span>
            <h2 className="text-lg font-bold font-serif text-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Account Ledger & Movement Journal</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Account Filter Dropdown */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text focus:outline-hidden focus:border-primary"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency} {a.balance.toLocaleString()})
                </option>
              ))}
            </select>

            {/* Tx Type Filter */}
            <select
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
              className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text focus:outline-hidden focus:border-primary"
            >
              <option value="all">All Transaction Types</option>
              <option value="pos_settlement">POS Restaurant Settlements</option>
              <option value="folio_settlement">Room Folio Settlements</option>
              <option value="expense">Operating Expenses</option>
              <option value="payroll_payout">Staff Payroll Disbursals</option>
              <option value="transfer_in">Transfers In</option>
              <option value="transfer_out">Transfers Out</option>
              <option value="credit_card_charge">Credit Card Charges</option>
              <option value="credit_card_payment">Card Bill Payments</option>
              <option value="loan_repayment">Loan Principal Repayments</option>
              <option value="adjustment">Audit Adjustments</option>
            </select>

            {/* Date Range Selector */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text focus:outline-hidden focus:border-primary"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            {/* Clear All Transactions Button */}
            {accountTransactions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearAllTxOpen(true)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Delete all mock/test records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payee, Guest, Reference #, Account Name, or Category..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
          />
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-[10px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Transaction / Type</th>
                <th className="py-3 px-4">Payee / Payer & Notes</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Inflow (Debit)</th>
                <th className="py-3 px-4 text-right">Outflow (Credit)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D6]/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-secondary text-xs">
                    <FileText className="w-8 h-8 mx-auto text-border-focus mb-2" />
                    <span>No ledger transactions match the selected criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const targetAcc = accounts.find(a => a.id === tx.accountId);
                  const isMoneyIn = tx.direction === 'in';

                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5] transition">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-secondary-dark">
                        {tx.date}
                      </td>

                      {/* Account */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-text text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: targetAcc?.color || '#5A634D' }} />
                          <span>{tx.accountName}</span>
                        </div>
                        <span className="text-[10px] text-secondary font-mono">
                          {targetAcc?.currency || 'LKR'}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'pos_settlement' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          tx.type === 'folio_settlement' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          tx.type === 'expense' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                          tx.type === 'payroll_payout' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          tx.type === 'transfer_in' || tx.type === 'transfer_out' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                          tx.type === 'credit_card_charge' ? 'bg-orange-50 text-orange-900 border border-orange-200' :
                          tx.type === 'credit_card_payment' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          tx.type === 'loan_repayment' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          'bg-gray-50 text-gray-800 border border-gray-200'
                        }`}>
                          {isMoneyIn ? <ArrowDownLeft className="w-3 h-3 text-green-600" /> : <ArrowUpRight className="w-3 h-3 text-amber-700" />}
                          <span>{tx.type.replace(/_/g, ' ')}</span>
                        </span>
                        {tx.category && (
                          <div className="text-[10px] text-secondary mt-0.5">
                            {tx.category}
                          </div>
                        )}
                      </td>

                      {/* Payee / Description / Notes */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text text-xs">
                          {tx.payeeOrPayer || '—'}
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-secondary line-clamp-1 mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                        {tx.transferRelatedAccountName && (
                          <div className="text-[10px] text-primary font-medium mt-0.5">
                            ⇄ Linked: {tx.transferRelatedAccountName}
                          </div>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-secondary-dark">
                        {tx.reference ? (
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded text-[11px] font-semibold text-text">
                            {tx.reference}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Inflow (Debit) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs font-bold text-green-700">
                        {isMoneyIn ? (
                          <span>+{targetAcc?.currency === 'USD' ? '$' : 'Rs. '}{tx.amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-secondary/40">—</span>
                        )}
                      </td>

                      {/* Outflow (Credit) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs font-bold text-text">
                        {!isMoneyIn ? (
                          <span>-{targetAcc?.currency === 'USD' ? '$' : 'Rs. '}{tx.amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-secondary/40">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs font-bold text-primary bg-[#FAF8F5]/60">
                        {targetAcc?.currency === 'USD' ? '$' : 'Rs. '}
                        {tx.runningBalance.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            deleteAccountTransaction(tx.id);
                            setFeedbackToast({
                              text: 'Transaction record removed from ledger.',
                              type: 'success'
                            });
                            setTimeout(() => setFeedbackToast(null), 3000);
                          }}
                          className="p-1 rounded-lg text-secondary hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Ledger Footer Metrics */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-secondary pt-2 border-t border-border">
          <span>Showing {filteredTransactions.length} recorded journal entries</span>
          <span className="font-mono text-[11px]">
            Hilldale Retreat Dual Currency Rate: 1 USD = Rs. {settings.usdToLkrRate} LKR
          </span>
        </div>
      </div>

      {/* Account Operations Modals */}
      {isTransferModalOpen && (
        <TransferFundsModal
          onClose={() => {
            setIsTransferModalOpen(false);
            setPreselectedTransferFromId(undefined);
          }}
          preselectedFromAccountId={preselectedTransferFromId}
        />
      )}

      {isNewAccountModalOpen && (
        <NewAccountModal
          onClose={() => {
            setIsNewAccountModalOpen(false);
            setAccountToEdit(null);
          }}
          onSuccess={handleAccountCreatedOrUpdated}
          editAccount={accountToEdit}
          initialType={accountModalInitialType}
        />
      )}

      {isAdjustBalanceModalOpen && accountForAdjustment && (
        <AdjustBalanceModal
          account={accountForAdjustment}
          onClose={() => {
            setIsAdjustBalanceModalOpen(false);
            setAccountForAdjustment(null);
          }}
        />
      )}

      {isRecordTxModalOpen && accountForRecordTx && (
        <RecordTransactionModal
          account={accountForRecordTx}
          onClose={() => {
            setIsRecordTxModalOpen(false);
            setAccountForRecordTx(null);
          }}
        />
      )}

      {/* Delete Account In-App Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-red-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">Remove Financial Account</h3>
                  <p className="text-xs text-red-700">Treasury & Ledger Maintenance</p>
                </div>
              </div>
              <button 
                onClick={() => setAccountToDelete(null)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-border flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: accountToDelete.color || '#5A634D' }}
                >
                  {accountToDelete.type === 'bank' && <Landmark className="w-6 h-6" />}
                  {accountToDelete.type === 'cash' && <Wallet className="w-6 h-6" />}
                  {accountToDelete.type === 'credit_card' && <CreditCard className="w-6 h-6" />}
                  {accountToDelete.type === 'loan' && <Building className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-text truncate">{accountToDelete.name}</h4>
                  <div className="text-xs text-secondary flex items-center gap-2 mt-0.5 font-mono">
                    <span>{accountToDelete.currency}</span>
                    <span>•</span>
                    <span className="capitalize">{accountToDelete.type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-xs font-bold text-primary mt-1 font-mono">
                    Balance: {accountToDelete.currency === 'USD' ? '$' : 'Rs. '}{accountToDelete.balance.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Are you sure you want to remove this account?</p>
                  <p className="text-amber-800 mt-1">
                    This account will no longer appear in active cash drawers, POS checkout selectors, or transfer forms. All past historical ledger transactions associated with this account will remain safely archived for audit integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-border text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Remove Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear All Transactions Modal */}
      {isConfirmClearAllTxOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">Delete All Ledger Records</h3>
                  <p className="text-xs text-red-700">Mock Data & Journal Reset</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsConfirmClearAllTxOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Are you sure you want to delete all {accountTransactions.length} transaction records?</p>
                  <p className="text-amber-800 mt-1">
                    This will wipe all test & mock movement journal entries and restore accounts to their clean initial opening balances.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllTxOpen(false)}
                className="px-4 py-2 bg-white hover:bg-border text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllAccountTransactions();
                  setIsConfirmClearAllTxOpen(false);
                  setFeedbackToast({
                    text: 'All mock transaction records have been deleted and accounts reset.',
                    type: 'success'
                  });
                  setTimeout(() => setFeedbackToast(null), 4000);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
