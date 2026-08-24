import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bed, 
  User, 
  Users, 
  Check, 
  Utensils, 
  MapPin, 
  Search, 
  Coffee, 
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { usePOS } from '../../hooks/usePOS';
import { Booking, Room, OrderType, Order } from '../../types';
import { RETREAT_LOCATIONS } from '../../data/menuData';

interface POSGuestSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSelectGuest: (details: {
    location: string;
    guestName: string;
    guestCount: number;
    orderType: OrderType;
    roomNumber?: string;
    bookingId?: string;
    sessionId?: string;
  }) => void;
  onEditOrder?: (order: Order) => void;
}

export const POSGuestSelectorModal: React.FC<POSGuestSelectorModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  onSelectGuest,
  onEditOrder,
}) => {
  const { currentLocation, guestName, guestCount, currentOrderType } = useApp();
  const { rooms, bookings } = usePMS();
  const { orders, walkInSessions, createWalkInSessionAsync: createWalkInSession } = usePOS();

  const [activeMode, setActiveMode] = useState<'room' | 'walkin'>('room');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [selectedWalkinSessionId, setSelectedWalkinSessionId] = useState<string>('');
  const [walkinGuestName, setWalkinGuestName] = useState<string>(guestName || '');
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    if (currentLocation && !currentLocation.startsWith('Chalet')) {
      return currentLocation;
    }
    return 'Table 01 (Main Dining)';
  });
  const [count, setCount] = useState<number>(guestCount > 0 ? guestCount : 2);
  const [orderType, setOrderType] = useState<OrderType>(currentOrderType || 'dine-in');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [customTableNumber, setCustomTableNumber] = useState<string>('');

  // When user switches tabs, ensure appropriate location defaults
  const handleTabSwitch = (mode: 'room' | 'walkin') => {
    setActiveMode(mode);
    if (mode === 'walkin') {
      if (selectedLocation.startsWith('Chalet')) {
        setSelectedLocation('Table 01 (Main Dining)');
      }
      if (!walkinGuestName.trim() || walkinGuestName.startsWith('Room')) {
        setWalkinGuestName('Walk-in Guest');
      }
    } else {
      if (checkedInRoomsWithData.length > 0 && !selectedRoomNumber) {
        const first = checkedInRoomsWithData[0];
        setSelectedRoomNumber(first.roomNumber);
        setSelectedLocation(`Chalet ${first.roomNumber}`);
        setWalkinGuestName(first.guestName);
      }
    }
  };

  // Find all active in-house checked-in bookings
  const checkedInBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'checked_in');
  }, [bookings]);

  // Combine checked-in bookings with room metadata
  const checkedInRoomsWithData = useMemo(() => {
    return checkedInBookings.map(booking => {
      const room = rooms.find(r => r.number === booking.roomNumber);
      return {
        booking,
        room,
        roomNumber: booking.roomNumber,
        guestName: booking.guestName,
        guestCountry: booking.guestCountry,
        mealPlan: booking.mealPlan,
        nights: booking.nights,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomName: room?.name || `Suite ${booking.roomNumber}`,
        floor: room?.floor || 'Main Level',
      };
    }).filter(item => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.roomNumber.toLowerCase().includes(q) ||
        item.guestName.toLowerCase().includes(q) ||
        item.roomName.toLowerCase().includes(q)
      );
    });
  }, [checkedInBookings, rooms, searchFilter]);

  // Derive active walk-in sessions
  const activeWalkinSessions = useMemo(() => {
    return walkInSessions.filter(s => s.status === 'ACTIVE');
  }, [walkInSessions]);

  if (!isOpen) return null;

  const handleSelectRoom = (roomNum: string, guest: string) => {
    setSelectedRoomNumber(roomNum);
    setSelectedLocation(`Chalet ${roomNum}`);
    setWalkinGuestName(guest);
  };

  const handleConfirm = async () => {
    if (activeMode === 'room') {
      const target = checkedInRoomsWithData.find(r => r.roomNumber === selectedRoomNumber) || checkedInRoomsWithData[0];
      if (target) {
        onSelectGuest({
          location: selectedLocation || `Chalet ${target.roomNumber}`,
          guestName: target.guestName,
          guestCount: count,
          orderType: orderType,
          roomNumber: target.roomNumber,
          bookingId: target.booking.id,
        });
      } else if (selectedRoomNumber) {
        onSelectGuest({
          location: `Chalet ${selectedRoomNumber}`,
          guestName: walkinGuestName || `Room ${selectedRoomNumber} Guest`,
          guestCount: count,
          orderType: orderType,
          roomNumber: selectedRoomNumber,
        });
      }
    } else {
      let targetSessionId = selectedWalkinSessionId;
      if (!targetSessionId) {
        const createdSession = await createWalkInSession({
          guestName: walkinGuestName.trim() || 'Walk-in Guest',
          numberOfGuests: count,
          location: selectedLocation
        });
        targetSessionId = createdSession.id;
      }
      onSelectGuest({
        location: selectedLocation,
        guestName: walkinGuestName.trim() || 'Walk-in Guest',
        guestCount: count,
        orderType: orderType,
        sessionId: targetSessionId,
      });
    }
    onClose();
  };

  // Check if form is valid to submit
  const isFormValid = activeMode === 'room' 
    ? (selectedRoomNumber !== '' || checkedInRoomsWithData.length > 0)
    : (selectedLocation !== '');

  return (
    <div className="fixed inset-0 z-50 bg-text/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-border rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-text flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-surface-muted flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-white">
                Step 1 of Ordering
              </span>
              <span className="text-xs text-secondary font-medium">
                Restaurant POS Station
              </span>
            </div>
            <h2 className="text-xl font-bold text-text font-serif">
              Select Guest & Service Destination
            </h2>
            <p className="text-xs text-secondary-dark">
              Choose an in-house checked-in suite from PMS or register a walk-in guest table.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="p-2 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Checked-in In-House Room vs Walk-in Guest */}
        <div className="p-6 pb-2 space-y-4">
          <div className="grid grid-cols-2 p-1 bg-surface-muted rounded-2xl border border-border">
            <button
              type="button"
              id="btn-pos-tab-room"
              onClick={() => handleTabSwitch('room')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'room'
                  ? 'bg-white text-primary shadow-sm border border-border'
                  : 'text-secondary hover:text-text'
              }`}
            >
              <Bed className="w-4 h-4 text-primary" />
              <span>In-House Checked-In Suite ({checkedInBookings.length})</span>
            </button>

            <button
              type="button"
              id="btn-pos-tab-walkin"
              onClick={() => handleTabSwitch('walkin')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'walkin'
                  ? 'bg-white text-primary shadow-sm border border-border'
                  : 'text-secondary hover:text-text'
              }`}
            >
              <User className="w-4 h-4 text-secondary" />
              <span>Walk-in Guest / Table</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="px-6 py-2 overflow-y-auto flex-1 space-y-4">
          {activeMode === 'room' ? (
            <div className="space-y-4">
              {/* Search filter for in-house rooms */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by room number, guest name, or suite..."
                    className="w-full bg-surface-muted border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="text-xs font-semibold text-primary bg-primary-light px-3 py-2 rounded-xl shrink-0">
                  {checkedInRoomsWithData.length} active in-house {checkedInRoomsWithData.length === 1 ? 'room' : 'rooms'}
                </div>
              </div>

              {/* In-House Rooms Grid */}
              {checkedInRoomsWithData.length === 0 ? (
                <div className="p-8 text-center bg-surface-muted rounded-2xl border border-border space-y-2">
                  <Bed className="w-8 h-8 text-secondary/50 mx-auto" />
                  <p className="text-sm font-bold text-text">No matching checked-in rooms found</p>
                  <p className="text-xs text-secondary">
                    {searchFilter ? 'Try clearing your search query.' : 'There are no active checked-in guests in PMS right now.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMode('walkin')}
                    className="mt-2 text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    Switch to Walk-in Guest &rarr;
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checkedInRoomsWithData.map((item) => {
                    const isSelected = selectedRoomNumber === item.roomNumber;
                    return (
                      <div
                        key={item.booking.id}
                        onClick={() => handleSelectRoom(item.roomNumber, item.guestName)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? 'bg-surface-hover border-primary ring-2 ring-primary/20 shadow-sm'
                            : 'bg-white border-border hover:border-secondary hover:bg-surface-hover'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-primary text-white">
                              Room {item.roomNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary-light text-secondary font-semibold uppercase">
                              {item.mealPlan?.replace('_', ' ') || 'Room Only'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-text flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>{item.guestName}</span>
                          </h4>

                          <p className="text-xs text-secondary-dark mt-0.5 line-clamp-1">
                            {item.roomName} ({item.floor})
                          </p>

                          <div className="text-[11px] text-secondary mt-2 flex items-center gap-2">
                            <span>Stay: {item.checkInDate} to {item.checkOutDate}</span>
                            <span>•</span>
                            <span>{item.nights} nights</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Direct Room Folio Charge Enabled</span>
                          </span>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-secondary/30 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Service Destination for Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
                    Service Delivery Option
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text font-semibold focus:outline-hidden focus:border-primary"
                  >
                    <option value="room-service">Room Service (Deliver to Chalet/Room)</option>
                    <option value="dine-in">Dine-In (Main Restaurant Table)</option>
                    <option value="poolside">Poolside Loungers</option>
                    <option value="garden">Tea Garden Pavilion</option>
                    <option value="takeaway">Takeaway / Packaged</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
                    Number of Diners
                  </label>
                  <div className="flex items-center gap-2 bg-surface-muted rounded-xl p-1 border border-border">
                    <button
                      type="button"
                      onClick={() => setCount(Math.max(1, count - 1))}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-bold shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-xs font-bold text-text bg-transparent focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setCount(count + 1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-bold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Walk-in Sessions Selector */}
              {activeWalkinSessions.length > 0 && (
                <div className="p-3 bg-surface-muted rounded-2xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Select Existing Active Walk-In Tab ({activeWalkinSessions.length})</span>
                    </label>
                    <span className="text-[10px] text-secondary font-medium">Click to add items</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeWalkinSessions.map(session => {
                      const sessionOrders = orders.filter(o => o.sessionId === session.id && o.status !== 'cancelled' && o.status !== 'paid');
                      const balance = sessionOrders.reduce((sum, o) => sum + o.grandTotal, 0);
                      const isSelected = selectedWalkinSessionId === session.id;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => {
                            setSelectedWalkinSessionId(session.id);
                            setWalkinGuestName(session.guestName);
                            setSelectedLocation(session.location || 'Table 01 (Main Dining)');
                            setCount(session.numberOfGuests || 2);
                            onSelectGuest({
                              location: session.location || 'Table 01 (Main Dining)',
                              guestName: session.guestName,
                              guestCount: session.numberOfGuests || 2,
                              orderType: 'dine-in',
                              sessionId: session.id
                            });
                            onClose();
                          }}
                          className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-primary-light border-primary ring-2 ring-primary/20 shadow-xs'
                              : 'bg-white border-border hover:border-primary hover:bg-surface-hover shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-text truncate max-w-[130px] flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span>{session.guestName}</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-primary-dark">${balance.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-secondary">
                            <span>{session.location || 'Walk-in Table'} • {session.numberOfGuests} guests</span>
                            <span className="font-mono text-[9px] bg-surface-muted px-1.5 py-0.2 rounded border">{session.id}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Or Open New Walk-in Guest Form */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                    {activeWalkinSessions.length > 0 ? 'Or Start a New Walk-In Tab' : 'Guest Name / Reference'}
                  </label>
                  <span className="text-[10px] text-secondary">Will be printed on KOT, receipt & invoice</span>
                </div>
                
                <input
                  type="text"
                  id="input-walkin-guest-name"
                  value={walkinGuestName}
                  onChange={(e) => {
                    setWalkinGuestName(e.target.value);
                    setSelectedWalkinSessionId('');
                  }}
                  placeholder="e.g. Mr. Alexander Silva, Table 04 Guest..."
                  className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white transition font-semibold"
                />

                {/* Quick name presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-secondary font-medium">Presets:</span>
                  {['Walk-in Guest', 'Day Pass Diner', 'Tea Garden Visitor', 'Bar Guest', 'Takeaway Guest'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setWalkinGuestName(preset);
                        setSelectedWalkinSessionId('');
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        walkinGuestName === preset 
                          ? 'bg-primary text-white border-primary font-bold' 
                          : 'bg-surface-muted text-secondary-dark border-border hover:bg-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / Seating Area Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                    Select Seating Area / Table
                  </label>
                  <span className="text-[10px] font-mono text-primary font-semibold">
                    Current: {selectedLocation}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RETREAT_LOCATIONS.filter(l => !l.name.startsWith('Chalet')).map((loc) => {
                    const isSelected = selectedLocation === loc.name;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setSelectedLocation(loc.name)}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-muted border-border text-[#424242] hover:bg-white'
                        }`}
                      >
                        <span className="leading-snug">{loc.name}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-secondary'}`}>
                          {loc.type.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service Type & Diners count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text font-semibold focus:outline-hidden focus:border-primary"
                  >
                    <option value="dine-in">Dine-In (Table Seating)</option>
                    <option value="poolside">Poolside Bar</option>
                    <option value="garden">Tea Garden</option>
                    <option value="takeaway">Takeaway / Parcel</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-2 bg-surface-muted rounded-xl p-1 border border-border">
                    <button
                      type="button"
                      onClick={() => setCount(Math.max(1, count - 1))}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-bold shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-xs font-bold text-text bg-transparent focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setCount(count + 1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-bold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-surface-muted border-t border-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isFormValid}
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm ${
              isFormValid
                ? 'bg-primary hover:bg-[#4d5541] text-white'
                : 'bg-border text-secondary cursor-not-allowed'
            }`}
          >
            <span>Proceed to Menu Ordering</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
