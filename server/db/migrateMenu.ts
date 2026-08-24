import { db } from './index';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateMenu() {
  console.log('Migrating menu_items table...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        description TEXT,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        portion_info VARCHAR(255),
        sides TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('menu_items table created.');

    const seedData = [
      { id: 'item-1', name: 'Cream of Tomato Soup', category: 'Soup', price: '5.00', description: 'Classic homemade tomato soup.', is_vegetarian: true, is_available: true, portion_info: 'Bowl', sides: '["Garlic Bread"]' },
      { id: 'item-2', name: 'Caesar Salad', category: 'Salad', price: '8.00', description: 'Fresh romaine lettuce with Caesar dressing.', is_vegetarian: false, is_available: true, portion_info: 'Plate', sides: '[]' },
      { id: 'item-3', name: 'Grilled Chicken Breast', category: 'Grilled', price: '15.00', description: 'Marinated and grilled to perfection.', is_vegetarian: false, is_available: true, portion_info: '1 Piece', sides: '["Mashed Potatoes", "Steamed Vegetables"]' },
      { id: 'item-4', name: 'Vegetable Fried Rice', category: 'Rice', price: '10.00', description: 'Asian style fried rice with mixed vegetables.', is_vegetarian: true, is_available: true, portion_info: 'Bowl', sides: '["Chili Paste"]' },
      { id: 'item-5', name: 'Sri Lankan Rice & Curry', category: 'Sri Lankan', price: '12.00', description: 'Traditional rice and curry with 4 vegetable curries.', is_vegetarian: true, is_available: true, portion_info: 'Plate', sides: '["Papadum"]' },
      { id: 'item-6', name: 'Club Sandwich', category: 'Sandwiches', price: '11.00', description: 'Triple-decker sandwich with chicken, egg, and bacon.', is_vegetarian: false, is_available: true, portion_info: '4 Pieces', sides: '["French Fries"]' },
      { id: 'item-7', name: 'Ceylon Tea', category: 'Tea', price: '3.00', description: 'Hot cup of famous Ceylon black tea.', is_vegetarian: true, is_available: true, portion_info: 'Cup', sides: '[]' },
      { id: 'item-8', name: 'Espresso', category: 'Coffee', price: '4.00', description: 'Strong black coffee.', is_vegetarian: true, is_available: true, portion_info: 'Cup', sides: '[]' },
      { id: 'item-9', name: 'Fresh Watermelon Juice', category: 'Fresh Drinks', price: '6.00', description: 'Refreshing cold pressed watermelon juice.', is_vegetarian: true, is_available: true, portion_info: 'Glass', sides: '[]' },
      { id: 'item-10', name: 'Mojito', category: 'Alcohol', price: '9.00', description: 'Classic rum cocktail with mint and lime.', is_vegetarian: true, is_available: true, portion_info: 'Glass', sides: '[]' },
      { id: 'item-11', name: 'Mushroom Soup', category: 'Soup', price: '6.00', description: 'Creamy wild mushroom soup.', is_vegetarian: true, is_available: true, portion_info: 'Bowl', sides: '["Bread Roll"]' },
      { id: 'item-12', name: 'Greek Salad', category: 'Salad', price: '9.00', description: 'Feta cheese, olives, and fresh vegetables.', is_vegetarian: true, is_available: true, portion_info: 'Plate', sides: '[]' },
      { id: 'item-13', name: 'Grilled Salmon', category: 'Grilled', price: '22.00', description: 'Fresh salmon fillet with dill sauce.', is_vegetarian: false, is_available: true, portion_info: '1 Piece', sides: '["Asparagus"]' },
      { id: 'item-14', name: 'Chicken Biryani', category: 'Rice', price: '14.00', description: 'Aromatic basmati rice cooked with chicken.', is_vegetarian: false, is_available: true, portion_info: 'Bowl', sides: '["Raita"]' },
      { id: 'item-15', name: 'Hoppers (Appa)', category: 'Sri Lankan', price: '8.00', description: 'Crispy bowl-shaped pancakes.', is_vegetarian: true, is_available: true, portion_info: '4 Pieces', sides: '["Lunu Miris", "Seeni Sambol"]' },
      { id: 'item-16', name: 'Beef Burger', category: 'Sandwiches', price: '13.00', description: 'Juicy beef patty with cheese and lettuce.', is_vegetarian: false, is_available: true, portion_info: '1 Burger', sides: '["Potato Wedges"]' },
      { id: 'item-17', name: 'Green Tea', category: 'Tea', price: '3.50', description: 'Soothing hot green tea.', is_vegetarian: true, is_available: true, portion_info: 'Cup', sides: '[]' },
      { id: 'item-18', name: 'Latte', category: 'Coffee', price: '5.00', description: 'Espresso with steamed milk.', is_vegetarian: true, is_available: true, portion_info: 'Cup', sides: '[]' },
      { id: 'item-19', name: 'Orange Juice', category: 'Fresh Drinks', price: '5.50', description: 'Freshly squeezed orange juice.', is_vegetarian: true, is_available: true, portion_info: 'Glass', sides: '[]' },
      { id: 'item-20', name: 'Local Beer (Lion)', category: 'Alcohol', price: '4.50', description: 'Chilled local lager beer.', is_vegetarian: true, is_available: true, portion_info: 'Bottle', sides: '[]' },
    ];

    for (const item of seedData) {
      await db.execute(sql`
        INSERT INTO menu_items (id, name, category, price, description, is_vegetarian, is_available, portion_info, sides)
        VALUES (${item.id}, ${item.name}, ${item.category}, ${item.price}, ${item.description}, ${item.is_vegetarian}, ${item.is_available}, ${item.portion_info}, ${item.sides})
        ON CONFLICT (id) DO NOTHING;
      `);
    }
    console.log('Seeded menu items.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateMenu();
