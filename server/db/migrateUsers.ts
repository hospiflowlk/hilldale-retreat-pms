import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hilldale_pms');

async function main() {
  console.log('Expanding staff table with UserProfile fields...');
  
  // Add new columns to staff table
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS email varchar(255)`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone varchar(100)`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS designation varchar(255)`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_color varchar(50)`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_manage_users boolean DEFAULT false`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_export_reports boolean DEFAULT false`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_delete_records boolean DEFAULT false`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS notes text`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`;
  await sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_login timestamp`;

  console.log('Staff table expanded.');

  // Seed default users if none exist
  const existing = await sql`SELECT COUNT(*) as count FROM staff`;
  if (Number(existing[0].count) === 0) {
    console.log('Seeding default staff profiles...');
    
    // Admin user
    await sql`INSERT INTO staff (name, username, role, department, pin_hash, status, email, designation, avatar_color, can_manage_users, can_export_reports, can_delete_records, is_active)
              VALUES ('Heshan Karunaratne', 'admin', 'ADMIN', 'Management', '1234', 'ACTIVE', 'admin@hilldaleretreat.lk', 'General Manager', '#5C6B4F', true, true, true, true)`;
    
    // Manager
    await sql`INSERT INTO staff (name, username, role, department, pin_hash, status, email, designation, avatar_color, can_manage_users, can_export_reports, can_delete_records, is_active)
              VALUES ('Kumara Dissanayake', 'manager', 'MANAGER', 'Front Office', '2345', 'ACTIVE', 'kumara@hilldaleretreat.lk', 'Front Desk Manager', '#8B7355', true, true, false, true)`;
    
    // Chef
    await sql`INSERT INTO staff (name, username, role, department, pin_hash, status, email, designation, avatar_color, is_active)
              VALUES ('Anura Perera', 'chef', 'FRONTLINE', 'Kitchen', '3456', 'ACTIVE', 'anura@hilldaleretreat.lk', 'Executive Chef', '#A0522D', true)`;
    
    // Waiter
    await sql`INSERT INTO staff (name, username, role, department, pin_hash, status, email, designation, avatar_color, is_active)
              VALUES ('Dilshan Fernando', 'waiter', 'FRONTLINE', 'Restaurant', '4567', 'ACTIVE', 'dilshan@hilldaleretreat.lk', 'Senior Waiter', '#6B8E23', true)`;
    
    // Receptionist
    await sql`INSERT INTO staff (name, username, role, department, pin_hash, status, email, designation, avatar_color, is_active)
              VALUES ('Nirasha Silva', 'reception', 'FRONTLINE', 'Front Office', '5678', 'ACTIVE', 'nirasha@hilldaleretreat.lk', 'Receptionist', '#CD853F', true)`;

    console.log('Default staff profiles seeded.');

    // Seed module access for admin (all modules)
    const adminUser = await sql`SELECT id FROM staff WHERE username = 'admin'`;
    if (adminUser.length > 0) {
      const adminId = adminUser[0].id;
      const allModules = ['pms', 'pos', 'orders', 'invoices', 'expenses', 'pnl', 'menu', 'payroll', 'accounts', 'masters', 'users'];
      for (const mod of allModules) {
        await sql`INSERT INTO staff_module_access (staff_id, module, permission_level) VALUES (${adminId}, ${mod}, 'ADMIN') ON CONFLICT DO NOTHING`;
      }
    }

    // Manager gets most modules
    const mgr = await sql`SELECT id FROM staff WHERE username = 'manager'`;
    if (mgr.length > 0) {
      const mgrId = mgr[0].id;
      const mgrModules = ['pms', 'pos', 'orders', 'invoices', 'expenses', 'pnl', 'menu', 'accounts', 'masters'];
      for (const mod of mgrModules) {
        await sql`INSERT INTO staff_module_access (staff_id, module, permission_level) VALUES (${mgrId}, ${mod}, 'WRITE') ON CONFLICT DO NOTHING`;
      }
    }

    // Chef gets kitchen modules
    const chef = await sql`SELECT id FROM staff WHERE username = 'chef'`;
    if (chef.length > 0) {
      const chefId = chef[0].id;
      for (const mod of ['pos', 'orders', 'menu', 'masters']) {
        await sql`INSERT INTO staff_module_access (staff_id, module, permission_level) VALUES (${chefId}, ${mod}, 'WRITE') ON CONFLICT DO NOTHING`;
      }
    }

    // Waiter gets POS modules
    const waiter = await sql`SELECT id FROM staff WHERE username = 'waiter'`;
    if (waiter.length > 0) {
      const waiterId = waiter[0].id;
      for (const mod of ['pos', 'orders', 'menu']) {
        await sql`INSERT INTO staff_module_access (staff_id, module, permission_level) VALUES (${waiterId}, ${mod}, 'WRITE') ON CONFLICT DO NOTHING`;
      }
    }

    // Receptionist gets front desk modules
    const recep = await sql`SELECT id FROM staff WHERE username = 'reception'`;
    if (recep.length > 0) {
      const recepId = recep[0].id;
      for (const mod of ['pms', 'invoices', 'pos', 'orders']) {
        await sql`INSERT INTO staff_module_access (staff_id, module, permission_level) VALUES (${recepId}, ${mod}, 'WRITE') ON CONFLICT DO NOTHING`;
      }
    }
  } else {
    console.log(`Staff table already has ${existing[0].count} users, skipping seed.`);
    // Still add new columns to existing rows
    await sql`UPDATE staff SET is_active = true WHERE is_active IS NULL`;
  }

  console.log('Users migration complete.');
  await sql.end();
}

main();
