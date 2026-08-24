import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Bed, 
  BookOpen, 
  Receipt, 
  Globe, 
  Plus, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PmsSubTab } from '../../types';
import { TapeChartCalendar } from './TapeChartCalendar';
import { FrontDeskBoard } from './FrontDeskBoard';
import { ReservationsList } from './ReservationsList';
import { GuestFolioView } from './GuestFolioView';
import { ChannelManagerView } from './ChannelManagerView';
import { NewBookingModal } from './NewBookingModal';
import { EditBookingModal } from './EditBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';
import { usePMS } from '../../hooks/usePMS';

export const PMSView: React.FC = () => {
  const { 
    activePmsSubTab, 
    setActivePmsSubTab, 
    channels,
    isSyncingChannels,
    triggerChannelSync,
    setIsNewBookingModalOpen 
  } = useApp();

  const { bookings, rooms } = usePMS();

  const activeInHouseCount = bookings.filter(b => b.status === 'checked_in').length;
  const activeBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;

  return (
    <div className="space-y-4">
      {/* Top Header & PMS Sub-Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="tab-pms-calendar"
            onClick={() => setActivePmsSubTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePmsSubTab === 'calendar'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-text hover:bg-surface-muted'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Availability & Tape Chart</span>
          </button>

          <button
            id="tab-pms-frontdesk"
            onClick={() => setActivePmsSubTab('frontdesk')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePmsSubTab === 'frontdesk'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-text hover:bg-surface-muted'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Front Desk & Rooms</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activePmsSubTab === 'frontdesk' ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'
            }`}>
              {activeInHouseCount}/7 In
            </span>
          </button>

          <button
            id="tab-pms-reservations"
            onClick={() => setActivePmsSubTab('reservations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePmsSubTab === 'reservations'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-text hover:bg-surface-muted'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reservations</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activePmsSubTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-surface-muted text-secondary'
            }`}>
              {activeBookingsCount}
            </span>
          </button>

          <button
            id="tab-pms-folios"
            onClick={() => setActivePmsSubTab('folios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePmsSubTab === 'folios'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-text hover:bg-surface-muted'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Guest Folios & Billing</span>
          </button>

          <button
            id="tab-pms-channel_manager"
            onClick={() => setActivePmsSubTab('channel_manager')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePmsSubTab === 'channel_manager'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-text hover:bg-surface-muted'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Channel Manager</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerChannelSync}
            disabled={isSyncingChannels}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-muted hover:bg-border text-text border border-border transition cursor-pointer"
            title="Fast Sync with Booking.com, Agoda, Airbnb, Expedia"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChannels ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Sync OTAs</span>
          </button>
        </div>
      </div>

      {/* Render Active PMS View */}
      <div>
        {activePmsSubTab === 'calendar' && <TapeChartCalendar />}
        {activePmsSubTab === 'frontdesk' && <FrontDeskBoard />}
        {activePmsSubTab === 'reservations' && <ReservationsList />}
        {activePmsSubTab === 'folios' && <GuestFolioView />}
        {activePmsSubTab === 'channel_manager' && <ChannelManagerView />}
      </div>

      {/* Modals */}
      <NewBookingModal />
      <EditBookingModal />
      <BookingDetailsModal />
    </div>
  );
};
