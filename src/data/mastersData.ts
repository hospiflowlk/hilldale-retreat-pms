import { 
  MasterCategory, 
  MasterSupplier, 
  MasterItem, 
  SupplierPurchaseInvoice, 
  MasterCustomer, 
  MasterBusinessSource 
} from '../types';

// ====================================================
// 1. MASTER CATEGORIES (1-Level Nesting for P&L)
// ====================================================

export const INITIAL_MASTER_CATEGORIES: MasterCategory[] = [
  // --- PARENT / ROOT CATEGORIES ---
  {
    id: 'cat-fb-parent',
    name: 'Food & Beverage',
    type: 'INCOME',
    description: 'All food, beverage, snack, and dining revenue and direct costs',
    color: '#5B6547',
    icon: 'UtensilsCrossed',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-rooms-parent',
    name: 'Rooms & Lodging',
    type: 'INCOME',
    description: 'Chalet accommodation, suite folios, and direct hospitality',
    color: '#8C735D',
    icon: 'Bed',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cogs-parent',
    name: 'Direct Cost of Goods (COGS)',
    type: 'EXPENSE',
    description: 'Raw ingredients, kitchen groceries, and bar stock purchases',
    color: '#C08081',
    icon: 'ShoppingBag',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-opex-parent',
    name: 'Operational Overheads',
    type: 'EXPENSE',
    description: 'Utilities, staff payroll, maintenance, fuels, and supplies',
    color: '#4B5563',
    icon: 'Building2',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },

  // --- CHILD CATEGORIES (1-Level Child under Root) ---
  {
    id: 'cat-fb-food-rev',
    parentId: 'cat-fb-parent',
    name: 'Restaurant Food Revenue',
    type: 'INCOME',
    description: 'Ala carte dining, set menus, breakfast, and room service meals',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-fb-bev-rev',
    parentId: 'cat-fb-parent',
    name: 'Bar & Beverage Revenue',
    type: 'INCOME',
    description: 'Ceylon teas, barista coffee, cocktails, beers, and fresh juices',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-room-stay-rev',
    parentId: 'cat-rooms-parent',
    name: 'Room Tariff Revenue',
    type: 'INCOME',
    description: 'Overnight retreat chalet bookings across all 7 suites',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cogs-meat-poultry',
    parentId: 'cat-cogs-parent',
    name: 'Meats, Poultry & Seafood',
    type: 'EXPENSE',
    description: 'Chicken breast, pork cuts, ocean prawns, fish fillets',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cogs-produce',
    parentId: 'cat-cogs-parent',
    name: 'Fresh Vegetables & Fruits',
    type: 'EXPENSE',
    description: 'Upcountry vegetables, herbs, salad greens, and tropical fruits',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cogs-dry-grocery',
    parentId: 'cat-cogs-parent',
    name: 'Dry Provisions & Spices',
    type: 'EXPENSE',
    description: 'Basmati rice, cooking oils, flour, spices, seasonings',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-cogs-beverages',
    parentId: 'cat-cogs-parent',
    name: 'Beverages & Packaged Drinks',
    type: 'EXPENSE',
    description: 'Soft drinks, bottled water, packaged beers, liquors',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-opex-energy',
    parentId: 'cat-opex-parent',
    name: 'Electricity & CEB Power',
    type: 'EXPENSE',
    description: 'Grid electricity bills, transformer charges',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-opex-fuel-gas',
    parentId: 'cat-opex-parent',
    name: 'LP Gas & Generator Diesel',
    type: 'EXPENSE',
    description: 'Kitchen 37.5kg Litro cylinders, backup power fuel',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-opex-payroll',
    parentId: 'cat-opex-parent',
    name: 'Staff Wages & EPF/ETF',
    type: 'EXPENSE',
    description: 'Monthly payroll, overtime, allowances, service pool shares',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

// ====================================================
// 2. MASTER SUPPLIERS
// ====================================================

export const INITIAL_MASTER_SUPPLIERS: MasterSupplier[] = [];

// ====================================================
// 3. MASTER ITEMS (Raw Ingredients, Resale & Recipes with BOM)
// ====================================================

export const INITIAL_MASTER_ITEMS: MasterItem[] = [
  {
    id: 'item-raw-rice',
    name: 'Aroma Basmati Rice (Long Grain)',
    type: 'RESALE',
    categoryId: 'cat-cogs-dry-grocery',
    categoryName: 'Dry Provisions & Spices',
    unit: 'kg',
    costPriceUSD: 2.80,
    sellingPriceUSD: 0.00,
    currentStock: 35.0,
    reorderThreshold: 10.0,
    isAvailable: true,
    description: 'Premium aged Basmati rice for fried rice and biryani dishes',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z'
  },
  {
    id: 'item-raw-tea-leaves',
    name: 'Highland Single-Estate BOPF Tea',
    type: 'RESALE',
    categoryId: 'cat-cogs-beverages',
    categoryName: 'Beverages & Packaged Drinks',
    unit: 'g',
    costPriceUSD: 0.012,
    sellingPriceUSD: 0.00,
    currentStock: 3200, // 3.2 kg
    reorderThreshold: 800,
    isAvailable: true,
    description: 'High grown premium BOPF black tea leaves with rich golden aroma',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z'
  },

  // --- RESALE ITEMS (Bought & Sold Direct As-Is) ---
  {
    id: 'item-coke-can',
    name: 'Coca-Cola Classic (330ml Can)',
    type: 'RESALE',
    categoryId: 'cat-cogs-beverages',
    categoryName: 'Beverages & Packaged Drinks',
    unit: 'pcs',
    costPriceUSD: 0.65,
    sellingPriceUSD: 2.50,
    currentStock: 48,
    reorderThreshold: 20, // Alert if <= 20 cans
    isAvailable: true,
    description: 'Chilled canned Coca-Cola served with lemon slice and ice',
    barcode: '5449000000996',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-sprite-can',
    name: 'Sprite Lemon-Lime (330ml Can)',
    type: 'RESALE',
    categoryId: 'cat-cogs-beverages',
    categoryName: 'Beverages & Packaged Drinks',
    unit: 'pcs',
    costPriceUSD: 0.65,
    sellingPriceUSD: 2.50,
    currentStock: 8, // Low Stock Alert Triggered!
    reorderThreshold: 15,
    isAvailable: true,
    description: 'Refreshing lemon-lime carbonated soda',
    barcode: '5449000014535',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-water-1l',
    name: 'Hilldale Artesian Mineral Water (1000ml)',
    type: 'RESALE',
    categoryId: 'cat-cogs-beverages',
    categoryName: 'Beverages & Packaged Drinks',
    unit: 'bottle',
    costPriceUSD: 0.40,
    sellingPriceUSD: 1.80,
    currentStock: 64,
    reorderThreshold: 24,
    isAvailable: true,
    description: 'Natural spring water bottled at source in Sri Lankan hill country',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-lion-lager-625',
    name: 'Lion Lager Beer (625ml Bottle)',
    type: 'RESALE',
    categoryId: 'cat-cogs-beverages',
    categoryName: 'Beverages & Packaged Drinks',
    unit: 'bottle',
    costPriceUSD: 1.80,
    sellingPriceUSD: 5.50,
    currentStock: 30,
    reorderThreshold: 12,
    isAvailable: true,
    description: 'Sri Lanka’s iconic crisp golden lager, 4.8% ABV, served chilled',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },

  // --- RECIPE ITEMS (Made from other items with Bill of Materials) ---
  {
    id: 'item-recipe-grilled-chicken',
    name: 'Grilled Chicken Breast with Herb Butter',
    type: 'RECIPE',
    categoryId: 'cat-fb-food-rev',
    categoryName: 'Restaurant Food Revenue',
    unit: 'unit',
    costPriceUSD: 2.35, // Computed from BOM sum
    sellingPriceUSD: 11.50,
    currentStock: 999, // Virtual indicator for made-to-order recipes
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Tender marinated chicken breast char-grilled to perfection with herb butter and side salad',
    bom: [
      {
        ingredientItemId: 'item-raw-chicken',
        ingredientName: 'Fresh Chicken Breast (Boneless)',
        quantity: 0.25, // 250 grams (0.25 kg)
        unit: 'kg',
        costEstimateUSD: 1.38
      },
      {
        ingredientItemId: 'item-raw-oil',
        ingredientName: 'Pure Sunflower Cooking Oil',
        quantity: 20, // 20 ml
        unit: 'ml',
        costEstimateUSD: 0.06
      },
      {
        ingredientItemId: 'item-raw-butter',
        ingredientName: 'Anchor Pure New Zealand Butter',
        quantity: 25, // 25 grams
        unit: 'g',
        costEstimateUSD: 0.38
      },
      {
        ingredientItemId: 'item-raw-seasoning',
        ingredientName: 'Hilldale Chef Herb & Spice Rub',
        quantity: 10, // 10 grams
        unit: 'g',
        costEstimateUSD: 0.20
      }
    ],
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-recipe-fried-rice',
    name: 'Hilldale Special Chicken Fried Rice',
    type: 'RECIPE',
    categoryId: 'cat-fb-food-rev',
    categoryName: 'Restaurant Food Revenue',
    unit: 'unit',
    costPriceUSD: 1.95,
    sellingPriceUSD: 9.50,
    currentStock: 999,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Wok-tossed aromatic Basmati rice with diced chicken, garden vegetables and chili paste',
    bom: [
      {
        ingredientItemId: 'item-raw-rice',
        ingredientName: 'Aroma Basmati Rice (Long Grain)',
        quantity: 0.20, // 200g
        unit: 'kg',
        costEstimateUSD: 0.56
      },
      {
        ingredientItemId: 'item-raw-chicken',
        ingredientName: 'Fresh Chicken Breast (Boneless)',
        quantity: 0.15, // 150g
        unit: 'kg',
        costEstimateUSD: 0.83
      },
      {
        ingredientItemId: 'item-raw-oil',
        ingredientName: 'Pure Sunflower Cooking Oil',
        quantity: 30, // 30 ml
        unit: 'ml',
        costEstimateUSD: 0.10
      },
      {
        ingredientItemId: 'item-raw-seasoning',
        ingredientName: 'Hilldale Chef Herb & Spice Rub',
        quantity: 8,
        unit: 'g',
        costEstimateUSD: 0.16
      }
    ],
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-recipe-pot-tea',
    name: 'Pot of Pure Ceylon Black Tea',
    type: 'RECIPE',
    categoryId: 'cat-fb-bev-rev',
    categoryName: 'Bar & Beverage Revenue',
    unit: 'unit',
    costPriceUSD: 0.25,
    sellingPriceUSD: 3.50,
    currentStock: 999,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Freshly brewed mountain-estate BOPF tea served in a ceramic teapot with fresh milk and jaggery',
    bom: [
      {
        ingredientItemId: 'item-raw-tea-leaves',
        ingredientName: 'Highland Single-Estate BOPF Tea',
        quantity: 12, // 12 grams for a 2-cup pot
        unit: 'g',
        costEstimateUSD: 0.14
      }
    ],
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },

  // --- NON-STOCK EXPENSE & SERVICE ITEMS (Operational Overheads) ---
  {
    id: 'item-exp-electricity',
    name: 'Electricity & Power Grid (CEB)',
    type: 'EXPENSE',
    categoryId: 'cat-opex-parent',
    categoryName: 'Operational Overheads',
    unit: 'unit',
    costPriceUSD: 280.00,
    sellingPriceUSD: 0,
    currentStock: 0,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Ceylon Electricity Board commercial retreat monthly grid consumption tariff',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-exp-petrol',
    name: 'Petrol 92 Octane (Generator & Resort Buggy)',
    type: 'EXPENSE',
    categoryId: 'cat-opex-parent',
    categoryName: 'Operational Overheads',
    unit: 'ml',
    costPriceUSD: 1.15,
    sellingPriceUSD: 0,
    currentStock: 0,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Fuel for backup power generator and resort guest transport buggy',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-exp-epf-etf',
    name: 'EPF (12%) & ETF (3%) Employer Remittance',
    type: 'EXPENSE',
    categoryId: 'cat-opex-parent',
    categoryName: 'Operational Overheads',
    unit: 'unit',
    costPriceUSD: 310.00,
    sellingPriceUSD: 0,
    currentStock: 0,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Statutory monthly contribution to Central Bank of Sri Lanka EPF/ETF fund for resort crew',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-exp-laundry-chem',
    name: 'Housekeeping Laundry Detergent & Softener',
    type: 'EXPENSE',
    categoryId: 'cat-opex-parent',
    categoryName: 'Operational Overheads',
    unit: 'unit',
    costPriceUSD: 24.50,
    sellingPriceUSD: 0,
    currentStock: 0,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'Commercial grade eco-friendly washing chemical for linen, towels, and bedding',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  },
  {
    id: 'item-exp-stationery',
    name: 'Office Printing Paper & Front-Desk Stationery',
    type: 'EXPENSE',
    categoryId: 'cat-opex-parent',
    categoryName: 'Operational Overheads',
    unit: 'unit',
    costPriceUSD: 8.50,
    sellingPriceUSD: 0,
    currentStock: 0,
    reorderThreshold: 0,
    isAvailable: true,
    description: 'A4 printing reams, registration cards, receipt rolls, and guest presentation folders',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z'
  }
];

// ====================================================
// 4. INITIAL SUPPLIER PURCHASES & AP LEDGER ENTRIES
// ====================================================

export const INITIAL_SUPPLIER_PURCHASES: SupplierPurchaseInvoice[] = [];

// ====================================================
// 5. MASTER CUSTOMERS (Guests & Walk-Ins)
// ====================================================

export const INITIAL_MASTER_CUSTOMERS: MasterCustomer[] = [
  {
    id: 'cust-sarah-jenkins',
    name: 'Sarah Jenkins',
    phone: '+44 7911 123456',
    email: 'sarah.jenkins@uktravel.co.uk',
    country: 'United Kingdom',
    passportOrId: 'GB98234109',
    customerType: 'ROOM_GUEST',
    businessSourceId: 'src-booking-com',
    businessSourceName: 'Booking.com',
    notes: 'Prefers quiet top-floor chalet. Vegetarian diet request.',
    lifetimeSpendUSD: 685.50,
    totalVisits: 2,
    lastVisitDate: '2026-08-21',
    roomNumbersStayed: ['101'],
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-08-21T10:00:00.000Z'
  },
  {
    id: 'cust-david-muller',
    name: 'David Müller',
    phone: '+49 151 23456789',
    email: 'd.mueller@munich-tech.de',
    country: 'Germany',
    passportOrId: 'C48920198',
    customerType: 'ROOM_GUEST',
    businessSourceId: 'src-direct-web',
    businessSourceName: 'Direct Website Engine',
    notes: 'Enjoys Ceylon tea tastings and hiking excursions.',
    lifetimeSpendUSD: 490.00,
    totalVisits: 1,
    lastVisitDate: '2026-08-20',
    roomNumbersStayed: ['102'],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-08-20T14:30:00.000Z'
  },
  {
    id: 'cust-kasun-perera',
    name: 'Kasun Perera',
    phone: '+94 77 123 4567',
    email: 'kasun.p@colombotech.lk',
    country: 'Sri Lanka',
    passportOrId: '199018402910',
    customerType: 'WALK_IN',
    businessSourceId: 'src-walk-in',
    businessSourceName: 'Walk-In Guest',
    notes: 'Regular weekend lunch diner at the restaurant.',
    lifetimeSpendUSD: 142.50,
    totalVisits: 3,
    lastVisitDate: '2026-08-21',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-08-21T13:15:00.000Z'
  },
  {
    id: 'cust-elena-rossi',
    name: 'Elena Rossi',
    phone: '+39 340 1234567',
    email: 'elena.rossi@milano.it',
    country: 'Italy',
    passportOrId: 'YA8492019',
    customerType: 'VIP',
    businessSourceId: 'src-airbnb',
    businessSourceName: 'Airbnb Luxe',
    notes: 'VIP honeymoon booking with special flower arrangement in Suite 103.',
    lifetimeSpendUSD: 1120.00,
    totalVisits: 1,
    lastVisitDate: '2026-08-15',
    roomNumbersStayed: ['103'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-15T18:00:00.000Z'
  }
];

// ====================================================
// 6. MASTER BUSINESS SOURCES
// ====================================================

export const INITIAL_MASTER_BUSINESS_SOURCES: MasterBusinessSource[] = [
  {
    id: 'src-direct-web',
    name: 'Direct Website Engine',
    commissionPercent: 0.0,
    contactInfo: 'reservations@hilldaleretreat.com',
    notes: 'Zero commission direct guest reservations via official website booking engine.',
    totalBookingsGenerated: 14,
    totalRevenueGeneratedUSD: 4850.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-booking-com',
    name: 'Booking.com',
    commissionPercent: 15.0,
    contactInfo: 'partner.booking.com / Hotel ID: 894210',
    notes: 'Major global OTA channel. Automatic XML 2-way sync.',
    totalBookingsGenerated: 28,
    totalRevenueGeneratedUSD: 9420.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-agoda',
    name: 'Agoda',
    commissionPercent: 14.0,
    contactInfo: 'ycs.agoda.com',
    notes: 'Key channel for Southeast Asian and European travelers.',
    totalBookingsGenerated: 18,
    totalRevenueGeneratedUSD: 5900.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-airbnb',
    name: 'Airbnb',
    commissionPercent: 3.0,
    contactInfo: 'airbnb.com/rooms/hilldale-retreat',
    notes: 'Low commission host fee for boutique nature luxury villas.',
    totalBookingsGenerated: 11,
    totalRevenueGeneratedUSD: 3750.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-walk-in',
    name: 'Walk-In & Direct Phone',
    commissionPercent: 0.0,
    contactInfo: 'Front Desk Station: +94 52 222 4567',
    notes: 'Guests arriving without prior online bookings or calling front desk directly.',
    totalBookingsGenerated: 22,
    totalRevenueGeneratedUSD: 2450.00,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-corp-travel',
    name: 'Corporate & Travel Agency Partners',
    commissionPercent: 8.0,
    contactInfo: 'b2b@hilldaleretreat.com / Aitken Spence Travels & Jetwing',
    notes: 'B2B contracted tour operator rates and corporate retreat packages.',
    totalBookingsGenerated: 7,
    totalRevenueGeneratedUSD: 3100.00,
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z'
  }
];
