import * as dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hilldale_pms');

async function migrate() {
  console.log('Migrating pos_carts and pos_cart_items...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pos_carts (
        id varchar(100) PRIMARY KEY,
        user_id varchar(100) NOT NULL,
        name varchar(255),
        discount_percent numeric(5, 2) DEFAULT 0,
        notes text,
        status varchar(50) DEFAULT 'active',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;
    console.log('Table pos_carts created or exists.');

    await sql`
      CREATE TABLE IF NOT EXISTS pos_cart_items (
        id varchar(100) PRIMARY KEY,
        cart_id varchar(100) NOT NULL REFERENCES pos_carts(id) ON DELETE CASCADE,
        menu_item_id varchar(100) NOT NULL,
        name varchar(255),
        price numeric(10, 2),
        quantity integer NOT NULL DEFAULT 1,
        selected_sides jsonb,
        notes text,
        is_vegetarian boolean DEFAULT false
      )
    `;
    console.log('Table pos_cart_items created or exists.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
