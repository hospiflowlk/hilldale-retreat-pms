import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { items, itemBom, categories, customers, suppliers, businessSources } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const mastersRoutes: FastifyPluginAsync = async (fastify) => {
  // ---- ITEMS ----
  fastify.get('/items', async () => {
    const rawItems = await db.select().from(items);
    const rawCategories = await db.select().from(categories);
    const rawBoms = await db.select().from(itemBom);
    const catMap = new Map(rawCategories.map(c => [c.id, c.name]));
    const itemMap = new Map(rawItems.map(i => [i.id, i.name]));

    const bomMap = new Map<number, any[]>();
    for (const b of rawBoms) {
      if (!bomMap.has(b.recipeItemId)) {
        bomMap.set(b.recipeItemId, []);
      }
      bomMap.get(b.recipeItemId)!.push({
        ingredientItemId: b.ingredientItemId.toString(),
        ingredientName: itemMap.get(b.ingredientItemId) || 'Unknown Ingredient',
        quantity: parseFloat(b.quantityPerUnit || '0'),
        unit: b.unit || 'pcs',
      });
    }

    return rawItems.map(item => {
      const itemType = item.type === 'RAW_MATERIAL' ? 'RAW' : (item.type || 'RESALE');
      const itemBomList = bomMap.get(item.id) || [];
      return {
        id: item.id.toString(),
        name: item.name,
        type: itemType,
        categoryId: item.categoryId ? item.categoryId.toString() : '',
        categoryName: item.categoryId ? (catMap.get(item.categoryId) || '') : '',
        unit: item.unit || 'pcs',
        costPriceUSD: parseFloat(item.costPrice || '0'),
        sellingPriceUSD: parseFloat(item.sellingPrice || '0'),
        currentStock: parseFloat(item.stockLevel || '0'),
        reorderThreshold: parseFloat(item.reorderThreshold || '0'),
        isAvailable: true,
        useInInvoices: item.useInInvoices ?? (itemType === 'RESALE' || itemType === 'RECIPE'),
        useInExpenses: item.useInExpenses ?? (itemType === 'RAW' || itemType === 'RESALE' || itemType === 'EXPENSE'),
        barcode: item.barcode || '',
        description: item.description || '',
        bom: itemBomList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  });

  fastify.post('/items', async (request) => {
    const data = request.body as any;
    const itemType = data.type === 'RAW_MATERIAL' ? 'RAW' : (data.type || 'RESALE');
    const insertPayload: any = {
      name: data.name,
      type: itemType,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      unit: data.unit || 'pcs',
      costPrice: (data.costPriceUSD ?? data.costPrice ?? 0).toString(),
      sellingPrice: (data.sellingPriceUSD ?? data.sellingPrice ?? 0).toString(),
      stockLevel: (data.currentStock ?? data.stockLevel ?? 0).toString(),
      reorderThreshold: (data.reorderThreshold ?? 0).toString(),
      useInInvoices: data.useInInvoices !== undefined ? data.useInInvoices : (itemType === 'RESALE' || itemType === 'RECIPE'),
      useInExpenses: data.useInExpenses !== undefined ? data.useInExpenses : (itemType === 'RAW' || itemType === 'RESALE' || itemType === 'EXPENSE'),
      barcode: data.barcode || null,
      description: data.description || null,
    };
    const result = await db.insert(items).values(insertPayload).returning();
    const raw = result[0];

    // Save BOM if provided
    if (Array.isArray(data.bom) && data.bom.length > 0) {
      await db.delete(itemBom).where(eq(itemBom.recipeItemId, raw.id));
      for (const ingredient of data.bom) {
        if (ingredient.ingredientItemId) {
          await db.insert(itemBom).values({
            recipeItemId: raw.id,
            ingredientItemId: parseInt(ingredient.ingredientItemId),
            quantityPerUnit: (ingredient.quantity ?? 1).toString(),
            unit: ingredient.unit || 'pcs',
          });
        }
      }
    }

    return {
      id: raw.id.toString(),
      name: raw.name,
      type: raw.type,
      categoryId: raw.categoryId ? raw.categoryId.toString() : '',
      categoryName: data.categoryName || '',
      unit: raw.unit,
      costPriceUSD: parseFloat(raw.costPrice || '0'),
      sellingPriceUSD: parseFloat(raw.sellingPrice || '0'),
      currentStock: parseFloat(raw.stockLevel || '0'),
      reorderThreshold: parseFloat(raw.reorderThreshold || '0'),
      isAvailable: true,
      useInInvoices: raw.useInInvoices,
      useInExpenses: raw.useInExpenses,
      barcode: raw.barcode || '',
      description: raw.description || '',
      bom: data.bom || [],
    };
  });

  fastify.put('/items/:id', async (request) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.type !== undefined) updatePayload.type = data.type === 'RAW_MATERIAL' ? 'RAW' : data.type;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId ? parseInt(data.categoryId) : null;
    if (data.unit !== undefined) updatePayload.unit = data.unit;
    if (data.costPriceUSD !== undefined) updatePayload.costPrice = data.costPriceUSD.toString();
    if (data.sellingPriceUSD !== undefined) updatePayload.sellingPrice = data.sellingPriceUSD.toString();
    if (data.currentStock !== undefined) updatePayload.stockLevel = data.currentStock.toString();
    if (data.reorderThreshold !== undefined) updatePayload.reorderThreshold = data.reorderThreshold.toString();
    if (data.useInInvoices !== undefined) updatePayload.useInInvoices = data.useInInvoices;
    if (data.useInExpenses !== undefined) updatePayload.useInExpenses = data.useInExpenses;
    if (data.barcode !== undefined) updatePayload.barcode = data.barcode;
    if (data.description !== undefined) updatePayload.description = data.description;

    const result = await db.update(items).set(updatePayload).where(eq(items.id, numId)).returning();
    const raw = result[0];

    // Save/Update BOM if provided
    if (Array.isArray(data.bom)) {
      await db.delete(itemBom).where(eq(itemBom.recipeItemId, numId));
      for (const ingredient of data.bom) {
        if (ingredient.ingredientItemId) {
          await db.insert(itemBom).values({
            recipeItemId: numId,
            ingredientItemId: parseInt(ingredient.ingredientItemId),
            quantityPerUnit: (ingredient.quantity ?? 1).toString(),
            unit: ingredient.unit || 'pcs',
          });
        }
      }
    }

    return {
      id: raw.id.toString(),
      name: raw.name,
      type: raw.type,
      categoryId: raw.categoryId ? raw.categoryId.toString() : '',
      categoryName: data.categoryName || '',
      unit: raw.unit,
      costPriceUSD: parseFloat(raw.costPrice || '0'),
      sellingPriceUSD: parseFloat(raw.sellingPrice || '0'),
      currentStock: parseFloat(raw.stockLevel || '0'),
      reorderThreshold: parseFloat(raw.reorderThreshold || '0'),
      isAvailable: true,
      useInInvoices: raw.useInInvoices,
      useInExpenses: raw.useInExpenses,
      barcode: raw.barcode || '',
      description: raw.description || '',
      bom: data.bom || [],
    };
  });

  fastify.delete('/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    try {
      await db.delete(itemBom).where(eq(itemBom.recipeItemId, numId));
      await db.delete(itemBom).where(eq(itemBom.ingredientItemId, numId));
      await db.delete(items).where(eq(items.id, numId));
      return { success: true };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Cannot delete item.' });
    }
  });

  fastify.delete('/items', async () => {
    await db.delete(itemBom);
    await db.delete(items);
    return { success: true };
  });

  // ---- CATEGORIES ----
  fastify.get('/categories', async () => {
    const raw = await db.select().from(categories);
    return raw.map(c => ({
      id: c.id.toString(),
      name: c.name,
      type: c.type || 'INCOME',
      parentId: c.parentId ? c.parentId.toString() : undefined,
      description: '',
      color: '#5B6547',
      icon: 'Folder',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  fastify.post('/categories', async (request) => {
    const data = request.body as any;
    const insertPayload: any = {
      name: data.name,
      type: data.type || 'INCOME',
      parentId: data.parentId ? parseInt(data.parentId) : null,
    };
    const result = await db.insert(categories).values(insertPayload).returning();
    const c = result[0];
    return {
      id: c.id.toString(),
      name: c.name,
      type: c.type,
      parentId: c.parentId ? c.parentId.toString() : undefined,
      description: data.description || '',
      isActive: true,
    };
  });

  fastify.put('/categories/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.parentId !== undefined) updatePayload.parentId = data.parentId ? parseInt(data.parentId) : null;

    const result = await db.update(categories).set(updatePayload).where(eq(categories.id, parseInt(id))).returning();
    const c = result[0];
    return {
      id: c.id.toString(),
      name: c.name,
      type: c.type,
      parentId: c.parentId ? c.parentId.toString() : undefined,
      isActive: true,
    };
  });

  fastify.delete('/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    try {
      await db.update(items).set({ categoryId: null }).where(eq(items.categoryId, numId));
      await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, numId));
      await db.delete(categories).where(eq(categories.id, numId));
      return { success: true };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Cannot delete category.' });
    }
  });

  // ---- CUSTOMERS ----
  fastify.get('/customers', async () => {
    const raw = await db.select().from(customers);
    return raw.map(c => ({
      id: c.id.toString(),
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      country: c.country || 'Sri Lanka',
      customerType: 'ROOM_GUEST',
      lifetimeSpendUSD: 0,
      totalVisits: 1,
      isActive: true,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  fastify.post('/customers', async (request) => {
    const data = request.body as any;
    const insertPayload: any = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      country: data.country || null,
    };
    const result = await db.insert(customers).values(insertPayload).returning();
    const c = result[0];
    return {
      id: c.id.toString(),
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      country: c.country || '',
      customerType: data.customerType || 'ROOM_GUEST',
      lifetimeSpendUSD: 0,
      totalVisits: 1,
      isActive: true,
    };
  });

  fastify.put('/customers/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.country !== undefined) updatePayload.country = data.country;

    const result = await db.update(customers).set(updatePayload).where(eq(customers.id, parseInt(id))).returning();
    const c = result[0];
    return {
      id: c.id.toString(),
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      country: c.country || '',
      customerType: data.customerType || 'ROOM_GUEST',
      isActive: true,
    };
  });

  fastify.delete('/customers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    try {
      await db.delete(customers).where(eq(customers.id, numId));
      return { success: true };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Cannot delete customer.' });
    }
  });

  // ---- SUPPLIERS ----
  fastify.get('/suppliers', async () => {
    const raw = await db.select().from(suppliers);
    return raw.map(s => ({
      id: s.id.toString(),
      name: s.name,
      companyName: s.name,
      contactPerson: s.contactInfo || '',
      phone: '',
      email: '',
      address: '',
      categories: ['Groceries & Provisions'],
      leadTimeDays: 1,
      openingBalanceUSD: 0,
      currentBalanceOwedUSD: 0,
      currentBalanceUSD: 0,
      isActive: true,
      createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  fastify.post('/suppliers', async (request) => {
    const data = request.body as any;
    const insertPayload: any = {
      name: data.companyName || data.name,
      contactInfo: data.contactPerson || data.phone || data.email || null,
    };
    const result = await db.insert(suppliers).values(insertPayload).returning();
    const s = result[0];
    return {
      id: s.id.toString(),
      name: s.name,
      companyName: s.name,
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      categories: data.categories || [],
      leadTimeDays: data.leadTimeDays || 1,
      openingBalanceUSD: data.openingBalanceUSD || 0,
      currentBalanceOwedUSD: 0,
      currentBalanceUSD: 0,
      isActive: true,
    };
  });

  fastify.put('/suppliers/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.companyName !== undefined || data.name !== undefined) {
      updatePayload.name = data.companyName || data.name;
    }
    if (data.contactPerson !== undefined || data.phone !== undefined || data.email !== undefined) {
      updatePayload.contactInfo = data.contactPerson || data.phone || data.email;
    }

    const result = await db.update(suppliers).set(updatePayload).where(eq(suppliers.id, parseInt(id))).returning();
    const s = result[0];
    return {
      id: s.id.toString(),
      name: s.name,
      companyName: s.name,
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      categories: data.categories || [],
      leadTimeDays: data.leadTimeDays || 1,
      openingBalanceUSD: data.openingBalanceUSD || 0,
      currentBalanceOwedUSD: 0,
      currentBalanceUSD: 0,
      isActive: true,
    };
  });

  fastify.delete('/suppliers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    try {
      await db.delete(suppliers).where(eq(suppliers.id, numId));
      return { success: true };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Cannot delete supplier.' });
    }
  });

  // ---- BUSINESS SOURCES ----
  fastify.get('/business-sources', async () => {
    const raw = await db.select().from(businessSources);
    return raw.map(src => ({
      id: src.id.toString(),
      name: src.name,
      type: 'OTA',
      commissionPercent: parseFloat(src.commissionPercent || '0'),
      totalBookingsGenerated: 0,
      totalRevenueGeneratedUSD: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  fastify.post('/business-sources', async (request) => {
    const data = request.body as any;
    const insertPayload: any = {
      name: data.name,
      commissionPercent: (data.commissionPercent ?? 0).toString(),
    };
    const result = await db.insert(businessSources).values(insertPayload).returning();
    const src = result[0];
    return {
      id: src.id.toString(),
      name: src.name,
      type: data.type || 'OTA',
      commissionPercent: parseFloat(src.commissionPercent || '0'),
      totalBookingsGenerated: 0,
      totalRevenueGeneratedUSD: 0,
      isActive: true,
    };
  });

  fastify.put('/business-sources/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.commissionPercent !== undefined) updatePayload.commissionPercent = data.commissionPercent.toString();

    const result = await db.update(businessSources).set(updatePayload).where(eq(businessSources.id, parseInt(id))).returning();
    const src = result[0];
    return {
      id: src.id.toString(),
      name: src.name,
      type: data.type || 'OTA',
      commissionPercent: parseFloat(src.commissionPercent || '0'),
      totalBookingsGenerated: 0,
      totalRevenueGeneratedUSD: 0,
      isActive: true,
    };
  });

  fastify.delete('/business-sources/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id);
    try {
      await db.delete(businessSources).where(eq(businessSources.id, numId));
      return { success: true };
    } catch (err: any) {
      reply.status(400).send({ error: err.message || 'Cannot delete business source.' });
    }
  });
};
