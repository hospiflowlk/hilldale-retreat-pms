import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Check, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterSupplier } from '../../types';
import { useSuppliers } from '../../hooks/useMasters';

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: MasterSupplier | null;
}

export const NewSupplierModal: React.FC<NewSupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit
}) => {
  const createSupplierMut = useSuppliers.useCreate();
  const updateSupplierMut = useSuppliers.useUpdate();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [openingBalanceUSD, setOpeningBalanceUSD] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setCompanyName(supplierToEdit.companyName);
      setContactPerson(supplierToEdit.contactPerson);
      setPhone(supplierToEdit.phone);
      setEmail(supplierToEdit.email);
      setAddress(supplierToEdit.address);
      setTaxNumber(supplierToEdit.taxNumber || '');
      setOpeningBalanceUSD(String(supplierToEdit.openingBalanceUSD || 0));
      setBankDetails(supplierToEdit.bankDetails || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxNumber('');
      setOpeningBalanceUSD('0.00');
      setBankDetails('');
      setNotes('');
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please enter a company name.');
      return;
    }
    if (!contactPerson.trim()) {
      setError('Please enter a contact person name.');
      return;
    }

    const openBal = parseFloat(openingBalanceUSD) || 0;

    if (supplierToEdit) {
      updateSupplierMut.mutate({
        id: supplierToEdit.id,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        taxNumber: taxNumber.trim() || undefined,
        bankDetails: bankDetails.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      createSupplierMut.mutate({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        taxNumber: taxNumber.trim() || undefined,
        openingBalanceUSD: openBal,
        currentBalanceOwedUSD: openBal,
        bankDetails: bankDetails.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive: true
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                {supplierToEdit ? 'Edit Supplier Profile' : 'Register New Supplier'}
              </h3>
              <p className="text-xs text-secondary">
                Vendor contact details, credit terms, and AP ledger configuration
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Keells Food Products PLC, Elephant House"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Contact Person & Tax ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rohan Jayawardena"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                VAT / Tax Registration #
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. VAT-102938475-7000"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +94 11 234 5678"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. orders@keellsfoods.lk"
                className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Office / Warehouse Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. No. 117, Colombo Road, Biyagama"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Opening Balance (Only for new suppliers) */}
          {!supplierToEdit && (
            <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border">
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                Opening Balance Owed (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-secondary text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalanceUSD}
                  onChange={(e) => setOpeningBalanceUSD(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-border rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-text focus:outline-hidden focus:border-primary"
                />
              </div>
              <p className="text-[11px] text-secondary mt-1">
                Prior balance owed to this vendor before system migration.
              </p>
            </div>
          )}

          {/* Bank Details */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Bank Details (For Payments)
            </label>
            <textarea
              rows={2}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="e.g. Commercial Bank, Kandy Branch, Acc: 1122334455, Name: Keells PLC"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Delivery Terms & Credit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 14-day credit terms, deliveries on Tuesdays & Fridays..."
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
              <span>{supplierToEdit ? 'Save Changes' : 'Register Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
