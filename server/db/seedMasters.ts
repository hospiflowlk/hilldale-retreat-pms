import { db } from './index';
import { categories, businessSources, customers, items } from './schema';
import { 
  INITIAL_MASTER_CATEGORIES, 
  INITIAL_MASTER_BUSINESS_SOURCES, 
  INITIAL_MASTER_CUSTOMERS, 
  INITIAL_MASTER_ITEMS 
} from '../../src/data/mastersData';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedMasters() {
  console.log('🌱 Seeding Masters Data...');

  try {
    // Categories
    console.log('Inserting Categories...');
    for (const cat of INITIAL_MASTER_CATEGORIES) {
      await db.insert(categories).values({
        name: cat.name,
        type: cat.type,
      }).onConflictDoNothing();
    }

    // Business Sources
    console.log('Inserting Business Sources...');
    for (const src of INITIAL_MASTER_BUSINESS_SOURCES) {
      await db.insert(businessSources).values({
        name: src.name,
        commissionPercent: src.commissionPercent.toString(),
      }).onConflictDoNothing();
    }

    // Customers
    console.log('Inserting Customers...');
    for (const cust of INITIAL_MASTER_CUSTOMERS) {
      await db.insert(customers).values({
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        country: cust.country,
      }).onConflictDoNothing();
    }

    // Items
    console.log('Inserting Items...');
    // Get categories to map IDs (since we use int IDs in postgres but strings in mock data)
    const dbCategories = await db.select().from(categories);
    
    for (const item of INITIAL_MASTER_ITEMS) {
      const dbCat = dbCategories.find(c => c.name === item.categoryName);
      
      await db.insert(items).values({
        name: item.name,
        type: item.type,
        categoryId: dbCat ? dbCat.id : null,
        unit: item.unit,
        costPrice: item.costPriceUSD.toString(),
        sellingPrice: item.sellingPriceUSD?.toString() || '0',
        stockLevel: item.currentStock.toString(),
        reorderThreshold: item.reorderThreshold.toString(),
      }).onConflictDoNothing();
    }

    console.log('✅ Masters Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedMasters();
