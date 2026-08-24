import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Plus, 
  Search, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { MasterBusinessSource } from '../../types';
import { NewBusinessSourceModal } from './NewBusinessSourceModal';
import { useBusinessSources } from '../../hooks/useMasters';

export const BusinessSourcesTab: React.FC = () => {
  const { settings } = useApp();
  const { bookings } = usePMS();
  const { data: masterBusinessSources = [] } = useBusinessSources.useGetAll();
  const deleteSourceMut = useBusinessSources.useDelete();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<MasterBusinessSource | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Compute live revenue attribution per channel based on PMS bookings
  const channelsWithMetrics = useMemo(() => {
    return masterBusinessSources.map(src => {
      // Find matching bookings
      const matchedBookings = bookings.filter(b => {
        const chanKey = b.channel ? b.channel.toLowerCase() : '';
        const srcName = src.name.toLowerCase();
        if (srcName.includes('booking.com') && chanKey.includes('booking_com')) return true;
        if (srcName.includes('direct') && (chanKey.includes('direct') || chanKey.includes('website'))) return true;
        if (srcName.includes('agoda') && chanKey.includes('agoda')) return true;
        if (srcName.includes('airbnb') && chanKey.includes('airbnb')) return true;
        if (srcName.includes('walk-in') && chanKey.includes('walk_in')) return true;
        return false;
      });

      const bookingsCount = Math.max(src.totalBookingsGenerated || 0, matchedBookings.length);
      const grossRevenueUSD = Math.max(
        src.totalRevenueGeneratedUSD || 0, 
        matchedBookings.reduce((sum, b) => sum + (b.roomTotalUSD || 0), 0)
      );
      const commissionUSD = grossRevenueUSD * (src.commissionPercent / 100);
      const netRevenueUSD = grossRevenueUSD - commissionUSD;

      return {
        ...src,
        bookingsCount,
        grossRevenueUSD,
        commissionUSD,
        netRevenueUSD
      };
    });
  }, [masterBusinessSources, bookings]);

  const filteredSources = useMemo(() => {
    return channelsWithMetrics.filter(src => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          src.name.toLowerCase().includes(q) ||
          src.contactInfo?.toLowerCase().includes(q) ||
          src.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [channelsWithMetrics, searchQuery]);

  const totalGrossRevenue = channelsWithMetrics.reduce((sum, s) => sum + s.grossRevenueUSD, 0);
  const totalCommissionPaid = channelsWithMetrics.reduce((sum, s) => sum + s.commissionUSD, 0);
  const totalBookingsGenerated = channelsWithMetrics.reduce((sum, s) => sum + s.bookingsCount, 0);

  const handleDelete = (src: MasterBusinessSource) => {
    setActionError(null);
    if (window.confirm(`Are you sure you want to delete channel "${src.name}"?`)) {
      deleteSourceMut.mutate(src.id, {
        onError: (err: any) => setActionError(err.message || 'Cannot delete business source.')
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Business Sources</span>
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{masterBusinessSources.length} Channels</div>
          <div className="text-[11px] text-secondary mt-0.5">Booking channels & OTA partners</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Channel Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-serif text-emerald-700">${totalGrossRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-secondary mt-0.5">
            Across {totalBookingsGenerated} attributed bookings
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated OTA Fees</span>
            <Percent className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-800">${totalCommissionPaid.toFixed(2)}</div>
          <div className="text-[11px] text-secondary mt-0.5">Commissions on third-party channels</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Channel Yield</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-primary">${(totalGrossRevenue - totalCommissionPaid).toFixed(2)}</div>
          <div className="text-[11px] text-secondary mt-0.5">Net realized revenue after OTA cuts</div>
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
            placeholder="Search channels, contact info, notes..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-text placeholder-secondary/60 focus:outline-hidden focus:border-primary focus:bg-white transition"
          />
        </div>

        {/* Add Channel Button */}
        <button
          onClick={() => { setSourceToEdit(null); setIsModalOpen(true); }}
          className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Business Source</span>
        </button>
      </div>

      {/* Channels Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-border p-12 text-center text-secondary">
            <Globe className="w-10 h-10 mx-auto text-secondary/40 mb-2" />
            <h4 className="font-bold text-text text-sm">No Business Sources Found</h4>
            <p className="text-xs mt-1">Add a new channel source to start tracking revenue by booking origin.</p>
          </div>
        ) : (
          filteredSources.map((src) => {
            const hasCommission = src.commissionPercent > 0;

            return (
              <div key={src.id} className="bg-white rounded-2xl border border-border shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        hasCommission ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-text leading-tight">{src.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-full ${
                            hasCommission ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {src.commissionPercent}% Commission
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSourceToEdit(src); setIsModalOpen(true); }}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer"
                        title="Edit Source"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(src)}
                        className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Contact */}
                  <p className="text-xs text-secondary mt-3 line-clamp-2">
                    {src.notes || src.contactInfo || 'Direct guest origin stream with zero OTA intermediary commission.'}
                  </p>
                </div>

                {/* Performance Metrics */}
                <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary text-[11px]">Bookings Generated:</span>
                    <span className="font-mono font-bold text-text">{src.bookingsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary text-[11px]">Gross Revenue:</span>
                    <span className="font-mono font-bold text-emerald-700">${src.grossRevenueUSD.toFixed(2)}</span>
                  </div>
                  {hasCommission && (
                    <div className="flex items-center justify-between text-amber-800 text-[11px]">
                      <span>Est. Commission:</span>
                      <span className="font-mono">-${src.commissionUSD.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between font-bold">
                    <span className="text-text text-[11px]">Net Resort Yield:</span>
                    <span className="font-mono text-primary">${src.netRevenueUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <NewBusinessSourceModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSourceToEdit(null); }}
        sourceToEdit={sourceToEdit}
      />
    </div>
  );
};
