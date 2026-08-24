import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Globe, Check, Tag, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterCustomer, CustomerType } from '../../types';
import { useCustomers, useBusinessSources } from '../../hooks/useMasters';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: MasterCustomer | null;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit
}) => {
  const { data: masterBusinessSources = [] } = useBusinessSources.useGetAll();
  const createCustomerMut = useCustomers.useCreate();
  const updateCustomerMut = useCustomers.useUpdate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [passportOrId, setPassportOrId] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('WALK_IN');
  const [businessSourceId, setBusinessSourceId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setCountry(customerToEdit.country || 'Sri Lanka');
      setPassportOrId(customerToEdit.passportOrId || '');
      setCustomerType(customerToEdit.customerType || 'WALK_IN');
      setBusinessSourceId(customerToEdit.businessSourceId || '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCountry('Sri Lanka');
      setPassportOrId('');
      setCustomerType('WALK_IN');
      setBusinessSourceId(masterBusinessSources[0]?.id || '');
      setNotes('');
    }
    setError(null);
  }, [customerToEdit, isOpen, masterBusinessSources]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a customer/guest name.');
      return;
    }

    const bSource = masterBusinessSources.find(s => s.id === businessSourceId);

    const customerData = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      country: country.trim() || 'Sri Lanka',
      passportOrId: passportOrId.trim() || undefined,
      customerType,
      businessSourceId: businessSourceId || undefined,
      businessSourceName: bSource?.name || undefined,
      notes: notes.trim() || undefined
    };

    if (customerToEdit?.id) {
      updateCustomerMut.mutate({ id: customerToEdit.id, ...customerData });
    } else {
      createCustomerMut.mutate(customerData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                {customerToEdit ? 'Edit Guest Profile' : 'Register Guest Record'}
              </h3>
              <p className="text-xs text-secondary">
                Customer CRM profile with auto-deduplication by phone/email
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

          {/* Full Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins, David Müller"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Customer Type
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              >
                <option value="ROOM_GUEST">Room Guest</option>
                <option value="WALK_IN">Walk-In Guest</option>
                <option value="VIP">VIP Guest</option>
                <option value="CORPORATE">Corporate</option>
              </select>
            </div>
          </div>

          {/* Phone & Email (Used for Auto-deduplication) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Phone Number (Auto-Dedup)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +94 77 123 4567"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Email Address (Auto-Dedup)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. guest@travel.com"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Country & Passport / ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Country of Residence
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom, Germany, Sri Lanka"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Passport / National ID #
              </label>
              <input
                type="text"
                value={passportOrId}
                onChange={(e) => setPassportOrId(e.target.value)}
                placeholder="e.g. GB98234109"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Business Source */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Acquisition Channel / Business Source
            </label>
            <select
              value={businessSourceId}
              onChange={(e) => setBusinessSourceId(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            >
              <option value="">None / Unknown</option>
              {masterBusinessSources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name} ({src.commissionPercent}% commission)
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Guest Preferences & VIP Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vegetarian breakfast, anniversary stay, prefers mountain view..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
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
              <span>{customerToEdit ? 'Save Changes' : 'Register Guest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
