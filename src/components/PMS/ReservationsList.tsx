import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Plus, 
  Receipt, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowUpDown,
  Download,
  Building,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { Booking, BookingStatus, BookingChannel } from '../../types';

const CHANNEL_NAMES: Record<BookingChannel, string> = {
  booking_com: 'Booking.com',
  agoda: 'Agoda',
  airbnb: 'Airbnb',
  expedia: 'Expedia',
  direct_website: 'Direct Website',
  walk_in: 'Front Desk Walk-In',
  phone_email: 'Phone / Email Direct'
};

export const ReservationsList: React.FC = () => {
  const { 
    setSelectedBookingForDetails,
    setSelectedBookingForFolio,
    setIsNewBookingModalOpen,
    formatCurrency,
    verifyManagerPin
  } = useApp();

  const { 
    bookings, 
    rooms,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    deleteBooking
  } = usePMS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'checkIn' | 'createdAt' | 'guestName'>('checkIn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.guestName.toLowerCase().includes(q);
        const matchesRef = b.bookingReference.toLowerCase().includes(q);
        const matchesChanId = (b.channelReservationId || '').toLowerCase().includes(q);
        const matchesRoom = b.roomNumber.includes(q);
        const matchesEmail = b.guestEmail.toLowerCase().includes(q);
        if (!matchesName && !matchesRef && !matchesChanId && !matchesRoom && !matchesEmail) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Channel
      if (channelFilter !== 'all' && b.channel !== channelFilter) {
        return false;
      }

      // Room
      if (roomFilter !== 'all' && b.roomNumber !== roomFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'checkIn') {
        comparison = a.checkInDate.localeCompare(b.checkInDate);
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else if (sortBy === 'guestName') {
        comparison = a.guestName.localeCompare(b.guestName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [bookings, searchQuery, statusFilter, channelFilter, roomFilter, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ['Reference', 'Guest Name', 'Room', 'Channel', 'Check-In', 'Check-Out', 'Nights', 'Total USD', 'Status', 'Payment Status'];
    const rows = filteredBookings.map(b => [
      b.bookingReference,
      `"${b.guestName}"`,
      b.roomNumber,
      b.channel,
      b.checkInDate,
      b.checkOutDate,
      b.nights,
      b.roomTotalUSD + b.serviceChargeUSD + b.taxAmountUSD,
      b.status,
      b.paymentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hilldale_Reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>Reservations Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-semibold border border-border-focus">
              {filteredBookings.length} Bookings
            </span>
          </h2>
          <p className="text-xs text-secondary">
            Direct guest folios, OTA sync reservations, check-in statuses, and revenue accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-surface-muted hover:bg-border text-text px-3 py-1.5 rounded-lg text-xs font-semibold border border-border transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-new-reservation-list"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guest name, ref #, room, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-text"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          <option value="checked_in">Checked-In (In-House)</option>
          <option value="confirmed">Confirmed (Upcoming)</option>
          <option value="checked_out">Checked-Out</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Channel Filter */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="text-xs bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Channels</option>
          <option value="booking_com">Booking.com</option>
          <option value="agoda">Agoda</option>
          <option value="airbnb">Airbnb</option>
          <option value="expedia">Expedia</option>
          <option value="direct_website">Direct Website</option>
          <option value="walk_in">Front Desk Walk-In</option>
        </select>

        {/* Room Filter */}
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="text-xs bg-surface-muted border border-border rounded-lg px-2.5 py-1.5 text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Rooms</option>
          {rooms.map(r => (
            <option key={r.number} value={r.number}>Room {r.number} ({r.floor})</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1 border-l border-border pl-3">
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 hover:bg-surface-muted rounded text-secondary hover:text-text transition cursor-pointer"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted text-primary border-b border-border font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Room & Floor</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Nights</th>
                <th className="py-3 px-4">Tariff & Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E1D6]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-secondary">
                    No reservations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const totalFolioExtra = (b.folioCharges || []).reduce((sum, f) => sum + (f.amountUSD * f.quantity), 0);
                  const grandTotal = b.roomTotalUSD + b.serviceChargeUSD + b.taxAmountUSD + totalFolioExtra;
                  const totalPaid = (b.payments || []).reduce((sum, p) => sum + p.amountUSD, 0);

                  return (
                    <tr key={b.id} className="hover:bg-background transition-colors">
                      {/* Ref */}
                      <td className="py-3 px-4 font-mono font-bold text-text">
                        <div>{b.bookingReference}</div>
                        {b.channelReservationId && (
                          <div className="text-[10px] text-secondary font-normal">
                            OTA: {b.channelReservationId}
                          </div>
                        )}
                      </td>

                      {/* Guest Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-text">{b.guestName}</div>
                        <div className="text-[11px] text-secondary">
                          {b.guestCountry ? `${b.guestCountry} • ` : ''}{b.guestPhone}
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-border text-text">
                          {b.roomNumber}
                        </span>
                        <div className="text-[10px] text-secondary mt-0.5">
                          {rooms.find(r => r.number === b.roomNumber)?.name || 'Deluxe'}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted border border-border text-primary">
                          {CHANNEL_NAMES[b.channel] || b.channel}
                        </span>
                      </td>

                      {/* Stay Dates */}
                      <td className="py-3 px-4 font-mono text-[11px] text-text">
                        <div>In: {b.checkInDate}</div>
                        <div className="text-secondary">Out: {b.checkOutDate}</div>
                      </td>

                      {/* Nights */}
                      <td className="py-3 px-4 font-bold text-primary">
                        {b.nights} nts
                      </td>

                      {/* Tariff & Total */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-text">{formatCurrency(grandTotal, false)}</div>
                        <div className="text-[10px] text-secondary">
                          Paid: ${(Number(totalPaid) || 0).toFixed(0)} ({b.paymentStatus})
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'checked_in'
                            ? 'bg-primary-light text-primary border border-border-focus'
                            : b.status === 'confirmed'
                            ? 'bg-secondary-light text-secondary border border-accent-light'
                            : b.status === 'checked_out'
                            ? 'bg-surface-muted text-secondary border border-border'
                            : 'bg-accent/20 text-[#9e432c] border border-accent/40'
                        }`}>
                          {b.status === 'checked_in' ? '🟢 In-House' : b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBookingForFolio(b)}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                            title="Open Master Folio & Invoicing"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedBookingForDetails(b)}
                            className="p-1.5 rounded-lg bg-surface-muted hover:bg-border text-text transition cursor-pointer"
                            title="View / Edit Reservation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => checkInGuest(b.id)}
                              className="px-2 py-1 rounded bg-primary text-white text-[10px] font-semibold hover:bg-[#4d5541] transition cursor-pointer"
                            >
                              Check In
                            </button>
                          )}

                          {b.status === 'checked_in' && (
                            <button
                              onClick={() => checkOutGuest(b.id)}
                              className="px-2 py-1 rounded bg-accent text-white text-[10px] font-semibold hover:bg-[#cb654b] transition cursor-pointer"
                            >
                              Check Out
                            </button>
                          )}

                          {b.status === 'cancelled' && (
                            <button
                              onClick={() => {
                                const pin = window.prompt('Enter Manager PIN to permanently delete this reservation:');
                                if (pin) {
                                  const result = verifyManagerPin(pin);
                                  if (result.success) {
                                    if (window.confirm('Are you absolutely sure you want to permanently delete this record? This action cannot be undone.')) {
                                      deleteBooking(b.id);
                                    }
                                  } else {
                                    alert(result.message);
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer border border-rose-200"
                              title="Delete Reservation (Requires Admin PIN)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </div>
  );
};
