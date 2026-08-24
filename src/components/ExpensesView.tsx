import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useExpenses } from '../hooks/useExpenses';
import { Expense, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from './AddExpenseModal';
import { DateRangePicker, DateRange } from './ui/DateRangePicker';
import { SettleExpenseModal } from './SettleExpenseModal';

export const ExpensesView: React.FC = () => {
  const { setIsAddExpenseModalOpen, setEditingExpenseId, settings } = useApp();
  const { expenses, deleteExpense, updateExpense } = useExpenses();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expenseToSettle, setExpenseToSettle] = useState<Expense | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return {
      startDate: startOfMonth,
      endDate: endOfMonth,
      preset: 'this_month'
    };
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      
      if (dateRange.startDate && exp.date < dateRange.startDate) return false;
      if (dateRange.endDate && exp.date > dateRange.endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          exp.title.toLowerCase().includes(q) ||
          exp.vendor.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q) ||
          exp.invoiceRef?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, categoryFilter, dateRange, searchQuery]);

  const totalExpenseUSD = (filteredExpenses || []).reduce((sum, e) => sum + (Number(e.amountUSD) || 0), 0);
  const totalExpenseLKR = Math.round(totalExpenseUSD * settings.usdToLkrRate);

  const getCategoryMeta = (catId: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find(c => c.id === catId) || {
      id: catId,
      label: catId,
      icon: '💼',
      description: ''
    };
  };

  const exportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Vendor', 'Amount USD', 'Amount LKR', 'Payment Method', 'Invoice Ref', 'Notes'];
    const rows = (filteredExpenses || []).map(e => [
      e.id,
      e.date,
      e.category,
      `"${e.title}"`,
      `"${e.vendor}"`,
      (Number(e.amountUSD) || 0).toFixed(2),
      Math.round((Number(e.amountUSD) || 0) * settings.usdToLkrRate),
      e.paymentMethod,
      `"${e.invoiceRef || ''}"`,
      `"${e.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hilldale_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Cost & Supplier Accounting
          </span>
          <h2 className="text-2xl font-bold font-serif text-text">
            Retreat Operational Expenses
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-white hover:bg-surface-muted text-text border border-border font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="btn-add-expense-main"
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Expenses</p>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-serif text-secondary">
                Rs. {totalExpenseLKR.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-secondary mt-1 font-mono">
              ≈ ${totalExpenseUSD.toFixed(2)} USD
            </p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Logged Entries</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-secondary">
              {filteredExpenses.length}
            </span>
            <span className="text-xs text-secondary">Records</span>
          </div>
          <p className="text-xs text-secondary mt-1 font-mono">
            Active ledger count
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Kitchen & Bar Share (COGS)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-secondary">
              Rs. {Math.round(filteredExpenses.filter(e => e.category === 'kitchen_food' || e.category === 'beverage_bar').reduce((sum, e) => sum + (Number(e.amountUSD) || 0), 0) * settings.usdToLkrRate).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1 font-mono">
            Direct Ingredients Cost
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-border rounded-2xl p-2 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor, ingredient, fuel, electricity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-primary cursor-pointer"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-secondary space-y-2">
            <DollarSign className="w-8 h-8 mx-auto text-secondary/40 mb-2" />
            <p className="text-sm font-semibold text-text">No expense records found.</p>
            <p className="text-xs text-secondary">Record supplier purchases, utility bills, or staff payroll.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-secondary uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Vendor / Supplier</th>
                  <th className="py-3.5 px-4">Bill Ref</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amount (LKR)</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D6]">
                {filteredExpenses.map((exp) => {
                  return (
                    <tr key={exp.id} className="hover:bg-surface-hover transition">
                      <td className="py-3.5 px-4 text-text font-mono">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-text">{exp.title}</p>
                        {exp.notes && (
                          <p className="text-[11px] text-secondary italic">{exp.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#424242] font-medium">
                        {exp.vendor}
                      </td>
                      <td className="py-3.5 px-4 text-secondary font-mono text-[11px]">
                        {exp.invoiceRef || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-muted text-secondary border border-border">
                          {exp.status === 'PAID' ? exp.paymentMethod : '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {exp.status === 'PAID' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Mark "${exp.title}" as Unpaid? This will reverse the ledger deduction.`)) {
                                updateExpense({ id: exp.id, status: 'UNPAID' });
                              }
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition cursor-pointer"
                            title="Click to un-settle / mark as unpaid"
                          >
                            Settled
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExpenseToSettle(exp)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 hover:border-red-300 transition cursor-pointer shadow-2xs flex items-center gap-1 group"
                            title="Click to settle this bill"
                          >
                            <span>Unpaid</span>
                            <span className="text-[9px] lowercase font-normal opacity-75 group-hover:opacity-100 underline">settle</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary text-xs">
                        Rs. {Math.round((Number(exp.amountUSD) || 0) * settings.usdToLkrRate).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingExpenseId(exp.id);
                            setIsAddExpenseModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-muted transition cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-surface-muted transition cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Settlement Modal */}
      <SettleExpenseModal
        isOpen={!!expenseToSettle}
        expense={expenseToSettle}
        onClose={() => setExpenseToSettle(null)}
      />
    </div>
  );
};
