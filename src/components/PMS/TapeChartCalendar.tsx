import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Bed, 
  User, 
  Globe, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { Booking, Room, BookingChannel } from '../../types';

const CHANNEL_BADGES: Record<BookingChannel, { name: string; bg: string; text: string; border: string }> = {
  booking_com: { name: 'Booking.com', bg: 'bg-[#003580]/10', text: 'text-[#003580]', border: 'border-[#003580]/30' },
  agoda: { name: 'Agoda', bg: 'bg-[#008234]/10', text: 'text-[#008234]', border: 'border-[#008234]/30' },
  airbnb: { name: 'Airbnb', bg: 'bg-[#FF5A5F]/10', text: 'text-[#FF5A5F]', border: 'border-[#FF5A5F]/30' },
  expedia: { name: 'Expedia', bg: 'bg-[#FFD200]/20', text: 'text-[#946A00]', border: 'border-[#FFD200]/40' },
  direct_website: { name: 'Direct Web', bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  walk_in: { name: 'Walk-In', bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary/30' },
  phone_email: { name: 'Direct Phone', bg: 'bg-accent/15', text: 'text-[#9e432c]', border: 'border-accent/30' }
};

export const TapeChartCalendar: React.FC = () => {
  const { 
    setSelectedBookingForDetails,
    setSelectedBookingForFolio,
    setIsNewBookingModalOpen,
    setNewBookingPreselectedRoom,
    setNewBookingPreselectedDate,
    formatCurrency
  } = useApp();

  const { rooms, bookings } = usePMS();

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2); // Start 2 days before today
    return d;
  });

  const daysToShow = 14;

  // Generate date columns
  const dateColumns: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dateColumns.push(d);
  }

  const shiftDays = (delta: number) => {
    setStartDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const resetToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    setStartDate(d);
  };

  const formatDateKey = (d: Date) => d.toISOString().split('T')[0];
  const todayKey = new Date().toISOString().split('T')[0];

  const handleCellClick = (roomNumber: string, dateStr: string) => {
    // Check if there is an existing booking covering this cell
    const existing = bookings.find(b => {
      if (b.roomNumber !== roomNumber || b.status === 'cancelled') return false;
      return dateStr >= b.checkInDate && dateStr < b.checkOutDate;
    });

    if (existing) {
      setSelectedBookingForDetails(existing);
    } else {
      setNewBookingPreselectedRoom(roomNumber);
      setNewBookingPreselectedDate(dateStr);
      setIsNewBookingModalOpen(true);
    }
  };

  // Calculate occupancy percentage for current window
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalRoomNights = rooms.length * daysToShow;
  let bookedNights = 0;

  dateColumns.forEach(date => {
    const dKey = formatDateKey(date);
    rooms.forEach(room => {
      const isOccupied = activeBookings.some(b => b.roomNumber === room.number && dKey >= b.checkInDate && dKey < b.checkOutDate);
      if (isOccupied) bookedNights++;
    });
  });

  const occupancyRate = Math.round((bookedNights / totalRoomNights) * 100);

  return (
    <div className="space-y-4">
      {/* Tape Chart Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <span>Room Availability & Tape Chart</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-semibold border border-border-focus">
                7 Retreat Rooms
              </span>
            </h2>
            <p className="text-xs text-secondary">
              Interactive visual timeline. Click any booking to manage folios, or click empty dates to book.
            </p>
          </div>
        </div>

        {/* Date Navigation & Occupancy Metric */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted border border-border text-xs">
            <span className="text-secondary">Period Occupancy:</span>
            <span className="font-bold text-primary">{occupancyRate}%</span>
            <span className="text-secondary">({bookedNights}/{totalRoomNights} nights)</span>
          </div>

          <div className="flex items-center bg-surface-muted rounded-lg border border-border p-0.5">
            <button
              id="btn-calendar-prev"
              onClick={() => shiftDays(-7)}
              className="p-1.5 hover:bg-white rounded text-secondary hover:text-text transition cursor-pointer"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-calendar-today"
              onClick={resetToToday}
              className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-white rounded transition cursor-pointer"
            >
              Today
            </button>
            <button
              id="btn-calendar-next"
              onClick={() => shiftDays(7)}
              className="p-1.5 hover:bg-white rounded text-secondary hover:text-text transition cursor-pointer"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-new-reservation-tape"
            onClick={() => {
              setNewBookingPreselectedRoom(null);
              setNewBookingPreselectedDate(todayKey);
              setIsNewBookingModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Channel Color Legend */}
      <div className="flex items-center gap-2 px-1 flex-wrap text-xs text-secondary">
        <span className="font-semibold text-text">Channels:</span>
        {Object.entries(CHANNEL_BADGES).map(([key, badge]) => (
          <span
            key={key}
            className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.name}
          </span>
        ))}
        <span className="ml-auto text-[11px] flex items-center gap-1 text-primary">
          <Info className="w-3.5 h-3.5" /> Hover on a reservation block to see quick details
        </span>
      </div>

            {/* Calendar Grid Container */}
      <div className="bg-white rounded-xl border border-border shadow-xs overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row: Dates */}
          <div className="flex border-b border-border bg-surface-muted min-w-max">
            <div className="p-3 w-[200px] shrink-0 font-semibold text-xs text-primary uppercase tracking-wider border-r border-border flex items-center justify-between">
              <span>Rooms Inventory</span>
              <span className="text-[10px] text-secondary font-normal font-sans">Rate / Nt</span>
            </div>

            <div className="flex-1 flex min-w-[784px]">
              {dateColumns.map((date, idx) => {
                const dKey = formatDateKey(date);
                const isToday = dKey === todayKey;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[56px] p-2 text-center border-r border-border last:border-r-0 ${
                      isToday ? 'bg-primary/15 font-bold text-primary' : isWeekend ? 'bg-secondary-light/30' : ''
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold text-secondary">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-xs ${isToday ? 'font-black text-primary' : 'font-bold text-text'}`}>
                      {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    {isToday && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Rows */}
          {rooms.map((room) => {
            const roomBookings = activeBookings.filter(b => {
              if (b.roomNumber !== room.number) return false;
              const start = formatDateKey(dateColumns[0]);
              const end = formatDateKey(dateColumns[daysToShow - 1]);
              return (b.checkInDate <= end && b.checkOutDate >= start);
            });

            return (
              <div
                key={room.id}
                className="flex border-b border-border last:border-b-0 hover:bg-background/60 transition-colors min-w-max"
              >
                {/* Room Info Cell */}
                <div className="p-3 border-r border-border bg-[#FAF8F5]/80 flex flex-col justify-center w-[200px] shrink-0 z-20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-text bg-white px-2 py-0.5 rounded border border-border shadow-2xs">
                      {room.number}
                    </span>
                    <span className="font-semibold text-xs text-primary font-mono">
                      ${room.basePriceUSD}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-text mt-1 line-clamp-1" title={room.name}>
                    {room.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-secondary mt-0.5">
                    <span>{room.floor}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                      room.housekeepingStatus === 'clean' || room.housekeepingStatus === 'inspected'
                        ? 'bg-primary-light text-primary'
                        : room.housekeepingStatus === 'dirty'
                        ? 'bg-accent-light/60 text-secondary'
                        : 'bg-border-focus text-primary'
                    }`}>
                      {room.housekeepingStatus}
                    </span>
                  </div>
                </div>

                {/* Days Container */}
                <div className="flex-1 relative flex min-w-[784px] overflow-hidden">
                  {/* Background Empty Cells */}
                  {dateColumns.map((date, colIdx) => {
                    const dKey = formatDateKey(date);
                    const isToday = dKey === todayKey;

                    return (
                      <div
                        key={colIdx}
                        onClick={() => handleCellClick(room.number, dKey)}
                        className={`flex-1 min-w-[56px] border-r border-border last:border-r-0 cursor-pointer hover:bg-primary-light/30 transition-colors group flex items-center justify-center min-h-[64px] ${
                          isToday ? 'bg-primary/5' : ''
                        }`}
                        title={`Room ${room.number} Available on ${dKey}. Click to create reservation.`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-primary bg-white/90 px-1.5 py-0.5 rounded border border-border-focus shadow-2xs">
                          + Book
                        </span>
                      </div>
                    );
                  })}

                  {/* Absolute Bookings Overlay */}
                  {roomBookings.map((b) => {
                    const parseDate = (dStr) => {
                      const [y, m, d] = dStr.split('-');
                      return new Date(Number(y), Number(m)-1, Number(d));
                    };
                    const visibleStart = parseDate(formatDateKey(dateColumns[0]));
                    const bStart = parseDate(b.checkInDate);
                    const bEnd = parseDate(b.checkOutDate);
                    
                    const diffTime = bStart.getTime() - visibleStart.getTime();
                    const startIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    let nights = Math.round((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24));
                    if (nights < 1 || isNaN(nights)) nights = b.nights || 1;
                    
                    const leftPercent = (startIndex + 0.5) * (100 / daysToShow);
                    const widthPercent = nights * (100 / daysToShow);
                    const channelBadge = CHANNEL_BADGES[b.channel] || CHANNEL_BADGES.direct_website;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingForDetails(b)}
                        className="absolute top-1.5 bottom-1.5 cursor-pointer group select-none z-10 px-0.5"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                      >
                        <div
                          className={`h-full w-full rounded-md p-1.5 flex flex-col justify-between border transition-all shadow-2xs group-hover:shadow-md group-hover:scale-[1.02] ${channelBadge.bg} ${channelBadge.border} bg-opacity-95 bg-white` }
                          title={`${b.guestName} (${nights} nights) - ${b.status.toUpperCase()} via ${channelBadge.name}`}
                        >
                          <div className="flex items-center justify-between gap-1 overflow-hidden">
                            <span className={`text-[10px] font-bold truncate ${channelBadge.text}`}>
                              {b.guestName.split(' ')[0]}
                            </span>
                            <span className="text-[9px] px-1 rounded bg-white/80 font-mono font-semibold text-text shadow-2xs shrink-0">
                              {nights}N
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px] text-secondary">
                            <span className="font-semibold uppercase tracking-tighter truncate bg-white/60 px-1 rounded">
                              {b.status === 'checked_in' ? '🟢 In-House' : b.status}
                            </span>
                            <span className="font-mono font-medium shrink-0">
                              ${b.ratePerNightUSD}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
