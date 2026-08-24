import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Fingerprint, 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  Save 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { Employee } from '../../types';

export const NewEmployeeModal: React.FC = () => {
  const { 
    isNewEmployeeModalOpen, 
    setIsNewEmployeeModalOpen
  } = useApp();

  const { employees, addEmployee } = usePayroll();

  const nextFingerprintId = (employees.length + 101).toString();

  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    fingerprintId: nextFingerprintId,
    name: '',
    designation: '',
    department: 'Service',
    basicSalary: 30000.00,
    serviceIntensiveDefault: 15000.00,
    foodAllowanceDaily: 750.00,
    epfEligible: true,
    epfNumber: `EPF-HDR-0${employees.length + 1}`,
    nicNumber: '',
    bankName: 'Commercial Bank of Ceylon',
    accountNumber: '',
    contactPhone: '+94 7',
    active: true,
    joinedDate: new Date().toISOString().split('T')[0]
  });

  if (!isNewEmployeeModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await addEmployee(formData);
      setIsNewEmployeeModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-border shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Register New Staff Member</h2>
              <p className="text-xs text-secondary">
                Configure biometric enroll ID, salary base, and statutory benefits
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsNewEmployeeModalOpen(false)}
            className="p-1.5 text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold text-text focus:outline-none focus:border-primary"
                placeholder="e.g. PERERA K M"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Biometric Enroll ID *
              </label>
              <input
                type="text"
                required
                value={formData.fingerprintId}
                onChange={(e) => setFormData({ ...formData, fingerprintId: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                placeholder="111"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Designation / Title *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
                placeholder="e.g. Villa Host / Commis Chef"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
              >
                <option value="Service">Service (Dining & Bar)</option>
                <option value="Kitchen">Kitchen & Culinary</option>
                <option value="Housekeeping">Housekeeping & Villas</option>
                <option value="Front Desk">Front Desk & Concierge</option>
                <option value="Maintenance">Maintenance & Grounds</option>
                <option value="Management">Management & Ops</option>
              </select>
            </div>
          </div>

          {/* Salary Base */}
          <div className="bg-surface-muted p-3.5 rounded-xl border border-border space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Monthly Remuneration Base (LKR)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Basic Salary (Rs.)
                </label>
                <input
                  type="number"
                  step="100"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Default Service Incentive (Rs.)
                </label>
                <input
                  type="number"
                  step="100"
                  value={formData.serviceIntensiveDefault}
                  onChange={(e) => setFormData({ ...formData, serviceIntensiveDefault: Number(e.target.value) })}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Food Allowance / Day (Rs.)
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.foodAllowanceDaily}
                  onChange={(e) => setFormData({ ...formData, foodAllowanceDaily: Number(e.target.value) })}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
                <input
                  type="checkbox"
                  checked={formData.epfEligible}
                  onChange={(e) => setFormData({ ...formData, epfEligible: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Eligible for EPF (8% deduction + 12% contribution) & ETF (3%)</span>
              </label>
            </div>
          </div>

          {/* Banking & Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-text"
                placeholder="e.g. Commercial Bank"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono text-text"
                placeholder="8004921049"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                NIC / National ID
              </label>
              <input
                type="text"
                value={formData.nicNumber}
                onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono text-text"
                placeholder="199512345678"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono text-text"
                placeholder="+94 77 123 4567"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewEmployeeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-[#4d5541] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
