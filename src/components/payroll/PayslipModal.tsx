import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Fingerprint
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { PayrollRecord } from '../../types';

export const PayslipModal: React.FC = () => {
  const { 
    selectedPayrollRecordForPayslip, 
    setSelectedPayrollRecordForPayslip,
    settings 
  } = useApp();

  const { employees } = usePayroll();

  if (!selectedPayrollRecordForPayslip) return null;

  const record = selectedPayrollRecordForPayslip;
  const matchedEmp = employees.find(e => e.id === record.employeeId || e.name === record.employeeName);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:h-auto">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-background print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text">Official Staff Payslip</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-primary hover:bg-[#4d5541] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Payslip
            </button>
            <button
              onClick={() => setSelectedPayrollRecordForPayslip(null)}
              className="p-1.5 text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div id="printable-payslip" className="p-8 overflow-y-auto space-y-6 text-text bg-white font-sans">
          {/* Header */}
          <div className="border-b-2 border-primary pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-serif font-bold text-lg">
                  H
                </div>
                <h1 className="text-xl font-black text-text tracking-tight uppercase">
                  HILLDALE RETREAT
                </h1>
              </div>
              <p className="text-xs text-secondary mt-1 font-medium">
                Luxury Boutique Eco-Resort & Spa • Sri Lanka
              </p>
              <p className="text-[11px] text-secondary">
                Registration: PV-94821 / VAT-0029 • Tel: +94 77 123 4567
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-secondary-light text-primary rounded-full border border-border-focus">
                Salary Payslip
              </span>
              <div className="text-sm font-bold text-text mt-2">
                Month: {record.monthYear}
              </div>
              <div className="text-[11px] text-secondary">
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Employee & Attendance Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-surface-muted p-4 rounded-xl border border-border text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-secondary font-medium">Employee Name:</span>{' '}
                <strong className="text-text text-sm">{record.employeeName}</strong>
              </div>
              <div>
                <span className="text-secondary font-medium">Designation:</span>{' '}
                <span className="text-text font-semibold">{record.designation || 'Staff'}</span>
              </div>
              <div>
                <span className="text-secondary font-medium">Department:</span>{' '}
                <span className="text-text">{record.department || 'Operations'}</span>
              </div>
              {matchedEmp?.epfNumber && (
                <div>
                  <span className="text-secondary font-medium">EPF Number:</span>{' '}
                  <span className="font-mono text-text">{matchedEmp.epfNumber}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-right sm:text-left">
              <div>
                <span className="text-secondary font-medium">Biometric Enroll ID:</span>{' '}
                <strong className="font-mono text-primary">#{record.fingerprintId || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-secondary font-medium">Recorded Hours:</span>{' '}
                <span className="font-mono font-bold text-text">{record.hoursWorked.toFixed(1)} hrs</span>
              </div>
              <div>
                <span className="text-secondary font-medium">OT Hours:</span>{' '}
                <span className="font-mono text-primary font-bold">
                  {record.otHours > 0 ? `${record.otHours.toFixed(1)} hrs` : '0.0 hrs'}
                </span>
              </div>
              <div>
                <span className="text-secondary font-medium">Payment Status:</span>{' '}
                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                  record.paymentStatus === 'paid' ? 'bg-primary-light text-primary' : 'bg-secondary-light text-amber-800'
                }`}>
                  {record.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-primary text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                Earnings / Additions (LKR)
              </div>
              <div className="p-3 space-y-2 text-xs divide-y divide-[#E6E1D6]/60">
                <div className="flex justify-between py-1">
                  <span className="text-secondary-dark">Basic Salary</span>
                  <span className="font-mono font-bold text-text">
                    Rs. {record.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {record.otPay > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Overtime Pay ({record.otHours} hrs)</span>
                    <span className="font-mono font-bold text-primary">
                      Rs. {record.otPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {record.serviceIntensive > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Service Incentive</span>
                    <span className="font-mono font-bold text-text">
                      Rs. {record.serviceIntensive.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {record.serviceCharge > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Service Charge Share (10%)</span>
                    <span className="font-mono font-bold text-primary">
                      Rs. {record.serviceCharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {record.foodAllowance > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Food Allowance</span>
                    <span className="font-mono font-bold text-text">
                      Rs. {record.foodAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {record.sp1 > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Special Pay 1 (SP1)</span>
                    <span className="font-mono text-text">
                      Rs. {record.sp1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {record.sp2 > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">Special Pay 2 (SP2)</span>
                    <span className="font-mono text-text">
                      Rs. {record.sp2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-primary/30 font-bold bg-background px-1 rounded">
                  <span className="text-primary">Total Gross Pay</span>
                  <span className="font-mono text-primary">
                    Rs. {record.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions & Funds */}
            <div className="border border-border rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-secondary text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Deductions & Statutory (LKR)
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-[#E6E1D6]/60">
                  <div className="flex justify-between py-1">
                    <span className="text-secondary-dark">EPF (8% Employee Deduction)</span>
                    <span className="font-mono font-bold text-red-700">
                      - Rs. {record.epf8.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {record.advances > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-secondary-dark">Salary Advance Deducted</span>
                      <span className="font-mono font-bold text-red-700">
                        - Rs. {record.advances.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-dashed border-border text-[11px] text-secondary space-y-1">
                    <div className="flex justify-between">
                      <span>Employer EPF (12%):</span>
                      <span className="font-mono">Rs. {record.epf12.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employer ETF (3%):</span>
                      <span className="font-mono">Rs. {record.etf3.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Balance Disbursal Box */}
              <div className="bg-primary text-white p-3 rounded-b-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-primary-light uppercase font-bold tracking-wider">Net Amount Payable</div>
                  <div className="text-base font-black font-mono text-secondary-light">
                    Rs. {record.balancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-[10px] text-primary-light text-right">
                  <div>Currency: LKR</div>
                  <div>Mode: {record.paymentMethod || 'Bank Transfer'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-dashed border-border grid grid-cols-2 gap-8 text-xs text-secondary">
            <div>
              <div className="border-b border-text/40 h-8 mb-1"></div>
              <div className="font-semibold text-text">Prepared By: Accounts Dept</div>
              <div className="text-[10px]">Hilldale Retreat Management</div>
            </div>
            <div className="text-right">
              <div className="border-b border-text/40 h-8 mb-1"></div>
              <div className="font-semibold text-text">Employee Signature / Acknowledgment</div>
              <div className="text-[10px]">Date: ________________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
