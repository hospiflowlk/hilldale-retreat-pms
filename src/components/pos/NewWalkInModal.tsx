import React, { useState } from 'react';
import { X, Users, User, CheckCircle2, Utensils, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePOS } from '../../hooks/usePOS';
import { RETREAT_LOCATIONS } from '../../data/menuData';

interface NewWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewWalkInModal: React.FC<NewWalkInModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loadWalkInSessionIntoCart } = useApp();
  const { createWalkInSessionAsync } = usePOS();
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedLocation, setSelectedLocation] = useState('Table 01 (Main Dining)');

  if (!isOpen) return null;

  const diningLocations = RETREAT_LOCATIONS.filter(l => !l.name.startsWith('Chalet'));

  const handleCreateOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    
    await createWalkInSessionAsync({
      guestName: guestName.trim(),
      numberOfGuests: guestCount,
      location: selectedLocation,
      status: 'ACTIVE'
    });
    
    setGuestName('');
    setGuestCount(2);
    onSuccess();
    onClose();
  };

  const handleCreateAndOrder = async () => {
    if (!guestName.trim()) return;
    
    const session = await createWalkInSessionAsync({
      guestName: guestName.trim(),
      numberOfGuests: guestCount,
      location: selectedLocation,
      status: 'ACTIVE'
    });
    setGuestName('');
    setGuestCount(2);
    onSuccess();
    onClose();
    if (session?.id) {
      loadWalkInSessionIntoCart(session.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white border border-border rounded-3xl shadow-2xl max-w-md w-full text-text overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-white">
                Walk-In Front Desk
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-text mt-0.5">Open New Walk-In Tab</h2>
            <p className="text-xs text-secondary">Assign a dedicated running bill profile to outside visitors</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-secondary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateOnly} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
              Guest Name or Reference
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Haygan, Mr. Fernando..."
                className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white transition font-semibold"
              />
            </div>

            {/* Quick name presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-secondary font-medium">Quick:</span>
              {['Walk-in Guest', 'Day Pass Diner', 'Tea Garden Visitor', 'Bar Guest'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGuestName(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    guestName === preset 
                      ? 'bg-primary text-white border-primary font-bold' 
                      : 'bg-surface-muted text-secondary-dark border-border hover:bg-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Table / Seating Area Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Table / Seating Area</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {diningLocations.map((loc) => {
                const isSelected = selectedLocation === loc.name;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc.name)}
                    className={`p-2 rounded-xl text-left text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-2xs'
                        : 'bg-surface-muted border-border text-[#424242] hover:bg-white'
                    }`}
                  >
                    <div className="truncate">{loc.name}</div>
                    <div className={`text-[9px] uppercase ${isSelected ? 'text-white/80' : 'text-secondary'}`}>
                      {loc.type}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
              Number of Guests
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
              <input
                type="number"
                min="1"
                max="30"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3 py-2 text-sm text-text focus:outline-hidden focus:border-primary focus:bg-white transition font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={!guestName.trim()}
              className="flex-1 py-2.5 px-3 bg-surface-muted hover:bg-surface-muted-hover disabled:opacity-50 text-text font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-border flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Create Tab Only</span>
            </button>

            <button
              type="button"
              disabled={!guestName.trim()}
              onClick={handleCreateAndOrder}
              className="flex-1 py-2.5 px-3 bg-primary hover:bg-[#4d5541] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Utensils className="w-4 h-4" />
              <span>Create & Take Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
