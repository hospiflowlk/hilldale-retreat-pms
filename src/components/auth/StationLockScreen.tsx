import React, { useState } from 'react';
import { 
  Lock, 
  Key, 
  ShieldCheck, 
  LogOut, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  Clock,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';

export const StationLockScreen: React.FC = () => {
  const { currentUser, unlockSession, logout, setIsSwitchUserModalOpen } = useApp();
  const { verifyPin } = useAuth();
  const [pinInput, setPinInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePinKeyPress = async (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      setError('');
      if (next.length === 4 || next.length === 5 || next.length === 6) {
        setIsSubmitting(true);
        const success = await verifyPin(next);
        setIsSubmitting(false);
        if (success) {
          unlockSession(next);
        } else if (next.length === 6) {
          setError('Incorrect PIN code. Please try again.');
          setPinInput('');
        }
      }
    }
  };

  const handleUnlock = async (pinToTest?: string) => {
    const pin = pinToTest || pinInput;
    if (!pin) {
      setError('Please enter your security PIN.');
      return;
    }

    setIsSubmitting(true);
    const success = await verifyPin(pin);
    setIsSubmitting(false);
    
    if (success) {
      unlockSession(pin);
    } else {
      setError('Incorrect PIN code. Please try again.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E231B]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-3xl border border-border-focus shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Lock Emblem */}
        <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center shadow-inner mb-4 relative">
          <Lock className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
            !
          </div>
        </div>

        <h2 className="text-2xl font-serif font-bold text-text">Station Locked</h2>
        <p className="text-xs text-secondary mt-1 mb-6">
          Hilldale Retreat • Terminal session is secured
        </p>

        {/* Active Staff Card */}
        <div className="w-full bg-[#FAF8F5] border border-border rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className={`w-11 h-11 rounded-full ${currentUser?.avatarColor || 'bg-primary'} text-white font-bold text-base flex items-center justify-center`}>
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-text">{currentUser?.name}</span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                  currentUser?.role === 'admin' 
                    ? 'bg-primary-light text-primary' 
                    : currentUser?.role === 'manager' 
                      ? 'bg-secondary-light text-secondary' 
                      : 'bg-teal-50 text-teal-700'
                }`}>
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs text-secondary">{currentUser?.designation}</p>
            </div>
          </div>

          <span className="text-[10px] text-secondary bg-white border border-border px-2 py-0.5 rounded-full font-mono">
            PIN: {currentUser?.pinCode || '1234'}
          </span>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map(i => {
            const hasVal = pinInput.length > i;
            return (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  hasVal 
                    ? 'bg-primary scale-110 shadow-xs' 
                    : 'bg-border border border-border-focus'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 mb-4 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handlePinKeyPress(num)}
              className="h-11 bg-white hover:bg-[#FAF8F5] active:bg-primary-light border border-border rounded-xl text-base font-bold text-text transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setPinInput(''); setError(''); }}
            className="h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handlePinKeyPress('0')}
            className="h-11 bg-white hover:bg-[#FAF8F5] active:bg-primary-light border border-border rounded-xl text-base font-bold text-text transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => { setPinInput(prev => prev.slice(0, -1)); setError(''); }}
            className="h-11 bg-surface-muted hover:bg-border border border-border rounded-xl text-xs font-bold text-primary transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={() => handleUnlock()}
            disabled={isSubmitting || pinInput.length === 0}
            className="w-full py-3 bg-primary hover:bg-[#4D5541] disabled:bg-primary/50 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Unlock Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 py-2 bg-white hover:bg-rose-50 border border-border hover:border-rose-200 text-xs font-bold text-rose-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Full Logout</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
