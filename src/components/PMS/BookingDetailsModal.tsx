import React, { useState } from 'react';
import { 
  X, 
  Bed, 
  User, 
  Calendar, 
  Globe, 
  Receipt, 
  LogIn, 
  LogOut, 
  XCircle, 
  CreditCard,
  UtensilsCrossed,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Shirt,
  Coffee,
  Compass,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  ShieldCheck,
  Edit,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { FolioExtraItem } from '../../types';

export const BookingDetailsModal: React.FC = () => {
  const { 
    selectedBookingForDetails, 
    setSelectedBookingForDetails, 
    setSelectedBookingForFolio,
    setActivePmsSubTab,
    settings,
    setCurrentLocation,
    setCurrentOrderType,
    setActiveTab,
    formatCurrency,
    setBookingToEdit,
    setIsEditBookingModalOpen,
    unlockSession
  } = useApp();

  const {
    bookings,
    rooms,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    updateBooking,
    addFolioCharge,
    removeFolioItem
  } = usePMS();

  // Quick Charge Form State inside details modal
  const [isQuickChargeOpen, setIsQuickChargeOpen] = useState<boolean>(false);
  const [chargeCategory, setChargeCategory] = useState<FolioExtraItem['category']>('sauna');
  const [chargeDesc, setChargeDesc] = useState<string>('');
  const [chargeAmountUSD, setChargeAmountUSD] = useState<string>('');
  const [chargeQty, setChargeQty] = useState<number>(1);
  const [chargeNotes, setChargeNotes] = useState<string>('');
  const [chargeFilter, setChargeFilter] = useState<'all' | 'meals' | 'laundry' | 'sauna_spa' | 'accommodation' | 'extras'>('all');

  if (!selectedBookingForDetails) return null;

  // Always resolve live booking object from app state
  const b = bookings.find(item => item.id === selectedBookingForDetails.id) || selectedBookingForDetails;
  const room = rooms.find(r => r.number === b.roomNumber);

  // Financial calculations
  const bStart = new Date(b.checkInDate); const bEnd = new Date(b.checkOutDate); let calculatedNights = Math.round((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)); const roomNights = (calculatedNights >= 1 && !isNaN(calculatedNights)) ? calculatedNights : (Number(b.nights) || 1);
  const roomRate = Number(b.ratePerNightUSD) || room?.basePriceUSD || 140;
  const roomBaseTotal = Number(b.roomTotalUSD) > 0 ? Number(b.roomTotalUSD) : (roomNights * roomRate);
  const roomServiceCharge = Number(b.serviceChargeUSD) || 0;
  const roomTax = Number(b.taxAmountUSD) || 0;
  
  const folioItems = b.folioCharges || [];
  const totalFolioExtra = folioItems.reduce((sum, f) => sum + ((Number(f.amountUSD) || 0) * (Number(f.quantity) || 1)), 0);
  const grandTotal = Number((roomBaseTotal + roomServiceCharge + roomTax + totalFolioExtra).toFixed(2));
  const totalPaid = Number(((b.payments || []).reduce((sum, p) => sum + (Number(p.amountUSD) || 0), 0)).toFixed(2));
  const balanceDue = Number(Math.max(0, grandTotal - totalPaid).toFixed(2));

  const handleOpenFolio = () => {
    setSelectedBookingForFolio(b);
    setSelectedBookingForDetails(null);
    setActivePmsSubTab('folios');
  };

  const handleChargeFood = () => {
    setCurrentLocation(`Room ${b.roomNumber}`);
    setCurrentOrderType('room-service');
    setSelectedBookingForDetails(null);
    setActiveTab('pos');
  };

  const handlePostQuickCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeDesc.trim() || !chargeAmountUSD || parseFloat(chargeAmountUSD) <= 0) return;

    addFolioCharge(b.id, {
      date: new Date().toISOString().split('T')[0],
      category: chargeCategory,
      description: chargeDesc.trim(),
      amountUSD: parseFloat(chargeAmountUSD),
      quantity: chargeQty || 1,
      notes: chargeNotes.trim() || 'Charged from Room Details'
    });

    setChargeDesc('');
    setChargeAmountUSD('');
    setChargeQty(1);
    setChargeNotes('');
    setIsQuickChargeOpen(false);
  };

  const applyPreset = (category: FolioExtraItem['category'], desc: string, priceUSD: number) => {
    setChargeCategory(category);
    setChargeDesc(desc);
    setChargeAmountUSD(priceUSD.toString());
    setChargeQty(1);
    setIsQuickChargeOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant_pos':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-[#D4A373]" />;
      case 'laundry':
        return <Shirt className="w-3.5 h-3.5 text-primary" />;
      case 'sauna':
        return <Flame className="w-3.5 h-3.5 text-accent" />;
      case 'spa':
        return <Sparkles className="w-3.5 h-3.5 text-primary" />;
      case 'minibar':
        return <Coffee className="w-3.5 h-3.5 text-secondary" />;
      case 'tour':
      case 'experience':
        return <Compass className="w-3.5 h-3.5 text-primary" />;
      case 'room_rate':
      case 'accommodation':
        return <Bed className="w-3.5 h-3.5 text-primary" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-secondary" />;
    }
  };

  // Filter charges for the view
  const filteredFolioItems = folioItems.filter(item => {
    if (chargeFilter === 'meals') return item.category === 'restaurant_pos';
    if (chargeFilter === 'laundry') return item.category === 'laundry';
    if (chargeFilter === 'sauna_spa') return item.category === 'sauna' || item.category === 'spa';
    if (chargeFilter === 'extras') return item.category !== 'restaurant_pos' && item.category !== 'laundry' && item.category !== 'sauna' && item.category !== 'spa';
    return true;
  });

  const countMeals = folioItems.filter(f => f.category === 'restaurant_pos').length;
  const countLaundry = folioItems.filter(f => f.category === 'laundry').length;
  const countSaunaSpa = folioItems.filter(f => f.category === 'sauna' || f.category === 'spa').length;
  const countExtras = folioItems.filter(f => f.category !== 'restaurant_pos' && f.category !== 'laundry' && f.category !== 'sauna' && f.category !== 'spa').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-border shadow-2xl p-5 space-y-4 my-6 animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              {b.roomNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text">{b.guestName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  b.status === 'checked_in' ? 'bg-primary-light text-primary' : 'bg-surface-muted text-secondary'
                }`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-secondary">Ref: <span className="font-mono font-bold text-text">{b.bookingReference}</span> • {room?.name || 'Deluxe Suite'}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedBookingForDetails(null)} 
            className="p-1.5 rounded-lg hover:bg-surface-muted text-secondary transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1">
          {/* Stay & Room Details Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-surface-muted p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-secondary uppercase block font-semibold">Stay Dates</span>
              <span className="font-mono font-bold text-text text-[11px] block">{b.checkInDate}</span>
              <span className="text-[10px] text-primary font-semibold">to {b.checkOutDate}</span>
            </div>

            <div className="bg-surface-muted p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-secondary uppercase block font-semibold">Duration</span>
              <span className="font-bold text-text text-[11px] block">{roomNights} Nights</span>
              <span className="text-[10px] text-secondary font-mono">${roomRate}/night</span>
            </div>

            <div className="bg-surface-muted p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-secondary uppercase block font-semibold">Guests & Channel</span>
              <span className="font-bold text-text text-[11px] block">
                {b.adultsCount} {b.adultsCount === 1 ? 'Adult' : 'Adults'}
                {b.childrenCount ? `, ${b.childrenCount} ${b.childrenCount === 1 ? 'Kid' : 'Kids'} ${b.childrenAges && b.childrenAges.length > 0 ? `(${b.childrenAges.length === 1 ? 'Age' : 'Ages'}: ${b.childrenAges.join(', ')})` : ''}` : ''}
              </span>
              <span className="text-[10px] text-secondary capitalize">{b.channel.replace('_', ' ')}</span>
            </div>

            <div className="bg-surface-muted p-2.5 rounded-xl border border-border">
              <span className="text-[10px] text-secondary uppercase block font-semibold">Contact</span>
              <span className="font-semibold text-text text-[11px] truncate block">{b.guestPhone || b.guestEmail || 'In-House'}</span>
              <span className="text-[10px] text-secondary">{b.guestCountry || 'International'}</span>
            </div>
          </div>

          {/* Quick-Action Presets for Adding Room Charges */}
          <div className="bg-surface-hover p-3 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Quick Post Charge to Room {b.roomNumber}</span>
              </span>
              <button
                onClick={() => setIsQuickChargeOpen(!isQuickChargeOpen)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isQuickChargeOpen ? 'Hide Custom Form' : '+ Custom Charge'}</span>
                {isQuickChargeOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick 1-Click Preset Badges */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('sauna', 'Hilldale Herbal Sauna & Eucalyptus Steam Session (1 hr)', 25)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border hover:border-accent hover:bg-accent/10 text-text text-[11px] font-medium transition cursor-pointer"
              >
                <Flame className="w-3 h-3 text-accent" />
                <span>🧖 Herbal Sauna ($25)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('laundry', 'Express Laundry & Pressing Service (5 items)', 15)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border hover:border-primary hover:bg-primary-light text-text text-[11px] font-medium transition cursor-pointer"
              >
                <Shirt className="w-3 h-3 text-primary" />
                <span>👔 Express Laundry ($15)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('spa', 'Ayurvedic Herbal Full Body Massage (60 mins)', 45)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border hover:border-primary hover:bg-primary-light text-text text-[11px] font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span>💆 Ayurvedic Spa ($45)</span>
              </button>

              <button
                type="button"
                onClick={handleChargeFood}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-light border border-border-focus hover:bg-[#fae7b9] text-secondary text-[11px] font-bold transition cursor-pointer"
              >
                <UtensilsCrossed className="w-3 h-3 text-secondary" />
                <span>🍽️ Open POS Menu & Meals</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('minibar', 'Minibar Restock: Ceylon Artisan Chocolates & Nuts', 14)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border hover:border-secondary text-text text-[11px] font-medium transition cursor-pointer"
              >
                <Coffee className="w-3 h-3 text-secondary" />
                <span>☕ Minibar ($14)</span>
              </button>
            </div>

            {/* Expandable Custom Charge Form */}
            {isQuickChargeOpen && (
              <form onSubmit={handlePostQuickCharge} className="pt-2 border-t border-border space-y-2.5 bg-white p-3 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase mb-0.5">Category</label>
                    <select
                      value={chargeCategory}
                      onChange={(e) => setChargeCategory(e.target.value as any)}
                      className="w-full bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 font-medium text-text text-xs focus:ring-1 focus:ring-primary"
                    >
                      <option value="sauna">🧖 Sauna & Steam Bath</option>
                      <option value="laundry">👔 Laundry & Pressing</option>
                      <option value="spa">💆 Ayurvedic Spa & Massage</option>
                      <option value="restaurant_pos">🍽️ Restaurant / Room Service</option>
                      <option value="minibar">☕ Minibar & Refreshments</option>
                      <option value="tour">🧭 Guided Tour / Hike</option>
                      <option value="transport">🚕 Taxi & Transport</option>
                      <option value="other">✨ Other Room Service</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-secondary uppercase mb-0.5">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Herbal Steam Bath, 3 Shirts Laundry, etc."
                      value={chargeDesc}
                      onChange={(e) => setChargeDesc(e.target.value)}
                      className="w-full bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-text text-xs focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase mb-0.5">Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.00"
                      value={chargeAmountUSD}
                      onChange={(e) => setChargeAmountUSD(e.target.value)}
                      className="w-full bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 font-mono text-text text-xs focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={chargeQty}
                      onChange={(e) => setChargeQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 font-mono text-text text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase mb-0.5">Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="Time, staff, ref..."
                      value={chargeNotes}
                      onChange={(e) => setChargeNotes(e.target.value)}
                      className="w-full bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-text text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-secondary">
                    Total: <strong className="text-primary">${((parseFloat(chargeAmountUSD) || 0) * chargeQty).toFixed(2)} USD</strong> (Rs. {Math.round(((parseFloat(chargeAmountUSD) || 0) * chargeQty) * settings.usdToLkrRate).toLocaleString()} LKR)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickChargeOpen(false)}
                      className="px-3 py-1 rounded-lg bg-surface-muted text-secondary text-xs font-semibold hover:bg-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 rounded-lg bg-primary text-white text-xs font-bold hover:bg-[#4d5541] shadow-xs cursor-pointer"
                    >
                      Post Charge to Folio
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* All Charges Placed to Room Section */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            {/* Header with Category Filter Tabs */}
            <div className="p-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-text text-xs uppercase tracking-wider">
                  All Charges Placed to Room {b.roomNumber}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold">
                  {1 + folioItems.length} Line Items
                </span>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setChargeFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    chargeFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  All ({1 + folioItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChargeFilter('meals')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    chargeFilter === 'meals' ? 'bg-[#D4A373] text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  🍽️ Meals ({countMeals})
                </button>
                <button
                  type="button"
                  onClick={() => setChargeFilter('laundry')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    chargeFilter === 'laundry' ? 'bg-primary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  👔 Laundry ({countLaundry})
                </button>
                <button
                  type="button"
                  onClick={() => setChargeFilter('sauna_spa')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                    chargeFilter === 'sauna_spa' ? 'bg-accent text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                  }`}
                >
                  🧖 Sauna & Spa ({countSaunaSpa})
                </button>
                {countExtras > 0 && (
                  <button
                    type="button"
                    onClick={() => setChargeFilter('extras')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                      chargeFilter === 'extras' ? 'bg-secondary text-white' : 'bg-surface-muted text-secondary hover:bg-border'
                    }`}
                  >
                    ✨ Extras ({countExtras})
                  </button>
                )}
              </div>
            </div>

            {/* Charges List Table */}
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-primary border-b border-border text-[10px] uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Item / Service Details</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Amount (USD)</th>
                    <th className="py-2 px-3 text-right">Amount (LKR)</th>
                    <th className="py-2 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D6]">
                  {/* 1. Room Accommodation Tariff */}
                  {(chargeFilter === 'all' || chargeFilter === 'accommodation') && (
                    <tr className="bg-white font-medium hover:bg-surface-hover">
                      <td className="py-2.5 px-3 font-mono text-secondary">{b.checkInDate}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                          <Bed className="w-3 h-3" />
                          <span>Room Tariff</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-text">Room Accommodation ({roomNights} Nights)</div>
                        <div className="text-[10px] text-secondary">Rate: ${roomRate.toFixed(2)} USD / night</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">{roomNights}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                        ${roomBaseTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-secondary text-[11px]">
                        Rs. {Math.round(roomBaseTotal * settings.usdToLkrRate).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center text-secondary">
                        <span title="Primary Room Rate" className="text-[10px]">🔒</span>
                      </td>
                    </tr>
                  )}

                  {/* 2. Extra Folio Charges (Restaurant Meals, Laundry, Sauna, Spa, Minibar, Tours) */}
                  {filteredFolioItems.map((folio) => {
                    const amount = Number(folio.amountUSD) || 0;
                    const qty = Number(folio.quantity) || 1;
                    const lineTotalUSD = amount * qty;
                    const lineTotalLKR = Math.round(lineTotalUSD * settings.usdToLkrRate);

                    return (
                      <tr key={folio.id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-2.5 px-3 font-mono text-secondary">{folio.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            folio.category === 'restaurant_pos'
                              ? 'bg-secondary-light text-secondary border border-accent-light'
                              : folio.category === 'sauna'
                              ? 'bg-accent/15 text-accent'
                              : folio.category === 'laundry'
                              ? 'bg-border-focus/60 text-primary'
                              : folio.category === 'spa'
                              ? 'bg-[#D4A373]/20 text-secondary'
                              : 'bg-surface-muted text-text'
                          }`}>
                            {getCategoryIcon(folio.category)}
                            <span>{folio.category.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text">
                          <div className="font-semibold text-xs">{folio.description}</div>
                          {folio.notes && (
                            <div className="text-[10px] text-secondary italic">{folio.notes}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                          ${lineTotalUSD.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-secondary text-[11px]">
                          Rs. {lineTotalLKR.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeFolioItem(b.id, folio.id)}
                            className="text-secondary hover:text-accent p-1 transition cursor-pointer"
                            title="Remove charge from room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredFolioItems.length === 0 && chargeFilter !== 'all' && chargeFilter !== 'accommodation' && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-secondary italic text-xs">
                        No {chargeFilter.replace('_', ' ')} charges placed to this room yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments & Deposits History (if any) */}
          {(b.payments || []).length > 0 && (
            <div className="bg-surface-hover p-3 rounded-xl border border-border space-y-1.5">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">
                Payments & Deposits Recorded
              </span>
              <div className="space-y-1">
                {(b.payments || []).map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-border text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-text capitalize">{pay.paymentMethod.replace('_', ' ')}</span>
                      {pay.reference && <span className="text-[10px] text-secondary font-mono">({pay.reference})</span>}
                      <span className="text-[10px] text-secondary">{pay.date}</span>
                    </div>
                    <span className="font-mono font-bold text-primary">${(Number(pay.amountUSD) || 0).toFixed(2)} USD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial summary breakdown */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[10px] text-secondary uppercase block font-medium">Room Accommodation</span>
              <span className="font-bold text-text text-xs">${roomBaseTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-secondary uppercase block font-medium">Services & Extras</span>
              <span className="font-bold text-primary text-xs">${totalFolioExtra.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-secondary uppercase block font-medium">Total Invoiced</span>
              <div className="font-bold text-text text-sm">${grandTotal.toFixed(2)}</div>
              <span className="text-[10px] text-secondary">Rs. {Math.round(grandTotal * settings.usdToLkrRate).toLocaleString()}</span>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[10px] text-secondary uppercase block font-medium">Balance Due</span>
              <div className={`font-bold text-sm ${balanceDue > 0 ? 'text-[#9e432c]' : 'text-primary'}`}>
                ${balanceDue.toFixed(2)} USD
              </div>
              <span className="text-[10px] text-secondary">Rs. {Math.round(balanceDue * settings.usdToLkrRate).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => {
                setBookingToEdit(b);
                setIsEditBookingModalOpen(true);
                setSelectedBookingForDetails(null);
              }}
              className="flex items-center justify-center gap-1.5 bg-surface-muted hover:bg-border text-text py-2 px-3.5 rounded-lg text-xs font-semibold border border-border transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            
            {b.status !== 'cancelled' && b.status !== 'checked_out' && (
              <button
                onClick={() => {
                  if (b.status === 'checked_in') {
                    alert('You cannot cancel a booking that is currently checked in. Please undo the check-in first.');
                    return;
                  }
                  const password = window.prompt('Please enter your PIN or password to cancel this reservation:');
                  if (password === null) return;
                  if (!unlockSession(password)) {
                    alert('Incorrect password. Cancellation aborted.');
                    return;
                  }
                  if (window.confirm('Are you absolutely sure you want to cancel this reservation? This cannot be easily undone.')) {
                    cancelBooking(b.id);
                    setSelectedBookingForDetails(null);
                  }
                }}
                className={`flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white py-2 px-2.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                  b.status === 'checked_in' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title={b.status === 'checked_in' ? 'Cannot cancel checked-in reservation' : 'Cancel Reservation'}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              onClick={handleOpenFolio}
              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white py-2 px-3.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Open Master Folio & Print</span>
            </button>

            <button
              onClick={handleChargeFood}
              className="flex items-center justify-center gap-1.5 bg-secondary-light hover:bg-[#fae7b9] text-secondary py-2 px-3 rounded-lg text-xs font-semibold border border-border-focus transition cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Charge Food / POS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {b.status === 'confirmed' && (
              <button
                onClick={() => {
                  if (!b.passportOrId?.trim() || !b.guestCountry?.trim()) {
                    alert('Passport/National ID and Country are required to check in. Please Edit the reservation to add them first.');
                    return;
                  }
                  checkInGuest(b.id);
                  setSelectedBookingForDetails(null);
                }}
                className="flex items-center justify-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Check In</span>
              </button>
            )}

            {b.status === 'checked_in' && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to undo this check-in and revert the status?')) {
                      updateBooking({ ...b, status: 'confirmed' });
                      setSelectedBookingForDetails(null);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-surface-muted hover:bg-border text-secondary py-2 px-3 rounded-lg text-xs font-semibold border border-border transition cursor-pointer"
                  title="Undo Check-In"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Undo Check-In</span>
                </button>
                <button
                  onClick={() => {
                    checkOutGuest(b.id);
                    setSelectedBookingForDetails(null);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-accent hover:bg-[#cb654b] text-white py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

