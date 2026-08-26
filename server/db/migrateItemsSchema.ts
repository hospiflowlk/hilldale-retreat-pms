import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hilldale_pms';

async function migrateItemsSchema() {
  console.log('Connecting to PostgreSQL database...');
  const sql = postgres(connectionString);

  try {
    console.log('Altering "items" table to ensure all columns exist...');
    
    await sql`
      ALTER TABLE items 
      ADD COLUMN IF NOT EXISTS use_in_invoices boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS use_in_expenses boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS show_in_pos boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS barcode varchar(100),
      ADD COLUMN IF NOT EXISTS description text;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS item_bom (
        id serial PRIMARY KEY,
        recipe_item_id integer NOT NULL REFERENCES items(id),
        ingredient_item_id integer NOT NULL REFERENCES items(id),
        quantity_per_unit numeric(12, 4) NOT NULL,
        unit varchar(50)
      );
    `;

    await sql`
      ALTER TABLE item_bom
      ADD COLUMN IF NOT EXISTS unit varchar(50);
    `;

    console.log('✅ Successfully added missing columns to "items" table!');

    const count = await sql`SELECT COUNT(*) FROM items`;
    console.log(`Current items count in database: ${count[0].count}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrateItemsSchema();
