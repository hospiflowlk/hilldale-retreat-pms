import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { rooms, reservations, guestFolios } from '../../db/schema';
import { eq, or } from 'drizzle-orm';
import { getIO } from '../../lib/socket';

export const roomsRoutes: FastifyPluginAsync = async (fastify) => {
  // ---- ROOMS ----
  fastify.get('/', async () => {
    const raw = await db.select().from(rooms);
    return raw.map(r => ({
      id: r.id,
      number: r.number,
      name: r.name || `Room ${r.number}`,
      floor: r.floor || 'Ground Floor',
      basePriceUSD: parseFloat(r.basePriceUSD || '0'),
      capacity: r.capacity || { adults: 2, children: 1, maxGuests: 3 },
      bedType: r.bedType || 'King Bed',
      amenities: (r.amenities as string[]) || [],
      housekeepingStatus: r.housekeepingStatus || 'clean',
      isAvailableForOnlineBooking: r.isAvailableForOnlineBooking !== false,
      notes: r.notes || '',
    }));
  });

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.floor !== undefined) updatePayload.floor = data.floor;
    if (data.basePriceUSD !== undefined) updatePayload.basePriceUSD = data.basePriceUSD.toString();
    if (data.capacity !== undefined) updatePayload.capacity = data.capacity;
    if (data.bedType !== undefined) updatePayload.bedType = data.bedType;
    if (data.amenities !== undefined) updatePayload.amenities = data.amenities;
    if (data.housekeepingStatus !== undefined) updatePayload.housekeepingStatus = data.housekeepingStatus;
    if (data.isAvailableForOnlineBooking !== undefined) updatePayload.isAvailableForOnlineBooking = data.isAvailableForOnlineBooking;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const result = await db.update(rooms).set(updatePayload).where(or(eq(rooms.id, id), eq(rooms.number, id))).returning();
    const r = result[0];
    const updated = {
      id: r.id,
      number: r.number,
      name: r.name || `Room ${r.number}`,
      floor: r.floor || 'Ground Floor',
      basePriceUSD: parseFloat(r.basePriceUSD || '0'),
      capacity: r.capacity || { adults: 2, children: 1, maxGuests: 3 },
      bedType: r.bedType || 'King Bed',
      amenities: (r.amenities as string[]) || [],
      housekeepingStatus: r.housekeepingStatus || 'clean',
      isAvailableForOnlineBooking: r.isAvailableForOnlineBooking !== false,
      notes: r.notes || '',
    };

    try {
      getIO().emit('roomStatusChanged', { roomId: r.id, housekeepingStatus: r.housekeepingStatus });
    } catch (e) {}

    return updated;
  });

  fastify.put('/:id/housekeeping', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const result = await db.update(rooms).set({ housekeepingStatus: status }).where(or(eq(rooms.id, id), eq(rooms.number, id))).returning();
    const r = result[0];

    try {
      getIO().emit('roomStatusChanged', { roomId: r.id, housekeepingStatus: status });
    } catch (e) {}

    return {
      id: r.id,
      number: r.number,
      housekeepingStatus: r.housekeepingStatus
    };
  });

  // ---- RESERVATIONS ----
  fastify.get('/reservations', async () => {
    const raw = await db.select().from(reservations);
    return raw.map(res => ({
      id: res.id.toString(),
      bookingReference: res.bookingReference || `HR-BK-2026-${res.id.toString().padStart(3, '0')}`,
      channel: res.channel || 'direct_website',
      channelReservationId: res.channelReservationId || '',
      roomNumber: res.roomNumber,
      guestName: res.guestName,
      guestEmail: res.guestEmail || '',
      guestPhone: res.guestPhone || '',
      guestCountry: res.guestCountry || 'Sri Lanka',
      passportOrId: res.passportOrId || '',
      adultsCount: res.adultsCount || 1,
      childrenCount: res.childrenCount || 0,
      childrenAges: (res.childrenAges as number[]) || [],
      checkInDate: res.checkInDate ? (res.checkInDate instanceof Date ? res.checkInDate.toISOString().split('T')[0] : String(res.checkInDate).split('T')[0]) : '',
      checkOutDate: res.checkOutDate ? (res.checkOutDate instanceof Date ? res.checkOutDate.toISOString().split('T')[0] : String(res.checkOutDate).split('T')[0]) : '',
      checkInTime: res.checkInTime || '',
      checkOutTime: res.checkOutTime || '',
      status: res.status || 'confirmed',
      mealPlan: res.mealPlan || 'room_only',
      ratePerNightUSD: parseFloat(res.ratePerNightUSD || '0'),
      nights: res.nights || 1,
      roomTotalUSD: parseFloat(res.roomTotalUSD || '0'),
      serviceChargeUSD: parseFloat(res.serviceChargeUSD || '0'),
      taxAmountUSD: parseFloat(res.taxAmountUSD || '0'),
      folioCharges: (res.folioCharges as any[]) || [],
      payments: (res.payments as any[]) || [],
      paymentStatus: res.paymentStatus || 'pending',
      specialRequests: res.specialRequests || '',
      createdAt: res.createdAt ? res.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: res.updatedAt ? res.updatedAt.toISOString() : new Date().toISOString(),
    }));
  });

  fastify.post('/reservations', async (request, reply) => {
    const data = request.body as any;
    
    // Auto-generate reference if not supplied
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const bookingRef = data.bookingReference || `HR-BK-2026-${randomSuffix}`;

    const insertPayload: any = {
      bookingReference: bookingRef,
      channel: data.channel || 'direct_website',
      channelReservationId: data.channelReservationId || null,
      guestName: data.guestName || 'Guest',
      guestEmail: data.guestEmail || null,
      guestPhone: data.guestPhone || null,
      guestCountry: data.guestCountry || 'Sri Lanka',
      passportOrId: data.passportOrId || null,
      roomId: data.roomId || `room-${data.roomNumber}`,
      roomNumber: data.roomNumber || '101',
      adultsCount: data.adultsCount || 1,
      childrenCount: data.childrenCount || 0,
      childrenAges: data.childrenAges || [],
      checkInDate: new Date(data.checkInDate || Date.now()),
      checkOutDate: new Date(data.checkOutDate || Date.now() + 86400000),
      checkInTime: data.checkInTime || null,
      checkOutTime: data.checkOutTime || null,
      status: data.status || 'confirmed',
      mealPlan: data.mealPlan || 'room_only',
      ratePerNightUSD: (data.ratePerNightUSD ?? 0).toString(),
      nights: data.nights || 1,
      roomTotalUSD: (data.roomTotalUSD ?? 0).toString(),
      serviceChargeUSD: (data.serviceChargeUSD ?? 0).toString(),
      taxAmountUSD: (data.taxAmountUSD ?? 0).toString(),
      folioCharges: data.folioCharges || [],
      payments: data.payments || [],
      paymentStatus: data.paymentStatus || 'pending',
      specialRequests: data.specialRequests || null,
    };

    const result = await db.insert(reservations).values(insertPayload).returning();
    const res = result[0];

    // Create guest folio entry
    await db.insert(guestFolios).values({
      reservationId: res.id,
      runningBalance: '0'
    });

    const mapped = {
      id: res.id.toString(),
      bookingReference: res.bookingReference,
      channel: res.channel,
      channelReservationId: res.channelReservationId || '',
      roomNumber: res.roomNumber,
      guestName: res.guestName,
      guestEmail: res.guestEmail || '',
      guestPhone: res.guestPhone || '',
      guestCountry: res.guestCountry || '',
      passportOrId: res.passportOrId || '',
      adultsCount: res.adultsCount || 1,
      childrenCount: res.childrenCount || 0,
      childrenAges: (res.childrenAges as number[]) || [],
      checkInDate: res.checkInDate.toISOString().split('T')[0],
      checkOutDate: res.checkOutDate.toISOString().split('T')[0],
      checkInTime: res.checkInTime || '',
      checkOutTime: res.checkOutTime || '',
      status: res.status,
      mealPlan: res.mealPlan || 'room_only',
      ratePerNightUSD: parseFloat(res.ratePerNightUSD || '0'),
      nights: res.nights || 1,
      roomTotalUSD: parseFloat(res.roomTotalUSD || '0'),
      serviceChargeUSD: parseFloat(res.serviceChargeUSD || '0'),
      taxAmountUSD: parseFloat(res.taxAmountUSD || '0'),
      folioCharges: (res.folioCharges as any[]) || [],
      payments: (res.payments as any[]) || [],
      paymentStatus: res.paymentStatus || 'pending',
      specialRequests: res.specialRequests || '',
      createdAt: res.createdAt ? res.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: res.updatedAt ? res.updatedAt.toISOString() : new Date().toISOString(),
    };

    try {
      getIO().emit('bookingCreated', mapped);
      if (res.status === 'checked_in') {
        getIO().emit('roomStatusChanged', { roomId: res.roomId, status: 'occupied' });
      }
    } catch (e) {}

    return mapped;
  });

  fastify.put('/reservations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    const data = request.body as any;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (data.channel !== undefined) updatePayload.channel = data.channel;
    if (data.guestName !== undefined) updatePayload.guestName = data.guestName;
    if (data.guestEmail !== undefined) updatePayload.guestEmail = data.guestEmail;
    if (data.guestPhone !== undefined) updatePayload.guestPhone = data.guestPhone;
    if (data.guestCountry !== undefined) updatePayload.guestCountry = data.guestCountry;
    if (data.passportOrId !== undefined) updatePayload.passportOrId = data.passportOrId;
    if (data.roomNumber !== undefined) {
      updatePayload.roomNumber = data.roomNumber;
      updatePayload.roomId = `room-${data.roomNumber}`;
    }
    if (data.adultsCount !== undefined) updatePayload.adultsCount = data.adultsCount;
    if (data.childrenCount !== undefined) updatePayload.childrenCount = data.childrenCount;
    if (data.checkInDate !== undefined) updatePayload.checkInDate = new Date(data.checkInDate);
    if (data.checkOutDate !== undefined) updatePayload.checkOutDate = new Date(data.checkOutDate);
    if (data.checkInTime !== undefined) updatePayload.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updatePayload.checkOutTime = data.checkOutTime;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.mealPlan !== undefined) updatePayload.mealPlan = data.mealPlan;
    if (data.ratePerNightUSD !== undefined) updatePayload.ratePerNightUSD = data.ratePerNightUSD.toString();
    if (data.nights !== undefined) updatePayload.nights = data.nights;
    if (data.roomTotalUSD !== undefined) updatePayload.roomTotalUSD = data.roomTotalUSD.toString();
    if (data.serviceChargeUSD !== undefined) updatePayload.serviceChargeUSD = data.serviceChargeUSD.toString();
    if (data.taxAmountUSD !== undefined) updatePayload.taxAmountUSD = data.taxAmountUSD.toString();
    if (data.folioCharges !== undefined) updatePayload.folioCharges = data.folioCharges;
    if (data.payments !== undefined) updatePayload.payments = data.payments;
    if (data.paymentStatus !== undefined) updatePayload.paymentStatus = data.paymentStatus;
    if (data.specialRequests !== undefined) updatePayload.specialRequests = data.specialRequests;

    const result = await db.update(reservations).set(updatePayload).where(eq(reservations.id, numId)).returning();
    const res = result[0];

    const mapped = {
      id: res.id.toString(),
      bookingReference: res.bookingReference,
      channel: res.channel,
      channelReservationId: res.channelReservationId || '',
      roomNumber: res.roomNumber,
      guestName: res.guestName,
      guestEmail: res.guestEmail || '',
      guestPhone: res.guestPhone || '',
      guestCountry: res.guestCountry || '',
      passportOrId: res.passportOrId || '',
      adultsCount: res.adultsCount || 1,
      childrenCount: res.childrenCount || 0,
      childrenAges: (res.childrenAges as number[]) || [],
      checkInDate: res.checkInDate ? (res.checkInDate instanceof Date ? res.checkInDate.toISOString().split('T')[0] : String(res.checkInDate).split('T')[0]) : '',
      checkOutDate: res.checkOutDate ? (res.checkOutDate instanceof Date ? res.checkOutDate.toISOString().split('T')[0] : String(res.checkOutDate).split('T')[0]) : '',
      checkInTime: res.checkInTime || '',
      checkOutTime: res.checkOutTime || '',
      status: res.status,
      mealPlan: res.mealPlan || 'room_only',
      ratePerNightUSD: parseFloat(res.ratePerNightUSD || '0'),
      nights: res.nights || 1,
      roomTotalUSD: parseFloat(res.roomTotalUSD || '0'),
      serviceChargeUSD: parseFloat(res.serviceChargeUSD || '0'),
      taxAmountUSD: parseFloat(res.taxAmountUSD || '0'),
      folioCharges: (res.folioCharges as any[]) || [],
      payments: (res.payments as any[]) || [],
      paymentStatus: res.paymentStatus || 'pending',
      specialRequests: res.specialRequests || '',
      createdAt: res.createdAt ? res.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: res.updatedAt ? res.updatedAt.toISOString() : new Date().toISOString(),
    };

    try {
      getIO().emit('bookingUpdated', mapped);
      if (res.status === 'checked_out') {
        // Set room to dirty when checked out
        await db.update(rooms).set({ housekeepingStatus: 'dirty' }).where(eq(rooms.number, res.roomNumber));
        getIO().emit('roomStatusChanged', { roomId: `room-${res.roomNumber}`, housekeepingStatus: 'dirty' });
      }
    } catch (e) {}

    return mapped;
  });

  fastify.delete('/reservations/:id', async (request) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    await db.delete(guestFolios).where(eq(guestFolios.reservationId, numId));
    await db.delete(reservations).where(eq(reservations.id, numId));

    try {
      getIO().emit('bookingDeleted', { id });
    } catch (e) {}

    return { success: true };
  });

  // ---- FOLIO CHARGES ----
  fastify.post('/reservations/:id/folio', async (request) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    const charge = request.body as any; // FolioExtraItem

    const existing = await db.select().from(reservations).where(eq(reservations.id, numId));
    if (existing.length === 0) throw new Error('Reservation not found');

    const currentCharges = (existing[0].folioCharges as any[]) || [];
    const newCharge = {
      id: charge.id || `folio-${Date.now()}`,
      date: charge.date || new Date().toISOString().split('T')[0],
      category: charge.category || 'other',
      description: charge.description || 'Folio Charge',
      amountUSD: parseFloat(charge.amountUSD || '0'),
      quantity: charge.quantity || 1,
      orderId: charge.orderId || undefined,
      notes: charge.notes || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedCharges = [...currentCharges, newCharge];
    await db.update(reservations).set({ folioCharges: updatedCharges, updatedAt: new Date() }).where(eq(reservations.id, numId));

    try {
      getIO().emit('bookingUpdated', { id, folioCharges: updatedCharges });
    } catch (e) {}

    return newCharge;
  });

  fastify.delete('/reservations/:id/folio/:folioId', async (request) => {
    const { id, folioId } = request.params as { id: string; folioId: string };
    const numId = parseInt(id);

    const existing = await db.select().from(reservations).where(eq(reservations.id, numId));
    if (existing.length === 0) throw new Error('Reservation not found');

    const currentCharges = (existing[0].folioCharges as any[]) || [];
    const updatedCharges = currentCharges.filter((c: any) => c.id !== folioId);

    await db.update(reservations).set({ folioCharges: updatedCharges, updatedAt: new Date() }).where(eq(reservations.id, numId));

    try {
      getIO().emit('bookingUpdated', { id, folioCharges: updatedCharges });
    } catch (e) {}

    return { success: true };
  });

  // ---- PAYMENTS ----
  fastify.post('/reservations/:id/payments', async (request) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    const payment = request.body as any; // BookingPayment

    const existing = await db.select().from(reservations).where(eq(reservations.id, numId));
    if (existing.length === 0) throw new Error('Reservation not found');

    const currentPayments = (existing[0].payments as any[]) || [];
    const newPayment = {
      id: payment.id || `pmt-${Date.now()}`,
      amountUSD: parseFloat(payment.amountUSD || '0'),
      paymentMethod: payment.paymentMethod || 'CASH',
      accountId: payment.accountId || undefined,
      accountName: payment.accountName || undefined,
      date: payment.date || new Date().toISOString().split('T')[0],
      reference: payment.reference || undefined,
      notes: payment.notes || undefined,
    };

    const updatedPayments = [...currentPayments, newPayment];
    
    // Calculate total payments vs total bill to set paymentStatus
    const res = existing[0];
    const roomTotal = parseFloat(res.roomTotalUSD || '0');
    const serviceCharge = parseFloat(res.serviceChargeUSD || '0');
    const tax = parseFloat(res.taxAmountUSD || '0');
    const folioSum = ((res.folioCharges as any[]) || []).reduce((sum: number, c: any) => sum + (c.amountUSD * (c.quantity || 1)), 0);
    const grandTotal = roomTotal + serviceCharge + tax + folioSum;
    const paidSum = updatedPayments.reduce((sum: number, p: any) => sum + p.amountUSD, 0);

    const paymentStatus = paidSum >= grandTotal ? 'paid_in_full' : paidSum > 0 ? 'partially_paid' : 'pending';

    await db.update(reservations).set({ 
      payments: updatedPayments, 
      paymentStatus, 
      updatedAt: new Date() 
    }).where(eq(reservations.id, numId));

    try {
      getIO().emit('bookingUpdated', { id, payments: updatedPayments, paymentStatus });
    } catch (e) {}

    return newPayment;
  });
};
