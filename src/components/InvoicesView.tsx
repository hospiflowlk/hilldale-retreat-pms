import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Calendar, 
  CreditCard, 
  Banknote, 
  Hotel, 
  Building2, 
  Eye, 
  Download, 
  ArrowUpDown,
  Filter,
  DollarSign,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePOS } from '../hooks/usePOS';
import { Order, PaymentMethod } from '../types';

export const InvoicesView: React.FC = () => {
  const { setSelectedOrderForReceipt, openDeleteOrderModal, settings } = useApp();
  const { orders } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const paidOrders = useMemo(() => {
    return orders.filter(o => o.status === 'paid');
  }, [orders]);

  const filteredInvoices = useMemo(() => {
    return paidOrders.filter(order => {
      if (methodFilter !== 'all' && order.paymentMethod !== methodFilter) return false;
      
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (today !== orderDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          order.invoiceNumber.toLowerCase().includes(q) ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.location.toLowerCase().includes(q) ||
          order.guestName?.toLowerCase().includes(q) ||
          order.cashierName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [paidOrders, methodFilter, dateFilter, searchQuery]);

  const totalInvoiced = (filteredInvoices || []).reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const totalServiceCharges = (filteredInvoices || []).reduce((sum, o) => sum + (Number(o.serviceChargeAmount) || 0), 0);
  const avgCheckSize = (filteredInvoices || []).length > 0 ? totalInvoiced / (filteredInvoices || []).length : 0;

  const exportCSV = () => {
    const headers = ['Invoice No', 'Order No', 'Date', 'Location', 'Guest Name', 'Order Type', 'Subtotal', 'Service Charge', 'Discount', 'Grand Total (USD)', 'Payment Method'];
    const rows = (filteredInvoices || []).map(o => [
      o.invoiceNumber,
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      `"${o.location}"`,
      `"${o.guestName || ''}"`,
      o.orderType,
      (Number(o.subtotal) || 0).toFixed(2),
      (Number(o.serviceChargeAmount) || 0).toFixed(2),
      (Number(o.discountAmount) || 0).toFixed(2),
      (Number(o.grandTotal) || 0).toFixed(2),
      o.paymentMethod || 'Paid'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hilldale_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
      {/* Title & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Billing Records & Archive
          </span>
          <h2 className="text-2xl font-bold font-serif text-text">
            Guest Invoices & Receipts
          </h2>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-white hover:bg-surface-muted text-text border border-border font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export Invoices CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Invoiced (Filtered)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-text">
              ${totalInvoiced.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-primary font-mono mt-1 font-semibold">
            ≈ Rs. {Math.round(totalInvoiced * settings.usdToLkrRate).toLocaleString()} LKR
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Service Charges (10%)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-primary">
              ${totalServiceCharges.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-secondary mt-1">Staff & Service Pool</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Average Check Size</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-serif text-text">
              ${avgCheckSize.toFixed(2)}
            </span>
            <span className="text-xs text-secondary">USD</span>
          </div>
          <p className="text-xs text-secondary mt-1">{filteredInvoices.length} Settled Invoices</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, table, room, guest name..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 text-xs text-secondary shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Payment:</span>
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-primary"
          >
            <option value="all">All Methods</option>
            <option value="card">Credit/Debit Card</option>
            <option value="cash">Cash</option>
            <option value="room_charge">Room Charge</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-hidden focus:border-primary"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-secondary space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-secondary/40 mb-2" />
            <p className="text-sm font-semibold text-text">No invoices match your query.</p>
            <p className="text-xs text-secondary">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-secondary uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Location / Room</th>
                  <th className="py-3.5 px-4">Guest</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">10% SC</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D6]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-hover transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-text">
                      <div>{new Date(inv.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-secondary">
                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text">
                      <div>{inv.location}</div>
                      <div className="text-[10px] text-secondary uppercase">{inv.orderType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#424242]">
                      {inv.guestName || <span className="text-secondary italic">Walk-in</span>}
                    </td>
                    <td className="py-3.5 px-4 text-secondary">
                      {(inv.items || []).reduce((s, i) => s + i.quantity, 0)} items
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#424242]">
                      ${(Number(inv.subtotal) || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-secondary">
                      ${(Number(inv.serviceChargeAmount) || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-text text-sm">
                        ${(Number(inv.grandTotal) || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-secondary font-mono">
                        Rs. {Math.round((Number(inv.grandTotal) || 0) * settings.usdToLkrRate).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-muted text-primary border border-border">
                        {inv.paymentMethod || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderForReceipt(inv)}
                          className="px-2.5 py-1 bg-white hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1 border border-primary shadow-xs"
                          title="View / Print Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                        <button
                          onClick={() => openDeleteOrderModal(inv)}
                          className="p-1 rounded-lg bg-white hover:bg-accent/15 text-secondary hover:text-accent border border-border hover:border-accent/40 transition cursor-pointer"
                          title="Void & Delete Order (Manager PIN Required)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
