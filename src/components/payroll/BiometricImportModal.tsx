import React, { useState } from 'react';
import { 
  Fingerprint, 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Play, 
  Sparkles,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { BiometricAttendanceLog } from '../../types';
import { SAMPLE_BIOMETRIC_CSV_CONTENT } from '../../data/payrollData';

export const BiometricImportModal: React.FC = () => {
  const { 
    isBiometricImportModalOpen, 
    setIsBiometricImportModalOpen, 
    selectedPayrollMonth
  } = useApp();

  const { employees, importAttendance, generatePayroll } = usePayroll();

  const [csvText, setCsvText] = useState<string>(SAMPLE_BIOMETRIC_CSV_CONTENT);
  const [deviceModel, setDeviceModel] = useState<string>('ZKTeco K40 Biometric Time & Attendance Machine');
  const [targetMonth, setTargetMonth] = useState<string>(selectedPayrollMonth);
  const [parsedLogs, setParsedLogs] = useState<BiometricAttendanceLog[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isBiometricImportModalOpen) return null;

  const handleParseCsv = () => {
    setParseError(null);
    setSuccessMessage(null);

    try {
      const lines = csvText.trim().split('\n').filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        setParseError('CSV data is empty or only contains headers.');
        return;
      }

      // Check header
      const headerLine = lines[0].toLowerCase();
      const rows = lines.slice(1);
      const generatedLogs: BiometricAttendanceLog[] = [];

      rows.forEach((row, idx) => {
        const cols = row.split(',').map(c => c.trim());
        if (cols.length >= 4) {
          const fingerprintId = cols[0] || '';
          const nameInFile = cols[1] || '';
          const date = cols[2] || `${targetMonth}-15`;
          const clockIn = cols[3] || '08:00';
          const clockOut = cols[4] || '17:00';
          const totalHours = Number(cols[5]) || 9.0;
          const otHours = Number(cols[6]) || (totalHours > 8 ? Number((totalHours - 8).toFixed(1)) : 0);

          // Match with employee in system
          const matchedEmp = employees.find(e => e.fingerprintId === fingerprintId || e.name.toLowerCase().includes(nameInFile.toLowerCase()));

          generatedLogs.push({
            id: `bio-imp-${Date.now()}-${idx}`,
            fingerprintId,
            employeeId: matchedEmp ? matchedEmp.id : `emp-unknown-${fingerprintId}`,
            employeeName: matchedEmp ? matchedEmp.name : nameInFile,
            date,
            clockIn,
            clockOut,
            hoursWorked: totalHours,
            otHours,
            status: 'present',
            deviceSource: deviceModel
          });
        }
      });

      if (generatedLogs.length === 0) {
        setParseError('No valid rows could be extracted. Please check CSV format.');
        return;
      }

      setParsedLogs(generatedLogs);
      setSuccessMessage(`Successfully parsed ${generatedLogs.length} attendance punch records!`);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse CSV attendance file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedLogs.length === 0) {
      setParseError('Please parse the CSV data first to preview records.');
      return;
    }

    const logsToImport = parsedLogs.map(log => ({ ...log, deviceSource: deviceModel }));

    try {
      await importAttendance(logsToImport);
      await generatePayroll(targetMonth);
      setIsBiometricImportModalOpen(false);
    } catch (e) {
      console.error(e);
      setParseError('Failed to import biometric data');
    }
  };

  const handleLoadSample = () => {
    setCsvText(SAMPLE_BIOMETRIC_CSV_CONTENT);
    setParseError(null);
    setSuccessMessage(null);
    setParsedLogs([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-border shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Import Biometric Fingerprint Logs</h2>
              <p className="text-xs text-secondary">
                Import staff working hours from fingerprint machine to calculate OT & Salaries
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsBiometricImportModalOpen(false)}
            className="p-1.5 text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Machine & Month Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-muted p-4 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Target Salary Month
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-medium text-text focus:outline-none focus:border-primary"
              >
                <option value="2026-07">July 2026 (Historical Record)</option>
                <option value="2026-08">August 2026 (Active Current Month)</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-dark mb-1">
                Biometric Device Source
              </label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-medium text-text focus:outline-none focus:border-primary"
                placeholder="e.g. ZKTeco K40 Fingerprint Device"
              />
            </div>
          </div>

          {/* File Upload / Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                CSV Attendance Data (Enroll_ID, Name, Date, In, Out, Total_Hours, OT_Hours)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Hilldale Sample
                </button>
                <label className="cursor-pointer text-[11px] bg-primary-light hover:bg-[#d8ddb4] text-primary font-semibold px-2.5 py-1 rounded-md border border-border-focus transition flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload CSV File
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-background font-mono text-xs text-text border border-border rounded-xl p-3 focus:outline-none focus:border-primary leading-relaxed"
              placeholder="Enroll_ID,Employee_Name,Date,Punch_In,Punch_Out,Total_Hours,OT_Hours"
            />
          </div>

          {/* Parsing Actions & Feedback */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParseCsv}
              className="bg-primary hover:bg-[#4d5541] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Parse & Validate Records
            </button>

            {successMessage && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary-light px-3 py-1.5 rounded-lg border border-border-focus">
                <CheckCircle2 className="w-4 h-4" />
                {successMessage}
              </div>
            )}

            {parseError && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4" />
                {parseError}
              </div>
            )}
          </div>

          {/* Preview Table if parsed */}
          {parsedLogs.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-surface-muted px-4 py-2 text-xs font-bold text-primary border-b border-border flex items-center justify-between">
                <span>Parsed Fingerprint Records ({parsedLogs.length})</span>
                <span className="text-secondary font-normal">Ready to update working hours & calculate OT</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary-light/30 text-secondary text-[11px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Enroll ID</th>
                      <th className="py-2 px-3">Staff Member</th>
                      <th className="py-2 px-3">Punch In / Out</th>
                      <th className="py-2 px-3 text-right">Total Hours</th>
                      <th className="py-2 px-3 text-right">OT Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D6]">
                    {parsedLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-background">
                        <td className="py-2 px-3 font-mono font-bold text-primary">
                          #{log.fingerprintId}
                        </td>
                        <td className="py-2 px-3 font-semibold text-text">
                          {log.employeeName}
                        </td>
                        <td className="py-2 px-3 text-secondary font-mono">
                          {log.clockIn} - {log.clockOut}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-text">
                          {log.hoursWorked.toFixed(1)} hrs
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                          {log.otHours > 0 ? `+${log.otHours.toFixed(1)} hrs` : '0.0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsBiometricImportModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              className="bg-primary hover:bg-[#4d5541] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply & Calculate Salaries for {targetMonth}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
