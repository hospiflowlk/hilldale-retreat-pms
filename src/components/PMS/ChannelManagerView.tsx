import React, { useState } from 'react';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Link2, 
  Calendar, 
  Sliders, 
  ArrowRight, 
  Clock, 
  Copy, 
  Check, 
  Settings,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePMS } from '../../hooks/usePMS';
import { ChannelConfig, BookingChannel } from '../../types';

export const ChannelManagerView: React.FC = () => {
  const { 
    channels, 
    syncLogs, 
    isSyncingChannels, 
    lastChannelSyncTime, 
    triggerChannelSync, 
    updateChannelConfig
  } = useApp();

  const { rooms } = usePMS();

  const [selectedRoomIcal, setSelectedRoomIcal] = useState<string>('101');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'ical' | 'logs'>('channels');

  const handleCopyIcal = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getChannelLogo = (channel: BookingChannel) => {
    switch (channel) {
      case 'booking_com': return '🏨 Booking.com';
      case 'agoda': return '🌴 Agoda';
      case 'airbnb': return '🏡 Airbnb';
      case 'expedia': return '✈️ Expedia';
      case 'direct_website': return '🌐 Direct Website';
      default: return '🔗 OTA Channel';
    }
  };

  return (
    <div className="space-y-4">
      {/* Channel Manager Top Status & Sync Action */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text">Channel Manager Hub</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold border border-border-focus">
                2-Way Live Sync Ready
              </span>
            </div>
            <p className="text-xs text-secondary">
              Centralized OTA distribution. Synchronize rates, availability, and bookings across Booking.com, Agoda, Airbnb, and Expedia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-secondary block text-[10px] uppercase">Last Synchronization</span>
            <span className="font-mono font-bold text-text">
              {lastChannelSyncTime ? new Date(lastChannelSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </span>
          </div>

          <button
            id="btn-sync-all-channels"
            onClick={triggerChannelSync}
            disabled={isSyncingChannels}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer ${
              isSyncingChannels ? 'bg-secondary cursor-not-allowed' : 'bg-primary hover:bg-[#4d5541]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingChannels ? 'animate-spin' : ''}`} />
            <span>{isSyncingChannels ? 'Synchronizing OTAs...' : 'Sync All Channels Now'}</span>
          </button>
        </div>
      </div>

      {/* Sub navigation within Channel Manager */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'channels' ? 'bg-primary text-white' : 'bg-white text-secondary hover:text-text'
          }`}
        >
          Connected OTAs & Rate Parity
        </button>

        <button
          onClick={() => setActiveTab('ical')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'ical' ? 'bg-primary text-white' : 'bg-white text-secondary hover:text-text'
          }`}
        >
          iCal 2-Way Calendar Feeds
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'logs' ? 'bg-primary text-white' : 'bg-white text-secondary hover:text-text'
          }`}
        >
          Sync Audit Logs ({syncLogs.length})
        </button>
      </div>

      {/* Tab 1: OTA Channels Grid */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-4 rounded-xl border transition-all bg-white shadow-xs ${
                channel.isEnabled ? 'border-border' : 'border-dashed border-border-focus opacity-80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">
                      {getChannelLogo(channel.channel)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      channel.connectionStatus === 'connected'
                        ? 'bg-primary-light text-primary border border-border-focus'
                        : channel.connectionStatus === 'syncing'
                        ? 'bg-secondary-light text-secondary border border-accent-light'
                        : 'bg-surface-muted text-secondary'
                    }`}>
                      {channel.connectionStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Commission: {channel.commissionRate}% • Markup: +{channel.markupPercentage}%
                  </p>
                </div>

                {/* Enable / Disable toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channel.isEnabled}
                    onChange={(e) => updateChannelConfig(channel.id, { isEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Channel Configuration Controls */}
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
                    Price Markup (%)
                  </label>
                  <input
                    type="number"
                    value={channel.markupPercentage}
                    onChange={(e) => updateChannelConfig(channel.id, { markupPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface-muted border border-border rounded-lg p-1.5 font-mono text-text focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
                    Min Stay (Nights)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={channel.minStayNights}
                    onChange={(e) => updateChannelConfig(channel.id, { minStayNights: parseInt(e.target.value) || 1 })}
                    className="w-full bg-surface-muted border border-border rounded-lg p-1.5 font-mono text-text focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Stop Sell & Auto-Sync toggles */}
              <div className="mt-3 flex items-center justify-between text-xs bg-[#FAF8F5] p-2.5 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`stop-sell-${channel.id}`}
                    checked={channel.stopSell}
                    onChange={(e) => updateChannelConfig(channel.id, { stopSell: e.target.checked })}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <label htmlFor={`stop-sell-${channel.id}`} className="font-semibold text-[#9e432c] text-[11px] cursor-pointer">
                    Stop-Sell (Close Channel)
                  </label>
                </div>

                <div className="text-[10px] text-secondary font-mono">
                  {channel.autoSyncAvailability ? '⚡ Auto 2-Way Sync' : 'Manual'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: iCal Calendar Feeds */}
      {activeTab === 'ical' && (
        <div className="bg-white p-5 rounded-xl border border-border shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text">iCal 2-Way Export & Import Feeds</h3>
            <p className="text-xs text-secondary">
              Use standardized iCal calendar URLs to sync Hilldale Retreat room availability with Airbnb, VRBO, or Apple/Google Calendars.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-text">Select Room:</label>
            <select
              value={selectedRoomIcal}
              onChange={(e) => setSelectedRoomIcal(e.target.value)}
              className="text-xs bg-surface-muted border border-border rounded-lg px-3 py-1.5 font-bold text-text"
            >
              {rooms.map(r => (
                <option key={r.number} value={r.number}>Room {r.number} - {r.name}</option>
              ))}
            </select>
          </div>

          {/* Export URL */}
          <div className="bg-[#FAF8F5] p-3 rounded-lg border border-border space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-primary block">
              Room {selectedRoomIcal} Export Feed URL (Paste into Airbnb / OTAs)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://api.hilldale-retreat.lk/v1/ical/room-${selectedRoomIcal}.ics`}
                className="w-full bg-white border border-border rounded-lg p-2 text-xs font-mono text-text select-all"
              />
              <button
                onClick={() => handleCopyIcal(`https://api.hilldale-retreat.lk/v1/ical/room-${selectedRoomIcal}.ics`)}
                className="flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#4d5541] shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-secondary">
              External OTAs will automatically fetch bookings from this feed every 15-30 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Sync Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="p-3 bg-background border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Channel Manager Sync Activity History
            </span>
            <span className="text-[10px] text-secondary">Live audit trail</span>
          </div>

          <div className="divide-y divide-[#E6E1D6] max-h-96 overflow-y-auto">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-background transition-colors flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary-light text-primary">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-text">
                      {getChannelLogo(log.channel)} • <span className="uppercase text-[10px] text-primary">{log.actionType.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[11px] text-secondary">{log.message}</div>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-secondary">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
