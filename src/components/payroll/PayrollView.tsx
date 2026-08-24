import React, { useState } from 'react';
import { 
  Users, 
  Fingerprint, 
  Calculator, 
  FileSpreadsheet, 
  Upload, 
  DollarSign, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  Plus, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  Sparkles,
  ArrowRight,
  Receipt,
  UserPlus,
  AlertCircle,
  Building2,
  Trash2,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAccounts } from '../../hooks/useAccounts';
import { usePayroll } from '../../hooks/usePayroll';
import { PayrollRecord, Employee, BiometricAttendanceLog } from '../../types';

export const PayrollView: React.FC = () => {
  const { 
    selectedPayrollMonth, 
    setSelectedPayrollMonth,
    setSelectedPayrollRecordForEdit,
    setSelectedPayrollRecordForPayslip,
    setIsBiometricImportModalOpen,
    setIsNewEmployeeModalOpen,
    settings,
  } = useApp();
  const { accounts } = useAccounts();

  const {
    employees,
    payrollRecords,
    attendanceLogs: biometricLogs,
    distributeServiceCharge,
    postPayrollToExpenses,
    deletePayrollRecord,
  } = usePayroll();

  const [activeSubTab, setActiveSubTab] = useState<'salary_sheet' | 'biometric_tracker' | 'staff_directory' | 'service_charge'>('salary_sheet');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [servicePoolInput, setServicePoolInput] = useState<number>(200000);
  const [showPoolDialog, setShowPoolDialog] = useState<boolean>(false);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeAccounts = (accounts || []).filter(a => a.isActive);

  React.useEffect(() => {
    const bankAcc = activeAccounts.find(a => a.name.toLowerCase().includes('payroll')) || activeAccounts.find(a => a.type === 'bank');
    if (bankAcc) setSelectedPayoutAccountId(bankAcc.id);
  }, [accounts]);

  // Available unique months from payroll records
  const availableMonths = Array.from(new Set(payrollRecords.map(r => r.monthYear))).sort().reverse();
  if (!availableMonths.includes('2026-08')) availableMonths.unshift('2026-08');
  if (!availableMonths.includes('2026-07')) availableMonths.push('2026-07');

  // Active month records
  const currentMonthRecords = payrollRecords.filter(r => r.monthYear === selectedPayrollMonth);

  // Filtered records
  const filteredRecords = currentMonthRecords.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.fingerprintId && r.fingerprintId.includes(searchQuery)) ||
                          (r.designation && r.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = departmentFilter === 'all' || r.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate Totals for the selected month
  const totalBasic = currentMonthRecords.reduce((sum, r) => sum + (Number(r.basicSalary) || 0), 0);
  const totalOtHours = currentMonthRecords.reduce((sum, r) => sum + (Number(r.otHours) || 0), 0);
  const totalOtPay = currentMonthRecords.reduce((sum, r) => sum + (Number(r.otPay) || 0), 0);
  const totalServiceIntensive = currentMonthRecords.reduce((sum, r) => sum + (Number(r.serviceIntensive) || 0), 0);
  const totalServiceCharge = currentMonthRecords.reduce((sum, r) => sum + (Number(r.serviceCharge) || 0), 0);
  const totalFoodAllowance = currentMonthRecords.reduce((sum, r) => sum + (Number(r.foodAllowance) || 0), 0);
  const totalSP1 = currentMonthRecords.reduce((sum, r) => sum + (Number(r.sp1) || 0), 0);
  const totalSP2 = currentMonthRecords.reduce((sum, r) => sum + (Number(r.sp2) || 0), 0);
  const totalEpf8 = currentMonthRecords.reduce((sum, r) => sum + (Number(r.epf8) || 0), 0);
  const totalEpf12 = currentMonthRecords.reduce((sum, r) => sum + (Number(r.epf12) || 0), 0);
  const totalEtf3 = currentMonthRecords.reduce((sum, r) => sum + (Number(r.etf3) || 0), 0);
  const totalAdvances = currentMonthRecords.reduce((sum, r) => sum + (Number(r.advances) || 0), 0);
  const grandTotalPay = currentMonthRecords.reduce((sum, r) => sum + (Number(r.totalPay) || 0), 0);
  const grandBalancePay = currentMonthRecords.reduce((sum, r) => sum + (Number(r.balancePay) || 0), 0);

  const handlePostToExpenses = async () => {
    try {
      await postPayrollToExpenses(selectedPayrollMonth, selectedPayoutAccountId);
      setShowPostModal(false);
      setActionSuccessMsg(`Successfully posted ${selectedPayrollMonth} Net Payroll to Retreat Expenses!`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyServiceChargePool = async () => {
    if (servicePoolInput <= 0) return;
    try {
      await distributeServiceCharge(selectedPayrollMonth, servicePoolInput);
      setShowPoolDialog(false);
      setActionSuccessMsg(`Distributed Rs. ${servicePoolInput.toLocaleString()} Service Charge pool across staff members for ${selectedPayrollMonth}!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Enroll_ID',
      'Name',
      'Designation',
      'Department',
      'Hours_Worked',
      'Basic_Salary',
      'OT_Hours',
      'OT_Pay',
      'Service_Intensive',
      'Food_Allowance',
      'Service_Charge',
      'EPF_8_Percent',
      'EPF_12_Percent',
      'ETF_3_Percent',
      'Advances',
      'SP1',
      'SP2',
      'Total_Pay',
      'Balance_Pay',
      'Payment_Status'
    ];

    const rows = currentMonthRecords.map(r => [
      r.fingerprintId || '',
      `"${r.employeeName}"`,
      `"${r.designation || ''}"`,
      `"${r.department || ''}"`,
      r.hoursWorked,
      r.basicSalary,
      r.otHours,
      r.otPay,
      r.serviceIntensive,
      r.foodAllowance,
      r.serviceCharge,
      r.epf8,
      r.epf12,
      r.etf3,
      r.advances,
      r.sp1,
      r.sp2,
      r.totalPay,
      r.balancePay,
      r.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hilldale_Retreat_Payroll_${selectedPayrollMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text tracking-tight">
                Staff Payroll & Attendance System
              </h2>
              <p className="text-xs text-secondary">
                Biometric Fingerprint Hours • OT Calculation • EPF/ETF Statutory • Service Charge Pool
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center bg-surface-muted p-1 rounded-xl border border-border">
            <select
              value={selectedPayrollMonth}
              onChange={(e) => setSelectedPayrollMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-text px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {m === '2026-07' ? 'July 2026 (Verified Master)' : m === '2026-08' ? 'August 2026 (Active)' : `Month: ${m}`}
                </option>
              ))}
            </select>
          </div>

          {/* Import Biometric Fingerprint Button */}
          <button
            id="btn-import-fingerprint"
            onClick={() => setIsBiometricImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Import working hours from fingerprint machine"
          >
            <Fingerprint className="w-4 h-4 text-primary-light" />
            <span>Import Biometrics</span>
          </button>

          {/* Distribute Service Charge Pool */}
          <button
            id="btn-distribute-pool"
            onClick={() => setShowPoolDialog(true)}
            className="flex items-center gap-1.5 bg-secondary-light hover:bg-[#eddcb0] text-primary border border-border-focus px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Distribute retreat 10% service charge pool"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">10% SC Pool</span>
          </button>

          {/* Post Payroll to Expenses */}
          <button
            id="btn-post-payroll-expenses"
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-surface-muted text-text border border-border px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Post net salary disbursals to Retreat Expenses for P&L"
          >
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Post to P&L</span>
          </button>

          {/* Add Staff Member */}
          <button
            id="btn-add-staff"
            onClick={() => setIsNewEmployeeModalOpen(true)}
            className="flex items-center gap-1.5 bg-surface-muted hover:bg-border text-text border border-border px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-secondary" />
            <span>Add Staff</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-white hover:bg-surface-muted text-secondary hover:text-text border border-border rounded-xl transition cursor-pointer"
            title="Export Monthly Salary Sheet to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="bg-primary-light border border-border-focus text-primary px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Service Charge Pool Prompt Modal */}
      {showPoolDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary-light text-primary flex items-center justify-center font-bold">
                %
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Distribute Service Charge Pool</h3>
                <p className="text-xs text-secondary">Month: {selectedPayrollMonth}</p>
              </div>
            </div>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Enter the total 10% Service Charge collected from restaurant & villa guest folios to automatically distribute equal shares to eligible team members.
            </p>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Total Pool Amount (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-secondary font-bold font-mono">Rs.</span>
                <input
                  type="number"
                  step="1000"
                  value={servicePoolInput}
                  onChange={(e) => setServicePoolInput(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2 text-sm font-mono font-bold text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPoolDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-muted rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyServiceChargePool}
                className="bg-primary hover:bg-[#4d5541] text-white px-4 py-2 rounded-lg text-xs font-bold transition"
              >
                Distribute to {currentMonthRecords.length} Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Payroll to Expenses Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Post Net Payroll to Ledger</h3>
                <p className="text-xs text-secondary">Month: {selectedPayrollMonth}</p>
              </div>
            </div>
            
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Total Staff Count:</span>
                <span className="font-bold text-text">{currentMonthRecords.length} Team Members</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Total Net Disbursal:</span>
                <span className="font-bold font-mono text-primary">Rs. {grandBalancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })} LKR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">USD Equivalent:</span>
                <span className="font-mono text-secondary">${(((Number(grandBalancePay) || 0) / (Number(settings?.usdToLkrRate) || 305))).toFixed(2)} USD</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Disburse From Treasury Account
              </label>
              <select
                value={selectedPayoutAccountId}
                onChange={(e) => setSelectedPayoutAccountId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-text focus:outline-none focus:border-primary"
              >
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency} {a.balance.toLocaleString()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-secondary mt-1">
                Money will be debited from this account and logged into the treasury ledger.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-muted rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostToExpenses}
                className="bg-primary hover:bg-[#4d5541] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Disburse</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Gross Pay */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">
            <span>Total Gross Pay</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-text">
            Rs. {grandTotalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-secondary mt-1 font-mono">
            ≈ ${(((Number(grandTotalPay) || 0) / (Number(settings?.usdToLkrRate) || 305))).toFixed(2)} USD
          </div>
        </div>

        {/* Net Disbursal / Balance Pay */}
        <div className="bg-primary text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-light mb-1 font-semibold uppercase tracking-wider">
            <span>Net Disbursal</span>
            <DollarSign className="w-4 h-4 text-secondary-light" />
          </div>
          <div className="text-xl font-black font-mono text-secondary-light">
            Rs. {grandBalancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-primary-light mt-1 font-mono">
            After EPF (8%) & Advances
          </div>
        </div>

        {/* Total Overtime */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">
            <span>Overtime (OT)</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            Rs. {totalOtPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-secondary mt-1 font-mono">
            {totalOtHours.toFixed(1)} OT Hours Logged
          </div>
        </div>

        {/* Statutory Funds (EPF + ETF) */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">
            <span>EPF & ETF Funds</span>
            <ShieldCheck className="w-4 h-4 text-red-700" />
          </div>
          <div className="text-xl font-bold font-mono text-text">
            Rs. {(totalEpf8 + totalEpf12 + totalEtf3).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-secondary mt-1 font-mono">
            EPF 8%: Rs. {totalEpf8.toFixed(0)} | 12%: Rs. {totalEpf12.toFixed(0)}
          </div>
        </div>

        {/* Service Charge Distributed */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">
            <span>10% Service Pool</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            Rs. {totalServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-secondary mt-1 font-mono">
            Distributed to team
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('salary_sheet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'salary_sheet'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-secondary-dark hover:bg-surface-muted border border-border'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Master Salary Calculation Sheet ({currentMonthRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('biometric_tracker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'biometric_tracker'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-secondary-dark hover:bg-surface-muted border border-border'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Biometric Punch Logs ({biometricLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff_directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'staff_directory'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-secondary-dark hover:bg-surface-muted border border-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('service_charge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'service_charge'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-secondary-dark hover:bg-surface-muted border border-border'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Service Charge & Incentive Pool</span>
        </button>
      </div>

      {/* VIEW 1: MASTER SALARY CALCULATION SHEET */}
      {activeSubTab === 'salary_sheet' && (
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          {/* Table Header Filter Controls */}
          <div className="p-4 border-b border-border bg-background flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff name, fingerprint ID, or title..."
                  className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-secondary font-semibold">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-white border border-border rounded-lg px-2.5 py-1 text-xs text-text font-medium focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Management">Management</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Service">Service</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Front Desk">Front Desk</option>
              </select>
            </div>
          </div>

          {/* Master Calculation Table (Matching user's exact sheet layout) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-muted text-secondary-dark text-[11px] uppercase tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-3">Enroll ID</th>
                  <th className="py-3 px-3">Name & Role</th>
                  <th className="py-3 px-3 text-right">Hours</th>
                  <th className="py-3 px-3 text-right">Basic (Rs.)</th>
                  <th className="py-3 px-3 text-right">OT Hrs</th>
                  <th className="py-3 px-3 text-right">OT Pay</th>
                  <th className="py-3 px-3 text-right">Service Intensive</th>
                  <th className="py-3 px-3 text-right">Food Allow.</th>
                  <th className="py-3 px-3 text-right">Service Charge</th>
                  <th className="py-3 px-3 text-right text-red-800">EPF 8%</th>
                  <th className="py-3 px-3 text-right text-secondary">EPF 12%</th>
                  <th className="py-3 px-3 text-right text-secondary">ETF 3%</th>
                  <th className="py-3 px-3 text-right text-red-800">Advances</th>
                  <th className="py-3 px-3 text-right">SP1</th>
                  <th className="py-3 px-3 text-right">SP2</th>
                  <th className="py-3 px-3 text-right font-bold text-primary">Total Pay</th>
                  <th className="py-3 px-3 text-right font-black text-text bg-secondary-light/40">Balance Pay</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D6]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-8 text-center text-secondary text-xs">
                      No payroll records found for {selectedPayrollMonth}. Click "Import Biometrics" to generate or load records.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr 
                      key={r.id || idx} 
                      className={`hover:bg-background transition ${
                        idx % 2 === 1 ? 'bg-secondary-light/10' : ''
                      }`}
                    >
                      {/* Fingerprint ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        #{r.fingerprintId || (idx + 101)}
                      </td>

                      {/* Name & Role */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-text whitespace-nowrap">{r.employeeName}</div>
                        <div className="text-[10px] text-secondary truncate max-w-[140px]">
                          {r.designation || r.department}
                        </div>
                      </td>

                      {/* Hours Worked */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-text">
                        {r.hoursWorked > 0 ? r.hoursWorked.toFixed(1) : '-'}
                      </td>

                      {/* Basic */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                        {r.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* OT Hours */}
                      <td className="py-2.5 px-3 text-right font-mono text-primary">
                        {r.otHours > 0 ? r.otHours.toFixed(1) : '-'}
                      </td>

                      {/* OT Pay */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary">
                        {r.otPay > 0 ? r.otPay.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Service Intensive */}
                      <td className="py-2.5 px-3 text-right font-mono text-text">
                        {r.serviceIntensive > 0 ? r.serviceIntensive.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Food Allowance */}
                      <td className="py-2.5 px-3 text-right font-mono text-text">
                        {r.foodAllowance > 0 ? r.foodAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Service Charge */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary">
                        {r.serviceCharge > 0 ? r.serviceCharge.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* EPF 8% */}
                      <td className="py-2.5 px-3 text-right font-mono text-red-700 font-medium">
                        {r.epf8 > 0 ? `(${r.epf8.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '-'}
                      </td>

                      {/* EPF 12% */}
                      <td className="py-2.5 px-3 text-right font-mono text-secondary text-[11px]">
                        {r.epf12 > 0 ? r.epf12.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* ETF 3% */}
                      <td className="py-2.5 px-3 text-right font-mono text-secondary text-[11px]">
                        {r.etf3 > 0 ? r.etf3.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Advances */}
                      <td className="py-2.5 px-3 text-right font-mono text-red-700 font-bold">
                        {r.advances > 0 ? `(${r.advances.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '-'}
                      </td>

                      {/* SP1 */}
                      <td className="py-2.5 px-3 text-right font-mono text-text">
                        {r.sp1 > 0 ? r.sp1.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* SP2 */}
                      <td className="py-2.5 px-3 text-right font-mono text-text">
                        {r.sp2 > 0 ? r.sp2.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Total Pay */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {r.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Balance Pay (Net Disbursal) */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-text bg-secondary-light/50">
                        {r.balancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.paymentStatus === 'paid' ? 'bg-primary-light text-primary' : 'bg-secondary-light text-amber-800'
                        }`}>
                          {r.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedPayrollRecordForEdit(r)}
                            className="p-1 text-secondary hover:text-primary hover:bg-surface-muted rounded transition"
                            title="Edit Record & Adjust Hours"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedPayrollRecordForPayslip(r)}
                            className="p-1 text-primary hover:text-[#4d5541] hover:bg-primary-light rounded transition"
                            title="Print Official Payslip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Master Totals Row */}
              <tfoot className="bg-primary text-white font-mono font-bold text-xs">
                <tr>
                  <td className="py-3 px-3" colSpan={2}>
                    TOTALS ({currentMonthRecords.length} STAFF)
                  </td>
                  <td className="py-3 px-3 text-right">-</td>
                  <td className="py-3 px-3 text-right">
                    {totalBasic.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right">{totalOtHours.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right">
                    {totalOtPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {totalServiceIntensive.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {totalFoodAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {totalServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-red-200">
                    ({totalEpf8.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </td>
                  <td className="py-3 px-3 text-right text-primary-light">
                    {totalEpf12.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-primary-light">
                    {totalEtf3.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-red-200">
                    ({totalAdvances.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </td>
                  <td className="py-3 px-3 text-right">
                    {totalSP1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {totalSP2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-primary-light font-black">
                    Rs. {grandTotalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-secondary-light font-black text-sm bg-black/20">
                    Rs. {grandBalancePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center font-sans text-[11px]">
                    LKR Currency
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: BIOMETRIC PUNCH LOGS */}
      {activeSubTab === 'biometric_tracker' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-text">Fingerprint Attendance Engine</h3>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Connected Device: <span className="font-semibold text-text">ZKTeco K40 Fingerprint Machine</span> (LAN / USB Sync)
              </p>
            </div>

            <button
              onClick={() => setIsBiometricImportModalOpen(true)}
              className="bg-primary hover:bg-[#4d5541] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-primary-light" />
              Upload Biometric Punch File (CSV / TXT)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-background flex items-center justify-between text-xs font-bold text-primary">
              <span>Recorded Biometric Attendance Time-Cards ({biometricLogs.length})</span>
              <span className="text-secondary font-normal">Overtime is calculated automatically after standard shift</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-secondary-dark text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Enroll ID</th>
                    <th className="py-2.5 px-4">Staff Member</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Punch In</th>
                    <th className="py-2.5 px-4">Punch Out</th>
                    <th className="py-2.5 px-4 text-right">Total Hours</th>
                    <th className="py-2.5 px-4 text-right">Overtime (OT)</th>
                    <th className="py-2.5 px-4">Machine Source</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D6]">
                  {biometricLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-background">
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">
                        #{log.fingerprintId}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-text">
                        {log.employeeName}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-secondary">
                        {log.date}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-primary font-bold">
                        {log.clockIn}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-secondary">
                        {log.clockOut}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-text">
                        {log.hoursWorked.toFixed(2)} hrs
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">
                        {log.otHours > 0 ? `+${log.otHours.toFixed(2)} hrs` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-secondary text-[11px] truncate max-w-[150px]">
                        {log.deviceSource || 'ZKTeco K40'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="bg-primary-light text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF DIRECTORY */}
      {activeSubTab === 'staff_directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-border">
            <div>
              <h3 className="text-base font-bold text-text">Hilldale Retreat Staff Profiles</h3>
              <p className="text-xs text-secondary">Enrolled biometric profiles, EPF numbers, and bank disbursal accounts</p>
            </div>
            <button
              onClick={() => setIsNewEmployeeModalOpen(true)}
              className="bg-primary hover:bg-[#4d5541] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-primary-light" />
              Add New Staff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text">{emp.name}</h4>
                      </div>
                      <p className="text-xs text-secondary font-medium">{emp.designation}</p>
                    </div>
                    <span className="font-mono text-xs bg-primary-light text-primary px-2.5 py-0.5 rounded-full font-bold border border-border-focus">
                      ID #{emp.fingerprintId}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs">
                    <div className="flex justify-between text-secondary-dark">
                      <span>Department:</span>
                      <span className="font-semibold text-text">{emp.department}</span>
                    </div>
                    <div className="flex justify-between text-secondary-dark">
                      <span>Basic Salary:</span>
                      <span className="font-mono font-bold text-text">
                        Rs. {emp.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-secondary-dark">
                      <span>Service Incentive:</span>
                      <span className="font-mono font-semibold text-primary">
                        Rs. {emp.serviceIntensiveDefault.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-secondary-dark">
                      <span>EPF Status:</span>
                      <span className={`font-semibold ${emp.epfEligible ? 'text-primary' : 'text-secondary'}`}>
                        {emp.epfEligible ? `Eligible (${emp.epfNumber || 'Enrolled'})` : 'Non-EPF'}
                      </span>
                    </div>
                    {emp.bankName && (
                      <div className="flex justify-between text-secondary-dark">
                        <span>Bank Disbursal:</span>
                        <span className="font-mono text-[11px] text-text">{emp.bankName} - {emp.accountNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-secondary text-[11px]">{emp.contactPhone}</span>
                  <span className="px-2 py-0.5 bg-primary-light text-primary rounded-full text-[10px] font-bold uppercase">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: SERVICE CHARGE & INCENTIVE POOL */}
      {activeSubTab === 'service_charge' && (
        <div className="bg-white rounded-2xl border border-border shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-text">10% Retreat Service Charge Pool Allocator</h3>
            <p className="text-xs text-secondary">
              Under Sri Lankan hospitality standards, 10% service charge collected from guest room bookings and dining folios is distributed to retreat operational staff.
            </p>
          </div>

          <div className="bg-surface-muted p-5 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">
                Total Service Charge Pool (Rs. LKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-secondary font-bold font-mono">Rs.</span>
                <input
                  type="number"
                  step="1000"
                  value={servicePoolInput}
                  onChange={(e) => setServicePoolInput(Number(e.target.value))}
                  className="w-full bg-white border border-border rounded-xl pl-10 pr-3 py-2 text-sm font-mono font-bold text-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1.5">
                Eligible Staff Members
              </label>
              <div className="bg-white border border-border rounded-xl px-4 py-2 text-sm font-bold text-primary">
                {currentMonthRecords.length} Staff Enrolled
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1.5">
                Calculated Per-Person Share
              </label>
              <div className="bg-secondary-light border border-border-focus rounded-xl px-4 py-2 text-sm font-mono font-black text-primary">
                Rs. {(currentMonthRecords.length > 0 ? (servicePoolInput / currentMonthRecords.length) : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleApplyServiceChargePool}
              className="bg-primary hover:bg-[#4d5541] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-primary-light" />
              Apply Service Charge to {selectedPayrollMonth} Payroll Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
