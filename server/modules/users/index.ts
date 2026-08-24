import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../../db';
import { staff, staffModuleAccess } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const usersModule: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET / - list all users
  fastify.get('/', async (request, reply) => {
    try {
      const users = await db.select().from(staff);
      
      // Fetch access for all users
      const allAccess = await db.select().from(staffModuleAccess);
      
      const mappedUsers = users.map(user => {
        const userAccess = allAccess.filter(a => a.staffId === user.id);
        return {
          id: `usr-${user.id}`, // To match frontend string IDs
          username: user.username,
          name: user.name,
          email: user.email || '',
          phone: user.phone || '',
          role: user.role.toLowerCase(),
          department: user.department || '',
          designation: user.designation || '',
          avatarColor: user.avatar_color || '#cccccc',
          allowedModules: userAccess.map(a => a.module),
          canManageUsers: user.can_manage_users,
          canExportReports: user.can_export_reports,
          canDeleteRecords: user.can_delete_records,
          notes: user.notes || '',
          isActive: user.is_active,
          lastLogin: user.last_login ? user.last_login.toISOString() : undefined,
          createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(), // Mocking updatedAt
        };
      });

      return mappedUsers;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Additional CRUD operations can be added here
};

export default usersModule;
