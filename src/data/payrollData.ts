import { Employee, PayrollRecord, BiometricAttendanceLog } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_JULY_2026_PAYROLL: PayrollRecord[] = [];

export const INITIAL_AUGUST_2026_PAYROLL: PayrollRecord[] = [];

export const INITIAL_BIOMETRIC_LOGS: BiometricAttendanceLog[] = [];

// SAMPLE CSV TEMPLATE FOR FINGERPRINT ATTENDANCE IMPORT
export const SAMPLE_BIOMETRIC_CSV_CONTENT = `Enroll_ID,Employee_Name,Date,Punch_In,Punch_Out,Total_Hours,OT_Hours
101,Employee Name 1,2026-08-15,08:00,17:00,9.0,0.0
102,Employee Name 2,2026-08-15,07:30,16:30,9.0,0.0`;
