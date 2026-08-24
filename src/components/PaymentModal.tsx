import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Hotel, 
  Building2, 
  Check, 
  Receipt, 
  DollarSign, 
  User, 
  FileText,
  Percent,
  Landmark,
  Wallet,
  Bed,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod, Order } from '../types';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: (finalizedOrder: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess }) => {
  const { 
    cartGrandTotal, 
    cartSubtotal, 
    cartServiceCharge, 
    cartDiscount, 
    discountPercent,
    settings, 
    finalizePayment, 
    guestName, 
    currentLocation,
    setCurrentLocation,
    setGuestName,
    accounts,
    bookings,
    rooms,
    extractRoomNumber,
    getCheckedInGuest
  } = useApp();

  const activeAccounts = accounts.filter(a => a.isActive);

  // Derive checked in rooms
  const checkedInBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'checked_in');
  }, [bookings]);

  const currentExtractedRoom = useMemo(() => {
    return extractRoomNumber(currentLocation);
  }, [currentLocation, extractRoomNumber]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'LKR'>('USD');
  const [tenderedAmount, setTenderedAmount] = useState<string>(String(cartGrandTotal));
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>(currentExtractedRoom || (checkedInBookings[0]?.roomNumber || ''));
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [editableGuestName, setEditableGuestName] = useState<string>(guestName || (!currentExtractedRoom ? 'Walk-in Guest' : ''));

  // Auto pick account based on payment method
  useEffect(() => {
    if (paymentMethod === 'cash') {
      const posCash = activeAccounts.find(a => a.type === 'cash' && a.name.toLowerCase().includes('pos')) || activeAccounts.find(a => a.type === 'cash');
      if (posCash) setSelectedAccountId(posCash.id);
    } else if (paymentMethod === 'card' || paymentMethod === 'bank_transfer') {
      const mainBank = activeAccounts.find(a => a.type === 'bank');
      if (mainBank) setSelectedAccountId(mainBank.id);
    }
  }, [paymentMethod]);

  const grandTotalUSD = cartGrandTotal;
  const grandTotalLKR = Math.round(cartGrandTotal * settings.usdToLkrRate);

  const tenderedNum = parseFloat(tenderedAmount) || 0;
  
  // Calculate change
  let changeDue = 0;
  if (selectedCurrency === 'USD') {
    changeDue = Math.max(0, tenderedNum - grandTotalUSD);
  } else {
    changeDue = Math.max(0, tenderedNum - grandTotalLKR);
  }

  // Active guest matching selected room
  const activeRoomGuest = useMemo(() => {
    if (!selectedRoomNumber) return null;
    return getCheckedInGuest(selectedRoomNumber);
  }, [selectedRoomNumber, getCheckedInGuest]);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();

    // If room charge, ensure location is set to the room
    if (paymentMethod === 'room_charge' && selectedRoomNumber) {
      setCurrentLocation(`Chalet ${selectedRoomNumber}`);
      setGuestName(activeRoomGuest ? activeRoomGuest.guestName : `Room ${selectedRoomNumber} Guest`);
    } else if (editableGuestName.trim()) {
      setGuestName(editableGuestName.trim());
    } else if (!currentExtractedRoom) {
      setGuestName('Walk-in Guest');
    }

    const finalized = finalizePayment(
      paymentMethod, 
      notes, 
      paymentMethod !== 'room_charge' ? selectedAccountId : undefined, 
      paymentMethod === 'cash' ? tenderedNum : undefined
    );
    onSuccess(finalized);
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-xl max-w-xl w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Settlement & Billing
            </span>
            <h2 className="text-xl font-bold font-serif text-text">
              Complete Guest Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleComplete} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Bill Summary Banner */}
          <div className="bg-surface-muted border border-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-secondary block font-medium">Payable Amount</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-serif font-bold text-text">
                  ${(Number(grandTotalUSD) || 0).toFixed(2)}
                </span>
                <span className="text-xs text-secondary font-bold">USD</span>
              </div>
              <span className="text-xs text-primary font-mono font-semibold">
                ≈ Rs. {grandTotalLKR.toLocaleString()} LKR
              </span>
            </div>

            <div className="text-right text-xs space-y-0.5 text-secondary-dark">
              <p>Location: <span className="font-semibold text-text">{currentLocation}</span></p>
              <p>
                Guest: <span className="font-semibold text-text">{editableGuestName || guestName || 'Walk-in Guest'}</span>
              </p>
              <p className="text-[10px] text-secondary">10% Service Charge Included</p>
            </div>
          </div>

          {/* Guest Name Confirmation / Override for Walk-in Diners */}
          {paymentMethod !== 'room_charge' && (
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-border space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                Walk-In Guest Name / Receipt Reference
              </label>
              <input
                type="text"
                value={editableGuestName}
                onChange={(e) => setEditableGuestName(e.target.value)}
                placeholder="e.g. Walk-in Guest, Mr. Alexander Silva..."
                className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-text font-semibold focus:outline-hidden focus:border-primary"
              />
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'cash', label: 'Cash (USD/LKR)', icon: Banknote },
                { id: 'room_charge', label: 'Room Charge', icon: Hotel },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'cash') {
                        setTenderedAmount(selectedCurrency === 'USD' ? String(grandTotalUSD) : String(grandTotalLKR));
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary-light/60 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-muted border-border text-secondary-dark hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receiving Account Selector */}
            {paymentMethod !== 'room_charge' && (
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-border">
                <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1">
                  Deposit Into Treasury Account
                </label>
                {activeAccounts.filter(a => a.type === 'cash' || a.type === 'bank').length > 0 ? (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg p-2 text-xs font-semibold text-text focus:outline-hidden focus:border-primary"
                  >
                    {activeAccounts
                      .filter(a => a.type === 'cash' || a.type === 'bank')
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.currency} {a.balance.toLocaleString()} available)
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200/50">
                    No active cash or bank accounts found. The payment will be recorded, but funds will not be deposited into the treasury module until an account is set up.
                  </div>
                )}
              </div>
            )}

          {/* Cash Handling with Currency Choice */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-surface-muted rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Tender Currency</span>
                <div className="flex bg-white rounded-full p-0.5 border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('USD');
                      setTenderedAmount(String(grandTotalUSD));
                    }}
                    className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                      selectedCurrency === 'USD' ? 'bg-primary text-white' : 'text-secondary'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('LKR');
                      setTenderedAmount(String(grandTotalLKR));
                    }}
                    className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                      selectedCurrency === 'LKR' ? 'bg-primary text-white' : 'text-secondary'
                    }`}
                  >
                    LKR (Rs.)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                  Amount Received from Guest
                </label>
                <input
                  type="number"
                  step="any"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-base font-mono font-bold text-text focus:outline-hidden focus:border-primary"
                />
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                  <span className="text-secondary font-bold">Change Due to Guest:</span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {selectedCurrency === 'USD' ? `$${(Number(changeDue) || 0).toFixed(2)} USD` : `Rs. ${Math.round(Number(changeDue) || 0).toLocaleString()} LKR`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Room Charge Details */}
          {paymentMethod === 'room_charge' && (
            <div className="p-4 bg-surface-muted rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-primary" />
                  <span>Select In-House Room / Chalet</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-light text-primary">
                  {checkedInBookings.length} Active Checked-In
                </span>
              </div>

              {checkedInBookings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {checkedInBookings.map((b) => {
                    const isSelected = selectedRoomNumber === b.roomNumber;
                    const rMeta = rooms.find(r => r.number === b.roomNumber);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedRoomNumber(b.roomNumber)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-primary ring-2 ring-primary/20 shadow-xs'
                            : 'bg-white/60 border-border hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-primary text-white">
                            Room {b.roomNumber}
                          </span>
                          <span className="text-[10px] text-secondary font-medium">
                            {b.mealPlan.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-text mt-1.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-primary" />
                          <span>{b.guestName}</span>
                        </p>
                        <p className="text-[10px] text-secondary mt-0.5">
                          {rMeta?.name || `Suite ${b.roomNumber}`} • Check-out {b.checkOutDate}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={selectedRoomNumber}
                    onChange={(e) => setSelectedRoomNumber(e.target.value)}
                    placeholder="e.g., 101 or Honeymoon Chalet 02"
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
                  />
                </div>
              )}

              <div className="p-2.5 bg-white rounded-xl border border-border flex items-center gap-2 text-xs text-primary">
                <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                <p className="text-[11px] leading-tight font-medium">
                  Direct PMS Integration: Bill #${(Number(cartGrandTotal) || 0).toFixed(2)} USD will be posted automatically to Room {selectedRoomNumber || '...'} guest folio statement.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Billing Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via HSBC Visa, split bill with room 4"
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Settle & Print Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
