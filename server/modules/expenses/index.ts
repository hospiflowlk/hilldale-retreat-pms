import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { accounts, accountTransactions, expenses, expenseItems } from '../../db/schema';
import { getIO } from '../../lib/socket';
import { eq, desc } from 'drizzle-orm';

export const accountsRoutes: FastifyPluginAsync = async (fastify) => {
  // ---- ACCOUNTS ----
  fastify.get('/', async () => {
    const raw = await db.select().from(accounts).orderBy(accounts.name);
    return raw.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type as 'bank' | 'cash' | 'credit_card' | 'loan',
      accountNumber: a.accountNumber || '',
      bankName: a.bankName || undefined,
      currency: (a.currency || 'LKR') as 'LKR' | 'USD',
      balance: parseFloat(a.balance || '0'),
      openingBalance: parseFloat(a.openingBalance || '0'),
      openingDate: a.openingDate || '2026-08-01',
      branch: a.branch || undefined,
      creditLimit: a.creditLimit ? parseFloat(a.creditLimit) : undefined,
      billingCycleDay: a.billingCycleDay || undefined,
      initialLoanAmount: a.initialLoanAmount ? parseFloat(a.initialLoanAmount) : undefined,
      principalAmount: a.principalAmount ? parseFloat(a.principalAmount) : undefined,
      loanTermMonths: a.loanTermMonths || undefined,
      monthlyInstallment: a.monthlyInstallment ? parseFloat(a.monthlyInstallment) : undefined,
      interestRate: a.interestRate ? parseFloat(a.interestRate) : undefined,
      dueDate: a.dueDate || undefined,
      monthlyPayment: a.monthlyPayment ? parseFloat(a.monthlyPayment) : undefined,
      interBankTransferFee: a.interBankTransferFee ? parseFloat(a.interBankTransferFee) : 0,
      interBankFeeType: (a.interBankFeeType || 'flat') as 'flat' | 'percent',
      cardCommissionPercent: a.cardCommissionPercent ? parseFloat(a.cardCommissionPercent) : 0,
      chequeClearingFee: a.chequeClearingFee ? parseFloat(a.chequeClearingFee) : 0,
      color: a.color || undefined,
      description: a.description || undefined,
      isActive: a.isActive ?? true,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: a.updatedAt ? a.updatedAt.toISOString() : new Date().toISOString(),
    }));
  });

  fastify.post('/', async (request) => {
    const data = request.body as any;
    const now = Date.now();
    const id = data.id || `acc-${data.type}-${now}`;

    const insertPayload = {
      id,
      name: data.name,
      type: data.type,
      accountNumber: data.accountNumber || '',
      bankName: data.bankName || null,
      currency: data.currency || 'LKR',
      balance: (data.balance ?? data.openingBalance ?? 0).toString(),
      openingBalance: (data.openingBalance ?? 0).toString(),
      openingDate: data.openingDate || new Date().toISOString().split('T')[0],
      branch: data.branch || null,
      creditLimit: data.creditLimit ? data.creditLimit.toString() : null,
      billingCycleDay: data.billingCycleDay || null,
      initialLoanAmount: data.initialLoanAmount ? data.initialLoanAmount.toString() : null,
      principalAmount: data.principalAmount ? data.principalAmount.toString() : null,
      loanTermMonths: data.loanTermMonths || null,
      monthlyInstallment: data.monthlyInstallment ? data.monthlyInstallment.toString() : null,
      interestRate: data.interestRate ? data.interestRate.toString() : null,
      dueDate: data.dueDate || null,
      monthlyPayment: data.monthlyPayment ? data.monthlyPayment.toString() : null,
      interBankTransferFee: (data.interBankTransferFee ?? 0).toString(),
      interBankFeeType: data.interBankFeeType || 'flat',
      cardCommissionPercent: (data.cardCommissionPercent ?? 0).toString(),
      chequeClearingFee: (data.chequeClearingFee ?? 0).toString(),
      color: data.color || '#2B5329',
      description: data.description || null,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(accounts).values(insertPayload).returning();
    const a = result[0];

    try {
      getIO().emit('accountCreated', a);
    } catch (e) {}

    return a;
  });

  fastify.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.balance !== undefined) updatePayload.balance = data.balance.toString();
    if (data.accountNumber !== undefined) updatePayload.accountNumber = data.accountNumber;
    if (data.bankName !== undefined) updatePayload.bankName = data.bankName;
    if (data.branch !== undefined) updatePayload.branch = data.branch;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.interBankTransferFee !== undefined) updatePayload.interBankTransferFee = data.interBankTransferFee.toString();
    if (data.cardCommissionPercent !== undefined) updatePayload.cardCommissionPercent = data.cardCommissionPercent.toString();

    const result = await db.update(accounts).set(updatePayload).where(eq(accounts.id, id)).returning();
    const a = result[0];

    try {
      getIO().emit('accountUpdated', a);
    } catch (e) {}

    return a;
  });

  fastify.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await db.delete(accounts).where(eq(accounts.id, id));

    try {
      getIO().emit('accountDeleted', { id });
    } catch (e) {}

    return { success: true };
  });

  // ---- FUND TRANSFERS ----
  fastify.post('/transfer', async (request) => {
    const data = request.body as any;
    const { fromAccountId, toAccountId, amount, targetAmount, feeAmount = 0, notes } = data;

    const fromAccList = await db.select().from(accounts).where(eq(accounts.id, fromAccountId));
    const toAccList = await db.select().from(accounts).where(eq(accounts.id, toAccountId));

    if (fromAccList.length === 0 || toAccList.length === 0) {
      throw new Error('Source or Destination account not found');
    }

    const fromAcc = fromAccList[0];
    const toAcc = toAccList[0];

    const numAmount = parseFloat(amount);
    const numFee = parseFloat(feeAmount || '0');
    const numTargetAmount = targetAmount ? parseFloat(targetAmount) : numAmount;

    // Deduct from source
    const newFromBal = parseFloat(fromAcc.balance || '0') - (numAmount + numFee);
    await db.update(accounts).set({ balance: newFromBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, fromAccountId));

    // Credit to destination
    const newToBal = parseFloat(toAcc.balance || '0') + numTargetAmount;
    await db.update(accounts).set({ balance: newToBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, toAccountId));

    const todayStr = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Log Outflow transaction
    await db.insert(accountTransactions).values({
      id: `tx-out-${now}`,
      accountId: fromAccountId,
      accountName: fromAcc.name,
      date: todayStr,
      type: 'transfer_out',
      direction: 'out',
      amount: numAmount.toString(),
      amountUSD: (fromAcc.currency === 'USD' ? numAmount : numAmount / 300).toString(),
      amountLKR: (fromAcc.currency === 'LKR' ? numAmount : numAmount * 300).toString(),
      runningBalance: newFromBal.toString(),
      feeAmount: numFee.toString(),
      netAmount: (numAmount + numFee).toString(),
      payeeOrPayer: toAcc.name,
      category: 'Internal Fund Transfer',
      reference: `TRF-${String(now).slice(-6)}`,
      relatedEntityType: 'transfer',
      relatedEntityId: `TRF-${now}`,
      transferRelatedAccountId: toAccountId,
      transferRelatedAccountName: toAcc.name,
      notes: notes || `Transfer out to ${toAcc.name}`,
      createdAt: new Date(),
    });

    // Log Inflow transaction
    await db.insert(accountTransactions).values({
      id: `tx-in-${now}`,
      accountId: toAccountId,
      accountName: toAcc.name,
      date: todayStr,
      type: 'transfer_in',
      direction: 'in',
      amount: numTargetAmount.toString(),
      amountUSD: (toAcc.currency === 'USD' ? numTargetAmount : numTargetAmount / 300).toString(),
      amountLKR: (toAcc.currency === 'LKR' ? numTargetAmount : numTargetAmount * 300).toString(),
      runningBalance: newToBal.toString(),
      feeAmount: '0',
      netAmount: numTargetAmount.toString(),
      payeeOrPayer: fromAcc.name,
      category: 'Internal Fund Transfer',
      reference: `TRF-${String(now).slice(-6)}`,
      relatedEntityType: 'transfer',
      relatedEntityId: `TRF-${now}`,
      transferRelatedAccountId: fromAccountId,
      transferRelatedAccountName: fromAcc.name,
      notes: notes || `Transfer in from ${fromAcc.name}`,
      createdAt: new Date(),
    });

    try {
      getIO().emit('accountUpdated', { id: fromAccountId });
      getIO().emit('accountUpdated', { id: toAccountId });
      getIO().emit('transactionCreated');
    } catch (e) {}

    return { success: true };
  });

  // ---- TRANSACTIONS ----
  fastify.get('/transactions', async () => {
    const raw = await db.select().from(accountTransactions).orderBy(desc(accountTransactions.createdAt));
    return raw.map(t => ({
      id: t.id,
      accountId: t.accountId,
      accountName: t.accountName || '',
      date: t.date || new Date().toISOString().split('T')[0],
      type: t.type as any,
      direction: t.direction as 'in' | 'out',
      amount: parseFloat(t.amount || '0'),
      amountUSD: parseFloat(t.amountUSD || '0'),
      amountLKR: parseFloat(t.amountLKR || '0'),
      runningBalance: parseFloat(t.runningBalance || '0'),
      feeAmount: parseFloat(t.feeAmount || '0'),
      netAmount: parseFloat(t.netAmount || '0'),
      payeeOrPayer: t.payeeOrPayer || undefined,
      category: t.category || undefined,
      reference: t.reference || undefined,
      relatedEntityType: (t.relatedEntityType || 'manual') as any,
      relatedEntityId: t.relatedEntityId || undefined,
      transferRelatedAccountId: t.transferRelatedAccountId || undefined,
      transferRelatedAccountName: t.transferRelatedAccountName || undefined,
      notes: t.notes || undefined,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
    }));
  });

  fastify.post('/transactions', async (request) => {
    const data = request.body as any;
    const now = Date.now();
    const id = data.id || `tx-${now}`;

    const accList = await db.select().from(accounts).where(eq(accounts.id, data.accountId));
    if (accList.length === 0) throw new Error('Account not found');
    const acc = accList[0];

    const currentBal = parseFloat(acc.balance || '0');
    const delta = parseFloat(data.amount || '0');
    const newBal = data.direction === 'in' ? currentBal + delta : currentBal - delta;

    await db.update(accounts).set({ balance: newBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, data.accountId));

    const insertPayload = {
      id,
      accountId: data.accountId,
      accountName: acc.name,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'adjustment',
      direction: data.direction || 'in',
      amount: delta.toString(),
      amountUSD: (acc.currency === 'USD' ? delta : delta / 300).toString(),
      amountLKR: (acc.currency === 'LKR' ? delta : delta * 300).toString(),
      runningBalance: newBal.toString(),
      feeAmount: (data.feeAmount || 0).toString(),
      netAmount: (data.netAmount || delta).toString(),
      payeeOrPayer: data.payeeOrPayer || null,
      category: data.category || 'Manual Adjustment',
      reference: data.reference || null,
      relatedEntityType: data.relatedEntityType || 'manual',
      relatedEntityId: data.relatedEntityId || null,
      notes: data.notes || null,
      createdAt: new Date(),
    };

    const result = await db.insert(accountTransactions).values(insertPayload).returning();
    const t = result[0];

    try {
      getIO().emit('accountUpdated', { id: data.accountId });
      getIO().emit('transactionCreated', t);
    } catch (e) {}

    return t;
  });
};

export const expensesRoutes: FastifyPluginAsync = async (fastify) => {
  // ---- EXPENSES ----
  fastify.get('/', async () => {
    const raw = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    return raw.map(e => ({
      id: e.id,
      expenseNumber: e.expenseNumber || e.id,
      date: e.date || new Date().toISOString().split('T')[0],
      category: e.category || 'Operational',
      description: e.description || '',
      amountUSD: parseFloat(e.amountUSD || '0'),
      amountLKR: parseFloat(e.amountLKR || '0'),
      paidAmountUSD: parseFloat(e.paidAmountUSD || '0'),
      paidAmountLKR: parseFloat(e.paidAmountLKR || '0'),
      status: (e.status || 'PAID') as 'PAID' | 'PENDING' | 'PARTIAL' | 'CANCELLED',
      paymentMethod: e.paymentMethod || undefined,
      accountId: e.accountId || undefined,
      accountName: e.accountName || undefined,
      supplierId: e.supplierId ? e.supplierId.toString() : undefined,
      supplierName: e.supplierName || undefined,
      invoiceNumber: e.invoiceNumber || undefined,
      receiptUrl: e.receiptUrl || undefined,
      notes: e.notes || undefined,
      items: (e.items as any[]) || [],
      createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: e.updatedAt ? e.updatedAt.toISOString() : new Date().toISOString(),
    }));
  });

  fastify.post('/', async (request) => {
    const data = request.body as any;
    const now = Date.now();
    const id = data.id || `exp-${now}`;
    const expenseNumber = data.expenseNumber || `EXP-${String(now).slice(-6)}`;

    const insertPayload = {
      id,
      expenseNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'General Operational',
      description: data.description || 'Expense entry',
      amountUSD: (data.amountUSD || 0).toString(),
      amountLKR: (data.amountLKR || 0).toString(),
      paidAmountUSD: (data.status === 'PAID' ? data.amountUSD || 0 : data.paidAmountUSD || 0).toString(),
      paidAmountLKR: (data.status === 'PAID' ? data.amountLKR || 0 : data.paidAmountLKR || 0).toString(),
      status: data.status || 'PAID',
      paymentMethod: data.paymentMethod || 'cash',
      accountId: data.accountId || null,
      accountName: data.accountName || null,
      supplierId: data.supplierId ? parseInt(data.supplierId) : null,
      supplierName: data.supplierName || null,
      invoiceNumber: data.invoiceNumber || null,
      receiptUrl: data.receiptUrl || null,
      notes: data.notes || null,
      items: data.items || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(expenses).values(insertPayload).returning();
    const exp = result[0];

    // If paid and linked to an account, deduct from account balance and log transaction
    if (data.status === 'PAID' && data.accountId) {
      try {
        const accList = await db.select().from(accounts).where(eq(accounts.id, data.accountId));
        if (accList.length > 0) {
          const acc = accList[0];
          const expenseAmountNative = acc.currency === 'USD' ? parseFloat(data.amountUSD || '0') : parseFloat(data.amountLKR || '0');
          const currentBal = parseFloat(acc.balance || '0');
          const newBal = currentBal - expenseAmountNative;

          await db.update(accounts).set({ balance: newBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, data.accountId));

          await db.insert(accountTransactions).values({
            id: `tx-exp-${now}`,
            accountId: data.accountId,
            accountName: acc.name,
            date: data.date || new Date().toISOString().split('T')[0],
            type: 'expense',
            direction: 'out',
            amount: expenseAmountNative.toString(),
            amountUSD: (data.amountUSD || 0).toString(),
            amountLKR: (data.amountLKR || 0).toString(),
            runningBalance: newBal.toString(),
            feeAmount: '0',
            netAmount: expenseAmountNative.toString(),
            payeeOrPayer: data.supplierName || data.category || 'Operational Expense',
            category: data.category || 'Operational Expense',
            reference: data.invoiceNumber || expenseNumber,
            relatedEntityType: 'expense',
            relatedEntityId: exp.id,
            notes: data.description || 'Expense payment',
            createdAt: new Date(),
          });

          getIO().emit('accountUpdated', { id: data.accountId });
          getIO().emit('transactionCreated');
        }
      } catch (e) {
        console.error('Expense account deduction error:', e);
      }
    }

    try {
      getIO().emit('expenseCreated', exp);
    } catch (e) {}

    return exp;
  });

  fastify.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.paidAmountUSD !== undefined) updatePayload.paidAmountUSD = data.paidAmountUSD.toString();
    if (data.paidAmountLKR !== undefined) updatePayload.paidAmountLKR = data.paidAmountLKR.toString();
    if (data.paymentMethod !== undefined) updatePayload.paymentMethod = data.paymentMethod;
    if (data.accountId !== undefined) updatePayload.accountId = data.accountId;
    if (data.accountName !== undefined) updatePayload.accountName = data.accountName;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const result = await db.update(expenses).set(updatePayload).where(eq(expenses.id, id)).returning();
    const exp = result[0];

    try {
      getIO().emit('expenseUpdated', exp);
    } catch (e) {}

    return exp;
  });

  fastify.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await db.delete(expenses).where(eq(expenses.id, id));

    try {
      getIO().emit('expenseDeleted', { id });
    } catch (e) {}

    return { success: true };
  });
};

