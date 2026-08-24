import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { menuItems } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const menuModule: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET / - list all menu items
  fastify.get('/', async (request, reply) => {
    try {
      const items = await db.select().from(menuItems);
      return items.map(item => ({ ...item, price: Number(item.price) || 0 }));
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch menu items' });
    }
  });

  // PUT /:id/availability - toggle availability
  fastify.put<{ Params: { id: string }, Body: { isAvailable: boolean } }>('/:id/availability', async (request, reply) => {
    try {
      const { id } = request.params;
      const { isAvailable } = request.body;

      const [updatedItem] = await db.update(menuItems)
        .set({ isAvailable })
        .where(eq(menuItems.id, id))
        .returning();

      if (!updatedItem) {
        return reply.status(404).send({ error: 'Menu item not found' });
      }

      (fastify as any).io?.emit('menu-updated', { type: 'availability', item: updatedItem });
      return updatedItem;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to update availability' });
    }
  });

  // PUT /:id/price - update price
  fastify.put<{ Params: { id: string }, Body: { price: number } }>('/:id/price', async (request, reply) => {
    try {
      const { id } = request.params;
      const { price } = request.body;

      const [updatedItem] = await db.update(menuItems)
        .set({ price: price.toString() })
        .where(eq(menuItems.id, id))
        .returning();

      if (!updatedItem) {
        return reply.status(404).send({ error: 'Menu item not found' });
      }

      (fastify as any).io?.emit('menu-updated', { type: 'price', item: updatedItem });
      return updatedItem;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to update price' });
    }
  });

  // POST / - create menu item
  fastify.post<{ Body: any }>('/', async (request, reply) => {
    try {
      const data = request.body as any;
      const id = 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      const [newItem] = await db.insert(menuItems).values({
        id,
        name: data.name,
        category: data.category,
        price: data.price.toString(),
        description: data.description,
        isVegetarian: data.isVegetarian || false,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        portionInfo: data.portionInfo,
        sides: JSON.stringify(data.sides || []),
      }).returning();

      (fastify as any).io?.emit('menu-updated', { type: 'created', item: newItem });
      return newItem;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to create menu item' });
    }
  });

  // DELETE /:id - delete menu item
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const [deletedItem] = await db.delete(menuItems)
        .where(eq(menuItems.id, id))
        .returning();

      if (!deletedItem) {
        return reply.status(404).send({ error: 'Menu item not found' });
      }

      (fastify as any).io?.emit('menu-updated', { type: 'deleted', id });
      return { success: true, id };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete menu item' });
    }
  });
};

export default menuModule;
