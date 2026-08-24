import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  LogIn, 
  Bed, 
  UtensilsCrossed, 
  Coffee, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  MenuSquare, 
  Users, 
  Landmark,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppModuleId } from '../../types';
import { SYSTEM_MODULES } from '../../data/userData';

const MODULE_ICONS: Record<AppModuleId, React.ReactNode> = {
  pms: <Bed className="w-4 h-4" />,
  pos: <UtensilsCrossed className="w-4 h-4" />,
  orders: <Coffee className="w-4 h-4" />,
  invoices: <Receipt className="w-4 h-4" />,
  expenses: <DollarSign className="w-4 h-4" />,
  pnl: <TrendingUp className="w-4 h-4" />,
  menu: <MenuSquare className="w-4 h-4" />,
  payroll: <Users className="w-4 h-4" />,
  accounts: <Landmark className="w-4 h-4" />,
  users: <ShieldCheck className="w-4 h-4" />,
  masters: <Landmark className="w-4 h-4" />
};

interface AccessRestrictedGuardProps {
  moduleId: AppModuleId;
}

export const AccessRestrictedGuard: React.FC<AccessRestrictedGuardProps> = ({ moduleId }) => {
  const { currentUser, setActiveTab, setIsSwitchUserModalOpen } = useApp();

  const currentModuleDef = SYSTEM_MODULES.find(m => m.id === moduleId);
  const userAllowedModuleIds = currentUser?.allowedModules || [];
  const allowedModuleDefs = SYSTEM_MODULES.filter(m => userAllowedModuleIds.includes(m.id));

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-background rounded-3xl border border-border shadow-xl overflow-hidden p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-secondary-light text-secondary flex items-center justify-center mx-auto mb-4 border border-[#DDA15E]/40 shadow-xs">
          <ShieldAlert className="w-8 h-8 text-secondary" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Lock className="w-3 h-3" />
          <span>Access Restricted • Role Authorization Required</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text mt-2">
          {currentModuleDef?.name || 'Module Access'}
        </h2>
        
        <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto mt-2 leading-relaxed">
          Your current staff profile (<span className="font-bold text-text">{currentUser?.name}</span> • <span className="font-semibold">{currentUser?.designation}</span>) is assigned the <span className="font-bold uppercase text-primary">{currentUser?.role}</span> tier and is not granted permission to access this ERP module.
        </p>

        {/* User Card */}
        <div className="bg-[#FAF8F5] border border-border-focus/60 rounded-2xl p-4 my-6 max-w-md mx-auto flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${currentUser?.avatarColor || 'bg-primary'} text-white font-bold text-sm flex items-center justify-center`}>
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            <div>
              <p className="font-bold text-sm text-text">{currentUser?.name}</p>
              <p className="text-xs text-secondary">{currentUser?.department} • {currentUser?.designation}</p>
            </div>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
            currentUser?.role === 'admin' 
              ? 'bg-primary-light text-primary' 
              : currentUser?.role === 'manager' 
                ? 'bg-secondary-light text-secondary' 
                : 'bg-teal-50 text-teal-700'
          }`}>
            {currentUser?.role}
          </span>
        </div>

        {/* Permitted Modules Quick Launch */}
        <div className="text-left mb-6">
          <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 text-center">
            Your Permitted Workstation Modules:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allowedModuleDefs.map(mod => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveTab(mod.id as any)}
                className="p-3 bg-white hover:bg-[#FAF8F5] border border-border hover:border-primary rounded-xl text-left transition flex items-center gap-2.5 cursor-pointer group shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  {MODULE_ICONS[mod.id]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text group-hover:text-primary truncate">{mod.shortName}</p>
                  <p className="text-[10px] text-secondary truncate">{mod.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {allowedModuleDefs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab(allowedModuleDefs[0].id as any)}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-[#4D5541] text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs shadow-xs"
            >
              <span>Return to {allowedModuleDefs[0].shortName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSwitchUserModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#FAF8F5] border border-border-focus text-xs font-bold text-text rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5 text-primary" />
            <span>Switch Staff Profile / Manager Login</span>
          </button>
        </div>

      </div>
    </div>
  );
};
