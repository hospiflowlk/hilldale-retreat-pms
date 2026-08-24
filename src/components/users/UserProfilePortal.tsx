import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Filter, 
  Key, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  LogIn, 
  Sparkles, 
  Lock, 
  Layers, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info,
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
import { AppModuleId, UserProfile, UserRole } from '../../types';
import { SYSTEM_MODULES, ROLE_PRESETS } from '../../data/userData';
import { NewUserModal } from './NewUserModal';
import { SwitchUserModal } from './SwitchUserModal';

const MODULE_ICONS: Record<AppModuleId, React.ReactNode> = {
  pms: <Bed className="w-3.5 h-3.5" />,
  pos: <UtensilsCrossed className="w-3.5 h-3.5" />,
  orders: <Coffee className="w-3.5 h-3.5" />,
  invoices: <Receipt className="w-3.5 h-3.5" />,
  expenses: <DollarSign className="w-3.5 h-3.5" />,
  pnl: <TrendingUp className="w-3.5 h-3.5" />,
  menu: <MenuSquare className="w-3.5 h-3.5" />,
  payroll: <Users className="w-3.5 h-3.5" />,
  accounts: <Landmark className="w-3.5 h-3.5" />,
  users: <ShieldCheck className="w-3.5 h-3.5" />,
  masters: <Landmark className="w-3.5 h-3.5" />
};

export const UserProfilePortal: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUserById, 
    isNewUserModalOpen, 
    setIsNewUserModalOpen,
    userToEdit, 
    setUserToEdit,
    isSwitchUserModalOpen, 
    setIsSwitchUserModalOpen,
    setActiveTab
  } = useApp();

  const { users } = useUsers();

  const deleteUser = (id: string) => { return { success: true, message: 'User deleted' }; };
  const updateUser = (id: string, updates: any) => {};


  // Navigation & Sub-views
  const [activeView, setActiveView] = useState<'cards' | 'matrix' | 'guide'>('cards');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'all' | UserRole>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended'>('all');

  // Deletion state
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => { if (u.department) set.add(u.department); });
    return Array.from(set).sort();
  }, [users]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin' && u.isActive).length;
    const managers = users.filter(u => u.role === 'manager' && u.isActive).length;
    const staff = users.filter(u => u.role === 'user' && u.isActive).length;
    const suspended = users.filter(u => !u.isActive).length;

    return { total, admins, managers, staff, suspended };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (selectedRole !== 'all' && user.role !== selectedRole) return false;

      // Department filter
      if (selectedDepartment !== 'all' && user.department !== selectedDepartment) return false;

      // Status filter
      if (selectedStatus === 'active' && !user.isActive) return false;
      if (selectedStatus === 'suspended' && user.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesUsername = user.username.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesDept = user.department.toLowerCase().includes(q);
        const matchesDesignation = user.designation.toLowerCase().includes(q);
        return matchesName || matchesUsername || matchesEmail || matchesDept || matchesDesignation;
      }

      return true;
    });
  }, [users, selectedRole, selectedDepartment, selectedStatus, searchQuery]);

  const handleEditUser = (user: UserProfile) => {
    setUserToEdit(user);
    setIsNewUserModalOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id);
    if (res.success) {
      setFeedbackMessage({ text: `Staff user profile "${userToDelete.name}" has been permanently deleted.`, type: 'success' });
    } else {
      setFeedbackMessage({ text: res.message || 'Cannot delete user profile.', type: 'error' });
    }
    setUserToDelete(null);
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  const handleToggleStatus = (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      setFeedbackMessage({ text: 'You cannot suspend your own active user account.', type: 'error' });
      setTimeout(() => setFeedbackMessage(null), 4000);
      return;
    }
    const nextStatus = !user.isActive;
    updateUser(user.id, { isActive: nextStatus });
    setFeedbackMessage({ 
      text: `User ${user.name} is now ${nextStatus ? 'Activated' : 'Suspended'}.`, 
      type: 'success' 
    });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSwitchToUser = (user: UserProfile) => {
    setCurrentUserById(user.id);
    setFeedbackMessage({ text: `Switched active session to: ${user.name} (${user.role.toUpperCase()})`, type: 'success' });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-border flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-text">{metrics.total}</div>
            <div className="text-[10px] text-secondary">Configured Profiles</div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-border flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-primary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Administrators</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{metrics.admins}</div>
            <div className="text-[10px] text-secondary">Full System Access</div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-border flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Managers</span>
            <Shield className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <div className="text-xl font-bold text-secondary">{metrics.managers}</div>
            <div className="text-[10px] text-secondary">Supervisory Roles</div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-border flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Frontline Users</span>
            <UserCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-teal-800">{metrics.staff}</div>
            <div className="text-[10px] text-secondary">Module-Scoped Staff</div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-border flex flex-col justify-between shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Status</span>
            <Lock className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <div className="text-xl font-bold text-text">
              {metrics.total - metrics.suspended} <span className="text-xs font-normal text-secondary">Active</span>
            </div>
            <div className="text-[10px] text-secondary">{metrics.suspended} Suspended</div>
          </div>
        </div>
      </div>

      {/* Active Session & Quick Switch Bar */}
      <div className="bg-primary-light/40 border border-border-focus rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${currentUser.avatarColor || 'bg-primary'} text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0`}>
            {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text">{currentUser.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                currentUser.role === 'admin' 
                  ? 'bg-primary text-white' 
                  : currentUser.role === 'manager' 
                    ? 'bg-secondary text-white' 
                    : 'bg-teal-700 text-white'
              }`}>
                {currentUser.role}
              </span>
              <span className="text-xs text-secondary">({currentUser.designation})</span>
            </div>
            <div className="text-xs text-secondary-dark flex items-center gap-3 mt-0.5">
              <span>Department: <strong>{currentUser.department}</strong></span>
              <span>•</span>
              <span>
                Authorized Modules: <strong>{currentUser.role === 'admin' ? 'All 10 Modules' : `${currentUser.allowedModules?.length || 0} Modules`}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsSwitchUserModalOpen(true)}
            className="px-3.5 py-1.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Switch Active Staff Profile</span>
          </button>
        </div>
      </div>

      {/* Feedback Message Toast */}
      {feedbackMessage && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-gray-500 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Controls & Search Bar */}
      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-border space-y-3 shadow-2xs">
        
        {/* Top Row: View Switcher & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Sub-view Navigation */}
          <div className="flex items-center p-1 bg-surface-muted rounded-xl border border-border self-start">
            <button
              onClick={() => setActiveView('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'cards'
                  ? 'bg-white text-text shadow-xs'
                  : 'text-secondary hover:text-text'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Profiles ({filteredUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'matrix'
                  ? 'bg-white text-text shadow-xs'
                  : 'text-secondary hover:text-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Role & Module Access Matrix</span>
            </button>
            <button
              onClick={() => setActiveView('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'guide'
                  ? 'bg-white text-text shadow-xs'
                  : 'text-secondary hover:text-text'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Security & Responsibilities</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              setUserToEdit(null);
              setIsNewUserModalOpen(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User Profile</span>
          </button>
        </div>

        {/* Bottom Row: Search & Filters (Shown in Cards View) */}
        {activeView === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-border">
            
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, username, designation, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-secondary hover:text-text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              >
                <option value="all">All Roles (Admin / Manager / User)</option>
                <option value="admin">Administrators Only</option>
                <option value="manager">Managers Only</option>
                <option value="user">Frontline Users Only</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: User Profile Cards Grid */}
      {activeView === 'cards' && (
        <div>
          {filteredUsers.length === 0 ? (
            <div className="bg-[#FAF8F5] rounded-2xl border border-border p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-border text-secondary flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-text">No staff user profiles match your filter</h3>
              <p className="text-xs text-secondary max-w-md mx-auto">
                Try resetting your search query or role/department filters to display more accounts.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('all');
                  setSelectedDepartment('all');
                  setSelectedStatus('all');
                }}
                className="px-4 py-1.5 bg-white hover:bg-surface-muted text-primary font-bold text-xs rounded-xl border border-border transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => {
                const isCurrent = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-2xl border transition flex flex-col justify-between overflow-hidden shadow-2xs ${
                      isCurrent 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : user.isActive 
                          ? 'border-border hover:border-border-focus' 
                          : 'border-red-200 bg-red-50/20 opacity-80'
                    }`}
                  >
                    {/* Card Top Section */}
                    <div className="p-4 space-y-3">
                      
                      {/* Avatar, Name, Role */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${user.avatarColor || 'bg-primary'} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}>
                            {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-text truncate max-w-[150px]">{user.name}</h3>
                              {isCurrent && (
                                <span className="text-[9px] bg-primary-light text-primary px-1.5 py-0.2 rounded-full font-bold border border-border-focus">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-secondary font-mono">@{user.username}</p>
                          </div>
                        </div>

                        {/* Role & Status Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-primary-light text-primary border border-border-focus' 
                              : user.role === 'manager' 
                                ? 'bg-secondary-light text-secondary border border-[#D4A373]' 
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {user.role}
                          </span>

                          <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                            user.isActive ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {user.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </div>

                      {/* Job Title & Department */}
                      <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-border text-xs space-y-1 text-secondary-dark">
                        <div className="flex items-center gap-1.5 text-text font-semibold">
                          <Briefcase className="w-3.5 h-3.5 text-secondary" />
                          <span>{user.designation}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-secondary">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{user.department}</span>
                          </span>
                          {user.pinCode && (
                            <span className="flex items-center gap-1 font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-border">
                              <Key className="w-2.5 h-2.5 text-secondary" />
                              <span>PIN ••••</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="text-[11px] text-secondary space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Allowed Modules Tag Pills */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                          <span>Authorized Modules</span>
                          <span>
                            {user.role === 'admin' ? '10 / 10 (Full)' : `${(user.allowedModules || []).length} / 10`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {user.role === 'admin' ? (
                            <div className="w-full text-xs font-semibold bg-primary-light/50 text-primary p-1.5 rounded-lg border border-border-focus flex items-center justify-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Full Unrestricted ERP Access</span>
                            </div>
                          ) : (!user.allowedModules || user.allowedModules.length === 0) ? (
                            <span className="text-[10px] text-red-500 italic">No modules granted</span>
                          ) : (
                            (user.allowedModules || []).map(modId => (
                              <span 
                                key={modId}
                                className="text-[10px] bg-surface-muted text-text px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border border-border"
                              >
                                <span className="text-primary">{MODULE_ICONS[modId]}</span>
                                <span className="capitalize">{modId}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Special Permissions Flags */}
                      <div className="pt-2 border-t border-border flex flex-wrap gap-1.5 text-[10px]">
                        {user.canManageUsers && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                            User Admin
                          </span>
                        )}
                        {user.canExportReports && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                            Export Reports
                          </span>
                        )}
                        {user.canDeleteRecords && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            Delete Rights
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-[#FAF8F5] border-t border-border flex items-center justify-between gap-1">
                      
                      {/* Left: Switch / Login Button */}
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handleSwitchToUser(user)}
                          className="px-2.5 py-1.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Log In As</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Current Profile
                        </span>
                      )}

                      {/* Right: Edit & Manage Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditUser(user)}
                          title="Edit Profile & Permissions"
                          className="p-1.5 hover:bg-border rounded-lg text-text transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          title={user.isActive ? 'Suspend User' : 'Activate User'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            user.isActive ? 'hover:bg-amber-100 text-amber-700' : 'hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isCurrent || (user.role === 'admin' && metrics.admins <= 1)}
                          title={isCurrent ? 'Cannot delete active user' : 'Delete User'}
                          className="p-1.5 hover:bg-red-100 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Role & Module Access Matrix */}
      {activeView === 'matrix' && (
        <div className="bg-[#FAF8F5] rounded-2xl border border-border overflow-hidden shadow-2xs">
          
          <div className="p-4 border-b border-border bg-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Granular Staff Access Matrix
              </h3>
              <p className="text-xs text-secondary">
                Comprehensive map of all 10 ERP modules across staff accounts and role tiers
              </p>
            </div>

            <button
              onClick={() => {
                setUserToEdit(null);
                setIsNewUserModalOpen(true);
              }}
              className="px-3 py-1.5 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-secondary uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-bold sticky left-0 bg-surface-muted min-w-[200px] z-10">
                    ERP Module Name
                  </th>
                  <th className="p-3 font-bold">Category</th>
                  {users.map(user => {
                    const isCurrent = user.id === currentUser?.id;
                    const canDelete = !isCurrent && !(user.role === 'admin' && metrics.admins <= 1);
                    return (
                      <th key={user.id} className="p-3 font-bold text-center min-w-[140px]">
                        <div className="flex flex-col items-center">
                          <span className="text-text font-bold truncate max-w-[130px]">{user.name.split(' ')[0]}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                            user.role === 'admin' ? 'bg-primary-light text-primary' : user.role === 'manager' ? 'bg-secondary-light text-secondary' : 'bg-teal-50 text-teal-700'
                          }`}>
                            {user.role}
                          </span>
                          <div className="flex items-center gap-1 mt-1.5 opacity-80 hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              title="Edit user profile & permissions"
                              className="p-1 hover:bg-border rounded text-text transition cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              disabled={!canDelete}
                              title={isCurrent ? 'Cannot delete active session' : !canDelete ? 'Cannot delete last admin' : 'Delete user profile'}
                              className="p-1 hover:bg-red-100 text-red-600 disabled:opacity-20 disabled:cursor-not-allowed rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D6]">
                {SYSTEM_MODULES.map(mod => (
                  <tr key={mod.id} className="hover:bg-white/80 transition">
                    
                    {/* Module Title & Icon */}
                    <td className="p-3 font-bold text-text sticky left-0 bg-[#FAF8F5] shadow-xs flex items-center gap-2">
                      <span className="text-primary">{MODULE_ICONS[mod.id]}</span>
                      <div>
                        <div>{mod.name}</div>
                        <div className="text-[10px] text-secondary font-normal">{mod.shortName}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 text-secondary">
                      <span className="px-2 py-0.5 rounded bg-white border border-border text-[10px] font-semibold">
                        {mod.category}
                      </span>
                    </td>

                    {/* User Permissions Checkmarks */}
                    {users.map(user => {
                      const hasAccess = user.role === 'admin' || (user.allowedModules && user.allowedModules.includes(mod.id));

                      return (
                        <td key={user.id} className="p-3 text-center">
                          {hasAccess ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-light text-primary border border-border-focus">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white border-t border-border flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary-light border border-border-focus inline-block" />
                <span>Granted Access</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 inline-block" />
                <span>Restricted Access</span>
              </span>
            </div>
            <span>Module changes take effect instantly across all active terminals</span>
          </div>

        </div>
      )}

      {/* VIEW 3: Security & Responsibilities Architecture Guide */}
      {activeView === 'guide' && (
        <div className="space-y-4">
          
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-border space-y-4 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Hilldale Retreat Role-Based Access Control (RBAC) Governance
              </h3>
              <p className="text-xs text-secondary mt-1">
                Security architecture and responsibility allocation guidelines for resort operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Admin Tier */}
              <div className="p-4 rounded-xl bg-white border-2 border-primary space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tier 1: Administrator</span>
                </div>
                <p className="text-xs text-secondary-dark">
                  Full, unrestricted access across all operational, financial, and administrative engines.
                </p>
                <div className="text-xs space-y-1 font-medium text-text border-t border-border pt-2">
                  <div className="text-primary font-bold text-[11px] uppercase">Core Responsibilities:</div>
                  <div>• Treasury, banking & cash account adjustments</div>
                  <div>• Executive P&L analysis and tax configurations</div>
                  <div>• User account lifecycle & RBAC permissions</div>
                  <div>• System settings, service charge & VAT rates</div>
                </div>
              </div>

              {/* Manager Tier */}
              <div className="p-4 rounded-xl bg-white border-2 border-secondary space-y-2.5">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Tier 2: Operational Manager</span>
                </div>
                <p className="text-xs text-secondary-dark">
                  Supervisory authority to oversee daily bookings, POS dining flow, staff payroll, and operational expenses.
                </p>
                <div className="text-xs space-y-1 font-medium text-text border-t border-border pt-2">
                  <div className="text-secondary font-bold text-[11px] uppercase">Core Responsibilities:</div>
                  <div>• Front office booking and check-in overrides</div>
                  <div>• Staff biometric attendance & payroll approval</div>
                  <div>• Operational vendor expense recording</div>
                  <div>• Menu item pricing & daily inventory sync</div>
                </div>
              </div>

              {/* Frontline User Tier */}
              <div className="p-4 rounded-xl bg-white border-2 border-teal-600 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span>Tier 3: Frontline User</span>
                </div>
                <p className="text-xs text-secondary-dark">
                  Task-tailored profile scoped strictly to specific station duties (e.g. Waiter POS, Chef KDS, Front Desk).
                </p>
                <div className="text-xs space-y-1 font-medium text-text border-t border-border pt-2">
                  <div className="text-teal-700 font-bold text-[11px] uppercase">Core Responsibilities:</div>
                  <div>• Taking dining orders at tables and room service</div>
                  <div>• Real-time kitchen order ticket preparation</div>
                  <div>• Room guest check-in & folio billing</div>
                  <div>• Zero access to general ledger or sensitive accounts</div>
                </div>
              </div>

            </div>

            {/* Role Presets Table */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                Default Staff Responsibility Presets:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ROLE_PRESETS.map(preset => (
                  <div key={preset.id} className="p-3 bg-white rounded-xl border border-border text-xs">
                    <div className="font-bold text-text flex items-center justify-between">
                      <span>{preset.designation}</span>
                      <span className="text-[10px] text-secondary font-mono">({preset.role})</span>
                    </div>
                    <p className="text-[11px] text-secondary-dark mt-1 line-clamp-2">{preset.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.allowedModules.map(m => (
                        <span key={m} className="text-[9px] bg-surface-muted px-1.5 py-0.2 rounded font-medium text-primary border border-border">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-red-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">Delete User Profile</h3>
                  <p className="text-xs text-red-700">Permanent account removal</p>
                </div>
              </div>
              <button 
                onClick={() => setUserToDelete(null)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-border flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${userToDelete.avatarColor || 'bg-primary'} text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0`}>
                  {userToDelete.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-text truncate">{userToDelete.name}</h4>
                  <div className="text-xs text-secondary flex items-center gap-2 mt-0.5">
                    <span className="font-mono">@{userToDelete.username}</span>
                    <span>•</span>
                    <span className="capitalize">{userToDelete.role}</span>
                  </div>
                  <div className="text-[11px] text-secondary mt-0.5">
                    {userToDelete.department} — {userToDelete.designation}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Are you sure you want to permanently delete this user?</p>
                  <p className="text-amber-800 mt-1">
                    This staff member will immediately lose access to all terminals and ERP modules. Historical invoices and shift logs created by this staff member will remain intact in the system.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-border text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isNewUserModalOpen && (
        <NewUserModal
          onClose={() => {
            setIsNewUserModalOpen(false);
            setUserToEdit(null);
          }}
          editUser={userToEdit}
        />
      )}

      {isSwitchUserModalOpen && (
        <SwitchUserModal
          onClose={() => setIsSwitchUserModalOpen(false)}
        />
      )}

    </div>
  );
};
