import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { posCarts, posCartItems } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const cartsModule: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const carts = await db.select().from(posCarts).where(eq(posCarts.status, 'active'));
    return carts;
  });

  fastify.get('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const cart = await db.select().from(posCarts).where(eq(posCarts.id, id));
    if (!cart.length) return reply.status(404).send({ error: 'Cart not found' });
    
    const items = await db.select().from(posCartItems).where(eq(posCartItems.cartId, id));
    
    return {
      ...cart[0],
      items
    };
  });

  fastify.post('/', async (request: any, reply) => {
    const { userId, name, discountPercent, notes, status } = request.body;
    const id = 'cart-' + Date.now();
    const newCart = await db.insert(posCarts).values({
      id,
      userId: userId || 'anonymous',
      name,
      discountPercent: discountPercent || '0',
      notes,
      status: status || 'active'
    }).returning();
    
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return newCart[0];
  });

  fastify.put('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const { name, discountPercent, status, notes } = request.body;
    
    const updated = await db.update(posCarts)
      .set({ name, discountPercent, status, notes, updatedAt: new Date() })
      .where(eq(posCarts.id, id))
      .returning();
      
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return updated[0];
  });

  fastify.post('/:id/items', async (request: any, reply) => {
    const { id } = request.params;
    const { menuItemId, name, price, quantity, selectedSides, notes, isVegetarian } = request.body;
    
    const itemId = 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const newItem = await db.insert(posCartItems).values({
      id: itemId,
      cartId: id,
      menuItemId,
      name,
      price: price ? price.toString() : '0',
      quantity: quantity || 1,
      selectedSides: selectedSides || null,
      notes,
      isVegetarian: isVegetarian || false
    }).returning();
    
    await db.update(posCarts).set({ updatedAt: new Date() }).where(eq(posCarts.id, id));
    
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return newItem[0];
  });

  fastify.put('/:id/items/:itemId', async (request: any, reply) => {
    const { id, itemId } = request.params;
    const { quantity, notes } = request.body;
    
    const updated = await db.update(posCartItems)
      .set({ quantity, notes })
      .where(eq(posCartItems.id, itemId))
      .returning();
      
    await db.update(posCarts).set({ updatedAt: new Date() }).where(eq(posCarts.id, id));
    
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return updated[0];
  });

  fastify.delete('/:id/items/:itemId', async (request: any, reply) => {
    const { id, itemId } = request.params;
    
    await db.delete(posCartItems).where(eq(posCartItems.id, itemId));
    await db.update(posCarts).set({ updatedAt: new Date() }).where(eq(posCarts.id, id));
    
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return { success: true };
  });

  fastify.delete('/:id', async (request: any, reply) => {
    const { id } = request.params;
    
    await db.delete(posCartItems).where(eq(posCartItems.cartId, id));
    await db.delete(posCarts).where(eq(posCarts.id, id));
    
    (fastify as any).io?.emit('cartUpdated', { cartId: id });
    return { success: true };
  });
};

export default cartsModule;
