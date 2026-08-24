import React, { useMemo } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Receipt, 
  Bed, 
  DollarSign, 
  Coffee, 
  Tag,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { usePOS } from '../../hooks/usePOS';
import { MasterCustomer } from '../../types';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: MasterCustomer | null;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const { settings } = useApp();
  const { bookings } = usePMS();
  const { orders } = usePOS();

  // Find all past/current bookings for this customer
  const customerBookings = useMemo(() => {
    if (!customer) return [];
    const cleanName = customer.name.toLowerCase().trim();
    const cleanPhone = customer.phone?.trim();
    const cleanEmail = customer.email?.toLowerCase().trim();

    return bookings.filter(b => {
      if (cleanPhone && b.guestPhone === cleanPhone) return true;
      if (cleanEmail && b.guestEmail?.toLowerCase() === cleanEmail) return true;
      if (cleanName && b.guestName.toLowerCase() === cleanName) return true;
      return false;
    });
  }, [customer, bookings]);

  // Find all dining/POS orders for this customer
  const customerOrders = useMemo(() => {
    if (!customer) return [];
    const cleanName = customer.name.toLowerCase().trim();

    return orders.filter(o => {
      if (cleanName && o.guestName && o.guestName.toLowerCase() === cleanName) return true;
      return false;
    });
  }, [customer, orders]);

  if (!isOpen || !customer) return null;

  const totalFolioSpend = customerBookings.reduce((sum, b) => sum + (b.roomTotalUSD || 0), 0);
  const totalPOSSpend = customerOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalCombinedSpend = Math.max(customer.lifetimeSpendUSD, totalFolioSpend + totalPOSSpend);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-text">
                  {customer.name}
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  customer.customerType === 'VIP' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : customer.customerType === 'ROOM_GUEST'
                    ? 'bg-primary-light text-primary border border-primary/20'
                    : 'bg-surface-muted text-secondary'
                }`}>
                  {customer.customerType.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-secondary">
                Customer Dossier & Lifetime Spend History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-secondary hover:text-text hover:bg-white border border-border transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Guest Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border">
              <span className="text-[10px] font-bold text-secondary uppercase block">Lifetime Spend</span>
              <span className="font-serif font-bold text-base text-primary block mt-0.5">
                ${totalCombinedSpend.toFixed(2)}
              </span>
              <span className="text-[10px] text-secondary font-mono">
                Rs. {(totalCombinedSpend * settings.usdToLkrRate).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border">
              <span className="text-[10px] font-bold text-secondary uppercase block">Total Visits / Stays</span>
              <span className="font-serif font-bold text-base text-text block mt-0.5">
                {Math.max(customer.totalVisits, customerBookings.length + (customerOrders.length > 0 ? 1 : 0))} Visits
              </span>
              <span className="text-[10px] text-secondary">
                {customerBookings.length} Chalet bookings
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border">
              <span className="text-[10px] font-bold text-secondary uppercase block">Origin Country</span>
              <span className="font-semibold text-xs text-text block mt-0.5">
                {customer.country || 'Sri Lanka'}
              </span>
              {customer.passportOrId && (
                <span className="text-[10px] font-mono text-secondary">ID: {customer.passportOrId}</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border">
              <span className="text-[10px] font-bold text-secondary uppercase block">Business Source</span>
              <span className="font-semibold text-xs text-text block mt-0.5">
                {customer.businessSourceName || 'Direct / Walk-In'}
              </span>
              <span className="text-[10px] text-secondary">Acquisition channel</span>
            </div>
          </div>

          {/* Contact Details & Preferences */}
          <div className="p-4 rounded-xl bg-white border border-border space-y-2 text-xs">
            <div className="font-bold text-secondary uppercase text-[10px] tracking-wider">
              Contact & CRM Notes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-secondary">
              <div>Phone: <strong className="text-text">{customer.phone || '—'}</strong></div>
              <div>Email: <strong className="text-text">{customer.email || '—'}</strong></div>
            </div>
            {customer.notes && (
              <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-amber-950 text-xs mt-2">
                <strong>Preferences:</strong> {customer.notes}
              </div>
            )}
          </div>

          {/* Past Bookings & Stays */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-text uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-primary" />
                Hotel Stays & Reservations ({customerBookings.length})
              </span>
            </div>

            {customerBookings.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-border text-center text-xs text-secondary">
                No room reservation records logged for this guest yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {customerBookings.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-border bg-white flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text">Chalet {b.roomNumber}</span>
                        <span className="font-mono text-[11px] text-secondary">({b.bookingReference})</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                          b.status === 'checked_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-muted text-secondary'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        {b.checkInDate} to {b.checkOutDate} ({b.nights} nights)
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-text">${b.roomTotalUSD.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restaurant Dining Orders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-text uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-800" />
                Restaurant & POS Dining Orders ({customerOrders.length})
              </span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-border text-center text-xs text-secondary">
                No restaurant dining orders logged for this guest name.
              </div>
            ) : (
              <div className="space-y-1.5">
                {customerOrders.map((o) => (
                  <div key={o.id} className="p-3 rounded-xl border border-border bg-white flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text">{o.location}</span>
                        <span className="font-mono text-[11px] text-secondary">#{o.orderNumber}</span>
                        <span className="text-[10px] text-secondary">({(o.items || []).length} items)</span>
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        {new Date(o.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-text">${o.grandTotal.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-700 block uppercase font-bold">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-muted/30 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-white border border-border transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
