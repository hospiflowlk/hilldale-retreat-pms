import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../data/menuData';
import { useSettings } from '../hooks/useSettings';
import { useCart } from '../hooks/useCart';
import { useUsers } from '../hooks/useUsers';
import { 
  MenuItem, 
  Order, 
  WalkInSession,
  OrderItem, 
  Expense, 
  Settings, 
  OrderType,
  PaymentMethod,
  PnLFilter,
  Room,
  Booking,
  ChannelConfig,
  ChannelSyncLog,
  HousekeepingStatus,
  FolioExtraItem,
  BookingPayment,
  BookingChannel,
  PmsSubTab,
  Employee,
  PayrollRecord,
  BiometricAttendanceLog,
  PayrollMonthSummary,
  Account,
  AccountType,
  AccountTransaction,
  AccountTransactionType,
  FundTransferRequest,
  AccountSummaryMetrics,
  UserProfile,
  UserRole,
  AppModuleId,
  LoginResult,
  MasterCategory,
  MasterItem,
  MasterSupplier,
  SupplierPurchaseInvoice,
  SupplierPaymentEntry,
  SupplierLedgerEntry,
  MasterCustomer,
  MasterBusinessSource,
  MastersSubTab,
  MasterCategoryType,
  ItemType,
  UnitOfMeasure
} from '../types';
import { apiClient } from '../utils/apiClient';

interface AppContextType {
  // Navigation & Sidebar
  activeTab: 'pos' | 'orders' | 'invoices' | 'expenses' | 'pnl' | 'menu' | 'pms' | 'payroll' | 'accounts' | 'masters' | 'users';
  setActiveTab: (tab: 'pos' | 'orders' | 'invoices' | 'expenses' | 'pnl' | 'menu' | 'pms' | 'payroll' | 'accounts' | 'masters' | 'users') => void;
  pmsSubTab: PmsSubTab;
  setPmsSubTab: (tab: PmsSubTab) => void;
  activePmsSubTab: PmsSubTab;
  setActivePmsSubTab: (tab: PmsSubTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;

  // Settings
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;

  // Menu State
  menuItems: MenuItem[];
  toggleItemAvailability: (id: string) => void;
  updateMenuItemPrice: (id: string, newPrice: number) => void;

  // Current POS Cart / Draft Order
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;
  currentOrderType: OrderType;
  setCurrentOrderType: (type: OrderType) => void;
  guestName: string;
  setGuestName: (name: string) => void;
  currentSessionId?: string;
  setCurrentSessionId: (id?: string) => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  cartItems: OrderItem[];
  addToCart: (item: MenuItem, selectedSides?: string[], notes?: string, quantity?: number) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  updateCartItemNote: (index: number, notes: string) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  applyServiceCharge: boolean;
  setApplyServiceCharge: (apply: boolean) => void;

  // Calculated Cart Totals
  cartSubtotal: number;
  cartServiceCharge: number;
  cartDiscount: number;
  cartTax: number;
  cartGrandTotal: number;

  // Orders & Invoices State
  orders: Order[];
  walkInSessions: WalkInSession[];
  createWalkInSession: (guestName: string, guestCount?: number, location?: string, notes?: string) => WalkInSession;
  deleteWalkInSession: (sessionId: string) => void;
  checkoutWalkInSession: (sessionId: string, paymentMethod: PaymentMethod, accountId?: string, cashGiven?: number) => void;
  unCheckoutWalkInSession: (sessionId: string) => void;
  repostWalkInBill: (sessionId: string) => void;
  createOrder: (status?: 'active' | 'preparing' | 'served' | 'paid', paymentMethod?: PaymentMethod, cashGiven?: number, extraNotes?: string, accountId?: string, sessionId?: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  settleOrderPayment: (orderId: string, paymentMethod: PaymentMethod, cashReceived?: number) => void;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string, managerPin: string, reason?: string) => { success: boolean; message?: string };
  verifyManagerPin: (pin: string) => { success: boolean; manager?: UserProfile; message?: string };
  activeOrderToEdit: Order | null;
  loadOrderIntoCart: (order: Order) => void;
  loadWalkInSessionIntoCart: (sessionId: string) => void;
  orderToDelete: Order | null;
  setOrderToDelete: (order: Order | null) => void;
  isDeleteOrderModalOpen: boolean;
  setIsDeleteOrderModalOpen: (open: boolean) => void;
  openDeleteOrderModal: (order: Order) => void;

  // Expenses State
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;

  // Property Management System (PMS) & Rooms
  rooms: Room[];
  updateRoom: (room: Room) => void;
  updateHousekeepingStatus: (roomNumber: string, status: HousekeepingStatus) => void;
  
  // Bookings & Reservations
  bookings: Booking[];
  addBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'bookingReference'>) => Booking;
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'bookingReference'>) => Booking;
  updateBooking: (booking: Booking) => void;
  checkInGuest: (bookingId: string) => void;
  checkOutGuest: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;
  deleteBooking: (bookingId: string) => void;
  getCheckedInGuest: (roomNumber: string) => Booking | undefined;
  extractRoomNumber: (location: string) => string;
  
  // Folio & Extra Charges
  addFolioItemToRoom: (roomNumber: string, item: Omit<FolioExtraItem, 'id' | 'createdAt'>) => boolean;
  addBookingPayment: (bookingId: string, payment: Omit<BookingPayment, 'id'>) => void;
  removeFolioItem: (bookingId: string, folioItemId: string) => void;

  // Channel Manager State & Actions
  channels: ChannelConfig[];
  syncLogs: ChannelSyncLog[];
  triggerChannelSync: (channelId?: BookingChannel) => void;
  updateChannelConfig: (channelIdOrConfig: BookingChannel | ChannelConfig | string, partial?: Partial<ChannelConfig>) => void;
  isSyncingChannels: boolean;
  lastChannelSyncTime: string | null;

  // PMS Modals
  selectedBookingForFolio: Booking | null;
  setSelectedBookingForFolio: (b: Booking | null) => void;
  selectedBookingForDetails: Booking | null;
  setSelectedBookingForDetails: (b: Booking | null) => void;
  isNewBookingModalOpen: boolean;
  setIsNewBookingModalOpen: (open: boolean) => void;
  isEditBookingModalOpen: boolean;
  setIsEditBookingModalOpen: (open: boolean) => void;
  bookingToEdit: Booking | null;
  setBookingToEdit: (b: Booking | null) => void;
  newBookingPreselectedRoom: string | null;
  setNewBookingPreselectedRoom: (room: string | null) => void;
  newBookingPreselectedDate: string | null;
  setNewBookingPreselectedDate: (date: string | null) => void;

  // Staff & Payroll Management
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  payrollRecords: PayrollRecord[];
  selectedPayrollMonth: string; // e.g. "2026-07"
  setSelectedPayrollMonth: (month: string) => void;
  updatePayrollRecord: (record: PayrollRecord) => void;
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => PayrollRecord;
  deletePayrollRecord: (id: string) => void;
  biometricLogs: BiometricAttendanceLog[];
  importBiometricAttendanceLogs: (logs: BiometricAttendanceLog[], targetMonthYear?: string) => void;
  distributeServiceChargePool: (monthYear: string, totalPoolAmount: number) => void;
  postPayrollToExpenses: (monthYear: string, accountId?: string) => boolean;
  selectedPayrollRecordForEdit: PayrollRecord | null;
  setSelectedPayrollRecordForEdit: (r: PayrollRecord | null) => void;
  selectedPayrollRecordForPayslip: PayrollRecord | null;
  setSelectedPayrollRecordForPayslip: (r: PayrollRecord | null) => void;
  isBiometricImportModalOpen: boolean;
  setIsBiometricImportModalOpen: (open: boolean) => void;
  isNewEmployeeModalOpen: boolean;
  setIsNewEmployeeModalOpen: (open: boolean) => void;

  // Accounting & Treasury Management
  accounts: Account[];
  accountTransactions: AccountTransaction[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  addAccount: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => boolean;
  deleteAccountTransaction: (id: string) => boolean;
  clearAllAccountTransactions: () => void;
  transferFunds: (req: FundTransferRequest) => { success: boolean; message?: string };
  repayLiability: (liabilityAccountId: string, fromAccountId: string, amount: number, date: string, reference?: string, notes?: string) => boolean;
  adjustAccountBalance: (accountId: string, newBalance: number, reason: string, date: string) => void;
  recordDirectTransaction: (accountId: string, type: 'income' | 'expense', amount: number, payeeOrPayer: string, category: string, date: string, reference?: string, notes?: string) => AccountTransaction | null;
  accountSummaryMetrics: AccountSummaryMetrics;
  isNewAccountModalOpen: boolean;
  setIsNewAccountModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  isAdjustBalanceModalOpen: boolean;
  setIsAdjustBalanceModalOpen: (open: boolean) => void;
  isRecordTxModalOpen: boolean;
  setIsRecordTxModalOpen: (open: boolean) => void;
  accountModalInitialType?: AccountType;
  setAccountModalInitialType: (type?: AccountType) => void;
  accountForAdjustment: Account | null;
  setAccountForAdjustment: (acc: Account | null) => void;
  accountToEdit: Account | null;
  setAccountToEdit: (acc: Account | null) => void;
  accountForRecordTx: Account | null;
  setAccountForRecordTx: (acc: Account | null) => void;
  finalizePayment: (paymentMethod: PaymentMethod, notes?: string, accountId?: string, cashReceived?: number) => Order;

  // Modals & UI helpers
  selectedOrderForReceipt: Order | null;
  setSelectedOrderForReceipt: (order: Order | null) => void;
  selectedOrderForKOT: Order | null;
  setSelectedOrderForKOT: (order: Order | null) => void;
  selectedItemForModifier: MenuItem | null;
  setSelectedItemForModifier: (item: MenuItem | null) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isAddExpenseModalOpen: boolean;
  setIsAddExpenseModalOpen: (open: boolean) => void;
  editingExpenseId: string | null;
  setEditingExpenseId: (id: string | null) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  // User Profiles & Access Control
  users: UserProfile[];
  currentUser: UserProfile;
  setCurrentUserById: (id: string) => void;
  addUser: (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => UserProfile;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  isUserAllowedModule: (moduleId: AppModuleId) => boolean;
  isNewUserModalOpen: boolean;
  setIsNewUserModalOpen: (open: boolean) => void;
  userToEdit: UserProfile | null;
  setUserToEdit: (user: UserProfile | null) => void;
  isSwitchUserModalOpen: boolean;
  setIsSwitchUserModalOpen: (open: boolean) => void;

  // Authentication & Station Lock
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (identifier: string, secret: string) => LoginResult;
  quickPinLogin: (userId: string, pin: string) => LoginResult;
  logout: () => void;
  setSession: (userId: string, token: string) => void;
  lockSession: () => void;
  unlockSession: (pinOrPassword: string) => boolean;

  // Master Reference Data & Catalogs
  mastersSubTab: MastersSubTab;
  setMastersSubTab: (tab: MastersSubTab) => void;
  
  // Master Categories
  masterCategories: MasterCategory[];
  addMasterCategory: (categoryData: Omit<MasterCategory, 'id' | 'createdAt' | 'updatedAt'>) => MasterCategory;
  updateMasterCategory: (id: string, updates: Partial<MasterCategory>) => void;
  deleteMasterCategory: (id: string) => { success: boolean; message?: string };
  deleteAllMasterCategories: () => void;
  bulkImportMasterCategories: (
    categories: Array<{
      id?: string;
      name: string;
      type: MasterCategoryType;
      parentId?: string;
      description?: string;
      color?: string;
      isActive: boolean;
    }>
  ) => void;
  
  // Master Items
  masterItems: MasterItem[];
  addMasterItem: (itemData: Omit<MasterItem, 'id' | 'createdAt' | 'updatedAt'>) => MasterItem;
  updateMasterItem: (id: string, updates: Partial<MasterItem>) => void;
  deleteMasterItem: (id: string) => { success: boolean; message?: string };
  deleteAllMasterItems: () => void;
  adjustItemStock: (itemId: string, delta: number, reason?: string) => void;
  bulkImportMasterItems: (
    items: Array<{
      id?: string;
      name: string;
      type: ItemType;
      categoryId?: string;
      categoryName?: string;
      unit: UnitOfMeasure;
      costPriceUSD: number;
      sellingPriceUSD: number;
      currentStock: number;
      reorderThreshold: number;
      barcode?: string;
      description?: string;
      isAvailable?: boolean;
    }>,
    options?: { updateExisting: boolean; createMissingCategories: boolean }
  ) => { inserted: number; updated: number; errorCount: number };
  
  // Master Suppliers & Accounts Payable
  masterSuppliers: MasterSupplier[];
  supplierPurchases: SupplierPurchaseInvoice[];
  addMasterSupplier: (supplierData: Omit<MasterSupplier, 'id' | 'createdAt' | 'updatedAt'>) => MasterSupplier;
  updateMasterSupplier: (id: string, updates: Partial<MasterSupplier>) => void;
  deleteMasterSupplier: (id: string) => { success: boolean; message?: string };
  deleteAllMasterSuppliers: () => void;
  bulkImportMasterSuppliers: (
    suppliers: Array<{
      id?: string;
      companyName: string;
      contactPerson: string;
      phone: string;
      email: string;
      address: string;
      taxNumber: string;
      openingBalanceUSD: number;
      bankDetails?: string;
      isActive: boolean;
    }>
  ) => void;
  recordSupplierPurchase: (purchaseData: Omit<SupplierPurchaseInvoice, 'id' | 'createdAt'>) => SupplierPurchaseInvoice;
  recordSupplierPayment: (invoiceId: string, paymentData: Omit<SupplierPaymentEntry, 'id' | 'createdAt'>) => void;
  getSupplierLedger: (supplierId: string) => SupplierLedgerEntry[];
  
  // Master Customers
  masterCustomers: MasterCustomer[];
  addOrUpdateCustomer: (customerData: Partial<MasterCustomer> & { name: string; phone?: string; email?: string }) => MasterCustomer;
  deleteCustomer: (id: string) => { success: boolean; message?: string };
  
  // Master Business Sources
  masterBusinessSources: MasterBusinessSource[];
  addMasterBusinessSource: (sourceData: Omit<MasterBusinessSource, 'id' | 'createdAt' | 'updatedAt'>) => MasterBusinessSource;
  updateMasterBusinessSource: (id: string, updates: Partial<MasterBusinessSource>) => void;
  deleteMasterBusinessSource: (id: string) => { success: boolean; message?: string };

  // Currency helper
  formatCurrency: (amountUSD: number, showLKR?: boolean) => string;

  // Data reset / clear
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'hilldale_pos_settings_v4',
  MENU: 'hilldale_pos_menu_v4',
  ATTENDANCE: 'hilldale_payroll_attendance_v2',
  ACCOUNT_TRANSACTIONS: 'hilldale_treasury_transactions_v2',
  CURRENT_USER_ID: 'hilldale_current_user_id_v2',
  AUTH_STATE: 'hilldale_auth_is_authenticated_v2',
  IS_LOCKED: 'hilldale_auth_is_locked_v2',
  SUPPLIER_PURCHASES: 'hilldale_supplier_purchases_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [currentLocation, setCurrentLocation] = useState<string>('Main Restaurant');
  const [currentOrderType, setCurrentOrderType] = useState<OrderType>('dine-in');
  const [guestCount, setGuestCount] = useState<number>(1);


  const { settings: dbSettings, updateSettings } = useSettings();
  const settings = dbSettings || DEFAULT_SETTINGS;
  const {
    activeCart,
    activeCartId,
    setAndSaveCartId,
    createCartAsync,
    updateCartAsync,
    addItemAsync,
    updateItem,
    removeItem,
    deleteCart
  } = useCart();

  const cartItems = (activeCart?.items || []) as any; // Cast as any if OrderItem interface differs slightly
  const discountPercent = Number(activeCart?.discountPercent || 0);
  const orderNotes = activeCart?.notes || '';
  const guestName = activeCart?.name || '';
  const currentSessionId = activeCartId || undefined;

  const ensureCart = async () => {
    if (activeCartId) return activeCartId;
    const cart = await createCartAsync({ name: 'Walk-in Guest', discountPercent: 0, notes: '', status: 'active' });
    return cart.id;
  };

  const setDiscountPercent = async (percent: number) => {
    const cid = await ensureCart();
    updateCartAsync({ id: cid, data: { discountPercent: percent } });
  };
  const setOrderNotes = async (notes: string) => {
    const cid = await ensureCart();
    updateCartAsync({ id: cid, data: { notes } });
  };
  const setGuestName = async (name: string) => {
    const cid = await ensureCart();
    updateCartAsync({ id: cid, data: { name } });
  };
  const setCurrentSessionId = (id: string | undefined) => {
    setAndSaveCartId(id || null);
  };
  const [activeOrderToEdit, setActiveOrderToEdit] = useState<Order | null>(null);
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);
  
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [selectedOrderForKOT, setSelectedOrderForKOT] = useState<Order | null>(null);
  const [selectedItemForModifier, setSelectedItemForModifier] = useState<MenuItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  
  const [selectedBookingForFolio, setSelectedBookingForFolio] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState<boolean>(false);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState<boolean>(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [newBookingPreselectedRoom, setNewBookingPreselectedRoom] = useState<string | null>(null);
  const [newBookingPreselectedDate, setNewBookingPreselectedDate] = useState<string | null>(null);

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState<boolean>(false);
  
  const [currentUserId, setCurrentUserId] = useState<string>('usr-1');

  const { users = [] } = useUsers();
  const currentUser = users.find(u => u.id === currentUserId) || users[0] || {
    id: 'usr-1',
    name: 'Staff User',
    username: 'staff',
    email: 'staff@hilldaleretreat.com',
    role: 'admin',
    department: 'Management',
    designation: 'Resort Administrator',
    avatarColor: 'bg-primary',
    isActive: true,
    allowedModules: ['pms', 'pos', 'orders', 'invoices', 'expenses', 'pnl', 'menu', 'payroll', 'accounts', 'masters', 'users'],
    canManageUsers: true,
    canExportReports: true,
    canDeleteRecords: true,
  };

  const setCurrentUserById = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER_ID, userId);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const openDeleteOrderModal = (o: Order) => { setOrderToDelete(o); setIsDeleteOrderModalOpen(true); };
  const loadOrderIntoCart = () => {};

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'invoices' | 'expenses' | 'pnl' | 'menu' | 'pms' | 'payroll' | 'accounts' | 'masters' | 'users'>('pms');
  const [pmsSubTab, setPmsSubTab] = useState<'calendar' | 'frontdesk' | 'reservations' | 'folios' | 'channel_manager'>('calendar');
  const [mastersSubTab, setMastersSubTab] = useState<MastersSubTab>('items');
  
  // Orders
  
  // Walk-In Sessions
  
  // PMS: Rooms (101, 102, 103, 201, 202, 301, 302)
  
  // PMS: Bookings
  
  // PMS: Channels
  
  // PMS: Channel Sync Logs
  
  // Staff & Payroll Management
  
  
  
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>('2026-07');
  const [selectedPayrollRecordForEdit, setSelectedPayrollRecordForEdit] = useState<PayrollRecord | null>(null);
  const [selectedPayrollRecordForPayslip, setSelectedPayrollRecordForPayslip] = useState<PayrollRecord | null>(null);
  const [isBiometricImportModalOpen, setIsBiometricImportModalOpen] = useState<boolean>(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState<boolean>(false);

  // Accounting & Treasury Management State
  
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState<boolean>(false);
  const [isRecordTxModalOpen, setIsRecordTxModalOpen] = useState<boolean>(false);
  const [accountModalInitialType, setAccountModalInitialType] = useState<AccountType | undefined>(undefined);
  const [accountForAdjustment, setAccountForAdjustment] = useState<Account | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountForRecordTx, setAccountForRecordTx] = useState<Account | null>(null);

  // User Profile & RBAC Portal State
  
  
  
  
  
  
  
  // Authentication & Session Lock
  






































































































  // Cart operations
  const addToCart = async (item: MenuItem, selectedSides?: string[], notes?: string, quantity: number = 1) => {
    const qty = quantity && quantity > 0 ? quantity : 1;
    const cid = await ensureCart();
    
    const existing = cartItems.find((ci: any) => ci.menuItemId === item.id && JSON.stringify(ci.selectedSides || []) === JSON.stringify(selectedSides || []) && (ci.notes || '') === (notes || ''));
    if (existing) {
       updateItem({ cartId: cid, itemId: existing.id, data: { quantity: existing.quantity + qty } });
    } else {
       await addItemAsync({ cartId: cid, item: { menuItemId: item.id, name: item.name, price: item.price, quantity: qty, selectedSides, notes, isVegetarian: item.isVegetarian } });
    }
  };

  const updateCartItemQty = async (index: number, delta: number) => {
    const item = cartItems[index];
    if (!item || !activeCartId) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem({ cartId: activeCartId, itemId: item.id });
    } else {
      updateItem({ cartId: activeCartId, itemId: item.id, data: { quantity: newQty } });
    }
  };

  const updateCartItemNote = async (index: number, notes: string) => {
    const item = cartItems[index];
    if (!item || !activeCartId) return;
    updateItem({ cartId: activeCartId, itemId: item.id, data: { notes } });
  };

  const removeFromCart = async (index: number) => {
    const item = cartItems[index];
    if (!item || !activeCartId) return;
    removeItem({ cartId: activeCartId, itemId: item.id });
  };

  const clearCart = () => {
    if (activeCartId) deleteCart(activeCartId);
    setActiveOrderToEdit(null);
  };

  // Cart Calculations
  const cartSubtotal = (cartItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartDiscount = Number(((cartSubtotal * discountPercent) / 100).toFixed(2));
  const taxableBase = Math.max(0, cartSubtotal - cartDiscount);
  const cartServiceCharge = applyServiceCharge ? Number((taxableBase * (settings.defaultServiceChargeRate || 0.10)).toFixed(2)) : 0;
  const cartTax = Number((taxableBase * (settings.taxRate || 0)).toFixed(2));
  const cartGrandTotal = Number((taxableBase + cartServiceCharge + cartTax).toFixed(2));

  // Currency Formatter
  const formatCurrency = (amountUSD: number, showLKR: boolean = false) => {
    const val = Number(amountUSD) || 0;
    const usdStr = `$${val.toFixed(2)}`;
    if (!showLKR) return usdStr;
    const lkrVal = Math.round(val * (settings?.usdToLkrRate || 305));
    return `${usdStr} (Rs. ${lkrVal.toLocaleString()})`;
  };


  const isUserAllowedModule = (moduleId: string): boolean => {
    // Rely on backend for strict checks, frontend just hides UI
    return true; 
  };

  const verifyManagerPin = (pin: string): boolean => {
    return pin === 'admin123' || pin === '1234';
  };

  const setSession = (userId: string, token: string) => {
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    setIsLocked(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_STATE, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER_ID, userId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOCKED, 'false');
    localStorage.setItem('hld_token', token);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsLocked(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_STATE, 'false');
    localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOCKED, 'false');
  };

  const lockSession = () => {
    setIsLocked(true);
    localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOCKED, 'true');
  };

  const unlockSession = (pinOrPassword: string): boolean => {
    setIsLocked(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.IS_LOCKED, 'false');
    return true;
  };

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUserById,
        currentLocation, setCurrentLocation, currentOrderType, setCurrentOrderType, guestCount, setGuestCount,
        activeTab,
        setActiveTab,
        pmsSubTab,
        setPmsSubTab,
        activePmsSubTab: pmsSubTab,
        setActivePmsSubTab: setPmsSubTab,
        // Masters Module
        mastersSubTab,
        setMastersSubTab,

        // Add dummy values to prevent crashes until they are fully migrated to the backend
        supplierPurchases: [],
        masterSuppliers: [],
        recordSupplierPayment: () => ({ success: true, message: 'Not implemented backend yet' }),
        recordSupplierPurchase: () => ({ success: true, message: 'Not implemented backend yet' }),
        bulkImportMasterSuppliers: () => {},
        addMasterSupplier: () => ({} as any),
        updateMasterSupplier: () => {},
        deleteMasterSupplier: () => ({ success: true }),

        // Existing State & Methods
        settings,
        updateSettings,






        guestName,
        setGuestName,
        currentSessionId,
        setCurrentSessionId,


        orderNotes,
        setOrderNotes,
        cartItems,
        addToCart,
        updateCartItemQty,
        updateCartItemNote,
        removeFromCart,
        clearCart,
        discountPercent,
        setDiscountPercent,
        applyServiceCharge,
        setApplyServiceCharge,
        cartSubtotal,
        cartServiceCharge,
        cartDiscount,
        cartTax,
        cartGrandTotal,



        verifyManagerPin,
        orderToDelete,
        setOrderToDelete,
        isDeleteOrderModalOpen,
        setIsDeleteOrderModalOpen,
        openDeleteOrderModal,
        activeOrderToEdit,
        loadOrderIntoCart,
        selectedBookingForFolio,
        setSelectedBookingForFolio,
        selectedBookingForDetails,
        setSelectedBookingForDetails,
        isNewBookingModalOpen,
        setIsNewBookingModalOpen,
        isEditBookingModalOpen,
        setIsEditBookingModalOpen,
        bookingToEdit,
        setBookingToEdit,
        newBookingPreselectedRoom,
        setNewBookingPreselectedRoom,
        newBookingPreselectedDate,
        setNewBookingPreselectedDate,
        selectedPayrollMonth,
        setSelectedPayrollMonth,
        selectedPayrollRecordForEdit,
        setSelectedPayrollRecordForEdit,
        selectedPayrollRecordForPayslip,
        setSelectedPayrollRecordForPayslip,
        isBiometricImportModalOpen,
        setIsBiometricImportModalOpen,
        isNewEmployeeModalOpen,
        setIsNewEmployeeModalOpen,
        // Accounts & Treasury
        selectedAccount,
        setSelectedAccount,
        isNewAccountModalOpen,
        setIsNewAccountModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        isAdjustBalanceModalOpen,
        setIsAdjustBalanceModalOpen,
        isRecordTxModalOpen,
        setIsRecordTxModalOpen,
        accountModalInitialType,
        setAccountModalInitialType,
        accountForAdjustment,
        setAccountForAdjustment,
        accountToEdit,
        setAccountToEdit,
        accountForRecordTx,
        setAccountForRecordTx,
        // User Profiles & RBAC Portal
        isUserAllowedModule,
        isNewUserModalOpen,
        setIsNewUserModalOpen,
        userToEdit,
        setUserToEdit,
        isSwitchUserModalOpen,
        setIsSwitchUserModalOpen,
        // Authentication & Session
        isAuthenticated,
        isLocked,
        setSession,
        logout,
        lockSession,
        unlockSession,
        selectedOrderForReceipt,
        setSelectedOrderForReceipt,
        selectedOrderForKOT,
        setSelectedOrderForKOT,
        selectedItemForModifier,
        setSelectedItemForModifier,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isAddExpenseModalOpen,
        setIsAddExpenseModalOpen,
        editingExpenseId,
        setEditingExpenseId,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleSidebar,
        formatCurrency,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

