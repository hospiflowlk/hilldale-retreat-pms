import React, { useState, useEffect } from 'react';
import { X, Globe, Percent, Check, Tag, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterBusinessSource } from '../../types';
import { useBusinessSources } from '../../hooks/useMasters';

interface NewBusinessSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceToEdit?: MasterBusinessSource | null;
}

export const NewBusinessSourceModal: React.FC<NewBusinessSourceModalProps> = ({
  isOpen,
  onClose,
  sourceToEdit
}) => {
  const createSourceMut = useBusinessSources.useCreate();
  const updateSourceMut = useBusinessSources.useUpdate();

  const [name, setName] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sourceToEdit) {
      setName(sourceToEdit.name);
      setCommissionPercent(String(sourceToEdit.commissionPercent));
      setContactInfo(sourceToEdit.contactInfo || '');
      setNotes(sourceToEdit.notes || '');
      setIsActive(sourceToEdit.isActive !== false);
    } else {
      setName('');
      setCommissionPercent('0');
      setContactInfo('');
      setNotes('');
      setIsActive(true);
    }
    setError(null);
  }, [sourceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a business source / channel name.');
      return;
    }

    const commNum = parseFloat(commissionPercent) || 0;

    if (sourceToEdit) {
      updateSourceMut.mutate({
        id: sourceToEdit.id,
        name: name.trim(),
        commissionPercent: commNum,
        contactInfo: contactInfo.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive
      });
    } else {
      createSourceMut.mutate({
        name: name.trim(),
        commissionPercent: commNum,
        contactInfo: contactInfo.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                {sourceToEdit ? 'Edit Channel Source' : 'Add Business Source'}
              </h3>
              <p className="text-xs text-secondary">
                Booking channel, OTA partner, and commission tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Channel / Source Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Direct Website, Booking.com, Travel Agent, Walk-In, Airbnb"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Commission % */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Channel Commission Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                placeholder="e.g. 15.0 for Booking.com, 0 for Direct"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 pr-8 text-xs font-mono text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
              <span className="absolute right-3.5 top-2.5 text-secondary font-bold text-xs">%</span>
            </div>
            <p className="text-[11px] text-secondary mt-1">
              Used to calculate net revenue after OTA commissions in channel reports.
            </p>
          </div>

          {/* Contact / Extranet Info */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Extranet / Partner Contact Info
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. partner.booking.com / Hotel ID: 894210"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Contract Terms & Channel Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Net payout weekly via bank transfer, automatic XML sync..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted/40 border border-border">
            <div>
              <span className="text-xs font-bold text-text block">Active Channel</span>
              <span className="text-[11px] text-secondary">Enable this channel for tagging reservations and guests.</span>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted border border-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{sourceToEdit ? 'Save Changes' : 'Create Source'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
