import React from 'react';
import { 
  Bed, 
  User, 
  LogIn, 
  LogOut, 
  Receipt, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Wrench, 
  Plus, 
  Coffee, 
  Calendar,
  UtensilsCrossed
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Room, Booking, HousekeepingStatus } from '../../types';
import { usePMS } from '../../hooks/usePMS';

export const FrontDeskBoard: React.FC = () => {
  const { 
    setSelectedBookingForFolio,
    setSelectedBookingForDetails,
    setIsNewBookingModalOpen,
    setNewBookingPreselectedRoom,
    setNewBookingPreselectedDate,
    setCurrentLocation,
    setCurrentOrderType,
    setActiveTab,
    formatCurrency
  } = useApp();

  const { 
    rooms, 
    bookings, 
    updateHousekeepingStatus, 
    checkInGuest, 
    checkOutGuest 
  } = usePMS();

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to get active booking for a room today
  const getRoomOccupancy = (roomNumber: string): { 
    type: 'occupied' | 'arriving_today' | 'departing_today' | 'vacant'; 
    booking?: Booking 
  } => {
    // 1. Check if currently checked in
    const checkedIn = bookings.find(b => b.roomNumber === roomNumber && b.status === 'checked_in');
    if (checkedIn) {
      if (checkedIn.checkOutDate === todayStr) {
        return { type: 'departing_today', booking: checkedIn };
      }
      return { type: 'occupied', booking: checkedIn };
    }

    // 2. Check if arriving today
    const arrivingToday = bookings.find(b => b.roomNumber === roomNumber && b.status === 'confirmed' && b.checkInDate === todayStr);
    if (arrivingToday) {
      return { type: 'arriving_today', booking: arrivingToday };
    }

    // 3. Otherwise vacant
    return { type: 'vacant' };
  };

  const handleHousekeepingCycle = (room: Room) => {
    const sequence: HousekeepingStatus[] = ['clean', 'inspected', 'dirty', 'maintenance'];
    const currentIdx = sequence.indexOf(room.housekeepingStatus);
    const nextStatus = sequence[(currentIdx + 1) % sequence.length];
    updateHousekeepingStatus(room.number, nextStatus);
  };

  const handleChargeRoomFood = (roomNumber: string, guestName?: string) => {
    setCurrentLocation(`Room ${roomNumber}`);
    setCurrentOrderType('room-service');
    setActiveTab('pos');
  };

  return (
    <div className="space-y-4">
      {/* Front Desk Summary Bar */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>Front Desk & Rooms Board</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary text-white font-semibold">
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </h2>
          <p className="text-xs text-secondary">
            Live room statuses, guest folios, instant check-in/out and housekeeping turnaround.
          </p>
        </div>

        {/* Quick status summary counts */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-primary-light border border-border-focus text-primary font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>
              {rooms.filter(r => getRoomOccupancy(r.number).type === 'occupied' || getRoomOccupancy(r.number).type === 'departing_today').length} / 7 Occupied
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-secondary-light border border-accent-light/60 text-secondary font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>
              {rooms.filter(r => getRoomOccupancy(r.number).type === 'arriving_today').length} Arrivals Today
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-surface-muted border border-border text-text font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text/40"></span>
            <span>
              {rooms.filter(r => getRoomOccupancy(r.number).type === 'vacant').length} Vacant Ready
            </span>
          </div>
        </div>
      </div>

      {/* 7 Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const occupancy = getRoomOccupancy(room.number);
          const booking = occupancy.booking;

          const totalFolioExtra = (booking?.folioCharges || []).reduce((sum, f) => sum + (f.amountUSD * f.quantity), 0);
          const totalFolioGrand = booking ? (booking.roomTotalUSD + booking.serviceChargeUSD + booking.taxAmountUSD + totalFolioExtra) : 0;
          const totalPaid = (booking?.payments || []).reduce((sum, p) => sum + p.amountUSD, 0);
          const balanceDue = booking ? Math.max(0, totalFolioGrand - totalPaid) : 0;

          return (
            <div
              key={room.id}
              className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                occupancy.type === 'occupied' || occupancy.type === 'departing_today'
                  ? 'bg-white border-primary/30 ring-1 ring-primary/15'
                  : occupancy.type === 'arriving_today'
                  ? 'bg-white border-accent-light ring-1 ring-accent-light/30'
                  : 'bg-white border-border'
              }`}
            >
              {/* Card Header */}
              <div className="p-3.5 border-b border-border bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-base shadow-xs">
                      {room.number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-text line-clamp-1" title={room.name}>
                        {room.name}
                      </div>
                      <div className="text-[11px] text-secondary">
                        {room.floor} • {room.bedType}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-primary">
                      ${room.basePriceUSD}
                    </span>
                    <div className="text-[10px] text-secondary">/ night</div>
                  </div>
                </div>

                {/* Housekeeping Badge & Status Toggle */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleHousekeepingCycle(room)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer border flex items-center gap-1 ${
                      room.housekeepingStatus === 'clean'
                        ? 'bg-primary-light text-primary border-border-focus'
                        : room.housekeepingStatus === 'inspected'
                        ? 'bg-[#D4E09B] text-primary-dark border-border-focus'
                        : room.housekeepingStatus === 'dirty'
                        ? 'bg-secondary-light text-secondary border-accent-light'
                        : 'bg-accent/20 text-[#9e432c] border-accent/40'
                    }`}
                    title="Click to cycle housekeeping status"
                  >
                    {room.housekeepingStatus === 'clean' && <CheckCircle className="w-3 h-3" />}
                    {room.housekeepingStatus === 'inspected' && <Sparkles className="w-3 h-3" />}
                    {room.housekeepingStatus === 'dirty' && <AlertCircle className="w-3 h-3" />}
                    {room.housekeepingStatus === 'maintenance' && <Wrench className="w-3 h-3" />}
                    <span>Housekeeping: {room.housekeepingStatus}</span>
                  </button>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    occupancy.type === 'occupied'
                      ? 'bg-primary text-white'
                      : occupancy.type === 'departing_today'
                      ? 'bg-accent text-white'
                      : occupancy.type === 'arriving_today'
                      ? 'bg-accent-light text-secondary'
                      : 'bg-primary-light text-primary'
                  }`}>
                    {occupancy.type === 'occupied' && 'Occupied'}
                    {occupancy.type === 'departing_today' && 'Departing'}
                    {occupancy.type === 'arriving_today' && 'Arriving'}
                    {occupancy.type === 'vacant' && 'Vacant'}
                  </span>
                </div>
              </div>

              {/* Card Body / Guest Details */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                {booking ? (
                  <div className="space-y-2">
                    <div className="bg-surface-muted p-2.5 rounded-lg border border-border">
                      <div className="flex items-center justify-between text-xs font-bold text-text">
                        <span className="truncate">{booking.guestName}</span>
                        <span className="text-[10px] text-secondary font-normal uppercase bg-white px-1.5 py-0.5 rounded border border-border">
                          {booking.channel.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-secondary mt-1 flex items-center justify-between">
                        <span>Dates: {booking.checkInDate} → {booking.checkOutDate}</span>
                        <span className="font-semibold text-primary">({booking.nights} nts)</span>
                      </div>

                      {booking.specialRequests && (
                        <p className="text-[10px] text-secondary italic mt-1 bg-white/70 p-1 rounded border border-border/60 line-clamp-2">
                          "{booking.specialRequests}"
                        </p>
                      )}
                    </div>

                    {/* Folio preview info */}
                    <div className="bg-white p-2 rounded-lg border border-border text-xs flex items-center justify-between">
                      <div>
                        <span className="text-secondary text-[10px] uppercase">Folio Balance</span>
                        <div className="font-mono font-bold text-text">
                          {formatCurrency(balanceDue, false)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-secondary text-[10px] uppercase">POS / Extras</span>
                        <div className="font-mono text-primary font-semibold text-xs">
                          {(booking.folioCharges || []).length} items (${(Number(totalFolioExtra) || 0).toFixed(2)})
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-secondary flex flex-col items-center justify-center space-y-1">
                    <Bed className="w-6 h-6 text-border-focus" />
                    <p className="font-medium text-primary">Vacant & Ready</p>
                    <p className="text-[10px]">No active guest in-house.</p>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
                  {occupancy.type === 'occupied' || occupancy.type === 'departing_today' ? (
                    <>
                      <button
                        onClick={() => setSelectedBookingForFolio(booking!)}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-[#4d5541] text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                        title="View Guest Folio & Invoicing"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Guest Folio</span>
                      </button>

                      <button
                        onClick={() => handleChargeRoomFood(room.number, booking?.guestName)}
                        className="flex items-center justify-center gap-1 bg-secondary-light hover:bg-[#fae7b9] text-secondary py-1.5 px-2 rounded-lg text-xs font-semibold border border-border-focus transition cursor-pointer"
                        title="Create Restaurant / Room Service Order for this Room"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>Food</span>
                      </button>

                      <button
                        onClick={() => checkOutGuest(booking!.id)}
                        className="flex items-center justify-center gap-1 bg-surface-muted hover:bg-accent/20 text-secondary hover:text-[#9e432c] py-1.5 px-2 rounded-lg text-xs font-semibold border border-border transition cursor-pointer"
                        title="Check Out Guest"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Out</span>
                      </button>
                    </>
                  ) : occupancy.type === 'arriving_today' ? (
                    <>
                      <button
                        onClick={() => checkInGuest(booking!.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-[#4d5541] text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Check In Guest</span>
                      </button>

                      <button
                        onClick={() => setSelectedBookingForDetails(booking!)}
                        className="flex items-center justify-center gap-1 bg-surface-muted hover:bg-white text-secondary py-1.5 px-2.5 rounded-lg text-xs font-semibold border border-border transition cursor-pointer"
                      >
                        Details
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setNewBookingPreselectedRoom(room.number);
                          setNewBookingPreselectedDate(todayStr);
                          setIsNewBookingModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-[#4d5541] text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book Room {room.number}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
