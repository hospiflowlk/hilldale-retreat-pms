import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calculator, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Percent, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { PayrollRecord } from '../../types';

export const EditPayrollRecordModal: React.FC = () => {
  const { 
    selectedPayrollRecordForEdit, 
    setSelectedPayrollRecordForEdit, 
    settings 
  } = useApp();

  const { updatePayrollRecord } = usePayroll();

  const [record, setRecord] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    if (selectedPayrollRecordForEdit) {
      setRecord({ ...selectedPayrollRecordForEdit });
    } else {
      setRecord(null);
    }
  }, [selectedPayrollRecordForEdit]);

  if (!record) return null;

  const handleChange = (field: keyof PayrollRecord, value: any) => {
    setRecord(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };

      // Auto-recalculate OT Pay if otHours or basic changes
      if (field === 'otHours' || field === 'basicSalary') {
        const basic = field === 'basicSalary' ? Number(value) || 0 : Number(prev.basicSalary) || 0;
        const otHours = field === 'otHours' ? Number(value) || 0 : Number(prev.otHours) || 0;
        // Standard rate: (Basic / 200) * 1.5 * otHours
        if (otHours > 0 && basic > 0) {
          updated.otPay = Number((((basic / 200) * 1.5) * otHours).toFixed(2));
        }
      }

      // Auto-recalculate EPF/ETF if basic changes and epf8 was standard
      if (field === 'basicSalary') {
        const basic = Number(value) || 0;
        if (prev.epf8 > 0) {
          updated.epf8 = Number((basic * 0.08).toFixed(2));
          updated.epf12 = Number((basic * 0.12).toFixed(2));
          updated.etf3 = Number((basic * 0.03).toFixed(2));
        }
      }

      // Recalculate totals
      const totalPay = Number((
        (Number(updated.basicSalary) || 0) +
        (Number(updated.otPay) || 0) +
        (Number(updated.serviceIntensive) || 0) +
        (Number(updated.serviceCharge) || 0) +
        (Number(updated.foodAllowance) || 0) +
        (Number(updated.sp1) || 0) +
        (Number(updated.sp2) || 0)
      ).toFixed(2));

      const balancePay = Number((
        totalPay - 
        (Number(updated.epf8) || 0) - 
        (Number(updated.advances) || 0)
      ).toFixed(2));

      return {
        ...updated,
        totalPay,
        balancePay
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (record) {
      updatePayrollRecord(record.id, record).catch(console.error);
      setSelectedPayrollRecordForEdit(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-background">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text">{record.employeeName}</h2>
              {record.fingerprintId && (
                <span className="text-[11px] font-mono bg-primary-light text-primary px-2 py-0.5 rounded-full font-bold border border-border-focus">
                  Enroll #{record.fingerprintId}
                </span>
              )}
            </div>
            <p className="text-xs text-secondary">
              {record.designation || 'Staff'} • Month: <span className="font-semibold text-text">{record.monthYear}</span>
            </p>
          </div>
          <button 
            onClick={() => setSelectedPayrollRecordForEdit(null)}
            className="p-1.5 text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Working Hours & Biometric Sync Section */}
          <div className="bg-surface-muted p-4 rounded-xl border border-border space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Working Hours & Overtime
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Total Hours Worked
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={record.hoursWorked}
                  onChange={(e) => handleChange('hoursWorked', Number(e.target.value))}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  OT Hours (Overtime)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={record.otHours}
                  onChange={(e) => handleChange('otHours', Number(e.target.value))}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  OT Pay (Rs. LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.otPay}
                  onChange={(e) => handleChange('otPay', Number(e.target.value))}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Earnings & Additions Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Earnings & Incentives (LKR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Basic Salary (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.basicSalary}
                  onChange={(e) => handleChange('basicSalary', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Service Incentive (Intensive) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.serviceIntensive}
                  onChange={(e) => handleChange('serviceIntensive', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Service Charge Share (10% Pool) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.serviceCharge}
                  onChange={(e) => handleChange('serviceCharge', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Food Allowance (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.foodAllowance}
                  onChange={(e) => handleChange('foodAllowance', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Special Payment 1 (SP1) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.sp1}
                  onChange={(e) => handleChange('sp1', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  Special Payment 2 (SP2) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.sp2}
                  onChange={(e) => handleChange('sp2', Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Deductions & Statutory Funds */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
              Deductions & Statutory Funds (LKR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-red-900 mb-1">
                  EPF (8% Employee) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.epf8}
                  onChange={(e) => handleChange('epf8', Number(e.target.value))}
                  className="w-full bg-red-50/50 border border-red-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-red-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  EPF (12% Employer) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.epf12}
                  onChange={(e) => handleChange('epf12', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                  ETF (3% Employer) (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={record.etf3}
                  onChange={(e) => handleChange('etf3', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-red-900 mb-1">
                Salary Advances Deducted (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                value={record.advances}
                onChange={(e) => handleChange('advances', Number(e.target.value))}
                className="w-full bg-red-50/50 border border-red-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-red-900 focus:outline-none focus:border-red-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Real-time Summary Banner */}
          <div className="bg-primary text-white p-4 rounded-xl grid grid-cols-2 gap-4 shadow-sm">
            <div>
              <div className="text-[11px] text-primary-light uppercase font-semibold">Total Gross Pay (Earnings)</div>
              <div className="text-lg font-bold font-mono">
                Rs. {record.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-secondary-light uppercase font-semibold">Net Balance Pay (Disbursal)</div>
              <div className="text-xl font-black font-mono text-secondary-light">
                Rs. {record.balancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                Payment Status
              </label>
              <select
                value={record.paymentStatus}
                onChange={(e) => handleChange('paymentStatus', e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold text-text focus:outline-none focus:border-primary"
              >
                <option value="unpaid">Unpaid / Pending</option>
                <option value="paid">Paid & Disbursed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-secondary-dark mb-1">
                Payment Method
              </label>
              <select
                value={record.paymentMethod || 'bank_transfer'}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-medium text-text focus:outline-none focus:border-primary"
              >
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="cash">Cash Voucher</option>
                <option value="cheque">Company Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setSelectedPayrollRecordForEdit(null)}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-[#4d5541] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              Save Changes & Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
