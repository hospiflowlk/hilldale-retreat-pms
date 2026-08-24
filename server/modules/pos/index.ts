import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { orders, walkinSessions, reservations, items, itemBom, kitchenTickets } from '../../db/schema';
import { getIO } from '../../lib/socket';
import { eq, desc } from 'drizzle-orm';

export const posRoutes: FastifyPluginAsync = async (fastify) => {
  // ---- ORDERS ----
  fastify.get('/orders', async () => {
    const raw = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return raw.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      invoiceNumber: o.invoiceNumber || o.id,
      sessionId: o.sessionId || undefined,
      bookingId: o.bookingId || undefined,
      roomNumber: o.roomNumber || undefined,
      orderType: o.orderType || 'dine-in',
      location: o.location || 'Table 01',
      guestName: o.guestName || '',
      guestCount: o.guestCount || 1,
      items: (o.items as any[]) || [],
      status: o.status || 'active',
      subtotal: parseFloat(o.subtotal || '0'),
      serviceChargeRate: parseFloat(o.serviceChargeRate || '0.10'),
      serviceChargeAmount: parseFloat(o.serviceChargeAmount || '0'),
      discountPercent: parseFloat(o.discountPercent || '0'),
      discountAmount: parseFloat(o.discountAmount || '0'),
      taxPercent: parseFloat(o.taxPercent || '0'),
      taxAmount: parseFloat(o.taxAmount || '0'),
      grandTotal: parseFloat(o.grandTotal || '0'),
      paymentMethod: o.paymentMethod || undefined,
      accountId: o.accountId || undefined,
      accountName: o.accountName || undefined,
      cashReceived: o.cashReceived ? parseFloat(o.cashReceived) : undefined,
      changeDue: o.changeDue ? parseFloat(o.changeDue) : undefined,
      cashierName: o.cashierName || 'Staff',
      notes: o.notes || '',
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString(),
      paidAt: o.paidAt ? o.paidAt.toISOString() : undefined,
    }));
  });

  fastify.post('/orders', async (request) => {
    const data = request.body as any;
    const now = Date.now();
    const orderId = data.id || `ORD-${now}`;
    const orderNumber = data.orderNumber || `#ORD-${String(now).slice(-4)}`;
    const invoiceNumber = data.invoiceNumber || `INV-${String(now).slice(-6)}`;

    const insertPayload: any = {
      id: orderId,
      orderNumber,
      invoiceNumber,
      sessionId: data.sessionId || null,
      reservationId: data.reservationId ? parseInt(data.reservationId) : null,
      bookingId: data.bookingId || null,
      roomNumber: data.roomNumber || null,
      orderType: data.orderType || 'dine-in',
      location: data.location || 'Table 01',
      guestName: data.guestName || 'Guest',
      guestCount: data.guestCount || 1,
      items: data.items || [],
      status: data.status || 'active',
      subtotal: (data.subtotal ?? 0).toString(),
      serviceChargeRate: (data.serviceChargeRate ?? 0.10).toString(),
      serviceChargeAmount: (data.serviceChargeAmount ?? 0).toString(),
      discountPercent: (data.discountPercent ?? 0).toString(),
      discountAmount: (data.discountAmount ?? 0).toString(),
      taxPercent: (data.taxPercent ?? 0).toString(),
      taxAmount: (data.taxAmount ?? 0).toString(),
      grandTotal: (data.grandTotal ?? 0).toString(),
      paymentMethod: data.paymentMethod || null,
      accountId: data.accountId || null,
      accountName: data.accountName || null,
      cashReceived: data.cashReceived !== undefined ? data.cashReceived.toString() : null,
      changeDue: data.changeDue !== undefined ? data.changeDue.toString() : null,
      cashierName: data.cashierName || 'Staff',
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: data.status === 'paid' ? new Date() : null,
    };

    const result = await db.insert(orders).values(insertPayload).returning();
    const o = result[0];

    // Auto-deduct inventory if items have BOM recipes
    try {
      if (Array.isArray(data.items)) {
        for (const line of data.items) {
          if (line.menuItemId) {
            const numItemId = parseInt(line.menuItemId);
            if (!isNaN(numItemId)) {
              // 1. Direct deduction if RESALE item
              const targetItem = await db.select().from(items).where(eq(items.id, numItemId));
              if (targetItem.length > 0 && targetItem[0].type === 'RESALE') {
                const currentStock = parseFloat(targetItem[0].stockLevel || '0');
                const newStock = Math.max(0, currentStock - (line.quantity || 1));
                await db.update(items).set({ stockLevel: newStock.toString() }).where(eq(items.id, numItemId));
              }
              // 2. BOM Recipe ingredient deductions
              const boms = await db.select().from(itemBom).where(eq(itemBom.recipeItemId, numItemId));
              for (const bom of boms) {
                const ingItem = await db.select().from(items).where(eq(items.id, bom.ingredientItemId));
                if (ingItem.length > 0) {
                  const qtyToDeduct = parseFloat(bom.quantityPerUnit || '0') * (line.quantity || 1);
                  const currentIngStock = parseFloat(ingItem[0].stockLevel || '0');
                  const newIngStock = Math.max(0, currentIngStock - qtyToDeduct);
                  await db.update(items).set({ stockLevel: newIngStock.toString() }).where(eq(items.id, bom.ingredientItemId));
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('BOM inventory deduction error:', e);
    }

    // If order is room-service or charged to room, post to guest folio
    if (data.roomNumber && (data.orderType === 'room-service' || data.paymentMethod === 'room_charge')) {
      try {
        const cleanRoom = data.roomNumber.replace(/[^0-9]/g, '');
        const matchingRes = await db.select().from(reservations).where(eq(reservations.roomNumber, cleanRoom));
        const activeBooking = matchingRes.find(b => b.status === 'checked_in');
        if (activeBooking) {
          const currentCharges = (activeBooking.folioCharges as any[]) || [];
          const newCharge = {
            id: `folio-pos-${o.id}`,
            date: new Date().toISOString().split('T')[0],
            category: 'restaurant_pos',
            description: `Restaurant POS Order ${o.orderNumber || o.id} (${data.items?.length || 1} items)`,
            amountUSD: parseFloat(o.grandTotal || '0'),
            quantity: 1,
            orderId: o.id,
            notes: `Auto-posted from POS for Room ${cleanRoom}`,
            createdAt: new Date().toISOString()
          };
          await db.update(reservations).set({
            folioCharges: [...currentCharges, newCharge],
            updatedAt: new Date()
          }).where(eq(reservations.id, activeBooking.id));
          getIO().emit('bookingUpdated', { id: activeBooking.id.toString() });
        }
      } catch (e) {
        console.error('Room charge folio auto-post error:', e);
      }
    }

    // Create kitchen ticket
    try {
      await db.insert(kitchenTickets).values({
        orderId: o.id,
        status: 'PENDING'
      });
    } catch (e) {}

    const mapped = {
      id: o.id,
      orderNumber: o.orderNumber,
      invoiceNumber: o.invoiceNumber,
      sessionId: o.sessionId || undefined,
      bookingId: o.bookingId || undefined,
      roomNumber: o.roomNumber || undefined,
      orderType: o.orderType,
      location: o.location,
      guestName: o.guestName,
      guestCount: o.guestCount,
      items: (o.items as any[]) || [],
      status: o.status,
      subtotal: parseFloat(o.subtotal || '0'),
      serviceChargeRate: parseFloat(o.serviceChargeRate || '0.10'),
      serviceChargeAmount: parseFloat(o.serviceChargeAmount || '0'),
      discountPercent: parseFloat(o.discountPercent || '0'),
      discountAmount: parseFloat(o.discountAmount || '0'),
      taxPercent: parseFloat(o.taxPercent || '0'),
      taxAmount: parseFloat(o.taxAmount || '0'),
      grandTotal: parseFloat(o.grandTotal || '0'),
      paymentMethod: o.paymentMethod || undefined,
      accountId: o.accountId || undefined,
      accountName: o.accountName || undefined,
      cashReceived: o.cashReceived ? parseFloat(o.cashReceived) : undefined,
      changeDue: o.changeDue ? parseFloat(o.changeDue) : undefined,
      cashierName: o.cashierName,
      notes: o.notes || '',
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString(),
      paidAt: o.paidAt ? o.paidAt.toISOString() : undefined,
    };

    try {
      getIO().emit('orderCreated', mapped);
      getIO().emit('newKitchenTicket', { orderId: o.id });
    } catch (e) {}

    return mapped;
  });

  fastify.put('/orders/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const updatePayload: any = {
      updatedAt: new Date()
    };

    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.status === 'paid' && !data.paidAt) updatePayload.paidAt = new Date();
    if (data.items !== undefined) updatePayload.items = data.items;
    if (data.subtotal !== undefined) updatePayload.subtotal = data.subtotal.toString();
    if (data.grandTotal !== undefined) updatePayload.grandTotal = data.grandTotal.toString();
    if (data.paymentMethod !== undefined) updatePayload.paymentMethod = data.paymentMethod;
    if (data.accountId !== undefined) updatePayload.accountId = data.accountId;
    if (data.accountName !== undefined) updatePayload.accountName = data.accountName;
    if (data.cashReceived !== undefined) updatePayload.cashReceived = data.cashReceived.toString();
    if (data.changeDue !== undefined) updatePayload.changeDue = data.changeDue.toString();

    const result = await db.update(orders).set(updatePayload).where(eq(orders.id, id)).returning();
    const o = result[0];

    const mapped = {
      id: o.id,
      orderNumber: o.orderNumber,
      invoiceNumber: o.invoiceNumber,
      sessionId: o.sessionId || undefined,
      bookingId: o.bookingId || undefined,
      roomNumber: o.roomNumber || undefined,
      orderType: o.orderType,
      location: o.location,
      guestName: o.guestName,
      guestCount: o.guestCount,
      items: (o.items as any[]) || [],
      status: o.status,
      subtotal: parseFloat(o.subtotal || '0'),
      serviceChargeRate: parseFloat(o.serviceChargeRate || '0.10'),
      serviceChargeAmount: parseFloat(o.serviceChargeAmount || '0'),
      discountPercent: parseFloat(o.discountPercent || '0'),
      discountAmount: parseFloat(o.discountAmount || '0'),
      taxPercent: parseFloat(o.taxPercent || '0'),
      taxAmount: parseFloat(o.taxAmount || '0'),
      grandTotal: parseFloat(o.grandTotal || '0'),
      paymentMethod: o.paymentMethod || undefined,
      accountId: o.accountId || undefined,
      accountName: o.accountName || undefined,
      cashReceived: o.cashReceived ? parseFloat(o.cashReceived) : undefined,
      changeDue: o.changeDue ? parseFloat(o.changeDue) : undefined,
      cashierName: o.cashierName,
      notes: o.notes || '',
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString(),
      paidAt: o.paidAt ? o.paidAt.toISOString() : undefined,
    };

    try {
      getIO().emit('orderUpdated', mapped);
    } catch (e) {}

    return mapped;
  });

  fastify.delete('/orders/:id', async (request) => {
    const { id } = request.params as { id: string };
    await db.delete(orders).where(eq(orders.id, id));

    try {
      getIO().emit('orderDeleted', { id });
    } catch (e) {}

    return { success: true };
  });

  // ---- WALK-IN SESSIONS ----
  fastify.get('/walk-ins', async () => {
    const raw = await db.select().from(walkinSessions).orderBy(desc(walkinSessions.createdAt));
    return raw.map(w => ({
      id: w.id,
      guestName: w.guestName || 'Walk-In Guest',
      numberOfGuests: w.numberOfGuests || 1,
      location: w.location || 'Table 01',
      status: (w.status || 'ACTIVE') as 'ACTIVE' | 'CHECKED_OUT',
      posBalance: parseFloat(w.posBalance || '0'),
      invoiceId: w.invoiceId || undefined,
      notes: w.notes || undefined,
      createdAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString(),
      checkedOutAt: w.checkedOutAt ? w.checkedOutAt.toISOString() : undefined,
    }));
  });

  fastify.post('/walk-ins', async (request) => {
    const data = request.body as any;
    const now = Date.now();
    const id = data.id || `WI-${now}`;

    const insertPayload = {
      id,
      guestName: data.guestName || 'Walk-In Guest',
      numberOfGuests: data.numberOfGuests || 1,
      location: data.location || 'Table 01 (Main Dining)',
      status: 'ACTIVE',
      posBalance: (data.posBalance || 0).toString(),
      notes: data.notes || null,
      createdAt: new Date(),
    };

    const result = await db.insert(walkinSessions).values(insertPayload).returning();
    const w = result[0];

    const mapped = {
      id: w.id,
      guestName: w.guestName,
      numberOfGuests: w.numberOfGuests,
      location: w.location,
      status: w.status as 'ACTIVE' | 'CHECKED_OUT',
      posBalance: parseFloat(w.posBalance || '0'),
      notes: w.notes || undefined,
      createdAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString(),
    };

    try {
      getIO().emit('walkInCreated', mapped);
    } catch (e) {}

    return mapped;
  });

  fastify.put('/walk-ins/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const updatePayload: any = {};
    if (data.guestName !== undefined) updatePayload.guestName = data.guestName;
    if (data.numberOfGuests !== undefined) updatePayload.numberOfGuests = data.numberOfGuests;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.posBalance !== undefined) updatePayload.posBalance = data.posBalance.toString();
    if (data.checkedOutAt !== undefined) updatePayload.checkedOutAt = new Date(data.checkedOutAt);

    const result = await db.update(walkinSessions).set(updatePayload).where(eq(walkinSessions.id, id)).returning();
    const w = result[0];

    const mapped = {
      id: w.id,
      guestName: w.guestName,
      numberOfGuests: w.numberOfGuests,
      location: w.location,
      status: w.status as 'ACTIVE' | 'CHECKED_OUT',
      posBalance: parseFloat(w.posBalance || '0'),
      notes: w.notes || undefined,
      createdAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString(),
      checkedOutAt: w.checkedOutAt ? w.checkedOutAt.toISOString() : undefined,
    };

    try {
      getIO().emit('walkInUpdated', mapped);
    } catch (e) {}

    return mapped;
  });

  fastify.post('/walk-ins/:id/checkout', async (request) => {
    const { id } = request.params as { id: string };
    const result = await db.update(walkinSessions).set({
      status: 'CHECKED_OUT',
      checkedOutAt: new Date()
    }).where(eq(walkinSessions.id, id)).returning();
    const w = result[0];

    const mapped = {
      id: w.id,
      guestName: w.guestName,
      numberOfGuests: w.numberOfGuests,
      location: w.location,
      status: w.status as 'ACTIVE' | 'CHECKED_OUT',
      posBalance: parseFloat(w.posBalance || '0'),
      notes: w.notes || undefined,
      createdAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString(),
      checkedOutAt: w.checkedOutAt ? w.checkedOutAt.toISOString() : undefined,
    };

    try {
      getIO().emit('walkInUpdated', mapped);
    } catch (e) {}

    return mapped;
  });
};
