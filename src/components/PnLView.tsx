import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Download, 
  Printer, 
  PieChart as PieIcon, 
  BarChart3, 
  Award, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';
import { usePOS } from '../hooks/usePOS';
import { useExpenses } from '../hooks/useExpenses';
import { usePMS } from '../hooks/usePMS';
import { EXPENSE_CATEGORIES } from './AddExpenseModal';
import { PnLFilter } from '../types';

export const PnLView: React.FC = () => {
  const { settings } = useApp();
  const { orders } = usePOS();
  const { expenses } = useExpenses();
  const { bookings } = usePMS();

  const [dateRange, setDateRange] = useState<PnLFilter['dateRange']>('thisMonth');

  // Filter orders & expenses based on chosen range
  const { filteredOrders, filteredExpenses, rangeLabel } = useMemo(() => {
    const now = new Date();
    
    // Start dates
    let startDate = new Date();
    let label = 'All Time';

    if (dateRange === 'today') {
      label = 'Today';
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'yesterday') {
      label = 'Yesterday';
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (dateRange === 'last7days') {
      label = 'Last 7 Days';
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (dateRange === 'thisMonth') {
      label = 'This Month (August 2026)';
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'lastMonth') {
      label = 'Last Month';
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      label = 'Full Ledger Lifetime';
      startDate = new Date(2020, 0, 1);
    }

    const startISO = startDate.toISOString();

    const fOrders = orders.filter(o => o.status === 'paid' && o.createdAt >= startISO);
    const fExpenses = expenses.filter(e => {
      const eDate = new Date(e.date).toISOString();
      return eDate >= startISO;
    });

    return {
      filteredOrders: fOrders,
      filteredExpenses: fExpenses,
      rangeLabel: label,
    };
  }, [orders, expenses, dateRange]);

  // Financial Metrics Calculations
  const grossFoodBeverageSales = (filteredOrders || []).reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
  const discountsGiven = (filteredOrders || []).reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);
  const netFoodBeverageSales = Math.max(0, grossFoodBeverageSales - discountsGiven);
  const serviceChargesCollected = (filteredOrders || []).reduce((sum, o) => sum + (Number(o.serviceChargeAmount) || 0), 0);
  const totalRevenue = netFoodBeverageSales + serviceChargesCollected;

  // COGS & Expense categorization
  const directKitchenBarCOGS = (filteredExpenses || [])
    .filter(e => e.category === 'kitchen_food' || e.category === 'beverage_bar')
    .reduce((sum, e) => sum + (Number(e.amountUSD) || 0), 0);

  const operatingExpenses = (filteredExpenses || [])
    .filter(e => e.category !== 'kitchen_food' && e.category !== 'beverage_bar')
    .reduce((sum, e) => sum + (Number(e.amountUSD) || 0), 0);

  const totalAllExpenses = directKitchenBarCOGS + operatingExpenses;
  const grossProfit = totalRevenue - directKitchenBarCOGS;
  const netProfit = totalRevenue - totalAllExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const cogsMargin = totalRevenue > 0 ? (directKitchenBarCOGS / totalRevenue) * 100 : 0;

  // Recharts: Expense Category Breakdown Pie Data (Natural Tones)
  const expensePieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    (filteredExpenses || []).forEach(exp => {
      catMap[exp.category] = (catMap[exp.category] || 0) + (Number(exp.amountUSD) || 0);
    });

    const NATURAL_CHART_COLORS = ['#5A634D', '#8C735D', '#D4A373', '#CCD5AE', '#E07A5F', '#D4E09B', '#F2CC8F', '#A39171'];

    return Object.keys(catMap).map((catKey, idx) => {
      const meta = EXPENSE_CATEGORIES.find(c => c.id === catKey);
      return {
        name: meta ? meta.label.split('&')[0].trim() : catKey,
        value: Number((catMap[catKey] || 0).toFixed(2)),
        color: NATURAL_CHART_COLORS[idx % NATURAL_CHART_COLORS.length],
      };
    });
  }, [filteredExpenses]);

  // Recharts: Top 8 Selling Dishes
  const topSellingDishes = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    (filteredOrders || []).forEach(order => {
      (order.items || []).forEach(item => {
        if (!itemMap[item.menuItemId]) {
          itemMap[item.menuItemId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemMap[item.menuItemId].quantity += Number(item.quantity) || 0;
        itemMap[item.menuItemId].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredOrders]);

  // Daily Trend Comparison (Past Days)
  const financialTrendData = useMemo(() => {
    const dayMap: Record<string, { date: string; revenue: number; expenses: number }> = {};
    
    // populate last 7 dates
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      dayMap[dateKey] = { date: shortDay, revenue: 0, expenses: 0 };
    }

    filteredOrders.forEach(o => {
      const dKey = o.createdAt.split('T')[0];
      if (dayMap[dKey]) {
        dayMap[dKey].revenue += o.grandTotal;
      }
    });

    filteredExpenses.forEach(e => {
      if (dayMap[e.date]) {
        dayMap[e.date].expenses += e.amountUSD;
      }
    });

    return Object.values(dayMap);
  }, [filteredOrders, filteredExpenses]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6 print:p-0 print:bg-white print:text-black">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Financial Health & P&L Statement
          </span>
          <h2 className="text-2xl font-bold font-serif text-text">
            Profit & Loss Accounting
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Real-time revenue, cost of goods sold, operating expenses, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-border rounded-full p-1 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'last7days', label: '7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                  dateRange === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary-dark hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-white hover:bg-surface-muted text-text border border-border font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Print P&L Report</span>
          </button>
        </div>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-secondary text-xs uppercase font-bold tracking-wider">
            <span>Total Revenue</span>
            <span className="p-1 rounded-full bg-primary-light text-primary"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold font-serif text-text">
              ${totalRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-primary font-mono font-medium">
            ≈ Rs. {Math.round(totalRevenue * settings.usdToLkrRate).toLocaleString()} LKR
          </p>
          <div className="pt-2 text-[11px] text-primary flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{filteredOrders.length} Completed Guest Bills</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-secondary text-xs uppercase font-bold tracking-wider">
            <span>Expenses & COGS</span>
            <span className="p-1 rounded-full bg-secondary-light text-secondary"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold font-serif text-secondary">
              ${totalAllExpenses.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-secondary font-mono">
            ≈ Rs. {Math.round(totalAllExpenses * settings.usdToLkrRate).toLocaleString()} LKR
          </p>
          <div className="pt-2 text-[11px] text-secondary flex items-center gap-1">
            <span>COGS: ${directKitchenBarCOGS.toFixed(2)} • Opex: ${operatingExpenses.toFixed(2)}</span>
          </div>
        </div>

        {/* Net Profit ($) */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-secondary text-xs uppercase font-bold tracking-wider">
            <span>Net Operating Profit</span>
            <span className={`p-1 rounded-full ${netProfit >= 0 ? 'bg-primary-light text-primary' : 'bg-secondary-light text-accent'}`}>
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-3xl font-bold font-serif ${netProfit >= 0 ? 'text-primary' : 'text-accent'}`}>
              ${netProfit.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-primary font-mono">
            ≈ Rs. {Math.round(netProfit * settings.usdToLkrRate).toLocaleString()} LKR
          </p>
          <div className="pt-2 text-[11px] text-secondary flex items-center gap-1 font-medium">
            <span>Gross Profit: ${grossProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Net Profit Margin (%) */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-secondary text-xs uppercase font-bold tracking-wider">
            <span>Net Profit Margin</span>
            <span className="p-1 rounded-full bg-primary-light text-primary"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-3xl font-bold font-serif ${netProfitMargin >= 25 ? 'text-primary' : netProfitMargin > 0 ? 'text-secondary' : 'text-accent'}`}>
              {netProfitMargin.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-secondary">
            Target benchmark: 25% - 40%
          </p>
          <div className="pt-2 text-[11px] text-secondary">
            <span>COGS Margin: {cogsMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Daily Revenue vs Expense Trend Chart */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Daily Revenue vs. Expenses (USD)
            </h3>
            <span className="text-[11px] text-secondary font-mono">Past 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1D6" opacity={0.6} />
                <XAxis dataKey="date" stroke="#8C735D" fontSize={11} />
                <YAxis stroke="#8C735D" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E1D6', borderRadius: '12px', color: '#2C2C2C', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  formatter={(val: any) => [`$${(Number(val) || 0).toFixed(2)} USD`]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Sales Revenue" fill="#5A634D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Operational Cost" fill="#D4A373" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-secondary" />
              Cost Breakdown by Category
            </h3>
            <span className="text-[11px] text-secondary font-mono">${totalAllExpenses.toFixed(2)} Total</span>
          </div>

          {expensePieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-secondary">
              No expenses recorded in this period.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E1D6', borderRadius: '12px', color: '#2C2C2C', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                    formatter={(val: any) => [`$${(Number(val) || 0).toFixed(2)} USD`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Formal Profit & Loss Accounting Statement Table */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4 print:border-none print:shadow-none">
        <div className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold font-serif text-text">
                HILLDALE RETREAT • PROFIT & LOSS STATEMENT
              </h3>
              <p className="text-xs text-secondary font-medium">
                Period: {rangeLabel} • Accounting Currency: USD & LKR
              </p>
            </div>
            <div className="text-xs text-secondary">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-[#E6E1D6]">
              {/* REVENUE SECTION */}
              <tr className="bg-surface-muted font-bold text-primary text-xs">
                <td className="py-2.5 px-3 uppercase tracking-wider" colSpan={2}>1. REVENUE (INCOME)</td>
                <td className="py-2.5 px-3 text-right">USD ($)</td>
                <td className="py-2.5 px-3 text-right">LKR (Rs.)</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-text" colSpan={2}>
                  Gross Food & Beverage Ala Carte Sales
                </td>
                <td className="py-2 px-3 text-right font-mono text-text">${grossFoodBeverageSales.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-mono text-secondary">Rs. {Math.round(grossFoodBeverageSales * settings.usdToLkrRate).toLocaleString()}</td>
              </tr>
              {discountsGiven > 0 && (
                <tr>
                  <td className="py-2 px-6 text-secondary" colSpan={2}>
                    Less: Guest Promotional Discounts
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-secondary">-${discountsGiven.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-secondary">Rs. -{Math.round(discountsGiven * settings.usdToLkrRate).toLocaleString()}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 px-6 text-text" colSpan={2}>
                  10% Service Charges Collected
                </td>
                <td className="py-2 px-3 text-right font-mono text-text">${serviceChargesCollected.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-mono text-secondary">Rs. {Math.round(serviceChargesCollected * settings.usdToLkrRate).toLocaleString()}</td>
              </tr>
              <tr className="font-bold text-text bg-surface-hover">
                <td className="py-2.5 px-6" colSpan={2}>TOTAL OPERATING REVENUE</td>
                <td className="py-2.5 px-3 text-right font-mono text-primary">${totalRevenue.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">Rs. {Math.round(totalRevenue * settings.usdToLkrRate).toLocaleString()}</td>
              </tr>

              {/* COST OF GOODS SOLD */}
              <tr className="bg-surface-muted font-bold text-secondary text-xs">
                <td className="py-2.5 px-3 uppercase tracking-wider" colSpan={2}>2. COST OF GOODS SOLD (COGS)</td>
                <td className="py-2.5 px-3 text-right">USD ($)</td>
                <td className="py-2.5 px-3 text-right">LKR (Rs.)</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-text" colSpan={2}>
                  Kitchen Groceries, Fresh Seafood, Meat & Produce
                </td>
                <td className="py-2 px-3 text-right font-mono text-text">
                  ${((filteredExpenses || []).filter(e => e.category === 'kitchen_food').reduce((s, e) => s + (Number(e.amountUSD) || 0), 0)).toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-secondary">
                  Rs. {Math.round((filteredExpenses || []).filter(e => e.category === 'kitchen_food').reduce((s, e) => s + (Number(e.amountUSD) || 0), 0) * settings.usdToLkrRate).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-text" colSpan={2}>
                  Bar Liquors, Ceylon Teas & Barista Coffee Beans
                </td>
                <td className="py-2 px-3 text-right font-mono text-text">
                  ${((filteredExpenses || []).filter(e => e.category === 'beverage_bar').reduce((s, e) => s + (Number(e.amountUSD) || 0), 0)).toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-secondary">
                  Rs. {Math.round((filteredExpenses || []).filter(e => e.category === 'beverage_bar').reduce((s, e) => s + (Number(e.amountUSD) || 0), 0) * settings.usdToLkrRate).toLocaleString()}
                </td>
              </tr>
              <tr className="font-bold text-text bg-surface-hover">
                <td className="py-2.5 px-6" colSpan={2}>GROSS PROFIT (Revenue - Direct COGS)</td>
                <td className="py-2.5 px-3 text-right font-mono text-primary">${grossProfit.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">Rs. {Math.round(grossProfit * settings.usdToLkrRate).toLocaleString()}</td>
              </tr>

              {/* OPERATING EXPENSES */}
              <tr className="bg-surface-muted font-bold text-secondary text-xs">
                <td className="py-2.5 px-3 uppercase tracking-wider" colSpan={2}>3. OPERATING EXPENSES (OPEX)</td>
                <td className="py-2.5 px-3 text-right">USD ($)</td>
                <td className="py-2.5 px-3 text-right">LKR (Rs.)</td>
              </tr>
              {EXPENSE_CATEGORIES.filter(c => c.id !== 'kitchen_food' && c.id !== 'beverage_bar').map(cat => {
                const sumUSD = (filteredExpenses || []).filter(e => e.category === cat.id).reduce((s, e) => s + (Number(e.amountUSD) || 0), 0);
                if (sumUSD === 0) return null;
                return (
                  <tr key={cat.id}>
                    <td className="py-2 px-6 text-text" colSpan={2}>
                      {cat.label}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-text">${sumUSD.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-secondary">Rs. {Math.round(sumUSD * settings.usdToLkrRate).toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="font-bold text-text bg-surface-hover">
                <td className="py-2.5 px-6" colSpan={2}>TOTAL OPERATING EXPENSES</td>
                <td className="py-2.5 px-3 text-right font-mono text-secondary">${operatingExpenses.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">Rs. {Math.round(operatingExpenses * settings.usdToLkrRate).toLocaleString()}</td>
              </tr>

              {/* FINAL NET PROFIT ROW */}
              <tr className="bg-surface-muted text-text font-extrabold text-sm border-t-2 border-primary">
                <td className="py-3 px-3 uppercase" colSpan={2}>NET PROFIT / LOSS (NET INCOME)</td>
                <td className={`py-3 px-3 text-right font-serif text-base ${netProfit >= 0 ? 'text-primary' : 'text-accent'}`}>
                  ${netProfit.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs">
                  Rs. {Math.round(netProfit * settings.usdToLkrRate).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Best-Selling Dishes Table */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Top Best-Selling Menu Dishes
          </h3>
          <span className="text-xs text-secondary">By Sales Volume & Revenue</span>
        </div>

        {topSellingDishes.length === 0 ? (
          <p className="text-xs text-secondary py-4 text-center">No sales data recorded in this period.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topSellingDishes.map((dish, i) => (
              <div key={i} className="bg-surface-muted p-3.5 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {i + 1}
                  </span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-text truncate">{dish.name}</p>
                    <p className="text-[11px] text-secondary">{dish.quantity} portions served</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-mono text-primary">${dish.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
