import React from 'react';
import { 
  Bed, Coffee, Receipt, DollarSign, TrendingUp, MenuSquare, Users, Landmark, 
  Settings as SettingsIcon, ChevronDown, Utensils, LayoutGrid, Grid, Maximize2, Minimize2, 
  Clock, Lock, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface POSHeaderProps {
  isNavDropdownOpen: boolean;
  setIsNavDropdownOpen: (val: boolean) => void;
  inHouseGuestsCount: number;
  activeOrdersCount: number;
  densityMode: 'compact' | 'comfortable';
  setDensityMode: (val: 'compact' | 'comfortable') => void;
  isNativeFullscreen: boolean;
  toggleNativeFullscreen: () => void;
  currentTime: Date;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  isNavDropdownOpen,
  setIsNavDropdownOpen,
  inHouseGuestsCount,
  activeOrdersCount,
  densityMode,
  setDensityMode,
  isNativeFullscreen,
  toggleNativeFullscreen,
  currentTime,
}) => {
  const { 
    settings, 
    currentUser, 
    isUserAllowedModule, 
    setActiveTab, 
    setIsSwitchUserModalOpen, 
    lockSession, 
    logout, 
    setIsSettingsModalOpen 
  } = useApp();

  return (
    <header className="bg-white border-b border-border px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 z-20 shadow-2xs">
      
      {/* Brand & Quick Module Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Logo & POS Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background font-serif font-bold text-base shadow-2xs">
            H
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <span>Hilldale POS</span>
              <span className="text-[10px] bg-primary-light text-primary font-bold px-1.5 py-0.2 rounded-md border border-border-focus">
                Full-Screen
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Module Switcher Pill Menu */}
        <div className="relative">
          <button
            type="button"
            id="btn-pos-module-switcher"
            onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            className="flex items-center gap-1.5 bg-surface-muted hover:bg-surface-muted-hover text-text px-2.5 py-1 rounded-lg border border-border text-xs font-semibold transition cursor-pointer"
            title="Navigate to PMS, Orders, Invoices, Finance & Reports"
          >
            <Utensils className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold">POS Station</span>
            <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 ${isNavDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Navigation Dropdown Menu */}
          {isNavDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNavDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-border rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Switch Application Module
                </div>

                {isUserAllowedModule('pms') && (
                  <button
                    onClick={() => { setActiveTab('pms'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-primary" />
                      <span>Rooms & PMS</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary-light text-primary">
                      {inHouseGuestsCount}/7 In-House
                    </span>
                  </button>
                )}

                {isUserAllowedModule('orders') && (
                  <button
                    onClick={() => { setActiveTab('orders'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-secondary" />
                      <span>Live Tables & Orders</span>
                    </div>
                    {activeOrdersCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-secondary-light text-secondary">
                        {activeOrdersCount}
                      </span>
                    )}
                  </button>
                )}

                {isUserAllowedModule('invoices') && (
                  <button
                    onClick={() => { setActiveTab('invoices'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <Receipt className="w-4 h-4 text-primary" />
                    <span>Invoices & Settlement</span>
                  </button>
                )}

                {isUserAllowedModule('expenses') && (
                  <button
                    onClick={() => { setActiveTab('expenses'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <DollarSign className="w-4 h-4 text-secondary" />
                    <span>Expense Records</span>
                  </button>
                )}

                {isUserAllowedModule('pnl') && (
                  <button
                    onClick={() => { setActiveTab('pnl'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>P&L & Analytics</span>
                  </button>
                )}

                {isUserAllowedModule('menu') && (
                  <button
                    onClick={() => { setActiveTab('menu'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <MenuSquare className="w-4 h-4 text-secondary" />
                    <span>Menu & Stock Editor</span>
                  </button>
                )}

                {isUserAllowedModule('payroll') && (
                  <button
                    onClick={() => { setActiveTab('payroll'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 text-primary" />
                    <span>Staff & Biometric Payroll</span>
                  </button>
                )}

                {isUserAllowedModule('accounts') && (
                  <button
                    onClick={() => { setActiveTab('accounts'); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-text transition cursor-pointer text-left"
                  >
                    <Landmark className="w-4 h-4 text-secondary" />
                    <span>Accounts & Treasury</span>
                  </button>
                )}

                <div className="pt-1 border-t border-border">
                  <button
                    onClick={() => { setIsSettingsModalOpen(true); setIsNavDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-surface-muted text-xs font-semibold text-secondary hover:text-text transition cursor-pointer text-left"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>System Settings</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* In-House Status Pill */}
        <button
          type="button"
          onClick={() => setActiveTab('pms')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light border border-border-focus text-primary text-xs font-bold transition hover:opacity-85 cursor-pointer"
          title="View In-House Guests in PMS"
        >
          <Bed className="w-3 h-3" />
          <span>{inHouseGuestsCount}/7 In-House Guests</span>
        </button>
      </div>

      {/* Right Tools: Grid Density, Fullscreen, Clock & Staff Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        
        {/* Grid Density Toggle (Compact vs Comfortable) */}
        <div className="flex items-center bg-surface-muted p-0.5 rounded-lg border border-border">
          <button
            type="button"
            id="btn-density-compact"
            onClick={() => setDensityMode('compact')}
            className={`p-1 sm:px-2 sm:py-0.5 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              densityMode === 'compact' 
                ? 'bg-white text-primary shadow-2xs' 
                : 'text-secondary hover:text-text'
            }`}
            title="Compact View: High density grid (4-6 columns, more items on screen)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Dense Grid</span>
          </button>
          <button
            type="button"
            id="btn-density-comfortable"
            onClick={() => setDensityMode('comfortable')}
            className={`p-1 sm:px-2 sm:py-0.5 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              densityMode === 'comfortable' 
                ? 'bg-white text-primary shadow-2xs' 
                : 'text-secondary hover:text-text'
            }`}
            title="Comfortable View: Standard tiles"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Standard</span>
          </button>
        </div>

        {/* Fullscreen API Toggle */}
        <button
          type="button"
          id="btn-toggle-fullscreen"
          onClick={toggleNativeFullscreen}
          className="flex items-center gap-1 bg-surface-muted hover:bg-surface-muted-hover text-secondary-dark hover:text-text px-2 py-1 rounded-lg border border-border text-xs font-semibold transition cursor-pointer"
          title={isNativeFullscreen ? 'Exit Browser Fullscreen' : 'Expand to Browser Fullscreen'}
        >
          {isNativeFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline text-[11px]">{isNativeFullscreen ? 'Exit Screen' : 'Fullscreen'}</span>
        </button>

        {/* Live Currency Rate Pill */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono bg-white px-2.5 py-0.5 rounded-full border border-border text-secondary">
          <span>$1 =</span>
          <span className="font-bold text-text">Rs. {(Number(settings?.usdToLkrRate) || 305).toFixed(0)}</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-mono bg-white px-2 py-0.5 rounded-full border border-border text-primary">
          <Clock className="w-3 h-3 text-secondary" />
          <span className="font-semibold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Active Staff Profile */}
        <button
          type="button"
          onClick={() => setIsSwitchUserModalOpen(true)}
          className="flex items-center gap-1.5 bg-white hover:bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-border-focus transition cursor-pointer text-xs group"
          title="Switch User Profile"
        >
          <div className={`w-4 h-4 rounded-full ${currentUser?.avatarColor || 'bg-primary'} text-white text-[9px] font-bold flex items-center justify-center`}>
            {currentUser?.name ? currentUser.name[0] : 'U'}
          </div>
          <span className="font-bold text-text hidden sm:inline">{currentUser?.name?.split(' ')[0] || 'User'}</span>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.1 rounded-full bg-primary-light text-primary hidden md:inline">
            {currentUser?.role || 'staff'}
          </span>
        </button>

        {/* Lock Station Button */}
        <button
          type="button"
          onClick={lockSession}
          className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-secondary hover:text-amber-800 border border-border transition cursor-pointer"
          title="Lock Station"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-secondary hover:text-rose-700 border border-border hover:border-rose-200 transition cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
        </button>
      </div>
    </header>
  );
};
