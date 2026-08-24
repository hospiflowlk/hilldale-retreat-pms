import React from 'react';
import { 
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
  ChevronLeft, 
  ChevronRight, 
  X, 
  Settings as SettingsIcon, 
  Lock, 
  LogOut, 
  LogIn,
  Plus,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useItems } from '../hooks/useMasters';
import { usePMS } from '../hooks/usePMS';
import { usePOS } from '../hooks/usePOS';
import { usePayroll } from '../hooks/usePayroll';
import { useAccounts } from '../hooks/useAccounts';
import { useUsers } from '../hooks/useUsers';

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'highlight' | 'primary' | 'neutral';
  allowed: boolean;
  isModalTrigger?: boolean;
}

interface SidebarNavGroup {
  group: string;
  items: SidebarNavItem[];
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cartItems, 
    currentUser, 
    isUserAllowedModule, 
    setIsSwitchUserModalOpen,
    lockSession,
    logout,
    settings, 
    setIsSettingsModalOpen, 
    setIsAddExpenseModalOpen,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useApp();

  // Live data from React Query hooks
  const { bookings } = usePMS();
  const { orders } = usePOS();
  const { employees } = usePayroll();
  const { accounts } = useAccounts();
  const { data: masterItems = [] } = useItems.useGetAll();
  const { users } = useUsers();

  const activeOrdersCount = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
  const inHouseGuestsCount = bookings.filter(b => b.status === 'checked_in').length;
  const cartItemCount = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = masterItems.filter(i => i.type === 'RESALE' && (i.reorderThreshold ?? 0) > 0 && (i.currentStock ?? 0) <= (i.reorderThreshold ?? 0)).length;

  const navGroups: SidebarNavGroup[] = [
    {
      group: 'Front Office & Stays',
      items: [
        {
          id: 'pms',
          label: 'Rooms & PMS',
          icon: Bed,
          badge: `${inHouseGuestsCount}/7`,
          badgeVariant: 'highlight',
          allowed: isUserAllowedModule('pms'),
        },
        {
          id: 'pos',
          label: 'Restaurant POS',
          icon: UtensilsCrossed,
          badge: cartItemCount > 0 ? `${cartItemCount}` : undefined,
          badgeVariant: 'primary',
          allowed: isUserAllowedModule('pos'),
        },
        {
          id: 'orders',
          label: 'Walk-Ins & Tables',
          icon: Coffee,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount}` : undefined,
          badgeVariant: 'primary',
          allowed: isUserAllowedModule('orders'),
        },
        {
          id: 'invoices',
          label: 'Invoices & Billing',
          icon: Receipt,
          allowed: isUserAllowedModule('invoices'),
        },
      ]
    },
    {
      group: 'Finance & Operations',
      items: [
        {
          id: 'accounts' as const,
          label: 'Accounts & Treasury',
          icon: Landmark,
          badge: `${accounts.filter(a => a.isActive).length}`,
          badgeVariant: 'neutral' as const,
          allowed: isUserAllowedModule('accounts'),
        },
        {
          id: 'expenses' as const,
          label: 'Expenses & Outflows',
          icon: DollarSign,
          allowed: isUserAllowedModule('expenses'),
        },
        {
          id: 'pnl' as const,
          label: 'P&L Reports',
          icon: TrendingUp,
          allowed: isUserAllowedModule('pnl'),
        },
        {
          id: 'masters' as const,
          label: 'Masters & Reference',
          icon: Layers,
          badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
          badgeVariant: lowStockCount > 0 ? 'highlight' as const : 'neutral' as const,
          allowed: isUserAllowedModule('masters'),
        },
        {
          id: 'menu' as const,
          label: 'Menu Availability',
          icon: MenuSquare,
          allowed: isUserAllowedModule('menu'),
        },
      ]
    },
    {
      group: 'People & Administration',
      items: [
        {
          id: 'payroll' as const,
          label: 'Staff & Payroll',
          icon: Users,
          badge: `${employees.length}`,
          badgeVariant: 'neutral' as const,
          allowed: isUserAllowedModule('payroll'),
        },
        {
          id: 'users' as const,
          label: 'User Profiles & RBAC',
          icon: ShieldCheck,
          badge: `${users.length}`,
          badgeVariant: 'neutral' as const,
          allowed: currentUser?.role === 'admin' || currentUser?.canManageUsers || isUserAllowedModule('users'),
        },
        {
          id: 'settings_modal' as const,
          label: 'System Settings',
          icon: SettingsIcon,
          allowed: true,
          isModalTrigger: true,
        },
      ]
    }
  ];

  const handleNavClick = (tabId: string, isModalTrigger?: boolean) => {
    if (isModalTrigger && tabId === 'settings_modal') {
      setIsSettingsModalOpen(true);
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
      return;
    }
    setActiveTab(tabId as typeof activeTab);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs lg:sticky lg:top-0 lg:h-screen lg:z-30 shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-18' : 'lg:w-64'
        }`}
      >
        {/* Top Branding & Collapse Button */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={`h-16 border-b border-border flex items-center px-4 justify-between bg-surface-muted/50 ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}>
            <div 
              className="flex items-center gap-2.5 cursor-pointer overflow-hidden select-none"
              onClick={() => handleNavClick('pms')}
            >
              <div className="w-9 h-9 bg-primary shrink-0 rounded-xl flex items-center justify-center text-background font-serif text-lg font-bold shadow-xs">
                H
              </div>
              
              {!isSidebarCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <h1 className="text-xs font-bold font-serif text-text tracking-wider uppercase leading-tight truncate">
                    Hilldale Retreat
                  </h1>
                  <p className="text-[10px] text-secondary font-sans truncate">
                    PMS & POS Suite
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-secondary hover:text-text hover:bg-surface-muted lg:hidden transition cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            {!isSidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-white border border-transparent hover:border-border transition cursor-pointer shadow-2xs"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsed Mode Expand Button */}
          {isSidebarCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-border/60">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-muted transition cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Expense Shortcut in Sidebar */}
          {isUserAllowedModule('expenses') && (
            <div className={`p-3 border-b border-border/60`}>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className={`flex items-center justify-center gap-1.5 bg-primary hover:bg-[#4d5541] text-white py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs ${isSidebarCollapsed ? 'px-0 w-full' : 'px-3 w-full'}`}
                title="Add Expense"
              >
                <Plus className="w-4 h-4" />
                {!isSidebarCollapsed && <span>Add Expense</span>}
              </button>
            </div>
          )}

          {/* Navigation Items (Scrollable) */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            {navGroups.map((grp, gIdx) => {
              const allowedItems = grp.items.filter(item => item.allowed);
              if (allowedItems.length === 0) return null;

              return (
                <div key={gIdx} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary/80 select-none">
                      {grp.group}
                    </div>
                  )}

                  <div className="space-y-1">
                    {allowedItems.map((item) => {
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          id={`nav-sidebar-${item.id}`}
                          onClick={() => handleNavClick(item.id, item.isModalTrigger)}
                          title={isSidebarCollapsed ? item.label : undefined}
                          className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            isActive
                              ? 'bg-primary text-white font-bold shadow-xs'
                              : 'text-secondary-dark hover:text-text hover:bg-surface-muted'
                          } ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-primary'
                          }`} />

                          {!isSidebarCollapsed && (
                            <span className="truncate flex-1 font-medium">
                              {item.label}
                            </span>
                          )}

                          {/* Badges */}
                          {!isSidebarCollapsed && item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                              isActive 
                                ? 'bg-secondary-light text-primary' 
                                : item.badgeVariant === 'highlight' 
                                  ? 'bg-primary-light text-primary font-mono' 
                                  : 'bg-surface-muted text-secondary-dark font-mono'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {/* Tooltip for Collapsed Sidebar */}
                          {isSidebarCollapsed && (
                            <div className="hidden lg:group-hover:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 bg-text text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="bg-white/20 text-white text-[10px] px-1 py-0.2 rounded-full font-bold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile, Rate & Quick Settings */}
        <div className="p-3 border-t border-border bg-surface-muted/30 space-y-2 shrink-0">
          {/* Rate Widget */}
          {!isSidebarCollapsed && (
            <div className="px-3 py-1.5 bg-surface-muted rounded-xl border border-border flex items-center justify-between text-[10px]">
              <span className="text-secondary font-medium">FX Rate</span>
              <span className="font-mono font-bold text-text">1 USD = Rs. {settings.usdToLkrRate.toFixed(2)}</span>
            </div>
          )}

          {/* User Card */}
          <div className={`p-2 rounded-xl bg-white border border-border shadow-2xs flex ${isSidebarCollapsed ? 'flex-col gap-2' : 'items-center gap-2.5'}`}>
            <button
              onClick={() => setIsSwitchUserModalOpen(true)}
              className={`flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Click to Switch User"
            >
              <div className={`w-8 h-8 rounded-xl ${currentUser?.avatarColor || 'bg-primary'} text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs`}>
                {currentUser?.name ? currentUser.name[0] : 'U'}
              </div>

              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-text truncate leading-tight">
                    {currentUser?.name || 'Staff User'}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-primary-light text-primary rounded-md">
                      {currentUser?.role || 'Staff'}
                    </span>
                    <LogIn className="w-2.5 h-2.5 text-secondary" />
                  </div>
                </div>
              )}
            </button>

            <div className={`flex ${isSidebarCollapsed ? 'flex-col gap-1 w-full border-t border-border pt-2' : 'items-center gap-1 shrink-0'}`}>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-1 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer ${isSidebarCollapsed ? 'w-full flex justify-center py-1.5' : ''}`}
                title="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
              <button
                onClick={lockSession}
                className={`p-1 text-secondary hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer ${isSidebarCollapsed ? 'w-full flex justify-center py-1.5' : ''}`}
                title="Lock Session"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className={`p-1 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer ${isSidebarCollapsed ? 'w-full flex justify-center py-1.5' : ''}`}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
