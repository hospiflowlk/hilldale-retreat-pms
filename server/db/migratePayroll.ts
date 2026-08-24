import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hilldale_pms';

async function main() {
  console.log('Connecting to database...');
  const sql = postgres(connectionString);
  const db = drizzle(sql, { schema });

  try {
    console.log('Creating Payroll tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id" varchar(100) PRIMARY KEY,
        "fingerprint_id" varchar(50) NOT NULL,
        "name" varchar(255) NOT NULL,
        "designation" varchar(100),
        "department" varchar(100),
        "basic_salary" numeric(12, 2) DEFAULT '0',
        "service_intensive_default" numeric(12, 2) DEFAULT '0',
        "food_allowance_daily" numeric(12, 2) DEFAULT '0',
        "epf_eligible" boolean DEFAULT false,
        "epf_number" varchar(100),
        "nic_number" varchar(100),
        "bank_name" varchar(100),
        "account_number" varchar(100),
        "contact_phone" varchar(100),
        "active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "attendance_logs" (
        "id" varchar(100) PRIMARY KEY,
        "fingerprint_id" varchar(50),
        "employee_id" varchar(100) REFERENCES "employees"("id"),
        "employee_name" varchar(255),
        "date" varchar(20) NOT NULL,
        "clock_in" varchar(20),
        "clock_out" varchar(20),
        "hours_worked" numeric(10, 2) DEFAULT '0',
        "ot_hours" numeric(10, 2) DEFAULT '0',
        "status" varchar(50),
        "device_source" varchar(100),
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "payroll_records" (
        "id" varchar(100) PRIMARY KEY,
        "month_year" varchar(20) NOT NULL,
        "employee_id" varchar(100) REFERENCES "employees"("id"),
        "employee_name" varchar(255),
        "fingerprint_id" varchar(50),
        "designation" varchar(100),
        "department" varchar(100),
        
        "hours_worked" numeric(10, 2) DEFAULT '0',
        "ot_hours" numeric(10, 2) DEFAULT '0',
        "ot_pay" numeric(12, 2) DEFAULT '0',
        
        "basic_salary" numeric(12, 2) DEFAULT '0',
        "service_intensive" numeric(12, 2) DEFAULT '0',
        "service_charge" numeric(12, 2) DEFAULT '0',
        "food_allowance" numeric(12, 2) DEFAULT '0',
        "sp1" numeric(12, 2) DEFAULT '0',
        "sp2" numeric(12, 2) DEFAULT '0',
        
        "epf8" numeric(12, 2) DEFAULT '0',
        "epf12" numeric(12, 2) DEFAULT '0',
        "etf3" numeric(12, 2) DEFAULT '0',
        "advances" numeric(12, 2) DEFAULT '0',
        
        "total_pay" numeric(12, 2) DEFAULT '0',
        "balance_pay" numeric(12, 2) DEFAULT '0',
        
        "payment_status" varchar(50) DEFAULT 'unpaid',
        "payment_method" varchar(50),
        "payment_date" varchar(50),
        
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;
    
    console.log('Seeding employees...');
    const existingEmployees = await db.select().from(schema.employees);
    if (existingEmployees.length === 0) {
      await db.insert(schema.employees).values([
        {
          id: 'emp-101',
          fingerprintId: '101',
          name: 'Nimal Perera',
          designation: 'General Manager',
          department: 'Management',
          basicSalary: '150000.00',
          serviceIntensiveDefault: '15000.00',
          foodAllowanceDaily: '0',
          epfEligible: true,
          active: true
        },
        {
          id: 'emp-102',
          fingerprintId: '102',
          name: 'Sunil Silva',
          designation: 'Executive Chef',
          department: 'Kitchen',
          basicSalary: '85000.00',
          serviceIntensiveDefault: '8500.00',
          foodAllowanceDaily: '500.00',
          epfEligible: true,
          active: true
        }
      ]);
      console.log('Employees seeded.');
    }

    console.log('Payroll schema migration & seeding completed.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

main();
