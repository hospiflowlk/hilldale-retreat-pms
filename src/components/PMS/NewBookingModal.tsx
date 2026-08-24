import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Bed, 
  User, 
  Globe, 
  DollarSign, 
  Check, 
  ShieldCheck, 
  Phone, 
  Mail,
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { BookingChannel, MealPlan } from '../../types';

export const NewBookingModal: React.FC = () => {
  const { 
    isNewBookingModalOpen, 
    setIsNewBookingModalOpen, 
    newBookingPreselectedRoom, 
    newBookingPreselectedDate,
    settings 
  } = useApp();

  const {
    rooms,
    bookings,
    createBooking
  } = usePMS();

  const [roomNumber, setRoomNumber] = useState<string>('101');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestCountry, setGuestCountry] = useState<string>('Sri Lanka');
  const [passportOrId, setPassportOrId] = useState<string>('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [channel, setChannel] = useState<BookingChannel>('walk_in');
  const [mealPlan, setMealPlan] = useState<MealPlan>('bed_and_breakfast');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [kidsCount, setKidsCount] = useState<number>(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  const handleKidsCountChange = (count: number) => {
    setKidsCount(count);
    setChildrenAges(prev => {
      if (count === 0) return [];
      const newAges = [...prev];
      while (newAges.length < count) newAges.push(5); // Default age 5
      return newAges.slice(0, count);
    });
  };
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [customRateUSD, setCustomRateUSD] = useState<string>('');
  const [submissionStatus, setSubmissionStatus] = useState<'confirmed' | 'checked_in'>('confirmed');

  useEffect(() => {
    if (newBookingPreselectedRoom) {
      setRoomNumber(newBookingPreselectedRoom);
    }
    if (newBookingPreselectedDate) {
      setCheckInDate(newBookingPreselectedDate);
      const nextDay = new Date(newBookingPreselectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().split('T')[0]);
    }
  }, [newBookingPreselectedRoom, newBookingPreselectedDate, isNewBookingModalOpen]);

  if (!isNewBookingModalOpen) return null;

  const selectedRoomObj = rooms.find(r => r.number === roomNumber) || rooms[0];

  // Calculate nights
  const calculateNights = (inDate: string, outDate: string) => {
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  };

  const nights = calculateNights(checkInDate, checkOutDate);
  const effectiveRateUSD = customRateUSD ? parseFloat(customRateUSD) || selectedRoomObj.basePriceUSD : selectedRoomObj.basePriceUSD;
  const roomBaseTotalUSD = effectiveRateUSD * nights;
  const serviceChargeUSD = Number((roomBaseTotalUSD * 0.10).toFixed(2));
  const grandTotalUSD = Number((roomBaseTotalUSD + serviceChargeUSD).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    if (submissionStatus === 'checked_in') {
      if (!passportOrId.trim() || !guestCountry.trim()) {
        alert('Passport/National ID and Country are required to Check-In immediately. Please provide them, or just use "Make Reservation".');
        return;
      }
    }

    createBooking({
      roomNumber,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      guestCountry: guestCountry.trim(),
      passportOrId: passportOrId.trim() || undefined,
      checkInDate,
      checkOutDate,
      channel,
      status: submissionStatus,
      ratePerNightUSD: effectiveRateUSD,
      nights: nights,
      roomTotalUSD: effectiveRateUSD * nights,
      serviceChargeUSD: serviceChargeUSD,
      taxAmountUSD: 0,
      adultsCount,
      childrenCount: kidsCount,
      childrenAges: kidsCount > 0 ? childrenAges : undefined,
      mealPlan,
      specialRequests: specialRequests.trim() || undefined,
      payments: [],
      folioCharges: [],
      paymentStatus: 'pending'
    } as any);

    setIsNewBookingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-border shadow-2xl p-5 space-y-4 my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">New Guest Reservation</h3>
              <p className="text-[11px] text-secondary">Hilldale Retreat Property Management</p>
            </div>
          </div>
          <button 
            onClick={() => setIsNewBookingModalOpen(false)} 
            className="p-1 rounded-lg hover:bg-surface-muted text-secondary hover:text-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Room & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF8F5] p-3 rounded-xl border border-border">
            <div>
              <label className="block font-semibold text-text mb-1">Select Room</label>
              <select
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value);
                  setCustomRateUSD('');
                }}
                className="w-full bg-white border border-border rounded-lg p-2 font-bold text-text focus:ring-1 focus:ring-primary"
              >
                {rooms.map(r => (
                  <option key={r.number} value={r.number}>
                    Room {r.number} - {r.name} (${r.basePriceUSD}/nt)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Check-In Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-white border border-border rounded-lg p-2 font-mono text-text focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Check-Out Date</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-white border border-border rounded-lg p-2 font-mono text-text focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Guest Personal Information */}
          <div className="space-y-2">
            <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider">Guest Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-text mb-1">Full Guest Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Wright"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Country / Nationality</label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom, Germany, Sri Lanka"
                  value={guestCountry}
                  onChange={(e) => setGuestCountry(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Passport / National ID</label>
                <input
                  type="text"
                  placeholder="Passport number or NIC"
                  value={passportOrId}
                  onChange={(e) => setPassportOrId(e.target.value)}
                  className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Channel & Meal Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1">Booking Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-surface-muted border border-border rounded-lg p-2 font-medium text-text focus:ring-1 focus:ring-primary"
              >
                <option value="walk_in">Front Desk Walk-In</option>
                <option value="direct_website">Direct Hilldale Website</option>
                <option value="booking_com">Booking.com</option>
                <option value="agoda">Agoda</option>
                <option value="airbnb">Airbnb</option>
                <option value="expedia">Expedia</option>
                <option value="phone_email">Direct Phone / Email</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Meal Plan</label>
              <select
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value as any)}
                className="w-full bg-surface-muted border border-border rounded-lg p-2 font-medium text-text focus:ring-1 focus:ring-primary"
              >
                <option value="bed_and_breakfast">Bed & Breakfast (BB)</option>
                <option value="room_only">Room Only (RO)</option>
                <option value="half_board">Half Board (HB)</option>
                <option value="full_board">Full Board (FB)</option>
                <option value="all_inclusive">All Inclusive (AI)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Nightly Rate ($ USD)</label>
              <input
                type="number"
                placeholder={`Default: $${selectedRoomObj.basePriceUSD}`}
                value={customRateUSD}
                onChange={(e) => setCustomRateUSD(e.target.value)}
                className="w-full bg-surface-muted border border-border rounded-lg p-2 font-mono font-bold text-text focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Occupancy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1">Adults</label>
              <input
                type="number"
                min="1"
                value={adultsCount}
                onChange={(e) => setAdultsCount(parseInt(e.target.value) || 1)}
                className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Kids</label>
              <input
                type="number"
                min="0"
                max="3"
                value={kidsCount}
                onChange={(e) => {
                  let count = parseInt(e.target.value) || 0;
                  if (count > 3) count = 3;
                  handleKidsCountChange(count);
                }}
                className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
              />
            </div>
            {kidsCount > 0 && (
              <div className="col-span-2 sm:col-span-2">
                <label className="block font-semibold text-text mb-1">Children Ages (Max 11)</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {childrenAges.map((age, i) => (
                    <div key={i} className="flex-shrink-0 relative">
                      <span className="absolute left-2 top-2 text-[10px] text-secondary">Child {i+1}</span>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={age}
                        onChange={(e) => {
                          const newAges = [...childrenAges];
                          let val = parseInt(e.target.value) || 0;
                          if (val > 11) val = 11;
                          newAges[i] = val;
                          setChildrenAges(newAges);
                        }}
                        className="w-20 bg-surface-muted border border-border rounded-lg p-2 pt-5 text-center text-text focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Special Requests */}
          <div>
            <label className="block font-semibold text-text mb-1">Special Requests / Preferences</label>
            <input
              type="text"
              placeholder="e.g. Honeymoon setup with flower decor, Airport pickup requested"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-lg p-2 text-text focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Calculated Cost Summary */}
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-border flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] uppercase text-secondary block">
                Stay Summary: {nights} Nights @ ${effectiveRateUSD}/nt + 10% Service
              </span>
              <span className="text-xs font-semibold text-text">
                Rs. {Math.round(grandTotalUSD * settings.usdToLkrRate).toLocaleString()} LKR
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-secondary block uppercase">Grand Total</span>
              <span className="text-base font-bold text-primary">${grandTotalUSD.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewBookingModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-muted text-secondary font-semibold hover:bg-border cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => setSubmissionStatus('confirmed')}
              className={`px-4 py-2 rounded-lg font-bold cursor-pointer transition ${
                checkInDate === todayStr 
                  ? 'bg-surface-muted text-primary border border-primary hover:bg-primary-light' 
                  : 'bg-primary text-white hover:bg-primary-dark shadow-xs'
              }`}
            >
              Make Reservation
            </button>
            {checkInDate === todayStr && (
              <button
                type="submit"
                onClick={() => setSubmissionStatus('checked_in')}
                className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark shadow-xs cursor-pointer"
              >
                Reserve & Check-In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
