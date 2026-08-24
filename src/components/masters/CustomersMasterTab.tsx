import React, { useState, useMemo } from 'react';
import { 
  User, 
  Plus, 
  Search, 
  FileText, 
  Phone, 
  Mail, 
  Globe, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Bed, 
  Coffee, 
  Sparkles,
  Calendar,
  Layers,
  Crown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterCustomer, CustomerType } from '../../types';
import { NewCustomerModal } from './NewCustomerModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { useCustomers } from '../../hooks/useMasters';

export const CustomersMasterTab: React.FC = () => {
  const { settings } = useApp();
  const { data: masterCustomers = [] } = useCustomers.useGetAll();
  const deleteCustomerMut = useCustomers.useDelete();

  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | CustomerType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<MasterCustomer | null>(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<MasterCustomer | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return masterCustomers.filter(c => {
      if (activeTypeTab !== 'ALL' && c.customerType !== activeTypeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.passportOrId?.toLowerCase().includes(q) ||
          c.businessSourceName?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [masterCustomers, activeTypeTab, searchQuery]);

  const totalLifetimeSpendUSD = masterCustomers.reduce((sum, c) => sum + (c.lifetimeSpendUSD || 0), 0);
  const roomGuestsCount = masterCustomers.filter(c => c.customerType === 'ROOM_GUEST').length;
  const walkInsCount = masterCustomers.filter(c => c.customerType === 'WALK_IN').length;
  const vipCount = masterCustomers.filter(c => c.customerType === 'VIP').length;

  const handleDelete = (c: MasterCustomer) => {
    setActionError(null);
    if (window.confirm(`Are you sure you want to delete guest record "${c.name}"?`)) {
      deleteCustomerMut.mutate(c.id, {
        onError: (err: any) => setActionError(err.message || 'Cannot delete customer.')
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{masterCustomers.length}</div>
          <div className="text-[11px] text-secondary mt-0.5">De-duplicated guest profiles</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Room Guests</span>
            <Bed className="w-4 h-4 text-primary-dark" />
          </div>
          <div className="text-xl font-bold font-serif text-primary">{roomGuestsCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">Hotel suite residents</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Walk-In Diners</span>
            <Coffee className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-800">{walkInsCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">Restaurant & bar guests</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Lifetime Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-serif text-emerald-700">${totalLifetimeSpendUSD.toFixed(2)}</div>
          <div className="text-[11px] text-secondary mt-0.5">
            Rs. {(totalLifetimeSpendUSD * settings.usdToLkrRate).toLocaleString()}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, country..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-text placeholder-secondary/60 focus:outline-hidden focus:border-primary focus:bg-white transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTypeTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'ALL'
                ? 'bg-text text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-text'
            }`}
          >
            All ({masterCustomers.length})
          </button>
          <button
            onClick={() => setActiveTypeTab('ROOM_GUEST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTypeTab === 'ROOM_GUEST'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-text'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Room ({roomGuestsCount})</span>
          </button>
          <button
            onClick={() => setActiveTypeTab('WALK_IN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTypeTab === 'WALK_IN'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-text'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Walk-In ({walkInsCount})</span>
          </button>
          <button
            onClick={() => setActiveTypeTab('VIP')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTypeTab === 'VIP'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-text'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>VIP ({vipCount})</span>
          </button>
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => { setCustomerToEdit(null); setIsModalOpen(true); }}
          className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-secondary uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-4">Guest Name & ID</th>
                <th className="py-3.5 px-4">Contact (Phone / Email)</th>
                <th className="py-3.5 px-4">Country & Channel</th>
                <th className="py-3.5 px-4 text-center">Visits / Stays</th>
                <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary">
                    <User className="w-8 h-8 mx-auto text-secondary/40 mb-2" />
                    <p className="font-semibold text-text">No guest records found</p>
                    <p className="text-xs mt-0.5">Guests are automatically recognized when booked in PMS or POS.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-surface-muted/30 transition group">
                      {/* Name & Type */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            c.customerType === 'VIP' ? 'bg-amber-100 text-amber-900' : 'bg-primary-light text-primary'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-text block leading-tight">
                              {c.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                                c.customerType === 'VIP' 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : c.customerType === 'ROOM_GUEST'
                                  ? 'bg-primary-light text-primary'
                                  : 'bg-surface-muted text-secondary'
                              }`}>
                                {c.customerType.replace('_', ' ')}
                              </span>
                              {c.passportOrId && (
                                <span className="text-[10px] text-secondary font-mono">
                                  {c.passportOrId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-secondary">
                        <div className="space-y-0.5 text-[11px]">
                          {c.phone ? <div className="font-mono">{c.phone}</div> : <div className="text-secondary/40">—</div>}
                          {c.email && <div className="text-secondary/70">{c.email}</div>}
                        </div>
                      </td>

                      {/* Country & Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-text font-medium text-xs">{c.country || 'Sri Lanka'}</div>
                        <div className="text-[10px] text-secondary mt-0.5">
                          via {c.businessSourceName || 'Direct'}
                        </div>
                      </td>

                      {/* Visits */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-surface-muted text-text border border-border">
                          {c.totalVisits} {c.totalVisits === 1 ? 'visit' : 'visits'}
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-text block">
                          ${(c.lifetimeSpendUSD || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-secondary font-mono">
                          Rs. {((c.lifetimeSpendUSD || 0) * settings.usdToLkrRate).toLocaleString()}
                        </span>
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-secondary text-[11px] font-mono">
                        {c.lastVisitDate || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomerForDetails(c)}
                            className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary-light hover:bg-primary/20 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="View Guest Dossier"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => { setCustomerToEdit(c); setIsModalOpen(true); }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCustomerToEdit(null); }}
        customerToEdit={customerToEdit}
      />

      <CustomerDetailsModal
        isOpen={Boolean(selectedCustomerForDetails)}
        onClose={() => setSelectedCustomerForDetails(null)}
        customer={selectedCustomerForDetails}
      />
    </div>
  );
};
