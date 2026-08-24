import { db } from './index';
import { staff, systemSettings, staffModuleAccess } from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 2. Insert admin user
    console.log('Inserting admin staff user...');
    const adminUser = await db.insert(staff).values({
      name: 'System Admin',
      username: 'admin',
      role: 'ADMIN',
      department: 'Management',
      pinHash: '1234', // For demo purposes, exact match in our auth route
      status: 'ACTIVE'
    }).returning();

    if (adminUser.length > 0) {
      const adminId = adminUser[0].id;

      // 3. Give admin full access
      console.log('Granting admin module access...');
      const modules = ['rooms', 'pos', 'walkins', 'invoices', 'accounts', 'expenses', 'reports', 'masters', 'menu', 'staff'];
      
      for (const mod of modules) {
        await db.insert(staffModuleAccess).values({
          staffId: adminId,
          module: mod,
          permissionLevel: 'ADMIN'
        });
      }
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
