export type OrderType = 'dine-in' | 'room-service' | 'takeaway' | 'poolside' | 'garden';

export type OrderStatus = 'active' | 'preparing' | 'served' | 'billed' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'room_charge' | 'bank_transfer';

export type ExpenseCategory = 
  | 'kitchen_food'
  | 'beverage_bar'
  | 'staff_payroll'
  | 'utilities_energy'
  | 'maintenance'
  | 'gas_fuel'
  | 'linens_amenities'
  | 'marketing'
  | 'other';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // in USD
  isVegetarian?: boolean;
  description?: string;
  portionInfo?: string;
  requiresSides?: boolean;
  maxSides?: number;
  availableSides?: string[];
  preparationTime?: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSides?: string[];
  notes?: string;
  isVegetarian?: boolean;
}

export interface WalkInSession {
  id: string;              // e.g. WI-1787242204708
  guestName: string;
  numberOfGuests: number;
  location: string;        // e.g. Table 01 (Main Dining)
  status: 'ACTIVE' | 'CHECKED_OUT';
  posBalance: number;
  createdAt: string;
  checkedOutAt?: string;
  invoiceId?: string;      // Link to the master Order ID (invoice)
  notes?: string;
}

export interface Order {
  id: string;
  sessionId?: string; // Link to WalkInSession
  bookingId?: string; // Link to Room Booking
  roomNumber?: string;
  orderNumber: string;
  invoiceNumber: string;
  orderType: OrderType;
  location: string; // e.g. Table 4, Chalet 102
  guestName?: string;
  guestCount?: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  serviceChargeRate: number; // e.g. 0.10
  serviceChargeAmount: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod?: PaymentMethod;
  accountId?: string; // Linked Bank or Cash Account ID
  accountName?: string;
  cashReceived?: number;
  changeDue?: number;
  createdAt: string; // ISO string
  updatedAt: string;
  paidAt?: string;
  cashierName: string;
  notes?: string;
}

export interface ExpenseLineItem {
  id: string; // internal id for array keys
  masterItemId?: string; // Reference to master item if applicable
  itemName: string;
  description?: string;
  price: number;
  quantity: number;
  vatPercent: number;
  total: number;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory; // Kept for high-level P&L
  categoryId?: string; // reference to MasterCategory if we link it
  amountUSD: number;
  amountLKR?: number;
  date: string; // YYYY-MM-DD
  vendor: string;
  supplierId?: string; // Reference to master supplier
  paymentMethod: PaymentMethod;
  accountId?: string; // Paid from Account ID (Bank, Cash, Credit Card, Loan)
  accountName?: string;
  notes?: string;
  invoiceRef?: string;
  receiptNumber?: string;
  
  currency: 'USD' | 'LKR';
  items: ExpenseLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  roundOff: number;
  finalTotal: number;
  status: 'PAID' | 'UNPAID';
  transferFee?: number;
  isInterBank?: boolean;
  chequeNumber?: string;

  createdAt: string;
}

export interface Settings {
  retreatName: string;
  retreatTagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  usdToLkrRate: number;
  defaultServiceChargeRate: number; // 0.10 (10%)
  taxRate: number;
  cashierName: string;
  pmsTaxRate?: number; // Accommodation tax
  pmsServiceChargeRate?: number; // Accommodation service charge
}

export interface PnLFilter {
  dateRange: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate?: string;
  endDate?: string;
}

// ----------------------------------------------------
// PROPERTY MANAGEMENT SYSTEM (PMS) & CHANNEL MANAGER TYPES
// ----------------------------------------------------

export type HousekeepingStatus = 'clean' | 'dirty' | 'cleaning_in_progress' | 'inspected' | 'maintenance';

export interface Room {
  id: string;
  number: string; // "101", "102", "103", "201", "202", "301", "302"
  name: string; // "Deluxe Room with Balcony Ground Floor", "Deluxe King Room with Garden", "Deluxe Room with Balcony"
  floor: string; // "Ground Floor", "1st Floor", "2nd Floor"
  basePriceUSD: number;
  capacity: { adults: number; children: number; maxGuests: number };
  bedType: string;
  amenities: string[];
  housekeepingStatus: HousekeepingStatus;
  isAvailableForOnlineBooking: boolean;
  notes?: string;
}

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type BookingChannel = 
  | 'direct_website' 
  | 'booking_com' 
  | 'agoda' 
  | 'airbnb' 
  | 'expedia' 
  | 'walk_in' 
  | 'phone_email';

export interface FolioExtraItem {
  id: string;
  date: string;
  category: 'restaurant_pos' | 'room_rate' | 'laundry' | 'spa' | 'sauna' | 'transport' | 'tour' | 'minibar' | 'experience' | 'other';
  description: string;
  amountUSD: number;
  quantity: number;
  orderId?: string; // Links to POS Order if charged from restaurant
  notes?: string;
  createdAt: string;
}

export interface BookingPayment {
  id: string;
  amountUSD: number;
  paymentMethod: PaymentMethod;
  accountId?: string; // Receiving account ID (Cash, Bank)
  accountName?: string;
  date: string;
  reference?: string;
  notes?: string;
}

export type PmsSubTab = 'calendar' | 'frontdesk' | 'reservations' | 'folios' | 'channel_manager';

export type MealPlan = 'room_only' | 'bed_and_breakfast' | 'half_board' | 'full_board' | 'all_inclusive';

export interface Booking {
  id: string;
  bookingReference: string; // e.g. "HR-BK-2026-081"
  channel: BookingChannel;
  channelReservationId?: string; // e.g. "BK-984210948" from Booking.com or "HM-94812" from Airbnb
  roomNumber: string; // "101", "102", "103", "201", "202", "301", "302"
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry?: string;
  passportOrId?: string;
  adultsCount: number;
  childrenCount?: number;
  childrenAges?: number[];
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: BookingStatus;
  mealPlan?: MealPlan;
  ratePerNightUSD: number;
  nights: number;
  roomTotalUSD: number;
  serviceChargeUSD: number;
  taxAmountUSD: number;
  folioCharges: FolioExtraItem[];
  payments: BookingPayment[];
  paymentStatus: 'pending' | 'partially_paid' | 'paid_in_full';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelConfig {
  id: BookingChannel;
  channel?: BookingChannel;
  name: string;
  icon: string;
  status?: 'connected' | 'syncing' | 'paused' | 'setup_required';
  connectionStatus?: 'connected' | 'syncing' | 'paused' | 'setup_required';
  isEnabled?: boolean;
  lastSyncAt?: string;
  commissionRate: number; // percentage, e.g. 15%
  markupPercentage?: number;
  minStayNights?: number;
  stopSell?: boolean;
  autoRateSync?: boolean;
  autoAvailabilitySync?: boolean;
  activeListingsCount?: number;
  iCalExportUrl?: string;
  iCalImportUrl?: string;
  apiCredentialsSet?: boolean;
}

export interface ChannelSyncLog {
  id: string;
  timestamp: string;
  channel: BookingChannel;
  action?: 'rates_pushed' | 'availability_pushed' | 'booking_imported' | 'booking_modified' | 'ical_synced' | 'stop_sell_updated';
  actionType?: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
  message?: string;
}

// ----------------------------------------------------
// STAFF & PAYROLL SYSTEM TYPES
// ----------------------------------------------------

export interface Employee {
  id: string;
  fingerprintId: string; // Device ID in biometric machine (e.g. "101", "102")
  name: string;
  designation: string;
  department: 'Management' | 'Kitchen' | 'Service' | 'Housekeeping' | 'Maintenance' | 'Front Desk';
  basicSalary: number; // e.g. 30000.00
  serviceIntensiveDefault: number;
  foodAllowanceDaily?: number;
  epfEligible: boolean; // 8% deduction, 12% + 3% employer
  epfNumber?: string;
  nicNumber?: string;
  bankName?: string;
  accountNumber?: string;
  contactPhone?: string;
  active: boolean;
  joinedDate?: string;
}

export interface PayrollRecord {
  id: string;
  monthYear: string; // e.g. "2026-07", "2026-08"
  employeeId: string;
  employeeName: string;
  fingerprintId?: string;
  designation?: string;
  department?: string;

  // Working Hours (from Biometric machine / manual override)
  hoursWorked: number; // e.g. 203.4
  otHours: number; // e.g. 63.8
  otPay: number; // e.g. 11626.52

  // Earnings
  basicSalary: number; // e.g. 30000.00
  serviceIntensive: number; // e.g. 70000.00 (Service Incentive)
  serviceCharge: number; // e.g. 34615.38 (10% service charge pool share)
  foodAllowance: number; // e.g. 16100.00
  sp1: number; // Special Pay 1 (e.g. 5000.00)
  sp2: number; // Special Pay 2 (e.g. 775.00)

  // Deductions & Statutory Funds (Sri Lanka EPF / ETF standard)
  epf8: number; // Employee EPF (8% = 2400.00)
  epf12: number; // Employer EPF (12% = 3600.00)
  etf3: number; // Employer ETF (3% = 900.00)
  advances: number; // Salary advances deducted (e.g. 15000.00)

  // Calculated Totals
  totalPay: number; // Gross earnings
  balancePay: number; // Net Pay to disburse

  // Status & Audit
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'bank_transfer' | 'cash' | 'cheque';
  paymentDate?: string;
  notes?: string;
}

export interface BiometricAttendanceLog {
  id: string;
  fingerprintId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string; // HH:mm
  hoursWorked: number;
  otHours: number;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'leave';
  deviceSource?: string;
}

export interface PayrollMonthSummary {
  monthYear: string;
  totalPayroll: number;
  balancePay: number;
  totalEpfCombined: number; // EPF 8% + 12%
  totalEpf8: number;
  totalEpf12: number;
  totalEtf3: number;
  totalSpecialPay: number; // SP1 + SP2
  totalServiceCharge: number;
  totalServiceIntensive: number;
  totalFoodAllowance: number;
  totalAdvances: number;
  totalOtPay: number;
  totalBasic: number;
  employeeCount: number;
  isPostedToExpenses: boolean;
}

// ----------------------------------------------------
// ACCOUNTING & TREASURY MANAGEMENT TYPES
// ----------------------------------------------------

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'loan';

export interface Account {
  id: string;
  name: string; // e.g., "Commercial Bank - LKR Main Operations", "Front Desk Cash Drawer", "Sampath Corporate VISA"
  type: AccountType; // 'bank' | 'cash' | 'credit_card' | 'loan'
  accountNumber: string; // Masked or internal code
  bankName?: string; // "Commercial Bank of Ceylon", "Bank of Ceylon", "Sampath Bank", "HNB", etc.
  currency: 'USD' | 'LKR';
  balance: number; // For cash/bank: available balance. For credit_card/loan: outstanding liability balance.
  openingBalance: number;
  openingDate: string;
  
  // Specific properties for Banks, Credit Cards & Loans:
  branch?: string;
  creditLimit?: number; // for credit_card
  billingCycleDay?: number;
  initialLoanAmount?: number; // for loan
  principalAmount?: number;
  loanTermMonths?: number;
  monthlyInstallment?: number;
  interestRate?: number; // annual percentage rate (APR)
  dueDate?: string; // e.g. "25th of month"
  monthlyPayment?: number; // Estimated monthly repayment / EMI
  
  // Banking Charges & Merchant Commission Rates:
  interBankTransferFee?: number; // e.g. 50 (flat fee in LKR/USD) or percentage
  interBankFeeType?: 'flat' | 'percent'; // 'flat' | 'percent' (default flat)
  cardCommissionPercent?: number; // e.g. 2.5 (%) card machine POS/merchant fee
  chequeClearingFee?: number; // e.g. 0
  
  // Customization & Meta:
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountTransactionType = 
  | 'income' 
  | 'expense' 
  | 'pos_settlement' 
  | 'folio_settlement' 
  | 'payroll_payout' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'credit_card_charge' 
  | 'credit_card_payment' 
  | 'loan_draw' 
  | 'loan_repayment' 
  | 'adjustment'
  | 'bank_fee';

export interface AccountTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string; // YYYY-MM-DD
  type: AccountTransactionType;
  direction: 'in' | 'out'; // 'in' = Money received / liability repaid; 'out' = Money spent / liability drawn
  amount: number; // in native currency of this account
  amountUSD: number; // normalized USD
  amountLKR: number; // normalized LKR
  runningBalance: number; // balance after transaction in native currency
  feeAmount?: number; // Bank fee / card commission deducted
  netAmount?: number; // Net amount after fee
  payeeOrPayer?: string; // Guest, Supplier, Employee, Bank
  category?: string; // POS Revenue, Folio Settlement, Food & Kitchen, Payroll, etc.
  reference?: string; // Invoice #, Expense Ref, Booking Ref, Cheque #
  relatedEntityType?: 'order' | 'expense' | 'booking' | 'payroll' | 'transfer' | 'manual';
  relatedEntityId?: string;
  transferRelatedAccountId?: string;
  transferRelatedAccountName?: string;
  notes?: string;
  createdAt: string;
}

export interface FundTransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number; // In source account currency
  targetAmount?: number; // In destination account currency (if cross-currency)
  exchangeRate?: number;
  date: string;
  reference?: string;
  notes?: string;
}

export interface AccountSummaryMetrics {
  totalCashAndBankUSD: number;
  totalCashAndBankLKR: number;
  totalCreditCardLiabilityUSD: number;
  totalCreditCardLiabilityLKR: number;
  totalLoanLiabilityUSD: number;
  totalLoanLiabilityLKR: number;
  netLiquidityUSD: number;
  netLiquidityLKR: number;
}

// User Profile & Role-Based Access Control (RBAC)
export type UserRole = 'admin' | 'manager' | 'user';

export type AppModuleId = 
  | 'pms' 
  | 'pos' 
  | 'orders' 
  | 'invoices' 
  | 'expenses' 
  | 'pnl' 
  | 'menu' 
  | 'payroll' 
  | 'accounts'
  | 'masters'
  | 'users';

export interface ModuleDefinition {
  id: AppModuleId;
  name: string;
  shortName: string;
  category: 'Front Office' | 'Food & Beverage' | 'Finance & Accounts' | 'Human Resources' | 'Administration';
  description: string;
  iconName: string;
  defaultRoles: UserRole[];
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  designation: string;
  avatarColor?: string;
  pinCode?: string;
  allowedModules: AppModuleId[];
  canManageUsers?: boolean;
  canExportReports?: boolean;
  canDeleteRecords?: boolean;
  notes?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  isLocked: boolean;
  loggedInAt?: string;
  stationName?: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: UserProfile;
  token?: string;
}

// ----------------------------------------------------
// CORE REFERENCE DATA & MASTERS MODULE TYPES
// ----------------------------------------------------

export type MastersSubTab = 'items' | 'suppliers' | 'customers' | 'categories' | 'sources';

// 1. Categories Master (P&L Chart of Accounts - strictly 1-level hierarchy)
export type MasterCategoryType = 'INCOME' | 'EXPENSE';

export interface MasterCategory {
  id: string;
  name: string;
  type: MasterCategoryType;
  parentId?: string; // Optional root category ID. Max 1-level hierarchy.
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 2. Items Master & Bill of Materials (BOM)
export type ItemType = 'RAW' | 'RESALE' | 'RECIPE' | 'EXPENSE' | 'RAW_MATERIAL';
export type UnitOfMeasure = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'portion' | 'bottle' | 'can' | 'pack' | 'tray' | 'service' | 'month' | 'trip' | 'box';

export interface BOMIngredient {
  ingredientItemId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitOfMeasure;
  costEstimateUSD?: number;
}

export interface MasterItem {
  id: string;
  name: string;
  type: ItemType;
  categoryId: string;
  categoryName: string;
  unit: UnitOfMeasure;
  costPriceUSD: number;
  sellingPriceUSD: number;
  currentStock: number;
  reorderThreshold: number; // Low stock alert triggered when currentStock <= reorderThreshold
  isAvailable: boolean;
  useInInvoices?: boolean;
  useInExpenses?: boolean;
  showInPos?: boolean;
  bom?: BOMIngredient[]; // For RECIPE items
  description?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Suppliers Master & Accounts Payable (AP) Ledger
export interface SupplierPaymentEntry {
  id: string;
  date: string;
  amountUSD: number;
  amountLKR?: number;
  paymentMethod: PaymentMethod;
  accountId?: string;
  accountName?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierPurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitCostUSD: number;
  totalCostUSD: number;
}

export interface SupplierPurchaseInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  items: SupplierPurchaseItem[];
  subtotalUSD: number;
  taxUSD: number;
  totalAmountUSD: number;
  amountPaidUSD: number;
  balanceOwedUSD: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  paymentHistory: SupplierPaymentEntry[];
  notes?: string;
  createdAt: string;
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'PURCHASE_INVOICE' | 'PAYMENT' | 'OPENING_BALANCE' | 'CREDIT_NOTE';
  reference: string;
  description: string;
  debitUSD: number; // Purchase / bill amount
  creditUSD: number; // Payment made
  runningBalanceUSD: number; // Balance owed after transaction
  createdAt: string;
}

export interface MasterSupplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  openingBalanceUSD: number;
  currentBalanceOwedUSD: number; // Outstanding accounts payable debt
  bankDetails?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 4. Customers Master (Guests & Walk-Ins)
export type CustomerType = 'ROOM_GUEST' | 'WALK_IN' | 'VIP' | 'CORPORATE';

export interface MasterCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  passportOrId?: string;
  customerType: CustomerType;
  businessSourceId?: string;
  businessSourceName?: string;
  notes?: string;
  lifetimeSpendUSD: number;
  totalVisits: number;
  lastVisitDate?: string;
  roomNumbersStayed?: string[];
  createdAt: string;
  updatedAt: string;
}

// 5. Business Sources Master
export interface MasterBusinessSource {
  id: string;
  name: string; // e.g. Direct Booking, Booking.com, Agoda, Airbnb, Walk-In, Corporate
  commissionPercent: number; // Commission % e.g. 15 for Booking.com, 0 for Direct
  contactInfo?: string;
  notes?: string;
  totalBookingsGenerated?: number;
  totalRevenueGeneratedUSD?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}





