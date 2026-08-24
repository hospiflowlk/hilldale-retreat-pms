import React, { useState } from 'react';
import { 
  Receipt, 
  User, 
  Calendar, 
  Plus, 
  DollarSign, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Trash2, 
  UtensilsCrossed, 
  Sparkles,
  Flame,
  Shirt,
  Coffee,
  Compass,
  Bed,
  Tag,
  Info,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking, FolioExtraItem, PaymentMethod } from '../../types';
import { usePMS } from '../../hooks/usePMS';

export const GuestFolioView: React.FC = () => {
  const { 
    settings, 
    selectedBookingForFolio, 
    setSelectedBookingForFolio, 
    formatCurrency,
    accounts
  } = useApp();

  const {
    bookings,
    rooms,
    addFolioCharge,
    addBookingPayment,
    removeFolioItem,
    deleteBooking,
    updateBooking
  } = usePMS();

  // If no booking is selected, pick the first checked_in booking or first available
  const activeBooking: Booking | undefined = selectedBookingForFolio || bookings.find(b => b.status === 'checked_in') || bookings[0];

  const [isAddChargeOpen, setIsAddChargeOpen] = useState<boolean>(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [folioFilter, setFolioFilter] = useState<'all' | 'meals' | 'laundry' | 'sauna_spa' | 'accommodation' | 'extras'>('all');

  // New Charge form state
  const [chargeCategory, setChargeCategory] = useState<FolioExtraItem['category']>('sauna');
  const [chargeDesc, setChargeDesc] = useState<string>('');
  const [chargeAmountUSD, setChargeAmountUSD] = useState<string>('');
  const [chargeQty, setChargeQty] = useState<number>(1);
  const [chargeNotes, setChargeNotes] = useState<string>('');

  // New Payment form state
  const [paymentAmountUSD, setPaymentAmountUSD] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const activeAccounts = accounts.filter(a => a.isActive);

  // Sync default account
  React.useEffect(() => {
    if (paymentMethod === 'cash') {
      const cashAcc = activeAccounts.find(a => a.type === 'cash');
      if (cashAcc) setSelectedAccountId(cashAcc.id);
    } else if (paymentMethod === 'card' || paymentMethod === 'bank_transfer') {
      const bankAcc = activeAccounts.find(a => a.type === 'bank');
      if (bankAcc) setSelectedAccountId(bankAcc.id);
    }
  }, [paymentMethod]);

  if (!activeBooking) {
    return (
      <div className="bg-white p-8 rounded-xl border border-border text-center text-secondary">
        <Receipt className="w-12 h-12 mx-auto text-border-focus mb-3" />
        <h3 className="text-base font-bold text-text">No Active Reservations Available</h3>
        <p className="text-xs mt-1">Please create a booking to view its guest folio billing.</p>
      </div>
    );
  }

  const room = rooms.find(r => r.number === activeBooking.roomNumber);

  // Folio Calculations
  const roomBaseTotal = activeBooking.status === 'cancelled' ? 0 : (Number(activeBooking.roomTotalUSD) || 0);
  const roomServiceCharge = activeBooking.status === 'cancelled' ? 0 : (Number(activeBooking.serviceChargeUSD) || 0);
  const roomTax = activeBooking.status === 'cancelled' ? 0 : (Number(activeBooking.taxAmountUSD) || 0);
  const extrasTotal = (activeBooking.folioCharges || []).reduce((sum, f) => sum + ((Number(f.amountUSD) || 0) * (Number(f.quantity) || 1)), 0);
  const grandTotal = Number((roomBaseTotal + roomServiceCharge + roomTax + extrasTotal).toFixed(2));
  const totalPaid = Number(((activeBooking.payments || []).reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0)).toFixed(2));
  const balanceDue = Number(Math.max(0, grandTotal - totalPaid).toFixed(2));

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeDesc.trim() || !chargeAmountUSD || parseFloat(chargeAmountUSD) <= 0) return;

    addFolioCharge(activeBooking.id, {
      date: new Date().toISOString().split('T')[0],
      category: chargeCategory,
      description: chargeDesc.trim(),
      amountUSD: parseFloat(chargeAmountUSD),
      quantity: chargeQty || 1,
      notes: chargeNotes.trim() || 'Added from Front Desk Folio'
    });

    setChargeDesc('');
    setChargeAmountUSD('');
    setChargeQty(1);
    setChargeNotes('');
    setIsAddChargeOpen(false);
  };

  const applyPresetCharge = (cat: FolioExtraItem['category'], desc: string, priceUSD: number) => {
    setChargeCategory(cat);
    setChargeDesc(desc);
    setChargeAmountUSD(priceUSD.toString());
    setChargeQty(1);
    setIsAddChargeOpen(true);
  };

  const getFolioCategoryBadge = (category: string) => {
    switch (category) {
      case 'restaurant_pos':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-light text-secondary border border-accent-light text-[10px] font-bold uppercase">
            <UtensilsCrossed className="w-3 h-3" />
            <span>Restaurant Meal</span>
          </span>
        );
      case 'sauna':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-bold uppercase">
            <Flame className="w-3 h-3" />
            <span>Sauna & Steam</span>
          </span>
        );
      case 'laundry':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-border-focus/60 text-primary text-[10px] font-bold uppercase">
            <Shirt className="w-3 h-3" />
            <span>Laundry</span>
          </span>
        );
      case 'spa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4A373]/20 text-secondary text-[10px] font-bold uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Ayurvedic Spa</span>
          </span>
        );
      case 'minibar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted text-secondary text-[10px] font-bold uppercase">
            <Coffee className="w-3 h-3" />
            <span>Minibar</span>
          </span>
        );
      case 'tour':
      case 'experience':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-light text-primary text-[10px] font-bold uppercase">
            <Compass className="w-3 h-3" />
            <span>Tour & Experience</span>
          </span>
        );
      case 'accommodation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
            <Bed className="w-3 h-3" />
            <span>Accommodation</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted text-text text-[10px] font-bold uppercase">
            <Tag className="w-3 h-3" />
            <span>{category.replace('_', ' ')}</span>
          </span>
        );
    }
  };

  const filteredFolios = (activeBooking.folioCharges || []).filter(item => {
    if (folioFilter === 'meals') return item.category === 'restaurant_pos';
    if (folioFilter === 'laundry') return item.category === 'laundry';
    if (folioFilter === 'sauna_spa') return item.category === 'sauna' || item.category === 'spa';
    if (folioFilter === 'extras') return item.category !== 'restaurant_pos' && item.category !== 'laundry' && item.category !== 'sauna' && item.category !== 'spa';
    return true;
  });

  const countMeals = (activeBooking.folioCharges || []).filter(f => f.category === 'restaurant_pos').length;
  const countLaundry = (activeBooking.folioCharges || []).filter(f => f.category === 'laundry').length;
  const countSaunaSpa = (activeBooking.folioCharges || []).filter(f => f.category === 'sauna' || f.category === 'spa').length;
  const countExtras = (activeBooking.folioCharges || []).filter(f => f.category !== 'restaurant_pos' && f.category !== 'laundry' && f.category !== 'sauna' && f.category !== 'spa').length;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmountUSD || parseFloat(paymentAmountUSD) <= 0) return;

    addBookingPayment(activeBooking.id, {
      amountUSD: parseFloat(paymentAmountUSD),
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      accountId: paymentMethod !== 'room_charge' ? selectedAccountId : undefined,
      reference: paymentRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined
    });

    setPaymentAmountUSD('');
    setPaymentRef('');
    setPaymentNotes('');
    setIsAddPaymentOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Selector / Folio Header */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-lg shadow-xs">
            {activeBooking.roomNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text">{activeBooking.guestName}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                activeBooking.status === 'checked_in'
                  ? 'bg-primary-light text-primary'
                  : 'bg-surface-muted text-secondary'
              }`}>
                {activeBooking.status === 'checked_in' ? '🟢 In-House' : activeBooking.status}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Folio Ref: <span className="font-mono font-bold text-text">{activeBooking.bookingReference}</span> • {room?.name || 'Deluxe Room'} ({room?.floor})
            </p>
          </div>
        </div>

        {/* Quick Room Switcher */}
        <div className="flex items-center gap-2">
          {activeBooking.status === 'cancelled' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently delete this cancelled reservation?')) {
                  deleteBooking(activeBooking.id);
                }
              }}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer border border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Reservation</span>
            </button>
          )}

          <label className="text-xs text-secondary font-medium hidden sm:inline">Select Room:</label>
          <select
            value={activeBooking.id}
            onChange={(e) => {
              const b = bookings.find(item => item.id === e.target.value);
              if (b) setSelectedBookingForFolio(b);
            }}
            className="text-xs bg-surface-muted border border-border rounded-lg px-3 py-1.5 font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {bookings.filter(b => b.status !== 'cancelled').map(b => (
              <option key={b.id} value={b.id}>
                Room {b.roomNumber} - {b.guestName.split(' ')[0]} ({b.checkInDate} → {b.checkOutDate})
              </option>
            ))}
          </select>

          <button
            id="btn-print-guest-folio"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Folio</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Folio Breakdown & Right Financial Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Itemized Folio Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Guest Stay Information Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Reservation Information</span>
              <span className="text-[11px] font-normal text-secondary uppercase">
                Channel: <strong className="text-text">{activeBooking.channel.replace('_', ' ')}</strong>
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-surface-muted p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-secondary uppercase block">Check-In</span>
                <span className="font-mono font-bold text-text">{activeBooking.checkInDate}</span>
                <span className="text-[10px] text-secondary block">{activeBooking.checkInTime || '14:00'}</span>
              </div>

              <div className="bg-surface-muted p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-secondary uppercase block">Check-Out</span>
                <span className="font-mono font-bold text-text">{activeBooking.checkOutDate}</span>
                <span className="text-[10px] text-secondary block">{activeBooking.checkOutTime || '11:00'}</span>
              </div>

              <div className="bg-surface-muted p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-secondary uppercase block">Duration</span>
                <span className="font-bold text-primary">{activeBooking.nights} Nights</span>
                <span className="text-[10px] text-secondary block">${activeBooking.ratePerNightUSD}/night</span>
              </div>

              <div className="bg-surface-muted p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-secondary uppercase block">Guests</span>
                <span className="font-bold text-text">{activeBooking.adultsCount} Adults</span>
                <span className="text-[10px] text-secondary block">{activeBooking.guestCountry || 'International'}</span>
              </div>
            </div>

            {activeBooking.specialRequests && (
              <div className="mt-2.5 bg-secondary-light/40 p-2 rounded-lg border border-accent-light/60 text-xs text-secondary">
                <strong className="text-text">Guest Notes / Requests:</strong> {activeBooking.specialRequests}
              </div>
            )}
          </div>

          {/* Itemized Folio Table */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-background">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Itemized Charges & Services
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold">
                  {1 + (activeBooking.folioCharges || []).length} Entries
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setFolioFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    folioFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  All ({1 + (activeBooking.folioCharges || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFolioFilter('meals')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    folioFilter === 'meals' ? 'bg-[#D4A373] text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  🍽️ Meals ({countMeals})
                </button>
                <button
                  type="button"
                  onClick={() => setFolioFilter('laundry')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    folioFilter === 'laundry' ? 'bg-primary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  👔 Laundry ({countLaundry})
                </button>
                <button
                  type="button"
                  onClick={() => setFolioFilter('sauna_spa')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    folioFilter === 'sauna_spa' ? 'bg-accent text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  🧖 Sauna & Spa ({countSaunaSpa})
                </button>
                {countExtras > 0 && (
                  <button
                    type="button"
                    onClick={() => setFolioFilter('extras')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      folioFilter === 'extras' ? 'bg-secondary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                    }`}
                  >
                    ✨ Extras ({countExtras})
                  </button>
                )}

                <button
                  onClick={() => setIsAddChargeOpen(true)}
                  className="flex items-center gap-1 bg-primary hover:bg-[#4d5541] text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ml-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Charge</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-primary border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Description & Notes</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Amount (USD)</th>
                    <th className="py-2.5 px-4 text-right">Amount (LKR)</th>
                    <th className="py-2.5 px-4 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E6E1D6]">
                  {/* 1. Base Room Accommodation Tariff */}
                  {(folioFilter === 'all' || folioFilter === 'accommodation') && activeBooking.status !== 'cancelled' && (
                    <tr className="bg-white font-medium hover:bg-surface-hover">
                      <td className="py-2.5 px-4 font-mono text-secondary">{activeBooking.checkInDate}</td>
                      <td className="py-2.5 px-4">
                        {getFolioCategoryBadge('accommodation')}
                      </td>
                      <td className="py-2.5 px-4 text-text">
                        <div className="font-bold">Room {activeBooking.roomNumber} Accommodation Tariff ({activeBooking.nights} nights @ ${activeBooking.ratePerNightUSD})</div>
                        <div className="text-[10px] text-secondary">Primary accommodation tariff for stay</div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">{activeBooking.nights}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-text">
                        ${(Number(activeBooking.roomTotalUSD) || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-secondary">
                        Rs. {Math.round((Number(activeBooking.roomTotalUSD) || 0) * settings.usdToLkrRate).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-secondary">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove the accommodation tariff? This will set the room rate to $0.')) {
                              updateBooking({
                                ...activeBooking,
                                ratePerNightUSD: 0,
                                roomTotalUSD: 0,
                                serviceChargeUSD: 0,
                                taxAmountUSD: 0
                              });
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-secondary hover:text-red-500 rounded cursor-pointer transition"
                          title="Remove Room Tariff (Set to $0)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* 2. Extra Folio Charges (Restaurant POS, Laundry, Sauna, Spa, Tours) */}
                  {filteredFolios.map((folio) => {
                    const amount = Number(folio.amountUSD) || 0;
                    const qty = Number(folio.quantity) || 1;
                    const lkr = Math.round(amount * qty * settings.usdToLkrRate);

                    return (
                      <tr key={folio.id} className="hover:bg-background transition-colors">
                        <td className="py-2.5 px-4 font-mono text-secondary">{folio.date}</td>
                        <td className="py-2.5 px-4">
                          {getFolioCategoryBadge(folio.category)}
                        </td>
                        <td className="py-2.5 px-4 text-text">
                          <div className="font-semibold">{folio.description}</div>
                          {folio.notes && <div className="text-[10px] text-secondary italic">{folio.notes}</div>}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono">{qty}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-text">
                          ${(amount * qty).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-secondary">
                          Rs. {lkr.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => removeFolioItem(activeBooking.id, folio.id)}
                            className="text-secondary hover:text-accent p-1 transition cursor-pointer"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredFolios.length === 0 && folioFilter !== 'all' && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-secondary italic text-xs">
                        No {folioFilter.replace('_', ' ')} charges posted to Room {activeBooking.roomNumber} yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Financial Summary & Payments Ledger */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
              <span>Folio Financial Balance</span>
              <span className="text-[10px] font-mono text-secondary">1 USD = Rs. {settings.usdToLkrRate}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-secondary">
                <span>Room Charges:</span>
                <span className="font-mono font-semibold text-text">${roomBaseTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-secondary">
                <span>Hospitality Service Charge (10%):</span>
                <span className="font-mono font-semibold text-text">${roomServiceCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-secondary">
                <span>POS & Extras Subtotal:</span>
                <span className="font-mono font-semibold text-primary">${extrasTotal.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-text">
                <span>Grand Total:</span>
                <div className="text-right">
                  <span className="font-mono">${grandTotal.toFixed(2)}</span>
                  <div className="text-[10px] text-secondary font-normal font-mono">
                    Rs. {Math.round(grandTotal * settings.usdToLkrRate).toLocaleString()} LKR
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-primary font-semibold pt-1">
                <span>Total Payments Applied:</span>
                <span className="font-mono">-${totalPaid.toFixed(2)}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted border border-border flex justify-between items-center mt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
                    Balance Due
                  </span>
                  <span className={`text-base font-mono font-black ${
                    balanceDue > 0 ? 'text-[#9e432c]' : 'text-primary'
                  }`}>
                    ${balanceDue.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-secondary block">In LKR</span>
                  <span className="text-xs font-mono font-bold text-text">
                    Rs. {Math.round(balanceDue * settings.usdToLkrRate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentAmountUSD(balanceDue > 0 ? String(balanceDue) : '');
                setIsAddPaymentOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#4d5541] text-white py-2 px-3 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer mt-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment / Settle</span>
            </button>
          </div>

          {/* Payments Applied Ledger Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
              <span>Payments Applied</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold">
                {(activeBooking.payments || []).length} Records
              </span>
            </h3>

            {(!activeBooking.payments || activeBooking.payments.length === 0) ? (
              <p className="text-xs text-secondary py-3 text-center">
                No payments recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {(activeBooking.payments || []).map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-surface-muted border border-border text-xs">
                    <div className="flex items-center justify-between font-bold text-text">
                      <span className="uppercase text-[10px] tracking-wider text-primary">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-primary">+${p.amountUSD.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-secondary mt-0.5 flex justify-between">
                      <span>{p.date}</span>
                      <span>Rs. {Math.round(p.amountUSD * settings.usdToLkrRate).toLocaleString()}</span>
                    </div>
                    {p.reference && (
                      <div className="text-[10px] text-secondary font-mono mt-0.5 truncate">
                        Ref: {p.reference}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Extra Charge Modal */}
      {isAddChargeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text">
                Add Extra Charge to Room {activeBooking.roomNumber}
              </h3>
              <button onClick={() => setIsAddChargeOpen(false)} className="text-secondary hover:text-text text-sm cursor-pointer">
                ✕
              </button>
            </div>

            {/* Quick 1-Click Preset Buttons inside Modal */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-secondary uppercase">1-Click Presets</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setChargeCategory('sauna');
                    setChargeDesc('Hilldale Eucalyptus Herbal Sauna & Steam Bath (1 hr)');
                    setChargeAmountUSD('25');
                    setChargeQty(1);
                  }}
                  className="px-2 py-1 rounded-md bg-surface-hover border border-border hover:border-accent text-[11px] font-medium cursor-pointer"
                >
                  🧖 Sauna ($25)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChargeCategory('laundry');
                    setChargeDesc('Express Laundry & Pressing Service (5 items)');
                    setChargeAmountUSD('15');
                    setChargeQty(1);
                  }}
                  className="px-2 py-1 rounded-md bg-surface-hover border border-border hover:border-primary text-[11px] font-medium cursor-pointer"
                >
                  👔 Laundry ($15)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChargeCategory('spa');
                    setChargeDesc('Ayurvedic Herbal Full Body Massage (60 mins)');
                    setChargeAmountUSD('45');
                    setChargeQty(1);
                  }}
                  className="px-2 py-1 rounded-md bg-surface-hover border border-border hover:border-primary text-[11px] font-medium cursor-pointer"
                >
                  💆 Spa ($45)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChargeCategory('restaurant_pos');
                    setChargeDesc('Room Service Lunch / Dinner Order');
                    setChargeAmountUSD('30');
                    setChargeQty(1);
                  }}
                  className="px-2 py-1 rounded-md bg-surface-hover border border-border hover:border-[#D4A373] text-[11px] font-medium cursor-pointer"
                >
                  🍽️ Meal ($30)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCharge} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Service Category</label>
                <select
                  value={chargeCategory}
                  onChange={(e) => setChargeCategory(e.target.value as any)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 font-medium text-text focus:ring-1 focus:ring-primary"
                >
                  <option value="sauna">🧖 Sauna & Eucalyptus Steam Bath</option>
                  <option value="laundry">👔 Laundry & Garment Pressing</option>
                  <option value="spa">💆 Wellness & Ayurvedic Spa Therapy</option>
                  <option value="restaurant_pos">🍽️ Restaurant / Bar / Room Service</option>
                  <option value="minibar">☕ Minibar & Refreshments</option>
                  <option value="tour">🧭 Guided Tour & Excursion</option>
                  <option value="transport">🚕 Airport / Station Taxi Transfer</option>
                  <option value="experience">✨ Experience & Tea Workshop</option>
                  <option value="other">📋 Other Service</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Herbal Sauna Session, Express Laundry 5 shirts, Nanu Oya Station Taxi"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-text mb-1">Unit Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.00"
                    value={chargeAmountUSD}
                    onChange={(e) => setChargeAmountUSD(e.target.value)}
                    className="w-full bg-surface-muted border border-border rounded-lg p-2 font-mono text-text focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={chargeQty}
                    onChange={(e) => setChargeQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-surface-muted border border-border rounded-lg p-2 font-mono text-text focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Notes / Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delivered 4:00 PM, requested by guest..."
                  value={chargeNotes}
                  onChange={(e) => setChargeNotes(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-border flex justify-between text-xs font-mono font-bold text-primary">
                <span>Total Charge:</span>
                <span>${((parseFloat(chargeAmountUSD) || 0) * chargeQty).toFixed(2)} USD (Rs. {Math.round(((parseFloat(chargeAmountUSD) || 0) * chargeQty) * settings.usdToLkrRate).toLocaleString()} LKR)</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChargeOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-muted text-secondary font-semibold hover:bg-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-[#4d5541] cursor-pointer"
                >
                  Add to Folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text">
                Record Payment for Room {activeBooking.roomNumber}
              </h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-secondary hover:text-text text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Amount to Collect ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmountUSD}
                  onChange={(e) => setPaymentAmountUSD(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 font-mono font-bold text-base text-text focus:ring-1 focus:ring-primary"
                  required
                />
                <span className="text-[11px] text-secondary block mt-0.5">
                  Approx Rs. {Math.round((parseFloat(paymentAmountUSD) || 0) * settings.usdToLkrRate).toLocaleString()} LKR
                </span>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 font-medium text-text focus:ring-1 focus:ring-primary"
                >
                  <option value="card">Credit / Debit Card (Mastercard / Visa / Amex)</option>
                  <option value="cash">Cash (USD or LKR)</option>
                  <option value="bank_transfer">Bank Transfer / Online Wire</option>
                  <option value="room_charge">Pre-settled via OTA (Booking.com / Airbnb)</option>
                </select>
              </div>

              {paymentMethod !== 'room_charge' && (
                <div>
                  <label className="block font-semibold text-text mb-1">Deposit Into Treasury Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-surface-muted border border-border rounded-lg p-2 text-xs font-semibold text-text focus:ring-1 focus:ring-primary"
                  >
                    {activeAccounts
                      .filter(a => a.type === 'cash' || a.type === 'bank')
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.currency} {a.balance.toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-text mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Card Auth #9812, Cash $100 + Rs. 15,000"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-muted text-secondary font-semibold hover:bg-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-[#4d5541]"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Master Guest Folio Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-border shadow-2xl p-6 space-y-6 my-8 animate-in fade-in zoom-in duration-150">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-border pb-3 print:hidden">
              <div className="text-xs text-secondary font-medium">
                Official Guest Folio Statement • Hilldale Retreat
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[#4d5541] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-surface-muted text-secondary text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Folio Content */}
            <div className="space-y-4 font-sans text-xs text-text">
              {/* Folio Brand Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h1 className="text-xl font-black text-primary uppercase font-sans tracking-wide">
                    {settings.retreatName || 'HILLDALE RETREAT'}
                  </h1>
                  <p className="text-[11px] text-secondary italic">{settings.retreatTagline}</p>
                  <p className="text-[10px] text-secondary mt-1">
                    {settings.address} • Tel: {settings.phone} • {settings.email}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-text">GUEST FOLIO INVOICE</div>
                  <div className="text-[11px] text-secondary">Folio #: {activeBooking.bookingReference}</div>
                  <div className="text-[10px] text-secondary">Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Guest & Stay Details */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-3 rounded-lg border border-border">
                <div>
                  <span className="text-[10px] uppercase text-secondary font-bold block">Guest Name</span>
                  <div className="text-sm font-bold text-text">{activeBooking.guestName}</div>
                  <div className="text-[10px] text-secondary">
                    {activeBooking.guestCountry ? `${activeBooking.guestCountry} • ` : ''}{activeBooking.guestEmail}
                  </div>
                  {activeBooking.passportOrId && (
                    <div className="text-[10px] font-mono text-secondary">ID/Passport: {activeBooking.passportOrId}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-secondary font-bold block">Accommodation Details</span>
                  <div className="font-bold text-text">Room {activeBooking.roomNumber} - {room?.name}</div>
                  <div className="text-[10px] font-mono text-secondary">
                    In: {activeBooking.checkInDate} → Out: {activeBooking.checkOutDate} ({activeBooking.nights} nights)
                  </div>
                  <div className="text-[10px] text-secondary">
                    Channel: {activeBooking.channel.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-text/20 text-primary uppercase text-[10px] font-bold">
                    <th className="py-2">Date</th>
                    <th className="py-2">Item / Service Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">USD ($)</th>
                    <th className="py-2 text-right">LKR (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D6]">
                  <tr>
                    <td className="py-2 font-mono">{activeBooking.checkInDate}</td>
                    <td className="py-2 font-medium">Room Accommodation ({activeBooking.nights} nights @ ${activeBooking.ratePerNightUSD})</td>
                    <td className="py-2 text-center">{activeBooking.nights}</td>
                    <td className="py-2 text-right font-mono">${(Number(activeBooking.roomTotalUSD) || 0).toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">Rs. {Math.round((Number(activeBooking.roomTotalUSD) || 0) * settings.usdToLkrRate).toLocaleString()}</td>
                  </tr>

                  {(activeBooking.folioCharges || []).map((item) => {
                    const amount = Number(item.amountUSD) || 0;
                    const qty = Number(item.quantity) || 1;
                    return (
                      <tr key={item.id}>
                        <td className="py-2 font-mono">{item.date}</td>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-center">{qty}</td>
                        <td className="py-2 text-right font-mono">${(amount * qty).toFixed(2)}</td>
                        <td className="py-2 text-right font-mono">Rs. {Math.round(amount * qty * settings.usdToLkrRate).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="border-t-2 border-text pt-3 flex justify-between">
                <div className="text-[10px] text-secondary max-w-[280px]">
                  Thank you for choosing Hilldale Retreat. We hope you enjoyed the serene beauty and hospitality of the hill country.
                </div>
                <div className="space-y-1 text-right font-mono text-xs w-64">
                  <div className="flex justify-between text-secondary">
                    <span>Subtotal:</span>
                    <span>${(roomBaseTotal + extrasTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>10% Service Charge:</span>
                    <span>${roomServiceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-text border-t border-border pt-1">
                    <span>Total Amount:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-secondary">
                    (Rs. {Math.round(grandTotal * settings.usdToLkrRate).toLocaleString()} LKR)
                  </div>
                  <div className="flex justify-between text-primary font-semibold pt-1">
                    <span>Payments Received:</span>
                    <span>-${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#9e432c] border-t border-border pt-1">
                    <span>Net Balance Due:</span>
                    <span>${balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
