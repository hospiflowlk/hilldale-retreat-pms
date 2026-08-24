import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_SETTINGS } from '../../../src/data/menuData';

const settingsModule: FastifyPluginAsync = async (fastify) => {
  
  // Format numeric values
  const formatSettings = (settings: any) => ({
    ...settings,
    usdToLkrRate: Number(settings.usdToLkrRate),
    defaultServiceChargeRate: Number(settings.defaultServiceChargeRate),
    taxRate: Number(settings.taxRate),
    pmsTaxRate: Number(settings.pmsTaxRate),
    pmsServiceChargeRate: Number(settings.pmsServiceChargeRate),
  });

  fastify.get('/', async (request, reply) => {
    try {
      const result = await db.select().from(systemSettings).where(eq(systemSettings.id, 'default'));
      
      if (result.length > 0) {
        return reply.send(formatSettings(result[0]));
      }

      // If doesn't exist, insert defaults
      const inserted = await db.insert(systemSettings).values({
        id: 'default',
        retreatName: DEFAULT_SETTINGS.retreatName,
        retreatTagline: DEFAULT_SETTINGS.retreatTagline,
        address: DEFAULT_SETTINGS.address,
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        website: DEFAULT_SETTINGS.website,
        currency: DEFAULT_SETTINGS.currency,
        usdToLkrRate: DEFAULT_SETTINGS.usdToLkrRate.toString(),
        defaultServiceChargeRate: DEFAULT_SETTINGS.defaultServiceChargeRate.toString(),
        taxRate: DEFAULT_SETTINGS.taxRate.toString(),
        pmsTaxRate: '0.00',
        pmsServiceChargeRate: '0.10',
      }).returning();
      
      return reply.send(formatSettings(inserted[0]));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.put('/', async (request, reply) => {
    try {
      const updates = request.body as any;
      const updated = await db.update(systemSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.id, 'default'))
        .returning();

      if (updated.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }

      const formattedSettings = formatSettings(updated[0]);
      (fastify as any).io.emit('settingsUpdated', formattedSettings);

      return reply.send(formattedSettings);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
};

export default settingsModule;
