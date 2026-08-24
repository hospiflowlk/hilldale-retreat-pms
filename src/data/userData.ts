import { AppModuleId, ModuleDefinition, UserProfile, UserRole } from '../types';

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    id: 'pms',
    name: 'Rooms & Property Management (PMS)',
    shortName: 'Rooms & PMS',
    category: 'Front Office',
    description: 'Chalet suites inventory, guest check-in/out, folio billing, channel reservations, and rate management.',
    iconName: 'Bed',
    defaultRoles: ['admin', 'manager']
  },
  {
    id: 'pos',
    name: 'Restaurant & Bar POS Register',
    shortName: 'Restaurant POS',
    category: 'Food & Beverage',
    description: 'Table dining, room-service ordering, kitchen order tickets (KOT), and multi-tender checkout.',
    iconName: 'UtensilsCrossed',
    defaultRoles: ['admin', 'manager', 'user']
  },
  {
    id: 'orders',
    name: 'Live Tables & Kitchen Display (KDS)',
    shortName: 'Live Tables',
    category: 'Food & Beverage',
    description: 'Real-time order statuses, table service progression, and kitchen preparation queue.',
    iconName: 'Coffee',
    defaultRoles: ['admin', 'manager', 'user']
  },
  {
    id: 'invoices',
    name: 'Billing & Guest Invoices',
    shortName: 'Invoices',
    category: 'Finance & Accounts',
    description: 'Finalized restaurant bills, room charges, printable tax receipts, and payment settlements.',
    iconName: 'Receipt',
    defaultRoles: ['admin', 'manager', 'user']
  },
  {
    id: 'expenses',
    name: 'Operating Expenses & Vouchers',
    shortName: 'Expenses',
    category: 'Finance & Accounts',
    description: 'Resort operational costs, vendor invoices, petty cash disbursements, and receipt attachments.',
    iconName: 'DollarSign',
    defaultRoles: ['admin', 'manager']
  },
  {
    id: 'pnl',
    name: 'Profit & Loss (P&L) Analytics',
    shortName: 'P&L Analytics',
    category: 'Finance & Accounts',
    description: 'Executive revenue breakdown, gross profit margins, RevPAR, and department profitability.',
    iconName: 'TrendingUp',
    defaultRoles: ['admin']
  },
  {
    id: 'menu',
    name: 'Menu Engineering & Stock Catalog',
    shortName: 'Menu & Stock',
    category: 'Food & Beverage',
    description: 'Food & beverage items, portion modifiers, allergen tags, and stock availability toggles.',
    iconName: 'MenuSquare',
    defaultRoles: ['admin', 'manager', 'user']
  },
  {
    id: 'payroll',
    name: 'Staff Directory & Sri Lanka Payroll',
    shortName: 'Staff & Payroll',
    category: 'Human Resources',
    description: 'Employee profiles, biometric CSV attendance import, 8%/12% EPF & 3% ETF statutory calculations, and PDF payslips.',
    iconName: 'Users',
    defaultRoles: ['admin', 'manager']
  },
  {
    id: 'accounts',
    name: 'Treasury, Bank Accounts & Ledger',
    shortName: 'Accounts & Treasury',
    category: 'Finance & Accounts',
    description: 'Commercial Bank, POS Cash Drawers, corporate credit cards, loans, double-entry fund transfers, and reconciliation.',
    iconName: 'Landmark',
    defaultRoles: ['admin', 'manager']
  },
  {
    id: 'masters',
    name: 'Master Reference Data & Catalogs',
    shortName: 'Masters',
    category: 'Administration',
    description: 'Items & Bill of Materials, Suppliers & AP Ledger, Customer directory, P&L Categories, and Business Sources.',
    iconName: 'Layers',
    defaultRoles: ['admin', 'manager']
  },
  {
    id: 'users',
    name: 'User Profiles & Access Control Portal',
    shortName: 'User Profiles',
    category: 'Administration',
    description: 'Create and administer staff accounts, assign Admin/Manager/User roles, and configure granular module permissions.',
    iconName: 'ShieldCheck',
    defaultRoles: ['admin']
  }
];

export interface RolePreset {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  designation: string;
  description: string;
  allowedModules: AppModuleId[];
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'preset-admin',
    name: 'System Administrator / General Manager',
    role: 'admin',
    department: 'Executive Management',
    designation: 'General Manager',
    description: 'Full unrestricted access to all modules, financial ledgers, settings, and user administration.',
    allowedModules: ['pms', 'pos', 'orders', 'invoices', 'expenses', 'pnl', 'menu', 'payroll', 'accounts', 'masters', 'users']
  },
  {
    id: 'preset-operations-manager',
    name: 'Resort Operations Manager',
    role: 'manager',
    department: 'Operations',
    designation: 'Operations Manager',
    description: 'Supervisory access across PMS, POS, live orders, staff roster, menu, expenses, masters, and treasury.',
    allowedModules: ['pms', 'pos', 'orders', 'invoices', 'expenses', 'menu', 'payroll', 'accounts', 'masters']
  },
  {
    id: 'preset-front-desk',
    name: 'Front Desk & Reservations Agent',
    role: 'user',
    department: 'Front Office',
    designation: 'Front Desk Executive',
    description: 'Focused access for room check-ins, reservations, room folios, and guest checkout invoices.',
    allowedModules: ['pms', 'invoices']
  },
  {
    id: 'preset-fb-captain',
    name: 'Restaurant Captain & POS Cashier',
    role: 'user',
    department: 'Food & Beverage',
    designation: 'F&B Captain / Cashier',
    description: 'Point of Sale register, live table tracking, invoice generation, and order billing.',
    allowedModules: ['pos', 'orders', 'invoices']
  },
  {
    id: 'preset-executive-chef',
    name: 'Executive Head Chef / Kitchen Lead',
    role: 'user',
    department: 'Kitchen & Culinary',
    designation: 'Executive Head Chef',
    description: 'Live kitchen orders (KDS), dish/recipe catalog management, and kitchen ingredient expenses.',
    allowedModules: ['orders', 'menu', 'expenses', 'masters']
  },
  {
    id: 'preset-accountant',
    name: 'Finance & Accounts Officer',
    role: 'user',
    department: 'Finance & Accounts',
    designation: 'Senior Accountant',
    description: 'Full accounting suite: Invoices, operating expenses, financial P&L, bank accounts, masters, and payroll.',
    allowedModules: ['invoices', 'expenses', 'pnl', 'accounts', 'masters', 'payroll']
  },
  {
    id: 'preset-hr-specialist',
    name: 'Human Resources & Payroll Specialist',
    role: 'user',
    department: 'Human Resources',
    designation: 'HR Coordinator',
    description: 'Employee profiles, biometric time-logs, and monthly EPF/ETF payroll calculation.',
    allowedModules: ['payroll']
  }
];

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Administrator',
    email: 'admin@hilldaleretreat.com',
    phone: '+94 77 123 4567',
    role: 'admin',
    department: 'Executive Management',
    designation: 'General Manager & System Administrator',
    avatarColor: 'bg-primary',
    pinCode: '1001',
    allowedModules: ['pms', 'pos', 'orders', 'invoices', 'expenses', 'pnl', 'menu', 'payroll', 'accounts', 'masters', 'users'],
    canManageUsers: true,
    canExportReports: true,
    canDeleteRecords: true,
    notes: 'Primary system administrator with full access to all modules and configurations.',
    isActive: true,
    lastLogin: '2026-08-17 19:40',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  }
];
