import React from 'react';
import { 
  Menu, 
  Bed, 
  UtensilsCrossed, 
  Coffee, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  MenuSquare, 
  Users, 
  Landmark, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Clock, 
  Plus, 
  Lock, 
  LogOut, 
  LogIn,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    currentUser, 
    isUserAllowedModule, 
    setIsSwitchUserModalOpen,
    lockSession,
    logout,
    settings, 
    setIsSettingsModalOpen, 
    setIsAddExpenseModalOpen,
    toggleSidebar,
    setIsMobileSidebarOpen
  } = useApp();

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabMeta: Record<string, { label: string; desc: string; icon: React.FC<{ className?: string }> }> = {
    pms: { label: 'Rooms & PMS Suites', desc: 'Room Inventory, Folio Billing & Channel Sync', icon: Bed },
    pos: { label: 'Restaurant POS', desc: 'Real-time Ala Carte Food & Beverage Ordering', icon: UtensilsCrossed },
    orders: { label: 'Walk-Ins & Live Tables', desc: 'Active Table Tabs, Kitchen Tickets & Floor Management', icon: Coffee },
    invoices: { label: 'Invoices & Billing', desc: 'Settled Master Folios & Revenue Receipts', icon: Receipt },
    expenses: { label: 'Expenses & Outflows', desc: 'Operational Costs, Vendor Payables & Vouchers', icon: DollarSign },
    pnl: { label: 'P&L Financial Reports', desc: 'Net Profit, Gross Margins & Real-time Analytics', icon: TrendingUp },
    menu: { label: 'Menu & Stock Inventory', desc: 'Dishes, Pricing & Stock Availability Management', icon: MenuSquare },
    payroll: { label: 'Staff & Payroll Management', desc: 'Attendance Biometrics, EPF/ETF & Salary Slips', icon: Users },
    accounts: { label: 'Accounts & Treasury', desc: 'Bank Accounts, Cash Registers & Liability Debt', icon: Landmark },
    users: { label: 'User Profiles & RBAC', desc: 'Staff Roles, Access Permissions & Security Logs', icon: ShieldCheck },
  };

  const currentMeta = tabMeta[activeTab] || { label: 'Hilldale Retreat PMS', desc: 'Resort Management Suite', icon: Sparkles };
  const CurrentIcon = currentMeta.icon;

  const handleToggleMenu = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="lg:hidden bg-white border-b border-border text-text sticky top-0 z-20 shadow-2xs">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu Button & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-sidebar-hamburger-toggle"
            onClick={handleToggleMenu}
            className="p-2 rounded-xl text-secondary hover:text-text hover:bg-surface-muted border border-border transition cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-primary-light text-primary items-center justify-center shrink-0">
              <CurrentIcon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                <span className="hidden md:inline font-serif font-bold text-text">Hilldale Retreat</span>
                <ChevronRight className="w-3 h-3 text-secondary/60 hidden md:inline" />
                <span className="font-bold text-primary truncate">{currentMeta.label}</span>
              </div>
              <p className="text-[11px] text-secondary hidden lg:block truncate leading-tight mt-0.5">
                {currentMeta.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Clock, FX Rate & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Removed FX Rate Badge (now in Sidebar) */}

          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-1.5 bg-surface-muted/60 px-2.5 py-1 rounded-full border border-border text-xs font-mono text-text">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span className="font-semibold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Quick Expense Shortcut */}
          {isUserAllowedModule('expenses') && (
            <button
              id="btn-quick-add-expense-header"
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
              title="Record New Expense"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          )}

          {/* Active Logged-in Staff Profile Pill */}
          <button
            onClick={() => setIsSwitchUserModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-surface-muted px-2.5 py-1 rounded-xl border border-border transition cursor-pointer text-xs group"
            title="Click to Switch Staff Profile"
          >
            <div className={`w-5 h-5 rounded-full ${currentUser?.avatarColor || 'bg-primary'} text-white text-[10px] font-bold flex items-center justify-center`}>
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            <span className="font-bold text-text hidden sm:inline">{currentUser?.name?.split(' ')[0] || 'User'}</span>
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
              currentUser?.role === 'admin' 
                ? 'bg-primary-light text-primary' 
                : currentUser?.role === 'manager' 
                  ? 'bg-secondary-light text-secondary' 
                  : 'bg-teal-50 text-teal-700'
            }`}>
              {currentUser?.role || 'user'}
            </span>
            <LogIn className="w-3 h-3 text-secondary group-hover:text-primary transition" />
          </button>

          {/* Lock Station */}
          <button
            id="btn-lock-station-header"
            onClick={lockSession}
            className="p-1.5 text-secondary hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer border border-transparent hover:border-amber-200"
            title="Lock Station"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            id="btn-header-settings"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer border border-transparent hover:border-border"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            id="btn-header-logout"
            onClick={logout}
            className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
