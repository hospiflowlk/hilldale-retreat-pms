import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ---- System Settings ----
export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 50 }).primaryKey(),
  retreatName: varchar('retreat_name', { length: 255 }),
  retreatTagline: varchar('retreat_tagline', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 100 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  currency: varchar('currency', { length: 10 }),
  usdToLkrRate: numeric('usd_to_lkr_rate', { precision: 10, scale: 2 }),
  defaultServiceChargeRate: numeric('default_service_charge_rate', { precision: 5, scale: 4 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }),
  pmsTaxRate: numeric('pms_tax_rate', { precision: 5, scale: 4 }),
  pmsServiceChargeRate: numeric('pms_service_charge_rate', { precision: 5, scale: 4 }),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---- Staff & RBAC ----
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull(), // ADMIN, MANAGER, FRONTLINE
  department: varchar('department', { length: 255 }),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 100 }),
  designation: varchar('designation', { length: 255 }),
  avatar_color: varchar('avatar_color', { length: 50 }),
  can_manage_users: boolean('can_manage_users').default(false),
  can_export_reports: boolean('can_export_reports').default(false),
  can_delete_records: boolean('can_delete_records').default(false),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  last_login: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffModuleAccess = pgTable('staff_module_access', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  permissionLevel: varchar('permission_level', { length: 50 }).notNull(), // READ, WRITE, ADMIN
});

export const staffActivityLog = pgTable('staff_activity_log', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ---- Masters ----
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // INCOME, EXPENSE
  parentId: integer('parent_id'),
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactInfo: text('contact_info'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const supplierTransactions = pgTable('supplier_transactions', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  type: varchar('type', { length: 50 }).notNull(), // INVOICE, PAYMENT, ADJUSTMENT
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  note: text('note'),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const businessSources = pgTable('business_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).default('0'),
});

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // RESALE, RECIPE, RAW_MATERIAL
  categoryId: integer('category_id').references(() => categories.id),
  unit: varchar('unit', { length: 50 }),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).default('0'),
  stockLevel: numeric('stock_level', { precision: 12, scale: 2 }).default('0'),
  reorderThreshold: numeric('reorder_threshold', { precision: 12, scale: 2 }).default('0'),
});

export const itemBom = pgTable('item_bom', {
  id: serial('id').primaryKey(),
  recipeItemId: integer('recipe_item_id').references(() => items.id).notNull(),
  ingredientItemId: integer('ingredient_item_id').references(() => items.id).notNull(),
  quantityPerUnit: numeric('quantity_per_unit', { precision: 12, scale: 4 }).notNull(),
});

// ---- Rooms & PMS ----
export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. room-101
  number: varchar('number', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  type: varchar('type', { length: 100 }),
  floor: varchar('floor', { length: 50 }),
  basePriceUSD: numeric('base_price_usd', { precision: 10, scale: 2 }),
  capacity: jsonb('capacity'), // { adults: 2, children: 1, maxGuests: 3 }
  bedType: varchar('bed_type', { length: 100 }),
  amenities: jsonb('amenities'), // string[]
  housekeepingStatus: varchar('housekeeping_status', { length: 50 }).default('clean'),
  isAvailableForOnlineBooking: boolean('is_available_for_online_booking').default(true),
  notes: text('notes'),
});

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  bookingReference: varchar('booking_reference', { length: 100 }),
  channel: varchar('channel', { length: 100 }),
  channelReservationId: varchar('channel_reservation_id', { length: 100 }),
  guestId: integer('guest_id').references(() => customers.id),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 100 }),
  guestCountry: varchar('guest_country', { length: 100 }),
  passportOrId: varchar('passport_or_id', { length: 100 }),
  roomId: varchar('room_id', { length: 50 }).references(() => rooms.id),
  roomNumber: varchar('room_number', { length: 20 }).notNull(),
  adultsCount: integer('adults_count').default(1),
  childrenCount: integer('children_count').default(0),
  childrenAges: jsonb('children_ages'),
  checkInDate: timestamp('check_in_date').notNull(),
  checkOutDate: timestamp('check_out_date').notNull(),
  checkInTime: varchar('check_in_time', { length: 50 }),
  checkOutTime: varchar('check_out_time', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull().default('confirmed'), // confirmed, checked_in, checked_out, cancelled, no_show
  mealPlan: varchar('meal_plan', { length: 100 }),
  ratePerNightUSD: numeric('rate_per_night_usd', { precision: 10, scale: 2 }).default('0'),
  nights: integer('nights').default(1),
  roomTotalUSD: numeric('room_total_usd', { precision: 12, scale: 2 }).default('0'),
  serviceChargeUSD: numeric('service_charge_usd', { precision: 12, scale: 2 }).default('0'),
  taxAmountUSD: numeric('tax_amount_usd', { precision: 12, scale: 2 }).default('0'),
  folioCharges: jsonb('folio_charges').default([]), // FolioExtraItem[]
  payments: jsonb('payments').default([]), // BookingPayment[]
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // pending, partially_paid, paid_in_full
  specialRequests: text('special_requests'),
  sourceId: integer('source_id').references(() => businessSources.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const guestFolios = pgTable('guest_folios', {
  id: serial('id').primaryKey(),
  reservationId: integer('reservation_id').references(() => reservations.id).notNull(),
  runningBalance: numeric('running_balance', { precision: 12, scale: 2 }).default('0'),
});

// ---- POS & Walk-Ins ----
export const walkinSessions = pgTable('walkin_sessions', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. WI-1787242204708
  customerId: integer('customer_id').references(() => customers.id),
  guestName: varchar('guest_name', { length: 255 }),
  numberOfGuests: integer('number_of_guests').default(1),
  location: varchar('location', { length: 100 }).default('Table 01 (Main Dining)'),
  status: varchar('status', { length: 50 }).default('ACTIVE'), // ACTIVE, CHECKED_OUT
  posBalance: numeric('pos_balance', { precision: 12, scale: 2 }).default('0'),
  invoiceId: varchar('invoice_id', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  checkedOutAt: timestamp('checked_out_at'),
});

export const orders = pgTable('orders', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. ORD-1787242204708
  orderNumber: varchar('order_number', { length: 100 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  sessionId: varchar('session_id', { length: 100 }).references(() => walkinSessions.id),
  reservationId: integer('reservation_id').references(() => reservations.id),
  bookingId: varchar('booking_id', { length: 100 }),
  roomNumber: varchar('room_number', { length: 50 }),
  orderType: varchar('order_type', { length: 50 }).default('dine-in'), // dine-in, room-service, takeaway, poolside, garden
  location: varchar('location', { length: 100 }).default('Table 01'),
  guestName: varchar('guest_name', { length: 255 }),
  guestCount: integer('guest_count').default(1),
  items: jsonb('items').default([]), // OrderItem[]
  status: varchar('status', { length: 50 }).default('active'), // active, preparing, served, billed, paid, cancelled
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0'),
  serviceChargeRate: numeric('service_charge_rate', { precision: 6, scale: 4 }).default('0.10'),
  serviceChargeAmount: numeric('service_charge_amount', { precision: 12, scale: 2 }).default('0'),
  discountPercent: numeric('discount_percent', { precision: 6, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxPercent: numeric('tax_percent', { precision: 6, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).default('0'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  accountId: varchar('account_id', { length: 100 }),
  accountName: varchar('account_name', { length: 255 }),
  cashReceived: numeric('cash_received', { precision: 12, scale: 2 }),
  changeDue: numeric('change_due', { precision: 12, scale: 2 }),
  cashierName: varchar('cashier_name', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  paidAt: timestamp('paid_at'),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 100 }).references(() => orders.id).notNull(),
  itemId: integer('item_id').references(() => items.id).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(), // price at time of order
  note: text('note'),
});

export const kitchenTickets = pgTable('kitchen_tickets', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 100 }).references(() => orders.id).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, PREPARING, COMPLETED
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- Billing & Invoices ----
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  reservationId: integer('reservation_id').references(() => reservations.id),
  walkinSessionId: varchar('walkin_session_id').references(() => walkinSessions.id),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('UNPAID'), // UNPAID, PARTIAL, PAID
  paymentMethod: varchar('payment_method', { length: 100 }), // CASH, CARD, BANK_TRANSFER
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- Accounts & Treasury ----
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. acc-bank-cml-lkr, acc-cash-frontdesk
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // bank, cash, credit_card, loan
  accountNumber: varchar('account_number', { length: 100 }),
  bankName: varchar('bank_name', { length: 255 }),
  currency: varchar('currency', { length: 10 }).default('LKR'), // LKR, USD
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0'),
  openingBalance: numeric('opening_balance', { precision: 15, scale: 2 }).default('0'),
  openingDate: varchar('opening_date', { length: 50 }),
  branch: varchar('branch', { length: 255 }),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }),
  billingCycleDay: integer('billing_cycle_day'),
  initialLoanAmount: numeric('initial_loan_amount', { precision: 15, scale: 2 }),
  principalAmount: numeric('principal_amount', { precision: 15, scale: 2 }),
  loanTermMonths: integer('loan_term_months'),
  monthlyInstallment: numeric('monthly_installment', { precision: 15, scale: 2 }),
  interestRate: numeric('interest_rate', { precision: 6, scale: 2 }),
  dueDate: varchar('due_date', { length: 50 }),
  monthlyPayment: numeric('monthly_payment', { precision: 15, scale: 2 }),
  interBankTransferFee: numeric('inter_bank_transfer_fee', { precision: 10, scale: 2 }).default('0'),
  interBankFeeType: varchar('inter_bank_fee_type', { length: 50 }).default('flat'), // flat, percent
  cardCommissionPercent: numeric('card_commission_percent', { precision: 6, scale: 2 }).default('0'),
  chequeClearingFee: numeric('cheque_clearing_fee', { precision: 10, scale: 2 }).default('0'),
  color: varchar('color', { length: 50 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accountTransactions = pgTable('account_transactions', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. tx-1787...
  accountId: varchar('account_id', { length: 100 }).references(() => accounts.id).notNull(),
  accountName: varchar('account_name', { length: 255 }),
  date: varchar('date', { length: 50 }), // YYYY-MM-DD
  type: varchar('type', { length: 50 }).notNull(), // income, expense, pos_settlement, folio_settlement, payroll_payout, transfer_in, transfer_out, adjustment, bank_fee, etc.
  direction: varchar('direction', { length: 10 }).notNull(), // in, out
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // in native currency
  amountUSD: numeric('amount_usd', { precision: 15, scale: 2 }).default('0'),
  amountLKR: numeric('amount_lkr', { precision: 15, scale: 2 }).default('0'),
  runningBalance: numeric('running_balance', { precision: 15, scale: 2 }).default('0'),
  feeAmount: numeric('fee_amount', { precision: 12, scale: 2 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).default('0'),
  payeeOrPayer: varchar('payee_or_payer', { length: 255 }),
  category: varchar('category', { length: 255 }),
  reference: varchar('reference', { length: 255 }),
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // order, expense, booking, payroll, transfer, manual
  relatedEntityId: varchar('related_entity_id', { length: 100 }),
  transferRelatedAccountId: varchar('transfer_related_account_id', { length: 100 }),
  transferRelatedAccountName: varchar('transfer_related_account_name', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- Expenses & Outflows ----
export const expenses = pgTable('expenses', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. exp-1787...
  expenseNumber: varchar('expense_number', { length: 100 }),
  date: varchar('date', { length: 50 }), // YYYY-MM-DD
  category: varchar('category', { length: 255 }),
  description: text('description'),
  amountUSD: numeric('amount_usd', { precision: 15, scale: 2 }).default('0'),
  amountLKR: numeric('amount_lkr', { precision: 15, scale: 2 }).default('0'),
  paidAmountUSD: numeric('paid_amount_usd', { precision: 15, scale: 2 }).default('0'),
  paidAmountLKR: numeric('paid_amount_lkr', { precision: 15, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).default('PAID'), // PAID, PENDING, PARTIAL, CANCELLED
  paymentMethod: varchar('payment_method', { length: 50 }),
  accountId: varchar('account_id', { length: 100 }).references(() => accounts.id),
  accountName: varchar('account_name', { length: 255 }),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  supplierName: varchar('supplier_name', { length: 255 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  items: jsonb('items').default([]), // ExpenseItem[]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const expenseItems = pgTable('expense_items', {
  id: serial('id').primaryKey(),
  expenseId: varchar('expense_id', { length: 100 }).references(() => expenses.id).notNull(),
  itemId: integer('item_id').references(() => items.id),
  note: varchar('note', { length: 255 }),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  qty: numeric('qty', { precision: 10, scale: 2 }).notNull(),
  vatPercent: numeric('vat_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
});

// ---- Payroll, Attendance & Employees ----
export const employees = pgTable('employees', {
  id: varchar('id', { length: 100 }).primaryKey(),
  fingerprintId: varchar('fingerprint_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  designation: varchar('designation', { length: 100 }),
  department: varchar('department', { length: 100 }),
  basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).default('0'),
  serviceIntensiveDefault: numeric('service_intensive_default', { precision: 12, scale: 2 }).default('0'),
  foodAllowanceDaily: numeric('food_allowance_daily', { precision: 12, scale: 2 }).default('0'),
  epfEligible: boolean('epf_eligible').default(false),
  epfNumber: varchar('epf_number', { length: 100 }),
  nicNumber: varchar('nic_number', { length: 100 }),
  bankName: varchar('bank_name', { length: 100 }),
  accountNumber: varchar('account_number', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 100 }),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const attendanceLogs = pgTable('attendance_logs', {
  id: varchar('id', { length: 100 }).primaryKey(),
  fingerprintId: varchar('fingerprint_id', { length: 50 }),
  employeeId: varchar('employee_id', { length: 100 }).references(() => employees.id),
  employeeName: varchar('employee_name', { length: 255 }),
  date: varchar('date', { length: 20 }).notNull(),
  clockIn: varchar('clock_in', { length: 20 }),
  clockOut: varchar('clock_out', { length: 20 }),
  hoursWorked: numeric('hours_worked', { precision: 10, scale: 2 }).default('0'),
  otHours: numeric('ot_hours', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }),
  deviceSource: varchar('device_source', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payrollRecords = pgTable('payroll_records', {
  id: varchar('id', { length: 100 }).primaryKey(),
  monthYear: varchar('month_year', { length: 20 }).notNull(),
  employeeId: varchar('employee_id', { length: 100 }).references(() => employees.id),
  employeeName: varchar('employee_name', { length: 255 }),
  fingerprintId: varchar('fingerprint_id', { length: 50 }),
  designation: varchar('designation', { length: 100 }),
  department: varchar('department', { length: 100 }),
  
  hoursWorked: numeric('hours_worked', { precision: 10, scale: 2 }).default('0'),
  otHours: numeric('ot_hours', { precision: 10, scale: 2 }).default('0'),
  otPay: numeric('ot_pay', { precision: 12, scale: 2 }).default('0'),
  
  basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).default('0'),
  serviceIntensive: numeric('service_intensive', { precision: 12, scale: 2 }).default('0'),
  serviceCharge: numeric('service_charge', { precision: 12, scale: 2 }).default('0'),
  foodAllowance: numeric('food_allowance', { precision: 12, scale: 2 }).default('0'),
  sp1: numeric('sp1', { precision: 12, scale: 2 }).default('0'),
  sp2: numeric('sp2', { precision: 12, scale: 2 }).default('0'),
  
  epf8: numeric('epf8', { precision: 12, scale: 2 }).default('0'),
  epf12: numeric('epf12', { precision: 12, scale: 2 }).default('0'),
  etf3: numeric('etf3', { precision: 12, scale: 2 }).default('0'),
  advances: numeric('advances', { precision: 12, scale: 2 }).default('0'),
  
  totalPay: numeric('total_pay', { precision: 12, scale: 2 }).default('0'),
  balancePay: numeric('balance_pay', { precision: 12, scale: 2 }).default('0'),
  
  paymentStatus: varchar('payment_status', { length: 50 }).default('unpaid'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentDate: varchar('payment_date', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---- Menu ----
export const menuItems = pgTable('menu_items', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  isVegetarian: boolean('is_vegetarian').default(false),
  isAvailable: boolean('is_available').default(true),
  portionInfo: varchar('portion_info', { length: 255 }),
  sides: text('sides'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- POS Carts ----
export const posCarts = pgTable('pos_carts', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posCartItems = pgTable('pos_cart_items', {
  id: varchar('id', { length: 100 }).primaryKey(),
  cartId: varchar('cart_id', { length: 100 }).references(() => posCarts.id).notNull(),
  menuItemId: varchar('menu_item_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }),
  price: numeric('price', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1).notNull(),
  selectedSides: jsonb('selected_sides'),
  notes: text('notes'),
  isVegetarian: boolean('is_vegetarian').default(false),
});
