import * as dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';
import { DEFAULT_SETTINGS } from '../../src/data/menuData.js';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hilldale_pms');

async function migrate() {
  console.log('Migrating system settings...');
  try {
    await sql`DROP TABLE IF EXISTS system_settings`;
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id varchar(50) PRIMARY KEY,
        retreat_name varchar(255),
        retreat_tagline varchar(255),
        address text,
        phone varchar(100),
        email varchar(255),
        website varchar(255),
        currency varchar(10),
        usd_to_lkr_rate numeric(10, 2),
        default_service_charge_rate numeric(5, 4),
        tax_rate numeric(5, 4),
        pms_tax_rate numeric(5, 4),
        pms_service_charge_rate numeric(5, 4),
        updated_at timestamp DEFAULT now()
      )
    `;
    console.log('Table system_settings created or exists.');

    const result = await sql`SELECT 1 FROM system_settings WHERE id = 'default'`;
    if (result.length === 0) {
      await sql`
        INSERT INTO system_settings (
          id, retreat_name, retreat_tagline, address, phone, email, website, currency,
          usd_to_lkr_rate, default_service_charge_rate, tax_rate, pms_tax_rate, pms_service_charge_rate
        ) VALUES (
          'default',
          ${DEFAULT_SETTINGS.retreatName},
          ${DEFAULT_SETTINGS.retreatTagline},
          ${DEFAULT_SETTINGS.address},
          ${DEFAULT_SETTINGS.phone},
          ${DEFAULT_SETTINGS.email},
          ${DEFAULT_SETTINGS.website},
          ${DEFAULT_SETTINGS.currency},
          ${DEFAULT_SETTINGS.usdToLkrRate},
          ${DEFAULT_SETTINGS.defaultServiceChargeRate},
          ${DEFAULT_SETTINGS.taxRate},
          ${(DEFAULT_SETTINGS as any).pmsTaxRate || null},
          ${(DEFAULT_SETTINGS as any).pmsServiceChargeRate || null}
        )
      `;
      console.log('Seeded default settings.');
    } else {
      console.log('Default settings already exist.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
