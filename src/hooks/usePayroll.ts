import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { Employee, BiometricAttendanceLog, PayrollRecord } from '../types';
import { useEffect } from 'react';
import { socket } from '../utils/socket';

export const usePayroll = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/payroll/employees');
      return res.data as Employee[];
    },
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ['attendanceLogs'],
    queryFn: async () => {
      const res = await apiClient.get('/payroll/attendance');
      return res.data as BiometricAttendanceLog[];
    },
  });

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['payrollRecords'],
    queryFn: async () => {
      const res = await apiClient.get('/payroll/records');
      return res.data as PayrollRecord[];
    },
  });

  // Socket sync
  useEffect(() => {
    const handleEmployeeChange = () => queryClient.invalidateQueries({ queryKey: ['employees'] });
    const handleAttendanceChange = () => queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
    const handlePayrollChange = () => queryClient.invalidateQueries({ queryKey: ['payrollRecords'] });

    socket.on('employeeCreated', handleEmployeeChange);
    socket.on('employeeUpdated', handleEmployeeChange);
    socket.on('employeeDeleted', handleEmployeeChange);
    
    socket.on('attendanceImported', handleAttendanceChange);
    
    socket.on('payrollGenerated', handlePayrollChange);
    socket.on('payrollUpdated', handlePayrollChange);
    socket.on('payrollServiceChargeDistributed', handlePayrollChange);
    socket.on('payrollDeleted', handlePayrollChange);
    socket.on('payrollPosted', handlePayrollChange);

    return () => {
      socket.off('employeeCreated', handleEmployeeChange);
      socket.off('employeeUpdated', handleEmployeeChange);
      socket.off('employeeDeleted', handleEmployeeChange);
      
      socket.off('attendanceImported', handleAttendanceChange);
      
      socket.off('payrollGenerated', handlePayrollChange);
      socket.off('payrollUpdated', handlePayrollChange);
      socket.off('payrollServiceChargeDistributed', handlePayrollChange);
      socket.off('payrollDeleted', handlePayrollChange);
      socket.off('payrollPosted', handlePayrollChange);
    };
  }, [queryClient]);

  // Mutations - Employees
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const res = await apiClient.post('/payroll/employees', employee);
    return res.data;
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    const res = await apiClient.put(`/payroll/employees/${id}`, employee);
    return res.data;
  };

  const deleteEmployee = async (id: string) => {
    const res = await apiClient.delete(`/payroll/employees/${id}`);
    return res.data;
  };

  // Mutations - Attendance
  const importAttendance = async (logs: any[]) => {
    const res = await apiClient.post('/payroll/attendance/import', { logs });
    return res.data;
  };

  // Mutations - Payroll
  const generatePayroll = async (monthYear: string) => {
    const res = await apiClient.post('/payroll/records/generate', { monthYear });
    return res.data;
  };

  const updatePayrollRecord = async (id: string, record: Partial<PayrollRecord>) => {
    const res = await apiClient.put(`/payroll/records/${id}`, record);
    return res.data;
  };

  const distributeServiceCharge = async (monthYear: string, poolAmount: number) => {
    const res = await apiClient.post('/payroll/records/distribute-service-charge', { monthYear, poolAmount });
    return res.data;
  };

  const deletePayrollRecord = async (id: string) => {
    const res = await apiClient.delete(`/payroll/records/${id}`);
    return res.data;
  };

  const postPayrollToExpenses = async (monthYear: string, accountId: string) => {
    const res = await apiClient.post('/payroll/post-to-expenses', { monthYear, accountId });
    return res.data;
  };

  return {
    employees,
    attendanceLogs,
    payrollRecords,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importAttendance,
    generatePayroll,
    updatePayrollRecord,
    distributeServiceCharge,
    deletePayrollRecord,
    postPayrollToExpenses,
  };
};
