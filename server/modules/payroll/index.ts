import { FastifyPluginAsync } from 'fastify';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import { employees, attendanceLogs, payrollRecords, expenses, accountTransactions, accounts } from '../../db/schema';


const payrollModule: FastifyPluginAsync = async (fastify, opts) => {
  // ---- Employees CRUD ----
  fastify.get('/employees', async (request, reply) => {
    const allEmployees = await db.select().from(employees);
    // Convert camelCase strings to boolean where needed, but Drizzle handles types mostly.
    return allEmployees;
  });

  fastify.post('/employees', async (request, reply) => {
    const data = request.body as any;
    const newEmp = {
      id: `emp-${Date.now()}`,
      ...data,
      epfEligible: data.epfEligible === true,
      active: true,
    };
    await db.insert(employees).values(newEmp);
    (fastify as any).io.emit('employeeCreated', newEmp);
    return { success: true, employee: newEmp };
  });

  fastify.put('/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    await db.update(employees).set(data).where(eq(employees.id, id));
    
    const updated = await db.select().from(employees).where(eq(employees.id, id));
    if (updated.length) {
      (fastify as any).io.emit('employeeUpdated', updated[0]);
    }
    
    return { success: true, employee: updated[0] };
  });

  fastify.delete('/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(employees).where(eq(employees.id, id));
    (fastify as any).io.emit('employeeDeleted', { id });
    return { success: true };
  });

  // ---- Biometric Attendance Logs ----
  fastify.get('/attendance', async (request, reply) => {
    return await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.date));
  });

  fastify.post('/attendance/import', async (request, reply) => {
    const { logs } = request.body as { logs: any[] };
    if (!logs || !logs.length) return { success: false, message: 'No logs provided' };

    const insertedLogs = [];
    for (const log of logs) {
      // Find employee by fingerprint ID
      const emps = await db.select().from(employees).where(eq(employees.fingerprintId, log.fingerprintId));
      let empId = null;
      let empName = log.employeeName;

      if (emps.length > 0) {
        empId = emps[0].id;
        empName = emps[0].name;
      }

      const newLog = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        fingerprintId: log.fingerprintId,
        employeeId: empId,
        employeeName: empName,
        date: log.date,
        clockIn: log.clockIn,
        clockOut: log.clockOut,
        hoursWorked: log.hoursWorked || '0',
        otHours: log.otHours || '0',
        status: log.status || 'present',
        deviceSource: log.deviceSource || 'biometric',
      };
      
      await db.insert(attendanceLogs).values(newLog);
      insertedLogs.push(newLog);
    }

    (fastify as any).io.emit('attendanceImported', insertedLogs);
    return { success: true, count: insertedLogs.length };
  });

  // ---- Payroll Records ----
  fastify.get('/records', async (request, reply) => {
    return await db.select().from(payrollRecords).orderBy(desc(payrollRecords.monthYear));
  });

  fastify.post('/records/generate', async (request, reply) => {
    const { monthYear } = request.body as { monthYear: string };
    
    const allEmployees = await db.select().from(employees).where(eq(employees.active, true));
    
    const startOfMonth = `${monthYear}-01`;
    // Approximate end of month for string comparison
    const endOfMonth = `${monthYear}-31`;
    
    const monthLogs = await db.select().from(attendanceLogs); 
    
    const filteredLogs = monthLogs.filter(l => l.date.startsWith(monthYear));

    const newRecords = [];

    for (const emp of allEmployees) {
      // Check if record exists
      const existing = await db.select().from(payrollRecords).where(and(eq(payrollRecords.employeeId, emp.id), eq(payrollRecords.monthYear, monthYear)));
      if (existing.length > 0) continue;

      const empLogs = filteredLogs.filter(l => l.employeeId === emp.id);
      const totalHours = empLogs.reduce((sum, l) => sum + Number(l.hoursWorked), 0);
      const otHours = empLogs.reduce((sum, l) => sum + Number(l.otHours), 0);

      const basicSalary = Number(emp.basicSalary);
      const hourlyRate = (basicSalary / 200) || 0; // Assuming 200 standard hours/month
      const otRate = hourlyRate * 1.5;
      const otPay = otHours * otRate;

      let epf8 = 0;
      let epf12 = 0;
      let etf3 = 0;

      if (emp.epfEligible) {
        epf8 = (basicSalary * 8) / 100;
        epf12 = (basicSalary * 12) / 100;
        etf3 = (basicSalary * 3) / 100;
      }

      const totalPay = basicSalary + otPay + Number(emp.serviceIntensiveDefault) + Number(emp.foodAllowanceDaily); // Need multiplier for food allowance?
      const balancePay = totalPay - epf8; // Simplified, will allow edit

      const rec = {
        id: `pr-${emp.id}-${monthYear}`,
        monthYear,
        employeeId: emp.id,
        employeeName: emp.name,
        fingerprintId: emp.fingerprintId,
        designation: emp.designation,
        department: emp.department,
        hoursWorked: totalHours.toFixed(2),
        otHours: otHours.toFixed(2),
        otPay: otPay.toFixed(2),
        basicSalary: basicSalary.toFixed(2),
        serviceIntensive: Number(emp.serviceIntensiveDefault).toFixed(2),
        serviceCharge: '0.00',
        foodAllowance: Number(emp.foodAllowanceDaily).toFixed(2),
        sp1: '0.00',
        sp2: '0.00',
        epf8: epf8.toFixed(2),
        epf12: epf12.toFixed(2),
        etf3: etf3.toFixed(2),
        advances: '0.00',
        totalPay: totalPay.toFixed(2),
        balancePay: balancePay.toFixed(2),
        paymentStatus: 'unpaid'
      };

      await db.insert(payrollRecords).values(rec);
      newRecords.push(rec);
    }
    
    (fastify as any).io.emit('payrollGenerated', { monthYear });
    return { success: true, count: newRecords.length };
  });

  fastify.put('/records/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    // Recalculate totals
    const totalPay = Number(data.basicSalary || 0) + Number(data.otPay || 0) + Number(data.serviceIntensive || 0) + Number(data.serviceCharge || 0) + Number(data.foodAllowance || 0) + Number(data.sp1 || 0) + Number(data.sp2 || 0);
    const balancePay = totalPay - Number(data.epf8 || 0) - Number(data.advances || 0);

    const updateData = {
      ...data,
      totalPay: totalPay.toFixed(2),
      balancePay: balancePay.toFixed(2),
    };

    await db.update(payrollRecords).set(updateData).where(eq(payrollRecords.id, id));
    
    const updated = await db.select().from(payrollRecords).where(eq(payrollRecords.id, id));
    (fastify as any).io.emit('payrollUpdated', updated[0]);
    
    return { success: true, record: updated[0] };
  });

  fastify.post('/records/distribute-service-charge', async (request, reply) => {
    const { monthYear, poolAmount } = request.body as { monthYear: string, poolAmount: number };
    const records = await db.select().from(payrollRecords).where(eq(payrollRecords.monthYear, monthYear));
    
    if (records.length === 0) return { success: false, message: 'No records for this month.' };

    const activeCount = records.length; // distribute equally for simplicity
    const perPerson = poolAmount / activeCount;

    for (const r of records) {
      const newSC = Number(r.serviceCharge) + perPerson;
      const totalPay = Number(r.totalPay) + perPerson;
      const balancePay = Number(r.balancePay) + perPerson;

      await db.update(payrollRecords).set({
        serviceCharge: newSC.toFixed(2),
        totalPay: totalPay.toFixed(2),
        balancePay: balancePay.toFixed(2)
      }).where(eq(payrollRecords.id, r.id));
    }

    (fastify as any).io.emit('payrollServiceChargeDistributed', { monthYear });
    return { success: true };
  });

  fastify.delete('/records/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(payrollRecords).where(eq(payrollRecords.id, id));
    (fastify as any).io.emit('payrollDeleted', { id });
    return { success: true };
  });

  fastify.post('/post-to-expenses', async (request, reply) => {
    const { monthYear, accountId } = request.body as { monthYear: string, accountId: string };
    
    const records = await db.select().from(payrollRecords).where(eq(payrollRecords.monthYear, monthYear));
    if (records.length === 0) return { success: false, message: 'No payroll records found.' };

    const grandBalancePay = records.reduce((sum, r) => sum + Number(r.balancePay), 0);

    const expId = `exp-${Date.now()}`;
    const newExp = {
      id: expId,
      expenseNumber: `PR-${monthYear}`,
      date: new Date().toISOString(),
      category: 'payroll_salaries',
      description: `Payroll Salary Disbursement for ${monthYear}`,
      amountUSD: '0',
      amountLKR: grandBalancePay.toString(),
      paidAmountUSD: '0',
      paidAmountLKR: grandBalancePay.toString(),
      status: 'PAID',
      paymentMethod: 'bank_transfer',
      accountId: accountId,
    };
    await db.insert(expenses).values(newExp);

    if (accountId) {
      const acc = await db.select().from(accounts).where(eq(accounts.id, accountId));
      if (acc.length) {
        const newBal = Number(acc[0].balance) - grandBalancePay;
        await db.update(accounts).set({ balance: newBal.toString() }).where(eq(accounts.id, accountId));
        
        await db.insert(accountTransactions).values({
          id: `tx-${Date.now()}`,
          accountId: accountId,
          accountName: acc[0].name,
          date: new Date().toISOString().split('T')[0],
          type: 'payroll_payout',
          direction: 'out',
          amount: grandBalancePay.toString(),
          amountUSD: '0',
          amountLKR: grandBalancePay.toString(),
          runningBalance: newBal.toString(),
          payeeOrPayer: 'Staff Salaries',
          category: 'Payroll & Salaries',
          reference: `PR-${monthYear}`,
          relatedEntityType: 'expense',
          relatedEntityId: expId
        });
      }
    }

    for (const r of records) {
      await db.update(payrollRecords).set({
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString().split('T')[0]
      }).where(eq(payrollRecords.id, r.id));
    }

    (fastify as any).io.emit('payrollPosted', { monthYear });
    return { success: true };
  });

};

export default payrollModule;
