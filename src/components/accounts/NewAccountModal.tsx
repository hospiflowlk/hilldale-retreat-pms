import React, { useState, useEffect } from 'react';
import { 
  X, 
  Landmark, 
  Wallet, 
  CreditCard, 
  Building, 
  Check, 
  HelpCircle,
  Percent,
  Calendar,
  DollarSign,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Account, AccountType } from '../../types';

interface NewAccountModalProps {
  onClose: () => void;
  onSuccess?: (account: Account, isEdit: boolean) => void;
  editAccount?: Account | null;
  initialType?: AccountType;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ 
  onClose, 
  onSuccess,
  editAccount,
  initialType = 'bank'
}) => {
  const { addAccount, updateAccount, deleteAccount, settings } = useApp();

  const [type, setType] = useState<AccountType>(editAccount?.type || initialType);
  const [name, setName] = useState<string>(editAccount?.name || '');
  const [accountNumber, setAccountNumber] = useState<string>(editAccount?.accountNumber || '');
  const [bankName, setBankName] = useState<string>(editAccount?.bankName || '');
  const [branch, setBranch] = useState<string>(editAccount?.branch || '');
  const [currency, setCurrency] = useState<'USD' | 'LKR'>(editAccount?.currency || (initialType === 'bank' ? 'LKR' : 'LKR'));
  const [openingBalance, setOpeningBalance] = useState<string>(editAccount ? String(editAccount.openingBalance) : '0');
  const [balance, setBalance] = useState<string>(editAccount ? String(editAccount.balance) : '0');
  const [description, setDescription] = useState<string>(editAccount?.description || '');
  const [color, setColor] = useState<string>(editAccount?.color || '#2B5329');
  const [isActive, setIsActive] = useState<boolean>(editAccount ? editAccount.isActive : true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Credit card specific fields
  const [creditLimit, setCreditLimit] = useState<string>(editAccount?.creditLimit ? String(editAccount.creditLimit) : '');
  const [billingCycleDay, setBillingCycleDay] = useState<string>(editAccount?.billingCycleDay ? String(editAccount.billingCycleDay) : '15');
  const [interestRate, setInterestRate] = useState<string>(editAccount?.interestRate ? String(editAccount.interestRate) : '');

  // Loan specific fields
  const [principalAmount, setPrincipalAmount] = useState<string>(editAccount?.principalAmount ? String(editAccount.principalAmount) : '');
  const [loanTermMonths, setLoanTermMonths] = useState<string>(editAccount?.loanTermMonths ? String(editAccount.loanTermMonths) : '36');
  const [monthlyInstallment, setMonthlyInstallment] = useState<string>(editAccount?.monthlyInstallment ? String(editAccount.monthlyInstallment) : '');

  // Bank charges & merchant commission rates
  const [interBankTransferFee, setInterBankTransferFee] = useState<string>(editAccount?.interBankTransferFee !== undefined ? String(editAccount.interBankTransferFee) : '50');
  const [interBankFeeType, setInterBankFeeType] = useState<'flat' | 'percent'>(editAccount?.interBankFeeType || 'flat');
  const [cardCommissionPercent, setCardCommissionPercent] = useState<string>(editAccount?.cardCommissionPercent !== undefined ? String(editAccount.cardCommissionPercent) : '2.5');
  const [chequeClearingFee, setChequeClearingFee] = useState<string>(editAccount?.chequeClearingFee !== undefined ? String(editAccount.chequeClearingFee) : '0');

  // Sync state whenever modal is opened or editAccount / initialType changes
  useEffect(() => {
    if (editAccount) {
      setType(editAccount.type);
      setName(editAccount.name);
      setAccountNumber(editAccount.accountNumber || '');
      setBankName(editAccount.bankName || '');
      setBranch(editAccount.branch || '');
      setCurrency(editAccount.currency);
      setOpeningBalance(String(editAccount.openingBalance || 0));
      setBalance(String(editAccount.balance || 0));
      setDescription(editAccount.description || '');
      setColor(editAccount.color || (editAccount.type === 'bank' ? '#2B5329' : editAccount.type === 'cash' ? '#5A634D' : editAccount.type === 'credit_card' ? '#B45309' : '#991B1B'));
      setIsActive(editAccount.isActive);
      setCreditLimit(editAccount.creditLimit ? String(editAccount.creditLimit) : '');
      setBillingCycleDay(editAccount.billingCycleDay ? String(editAccount.billingCycleDay) : '15');
      setInterestRate(editAccount.interestRate ? String(editAccount.interestRate) : '');
      setPrincipalAmount(editAccount.principalAmount ? String(editAccount.principalAmount) : '');
      setLoanTermMonths(editAccount.loanTermMonths ? String(editAccount.loanTermMonths) : '36');
      setMonthlyInstallment(editAccount.monthlyInstallment ? String(editAccount.monthlyInstallment) : '');
      setInterBankTransferFee(editAccount.interBankTransferFee !== undefined ? String(editAccount.interBankTransferFee) : '50');
      setInterBankFeeType(editAccount.interBankFeeType || 'flat');
      setCardCommissionPercent(editAccount.cardCommissionPercent !== undefined ? String(editAccount.cardCommissionPercent) : '2.5');
      setChequeClearingFee(editAccount.chequeClearingFee !== undefined ? String(editAccount.chequeClearingFee) : '0');
    } else {
      const defaultColor = initialType === 'bank' ? '#2B5329' : initialType === 'cash' ? '#5A634D' : initialType === 'credit_card' ? '#B45309' : '#991B1B';
      setType(initialType);
      setName('');
      setAccountNumber('');
      setBankName('');
      setBranch('');
      setCurrency(initialType === 'bank' ? 'LKR' : 'LKR');
      setOpeningBalance('0');
      setBalance('0');
      setDescription('');
      setColor(defaultColor);
      setIsActive(true);
      setCreditLimit('');
      setBillingCycleDay('15');
      setInterestRate('');
      setPrincipalAmount('');
      setLoanTermMonths('36');
      setMonthlyInstallment('');
      setInterBankTransferFee('50');
      setInterBankFeeType('flat');
      setCardCommissionPercent('2.5');
      setChequeClearingFee('0');
    }
    setValidationError('');
    setShowDeleteConfirm(false);
  }, [editAccount, initialType]);

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    if (!editAccount) {
      if (newType === 'bank') setColor('#2B5329');
      else if (newType === 'cash') setColor('#5A634D');
      else if (newType === 'credit_card') setColor('#B45309');
      else if (newType === 'loan') setColor('#991B1B');
    }
  };

  const applyPreset = (preset: {
    type: AccountType;
    name: string;
    currency: 'USD' | 'LKR';
    bankName: string;
    accountNumber: string;
    branch: string;
    openingBalance: string;
    color: string;
    description: string;
  }) => {
    setType(preset.type);
    setName(preset.name);
    setCurrency(preset.currency);
    setBankName(preset.bankName);
    setAccountNumber(preset.accountNumber);
    setBranch(preset.branch);
    setOpeningBalance(preset.openingBalance);
    setColor(preset.color);
    setDescription(preset.description);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Smart Fallback Naming: If name is blank, generate an intelligent label
    let finalName = name.trim();
    if (!finalName) {
      if (bankName.trim()) {
        finalName = `${bankName.trim()} ${accountNumber.trim() ? `(${accountNumber.trim()})` : ''} - ${currency}`;
      } else if (type === 'bank') {
        finalName = `Commercial Bank (${currency})`;
      } else if (type === 'cash') {
        finalName = `Cash Drawer Float (${currency})`;
      } else if (type === 'credit_card') {
        finalName = `Corporate Credit Card (${currency})`;
      } else {
        finalName = `Treasury Debt Account (${currency})`;
      }
    }

    setValidationError('');
    const opBal = parseFloat(openingBalance) || 0;
    const curBal = editAccount ? (parseFloat(balance) || 0) : opBal;

    const accountData = {
      name: finalName,
      type,
      accountNumber: accountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      branch: branch.trim() || undefined,
      currency,
      openingBalance: opBal,
      openingDate: new Date().toISOString().split('T')[0],
      balance: curBal,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      loanTermMonths: loanTermMonths ? parseInt(loanTermMonths) : undefined,
      principalAmount: principalAmount ? parseFloat(principalAmount) : undefined,
      monthlyInstallment: monthlyInstallment ? parseFloat(monthlyInstallment) : undefined,
      billingCycleDay: billingCycleDay ? parseInt(billingCycleDay) : undefined,
      interBankTransferFee: interBankTransferFee ? parseFloat(interBankTransferFee) : undefined,
      interBankFeeType: interBankFeeType,
      cardCommissionPercent: cardCommissionPercent ? parseFloat(cardCommissionPercent) : undefined,
      chequeClearingFee: chequeClearingFee ? parseFloat(chequeClearingFee) : undefined,
      description: description.trim() || undefined,
      color: color || '#2B5329',
      isActive,
    };

    if (editAccount) {
      const updated: Account = {
        ...editAccount,
        ...accountData,
      };
      updateAccount(updated);
      if (onSuccess) onSuccess(updated, true);
    } else {
      const created = addAccount(accountData);
      if (onSuccess) onSuccess(created, false);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-xl max-w-xl w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Treasury & Accounts
            </span>
            <h2 className="text-xl font-bold font-serif text-text">
              {editAccount ? 'Edit Account Details' : 'Add New Financial Account'}
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
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Quick Starter Presets for 1-Click Setup */}
          {!editAccount && (
            <div className="p-3 bg-surface-muted border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Quick Fill Templates
                </span>
                <span className="text-[10px] text-secondary">Click to auto-populate</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    type: 'bank' as AccountType,
                    name: 'Commercial Bank - Main Operations LKR',
                    currency: 'LKR' as const,
                    bankName: 'Commercial Bank of Ceylon',
                    accountNumber: '1000492817',
                    branch: 'Bandarawela Branch',
                    openingBalance: '0',
                    color: '#2B5329',
                    description: 'Main operational current account for merchant payouts and vendor settlements',
                  },
                  {
                    type: 'bank' as AccountType,
                    name: 'Sampath Bank - Foreign Currency USD',
                    currency: 'USD' as const,
                    bankName: 'Sampath Bank PLC',
                    accountNumber: '003928194',
                    branch: 'Colombo Corporate Branch',
                    openingBalance: '0',
                    color: '#1D4ED8',
                    description: 'Direct USD account for international OTA transfers and direct wire payments',
                  },
                  {
                    type: 'cash' as AccountType,
                    name: 'Front Desk Cash Drawer (LKR)',
                    currency: 'LKR' as const,
                    bankName: 'Front Office Reception',
                    accountNumber: 'REG-01',
                    branch: 'Hilldale Main Lobby',
                    openingBalance: '0',
                    color: '#5A634D',
                    description: 'Petty cash and point-of-sale currency float for front desk guest transactions',
                  },
                  {
                    type: 'credit_card' as AccountType,
                    name: 'HNB Corporate Visa Credit Card',
                    currency: 'LKR' as const,
                    bankName: 'Hatton National Bank',
                    accountNumber: '4829',
                    branch: 'Corporate Banking Unit',
                    openingBalance: '0',
                    color: '#B45309',
                    description: 'Corporate emergency card for villa supplies, fuel and online procurement',
                  },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 bg-white hover:bg-primary-light border border-border hover:border-primary text-text text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>{p.currency === 'USD' ? '💵' : p.type === 'cash' ? '🪙' : p.type === 'credit_card' ? '💳' : '🏦'}</span>
                    <span>{p.name.split('-')[0].trim()}</span>
                    <span className="text-[9px] text-secondary">({p.currency})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Type Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-2">
              Account Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'bank', label: 'Bank Account', icon: Landmark, desc: 'Current / Savings' },
                { id: 'cash', label: 'Cash / Vault', icon: Wallet, desc: 'Petty Cash & Registers' },
                { id: 'credit_card', label: 'Credit Card', icon: CreditCard, desc: 'Revolving Liability' },
                { id: 'loan', label: 'Loan / Debt', icon: Building, desc: 'Term Debt / Borrowing' },
              ].map((t) => {
                const isSelected = type === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={Boolean(editAccount)}
                    onClick={() => handleTypeChange(t.id as AccountType)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 text-left ${
                      isSelected
                        ? 'bg-primary-light/70 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-muted border-border text-secondary-dark hover:bg-white'
                    } ${editAccount ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                    <span className="text-[9px] text-secondary font-normal leading-tight">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Account Label / Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commercial Bank - Main Operations LKR, Petty Cash Register"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white font-medium"
            />
          </div>

          {/* Currency and Bank Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Account Currency <span className="text-primary">*</span>
              </label>
              <select
                value={currency}
                disabled={Boolean(editAccount)}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'LKR')}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
              >
                <option value="LKR">LKR (Sri Lankan Rupee - Rs.)</option>
                <option value="USD">USD (United States Dollar - $)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                {type === 'cash' ? 'Location / Custodian' : type === 'credit_card' ? 'Issuing Bank / Network' : 'Bank / Financial Institution'}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={type === 'cash' ? 'Front Desk / General Manager' : 'Commercial Bank, HNB, Sampath, HSBC'}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Account / Card / Loan Number & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                {type === 'credit_card' ? 'Card Number (Last 4 digits)' : type === 'loan' ? 'Loan Account Ref #' : 'Account Number / Ref'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={type === 'credit_card' ? '4912' : '8004192841'}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white font-mono"
              />
            </div>

            {type !== 'cash' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                  Bank Branch / Department
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Bandarawela / Ella City Branch"
                  className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Opening Balance / Current Balance */}
          {!editAccount ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Opening Balance ({currency}) {type === 'credit_card' || type === 'loan' ? '(Amount Currently Owed)' : ''}
              </label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-base font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
              <span className="text-[11px] text-secondary block mt-1">
                {type === 'cash' || type === 'bank' 
                  ? 'Initial cash/funds available in this account.' 
                  : 'Current outstanding liability balance on this card or loan.'}
              </span>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Current Balance ({currency})
              </label>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-base font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>
          )}

          {/* Credit Card Specific: Credit Limit & Billing Cycle */}
          {type === 'credit_card' && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-border space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Credit Card Parameters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-secondary block mb-1">
                    Credit Limit ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-text"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-secondary block mb-1">
                    Statement Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={billingCycleDay}
                    onChange={(e) => setBillingCycleDay(e.target.value)}
                    placeholder="15"
                    className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-text"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loan Specific: Principal, Term, EMI, Interest */}
          {type === 'loan' && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-border space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Building className="w-3.5 h-3.5" />
                <span>Loan & Borrowing Terms</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-secondary block mb-1">
                    Original Principal ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    placeholder="5000000"
                    className="w-full bg-white border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-secondary block mb-1">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="13.5"
                    className="w-full bg-white border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-secondary block mb-1">
                    Monthly Installment ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={monthlyInstallment}
                    onChange={(e) => setMonthlyInstallment(e.target.value)}
                    placeholder="165000"
                    className="w-full bg-white border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Specific: Inter-Bank Transfer Fees & Card Machine Commission */}
          {type === 'bank' && (
            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-border space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Landmark className="w-4 h-4" />
                <span>Automated Bank Charges & Card Commission Rates</span>
              </div>
              <p className="text-[11px] text-secondary">
                Configure default deduction fees applied when paying out via inter-bank transfer or receiving card machine settlements into this bank account.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Inter-bank transfer charge */}
                <div>
                  <label className="text-[11px] font-bold text-secondary block mb-1">
                    Inter-Bank Transfer Charge (Other Banks)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      value={interBankTransferFee}
                      onChange={(e) => setInterBankTransferFee(e.target.value)}
                      placeholder="50"
                      className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text focus:outline-hidden focus:border-primary"
                    />
                    <select
                      value={interBankFeeType}
                      onChange={(e) => setInterBankFeeType(e.target.value as 'flat' | 'percent')}
                      className="bg-white border border-border rounded-xl px-2.5 py-2 text-xs font-medium text-text focus:outline-hidden focus:border-primary"
                    >
                      <option value="flat">{currency} Flat</option>
                      <option value="percent">% Rate</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-secondary mt-1 block">
                    Applied when transferring to non-matching banks (e.g. SLIPS/CEFTS fee).
                  </span>
                </div>

                {/* Card machine commission */}
                <div>
                  <label className="text-[11px] font-bold text-secondary block mb-1">
                    Card Machine Commission / MDR (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={cardCommissionPercent}
                      onChange={(e) => setCardCommissionPercent(e.target.value)}
                      placeholder="2.50"
                      className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text focus:outline-hidden focus:border-primary pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-secondary">%</span>
                  </div>
                  <span className="text-[10px] text-secondary mt-1 block">
                    Auto-deducted as bank fee on POS card machine collections into this account.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Internal Ledger Remarks (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Primary merchant settlement account for card swipes and OTA payouts"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveAccount"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#5A634D] rounded cursor-pointer"
            />
            <label htmlFor="isActiveAccount" className="text-xs font-semibold text-text cursor-pointer">
              Active Account (Enabled for receiving guest payments, expenses and transfers)
            </label>
          </div>

          {/* Delete Confirmation inside Modal */}
          {showDeleteConfirm && editAccount && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <span className="font-bold">Permanently remove "{editAccount.name}"?</span>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    This financial account will be removed from treasury drawers and active selections. Historical ledger entries remain recorded.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg border border-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAccount(editAccount.id);
                    onClose();
                  }}
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              {editAccount && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl border border-red-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editAccount ? 'Save Changes' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
