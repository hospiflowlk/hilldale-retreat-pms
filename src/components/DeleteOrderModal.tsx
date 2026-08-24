import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  Delete as BackspaceIcon,
  Info,
  Clock,
  User,
  Coffee,
  DollarSign,
  FileWarning,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { useUsers } from '../hooks/useUsers';

interface DeleteOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_VOID_REASONS = [
  'Guest Changed Mind / Cancelled',
  'Table Walkout / Left',
  'Duplicate / Accidental Order',
  'Test / Training Order',
  'Kitchen Out of Stock',
  'Wrong Table / Re-ordered',
  'Bill Adjustment / Void'
];

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const { deleteOrder, verifyManagerPin, settings } = useApp();
  const { users } = useUsers();

  const [pin, setPin] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('Guest Changed Mind / Cancelled');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Reset state when opened with a new order
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setSelectedReason('Guest Changed Mind / Cancelled');
      setCustomNotes('');
      setErrorMessage('');
      setIsSuccess(false);
      setSuccessMessage('');
      setIsProcessing(false);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  // Handle keypad number press
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  // Perform deletion
  const handleDeleteConfirm = () => {
    if (!pin.trim()) {
      setErrorMessage('Please enter your 4-digit Manager PIN to authorize deletion.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const fullReason = customNotes.trim() 
      ? `${selectedReason}: ${customNotes.trim()}` 
      : selectedReason;

    const result = deleteOrder(order.id, pin.trim(), fullReason);

    if (result.success) {
      setIsSuccess(true);
      setSuccessMessage(result.message || 'Order successfully deleted.');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } else {
      setIsProcessing(false);
      setErrorMessage(result.message || 'Authorization failed. Invalid Manager PIN.');
      setPin('');
    }
  };

  // Find authorized managers/admins for reference
  const managers = users.filter(u => u.isActive && (u.role === 'admin' || u.role === 'manager' || u.canDeleteRecords));

  return (
    <div 
      className="fixed inset-0 z-50 bg-text/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      id="modal-delete-order"
    >
      <div className="bg-white border border-border rounded-2xl shadow-2xl max-w-lg w-full text-text overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/30 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-white px-2 py-0.5 rounded-full">
                  Manager Authorization
                </span>
                <span className="text-xs text-secondary font-mono">PIN Required</span>
              </div>
              <h2 className="text-lg font-bold font-serif text-text mt-0.5">
                Void & Delete Order
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-delete-modal"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Success State Overlay */}
          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto border border-primary/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold font-serif text-text">
                Order Deleted Successfully
              </h3>
              <p className="text-xs text-secondary max-w-xs mx-auto">
                {successMessage}
              </p>
            </div>
          ) : (
            <>
              {/* Order Details Card */}
              <div className="bg-[#FAF8F5] border border-border rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-sm text-text">
                        {order.location}
                      </h4>
                      <span className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-md border border-border text-[11px]">
                        {order.orderNumber}
                      </span>
                    </div>
                    <p className="text-secondary text-[11px] mt-0.5">
                      Guest: <span className="font-semibold text-text">{order.guestName || 'Walk-in Guest'}</span> • {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-serif font-bold text-base text-text">
                      ${order.grandTotal.toFixed(2)} <span className="text-[10px] text-secondary font-normal font-sans">USD</span>
                    </div>
                    <div className="text-[10px] text-primary font-mono font-semibold">
                      ≈ Rs. {Math.round(order.grandTotal * settings.usdToLkrRate).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Items preview list */}
                <div className="pt-2 border-t border-border space-y-1">
                  {(order.items || []).slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-secondary-dark">
                      <span>
                        <strong className="text-primary mr-1">{it.quantity}x</strong> {it.name}
                      </span>
                      <span className="font-mono text-secondary">${(it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 3 && (
                    <p className="text-[10px] text-secondary italic">
                      + {(order.items || []).length - 3} more items in this order...
                    </p>
                  )}
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                  Select Reason for Void / Deletion
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_VOID_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                        selectedReason === reason
                          ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                          : 'bg-surface-muted text-secondary-dark border-border hover:bg-white'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Optional manager notes / details..."
                  className="w-full bg-[#FAF8F5] border border-border rounded-xl px-3 py-1.5 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white transition mt-1.5"
                />
              </div>

              {/* Manager PIN Input & Keypad Section */}
              <div className="bg-[#FAF8F5] border border-border rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Enter Manager 4-Digit PIN</span>
                  </label>
                  <span className="text-[10px] text-secondary">
                    Default PIN: <strong className="text-primary font-mono">1001</strong>
                  </span>
                </div>

                {/* PIN Display Boxes */}
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => {
                    const digit = pin[index];
                    return (
                      <div
                        key={index}
                        className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono transition shadow-2xs ${
                          digit !== undefined
                            ? 'border-primary bg-white text-text'
                            : index === pin.length
                            ? 'border-primary/60 bg-[#FAF8F5] ring-2 ring-primary/20 animate-pulse'
                            : 'border-border bg-white text-secondary/30'
                        }`}
                      >
                        {digit !== undefined ? '●' : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Hidden/Direct text input for keyboard typing */}
                <input
                  type="password"
                  id="input-manager-pin-delete"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pin.length >= 4) {
                      handleDeleteConfirm();
                    }
                  }}
                  autoFocus
                  placeholder="Or type PIN here..."
                  className="w-full text-center tracking-[0.5em] font-mono font-bold bg-white border border-border rounded-xl py-2 text-sm text-text placeholder-[#8C735D]/50 focus:outline-hidden focus:border-primary"
                />

                {/* Touch Keypad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="py-2.5 bg-white hover:bg-surface-muted active:bg-border text-text font-bold text-sm rounded-xl border border-border transition cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="py-2.5 bg-[#FAF8F5] hover:bg-white text-secondary hover:text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="py-2.5 bg-white hover:bg-surface-muted text-text font-bold text-sm rounded-xl border border-border transition cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="py-2.5 bg-[#FAF8F5] hover:bg-white text-secondary hover:text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer flex items-center justify-center"
                    title="Backspace"
                  >
                    <BackspaceIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2.5 bg-accent/15 border border-accent/40 rounded-xl text-accent flex items-center gap-2 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="p-4 border-t border-border bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              id="btn-cancel-delete"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-surface-muted text-secondary-dark font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-confirm-delete-order"
              onClick={handleDeleteConfirm}
              disabled={isProcessing || pin.length < 3}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                pin.length >= 3 && !isProcessing
                  ? 'bg-accent hover:bg-[#c9644a] text-white shadow-[#E07A5F]/20'
                  : 'bg-border text-secondary cursor-not-allowed shadow-none'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isProcessing ? 'Verifying PIN...' : 'Authorize & Delete Order'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
