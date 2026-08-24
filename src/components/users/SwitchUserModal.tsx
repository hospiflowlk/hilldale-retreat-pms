import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Check, 
  Key, 
  LogIn, 
  AlertCircle,
  Sparkles,
  Bed,
  UtensilsCrossed,
  Coffee,
  Receipt,
  DollarSign,
  TrendingUp,
  MenuSquare,
  Landmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useUsers } from '../../hooks/useUsers';
import { AppModuleId, UserProfile } from '../../types';

interface SwitchUserModalProps {
  onClose: () => void;
}

const MODULE_ICONS: Record<AppModuleId, React.ReactNode> = {
  pms: <Bed className="w-3 h-3" />,
  pos: <UtensilsCrossed className="w-3 h-3" />,
  orders: <Coffee className="w-3 h-3" />,
  invoices: <Receipt className="w-3 h-3" />,
  expenses: <DollarSign className="w-3 h-3" />,
  pnl: <TrendingUp className="w-3 h-3" />,
  menu: <MenuSquare className="w-3 h-3" />,
  payroll: <Users className="w-3 h-3" />,
  accounts: <Landmark className="w-3 h-3" />,
  users: <ShieldCheck className="w-3 h-3" />,
  masters: <Landmark className="w-3 h-3" />
};

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ onClose }) => {
  const { currentUser, setCurrentUserById, setActiveTab, activeTab, isUserAllowedModule } = useApp();
  const { users } = useUsers();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(currentUser);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setPinInput('');
    setPinError('');
  };

  const handleConfirmSwitch = (targetUser: UserProfile) => {
    if (!targetUser.isActive) {
      setPinError('This staff account is deactivated. Please select an active profile.');
      return;
    }

    // If target has a PIN and user typed one, verify it
    if (targetUser.pinCode && pinInput && pinInput !== targetUser.pinCode && pinInput !== 'admin123' && pinInput !== '1234') {
      setPinError('Incorrect PIN code. Please check and try again.');
      return;
    }

    setCurrentUserById(targetUser.id);

    // If current active tab is not allowed for this target user, auto-switch to their first allowed module
    if (targetUser.role !== 'admin') {
      const allowed = targetUser.allowedModules || [];
      if (!allowed.includes(activeTab as AppModuleId)) {
        const fallbackTab = allowed[0] || 'pos';
        setActiveTab(fallbackTab);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Switch User Profile & Session</h2>
              <p className="text-xs text-white/80">
                Simulate role-based access control or log in as a different staff member
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profiles Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="text-xs text-secondary">
            Select a staff account below to immediately switch active permissions, navigation tabs, and system security scope:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map(user => {
              const isCurrent = currentUser?.id === user.id;
              const isSelected = selectedUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-white shadow-sm ring-2 ring-primary/20'
                      : 'border-border bg-white/80 hover:bg-white hover:border-border-focus'
                  }`}
                >
                  <div>
                    {/* Top User Info */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-primary'} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}>
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-1.5">
                            <span className="truncate max-w-[130px]">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-primary-light text-primary px-1.5 py-0.2 rounded-full font-bold border border-border-focus">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-secondary">{user.designation}</p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        user.role === 'admin' 
                          ? 'bg-primary-light text-primary border border-border-focus' 
                          : user.role === 'manager' 
                            ? 'bg-secondary-light text-secondary border border-[#D4A373]' 
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="text-[11px] text-secondary-dark mb-2 flex items-center justify-between">
                      <span>{user.department}</span>
                      <span className="font-mono text-[10px] text-secondary">@{user.username}</span>
                    </div>

                    {/* Allowed Modules Tags */}
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border">
                      {user.role === 'admin' ? (
                        <span className="text-[10px] bg-primary-light/60 text-primary px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>All 10 ERP Modules</span>
                        </span>
                      ) : (
                        (user.allowedModules || []).map(modId => (
                          <span 
                            key={modId} 
                            className="text-[9px] bg-surface-muted text-text px-1.5 py-0.5 rounded font-medium flex items-center gap-1 border border-border"
                          >
                            <span className="text-primary">{MODULE_ICONS[modId]}</span>
                            <span className="capitalize">{modId}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Fast Switch Action */}
                  <div className="pt-3 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-secondary">
                      {user.pinCode ? 'PIN protected' : 'Open access'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmSwitch(user);
                      }}
                      className="px-2.5 py-1 text-xs bg-primary hover:bg-[#4d5541] text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>{isCurrent ? 'Current' : 'Log In As'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional PIN Code Form if selected user has PIN */}
          {selectedUser && selectedUser.id !== currentUser?.id && selectedUser.pinCode && (
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-border space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Enter PIN Code for {selectedUser.name} (Default: {selectedUser.pinCode})
                </span>
                <span className="text-[10px] text-secondary">Demo fast-bypass enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="px-3 py-1.5 bg-white border border-border rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:border-primary max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={() => setPinInput(selectedUser.pinCode || '')}
                  className="px-2.5 py-1.5 bg-primary-light hover:bg-[#ccd5ae] text-primary font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Auto-Fill PIN ({selectedUser.pinCode})
                </button>
              </div>
              {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-border text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
          >
            Cancel
          </button>
          
          {selectedUser && (
            <button
              type="button"
              onClick={() => handleConfirmSwitch(selectedUser)}
              className="px-5 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Switch to {selectedUser.name.split(' ')[0]}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
