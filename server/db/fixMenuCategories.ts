import { db } from './index';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixMenuCategories() {
  console.log('Fixing menu categories to match frontend exact IDs...');
  try {
    // The frontend filters expect IDs like 'soup', 'salad', 'grilled', 'rice', 'sri_lankan', 'sandwiches', 'tea', 'coffee', 'drinks', 'alcohol'
    
    await db.execute(sql`UPDATE menu_items SET category = 'soup' WHERE category ILIKE '%Soup%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'salad' WHERE category ILIKE '%Salad%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'grilled' WHERE category ILIKE '%Grilled%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'rice' WHERE category ILIKE '%Rice%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'sri_lankan' WHERE category ILIKE '%Sri Lankan%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'sandwiches' WHERE category ILIKE '%Sandwich%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'tea' WHERE category ILIKE '%Tea%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'coffee' WHERE category ILIKE '%Coffee%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'drinks' WHERE category ILIKE '%Fresh Drinks%';`);
    await db.execute(sql`UPDATE menu_items SET category = 'alcohol' WHERE category ILIKE '%Alcohol%';`);
    
    console.log('Categories successfully updated to lowercase frontend IDs!');
  } catch (error) {
    console.error('Error fixing categories:', error);
  }
  process.exit(0);
}

fixMenuCategories();
