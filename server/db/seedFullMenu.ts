import { db } from './index';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
// Import the full original array of mock data
import { INITIAL_MENU_ITEMS } from '../../src/data/menuData';

dotenv.config();

async function seedFullMenu() {
  console.log(`Seeding all ${INITIAL_MENU_ITEMS.length} original menu items...`);
  try {
    // We can clear the old 20 items first to avoid duplicates
    await db.execute(sql`DELETE FROM menu_items`);
    console.log('Cleared initial small seed data.');

    let inserted = 0;
    
    // Insert them into the new postgres table
    for (const item of INITIAL_MENU_ITEMS) {
      await db.execute(sql`
        INSERT INTO menu_items (
          id, name, category, price, description, is_vegetarian, is_available, portion_info, sides
        ) VALUES (
          ${item.id},
          ${item.name},
          ${item.category},
          ${item.price},
          ${item.description || null},
          ${item.isVegetarian || false},
          ${item.isAvailable !== false},
          ${item.portionInfo || null},
          ${JSON.stringify(item.sides || [])}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          price = EXCLUDED.price;
      `);
      inserted++;
    }
    
    console.log(`Successfully migrated ${inserted} menu items into the database!`);
  } catch (error) {
    console.error('Error seeding full menu:', error);
  }
  process.exit(0);
}

seedFullMenu();
