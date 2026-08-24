import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  DollarSign, 
  Percent, 
  Building2, 
  FileText, 
  Check, 
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Settings } from '../types';

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, setIsSettingsModalOpen, settings, updateSettings, clearAllData } = useApp();

  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });
  const [savedToast, setSavedToast] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      setIsSettingsModalOpen(false);
    }, 800);
  };

  const handleClearAllData = () => {
    clearAllData();
    setShowClearConfirm(false);
    setClearedToast(true);
    setTimeout(() => {
      setClearedToast(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-2xl shadow-xl max-w-lg w-full text-text overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Configuration & Rates
            </span>
            <h2 className="text-xl font-bold font-serif text-text">
              Hilldale System Settings
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {clearedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All mock data has been deleted. System is on a clean slate.</span>
            </div>
          )}

          {/* Currency Exchange Rate */}
          <div className="p-4 bg-surface-muted rounded-2xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                USD to LKR Exchange Rate
              </label>
              <span className="text-[10px] font-mono text-primary bg-primary-light px-2.5 py-0.5 rounded-full font-bold border border-border-focus">
                1 USD = Rs. {localSettings.usdToLkrRate}
              </span>
            </div>
            <input
              type="number"
              step="0.5"
              min="1"
              required
              value={localSettings.usdToLkrRate}
              onChange={(e) => setLocalSettings({ ...localSettings, usdToLkrRate: parseFloat(e.target.value) || 300 })}
              className="w-full bg-white border border-border rounded-xl px-3 py-2 text-base font-mono font-bold text-text focus:outline-hidden focus:border-primary"
            />
            <p className="text-[11px] text-secondary">
              All items in the menu are priced in USD ($) and converted dynamically on bills and receipts to LKR.
            </p>
          </div>

          {/* Service Charge & Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Service Charge Rate (10%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={localSettings.defaultServiceChargeRate}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultServiceChargeRate: parseFloat(e.target.value) || 0.1 })}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={localSettings.taxRate}
                onChange={(e) => setLocalSettings({ ...localSettings, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Restaurant & Location Info */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Property / Resort Name
            </label>
            <input
              type="text"
              required
              value={localSettings.retreatName}
              onChange={(e) => setLocalSettings({ ...localSettings, retreatName: e.target.value })}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
              Address / Location
            </label>
            <input
              type="text"
              value={localSettings.address}
              onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Telephone Hotline
              </label>
              <input
                type="text"
                value={localSettings.phone}
                onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Default Cashier Name
              </label>
              <input
                type="text"
                value={localSettings.cashierName}
                onChange={(e) => setLocalSettings({ ...localSettings, cashierName: e.target.value })}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Danger Zone: Data Management */}
          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                  Clear Mock Data & Reset State
                </h4>
                <p className="text-[11px] text-rose-700/80 mt-0.5">
                  Wipes all test orders, expenses, bookings, payroll, and account transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                Clear All Data
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{savedToast ? 'Saved Successfully!' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-serif text-text">
                Delete All Mock Data?
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                This action will permanently delete all demo orders, mock bookings, expenses, payroll calculations, and transactions, giving you a fresh, clean system.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-bold text-secondary hover:bg-surface-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
