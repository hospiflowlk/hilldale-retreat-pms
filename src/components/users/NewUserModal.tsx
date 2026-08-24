import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Key, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Check, 
  AlertCircle, 
  Sparkles,
  Bed,
  UtensilsCrossed,
  Coffee,
  Receipt,
  DollarSign,
  TrendingUp,
  MenuSquare,
  Users,
  Landmark,
  Layers,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useUsers } from '../../hooks/useUsers';
import { AppModuleId, UserProfile, UserRole } from '../../types';
import { SYSTEM_MODULES, ROLE_PRESETS } from '../../data/userData';

interface NewUserModalProps {
  onClose: () => void;
  editUser?: UserProfile | null;
}

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

const AVATAR_COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-teal-700',
  'bg-amber-700',
  'bg-rose-700',
  'bg-indigo-700',
  'bg-purple-700',
  'bg-emerald-700',
  'bg-cyan-700',
  'bg-slate-700'
];

const DEPARTMENTS = [
  'Executive Management',
  'Operations',
  'Front Office',
  'Food & Beverage',
  'Kitchen & Culinary',
  'Finance & Accounts',
  'Human Resources',
  'Housekeeping & Maintenance'
];

export const NewUserModal: React.FC<NewUserModalProps> = ({ onClose, editUser }) => {
  const { addUser, updateUser, deleteUser, currentUser } = useApp();
  const { users } = useUsers();

  const isEditing = Boolean(editUser);
  const isSelf = editUser?.id === currentUser?.id;
  const adminCount = users.filter(u => u.role === 'admin' && u.isActive).length;
  const isLastAdmin = editUser?.role === 'admin' && adminCount <= 1;

  // Form States
  const [name, setName] = useState<string>(editUser?.name || '');
  const [username, setUsername] = useState<string>(editUser?.username || '');
  const [email, setEmail] = useState<string>(editUser?.email || '');
  const [phone, setPhone] = useState<string>(editUser?.phone || '');
  const [role, setRole] = useState<UserRole>(editUser?.role || 'user');
  const [department, setDepartment] = useState<string>(editUser?.department || 'Front Office');
  const [designation, setDesignation] = useState<string>(editUser?.designation || 'Front Desk Executive');
  const [pinCode, setPinCode] = useState<string>(editUser?.pinCode || '1234');
  const [avatarColor, setAvatarColor] = useState<string>(editUser?.avatarColor || 'bg-primary');
  const [isActive, setIsActive] = useState<boolean>(editUser ? editUser.isActive : true);
  const [notes, setNotes] = useState<string>(editUser?.notes || '');

  // Delete State inside modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string>('');

  const handleDeleteThisUser = () => {
    if (!editUser) return;
    const res = deleteUser(editUser.id);
    if (res.success) {
      onClose();
    } else {
      setDeleteErrorMessage(res.message || 'Cannot delete user profile.');
    }
  };

  // Permissions Matrix
  const [allowedModules, setAllowedModules] = useState<AppModuleId[]>(
    editUser?.allowedModules || ['pms', 'invoices']
  );
  const [canManageUsers, setCanManageUsers] = useState<boolean>(editUser?.canManageUsers || false);
  const [canExportReports, setCanExportReports] = useState<boolean>(editUser?.canExportReports ?? true);
  const [canDeleteRecords, setCanDeleteRecords] = useState<boolean>(editUser?.canDeleteRecords || false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto-generate username from name if not editing
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !username) {
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '.');
      setUsername(generated);
    }
  };

  // When role changes to Admin, auto-select all modules
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setAllowedModules(SYSTEM_MODULES.map(m => m.id));
      setCanManageUsers(true);
      setCanExportReports(true);
      setCanDeleteRecords(true);
    } else if (newRole === 'manager') {
      setAllowedModules(['pms', 'pos', 'orders', 'invoices', 'expenses', 'menu', 'payroll', 'accounts']);
      setCanManageUsers(false);
      setCanExportReports(true);
      setCanDeleteRecords(false);
    }
  };

  // Apply Role Preset Template
  const handleApplyPreset = (presetId: string) => {
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setRole(preset.role);
    setDepartment(preset.department);
    setDesignation(preset.designation);
    setAllowedModules([...preset.allowedModules]);
    if (preset.role === 'admin') {
      setCanManageUsers(true);
      setCanDeleteRecords(true);
    } else {
      setCanManageUsers(false);
      setCanDeleteRecords(false);
    }
  };

  const toggleModule = (moduleId: AppModuleId) => {
    if (role === 'admin') return; // Admins always have all modules
    setAllowedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const selectAllModules = () => {
    setAllowedModules(SYSTEM_MODULES.map(m => m.id));
  };

  const clearAllModules = () => {
    if (role === 'admin') return;
    setAllowedModules([]);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Full Name is required';
    if (!username.trim()) errs.username = 'Username is required';
    if (!email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    
    if (pinCode && !/^\d{4,6}$/.test(pinCode)) {
      errs.pinCode = 'PIN must be 4 to 6 numeric digits';
    }

    if (role !== 'admin' && allowedModules.length === 0) {
      errs.modules = 'Please select at least one module for this user';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const userPayload = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      role,
      department,
      designation: designation.trim() || 'Staff Member',
      avatarColor,
      pinCode: pinCode.trim() || undefined,
      allowedModules: role === 'admin' ? SYSTEM_MODULES.map(m => m.id) : allowedModules,
      canManageUsers: role === 'admin' ? true : canManageUsers,
      canExportReports,
      canDeleteRecords: role === 'admin' ? true : canDeleteRecords,
      notes: notes.trim() || undefined,
      isActive,
      lastLogin: editUser?.lastLogin
    };

    if (isEditing && editUser) {
      updateUser(editUser.id, userPayload);
    } else {
      addUser(userPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              {isEditing ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? `Edit User: ${editUser?.name}` : 'Create New Staff User Profile'}
              </h2>
              <p className="text-xs text-white/80">
                Configure profile identity, role tier, and granular module access permissions
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Quick Role Preset Bar */}
          {!isEditing && (
            <div className="bg-surface-muted p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Quick Responsibility Presets:
                </span>
                <span className="text-[11px] text-secondary">Click to pre-fill role & module matrix</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="px-2.5 py-1 text-xs bg-white hover:bg-primary-light text-text font-medium rounded-lg border border-border transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <span>{preset.designation}</span>
                    <span className="text-[10px] text-secondary font-mono">({preset.allowedModules.length} mods)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Basic Identity & Contact Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Profile Identity & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavinda Fernando"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border ${errors.name ? 'border-red-400' : 'border-border'} rounded-xl text-sm focus:outline-none focus:border-primary`}
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  System Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kavinda.f"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border ${errors.username ? 'border-red-400' : 'border-border'} rounded-xl text-sm focus:outline-none focus:border-primary font-mono`}
                />
                {errors.username && <p className="text-[11px] text-red-500 mt-1">{errors.username}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="kavinda@hilldaleretreat.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 bg-white border ${errors.email ? 'border-red-400' : 'border-border'} rounded-xl text-sm focus:outline-none focus:border-primary`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Designation / Job Title */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Job Designation *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Desk Executive"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Quick Switch PIN */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Quick Staff PIN (4–6 Digits)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 bg-white border ${errors.pinCode ? 'border-red-400' : 'border-border'} rounded-xl text-sm focus:outline-none focus:border-primary font-mono tracking-widest`}
                  />
                </div>
                {errors.pinCode && <p className="text-[11px] text-red-500 mt-1">{errors.pinCode}</p>}
                <p className="text-[10px] text-secondary mt-0.5">Used for fast terminal profile switching</p>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Avatar Color Theme
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {AVATAR_COLORS.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAvatarColor(col)}
                      className={`w-6 h-6 rounded-full ${col} transition cursor-pointer flex items-center justify-center text-white ${avatarColor === col ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {avatarColor === col && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role Tier Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              2. User Profile Tier & Authority Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Admin */}
              <div 
                onClick={() => handleRoleChange('admin')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  role === 'admin'
                    ? 'border-primary bg-primary-light/30 text-text'
                    : 'border-border bg-white hover:border-border-focus'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Administrator
                    </span>
                    {role === 'admin' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-secondary-dark">
                    Unrestricted access to all 10 ERP modules, financials, P&L, treasury, settings, and user management.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-primary bg-white px-2 py-0.5 rounded border border-border w-fit">
                  Full Authority
                </div>
              </div>

              {/* Manager */}
              <div 
                onClick={() => handleRoleChange('manager')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  role === 'manager'
                    ? 'border-secondary bg-secondary-light/40 text-text'
                    : 'border-border bg-white hover:border-border-focus'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Manager
                    </span>
                    {role === 'manager' && <Check className="w-4 h-4 text-secondary" />}
                  </div>
                  <p className="text-xs text-secondary-dark">
                    Supervisory access across resort operations, guest folios, staff attendance, expenses, and service flows.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-secondary bg-white px-2 py-0.5 rounded border border-border w-fit">
                  Supervisory Access
                </div>
              </div>

              {/* Frontline User */}
              <div 
                onClick={() => handleRoleChange('user')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  role === 'user'
                    ? 'border-teal-600 bg-teal-50 text-text'
                    : 'border-border bg-white hover:border-border-focus'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      Frontline User
                    </span>
                    {role === 'user' && <Check className="w-4 h-4 text-teal-700" />}
                  </div>
                  <p className="text-xs text-secondary-dark">
                    Restricted access strictly to assigned operational modules tailored to daily job duty.
                  </p>
                </div>
                <div className="mt-2 text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-border w-fit">
                  Role-Tailored Access
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Granular Module Access Matrix */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                3. Allowed Module Permissions ({role === 'admin' ? SYSTEM_MODULES.length : allowedModules.length} / {SYSTEM_MODULES.length} Selected)
              </h3>
              
              {role !== 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllModules}
                    className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-secondary/40">•</span>
                  <button
                    type="button"
                    onClick={clearAllModules}
                    className="text-[11px] text-red-600 font-medium hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {role === 'admin' && (
              <div className="bg-primary-light/50 border border-border-focus p-3 rounded-xl flex items-center gap-2 text-xs text-primary">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Administrator Role Active:</strong> Administrators automatically have full access to all system modules, financial reports, and settings.
                </span>
              </div>
            )}

            {errors.modules && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {errors.modules}
              </p>
            )}

            {/* Grid of 10 Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYSTEM_MODULES.map(mod => {
                const isSelected = role === 'admin' || allowedModules.includes(mod.id);
                const isDisabled = role === 'admin';

                return (
                  <div
                    key={mod.id}
                    onClick={() => !isDisabled && toggleModule(mod.id)}
                    className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                      isDisabled 
                        ? 'bg-surface-muted border-border opacity-90 cursor-default'
                        : isSelected
                          ? 'bg-white border-primary shadow-xs cursor-pointer'
                          : 'bg-white/60 border-border hover:border-border-focus cursor-pointer'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-border-focus bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Module Icon & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-text">
                          <span className={isSelected ? 'text-primary' : 'text-secondary'}>
                            {MODULE_ICONS[mod.id]}
                          </span>
                          <span className="truncate">{mod.shortName}</span>
                        </div>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-surface-muted text-secondary border border-border">
                          {mod.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary-dark line-clamp-2 leading-tight">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Security Flags & Status */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              4. Advanced Security Governance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-border cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={role === 'admin' ? true : canManageUsers}
                  disabled={role === 'admin'}
                  onChange={(e) => setCanManageUsers(e.target.checked)}
                  className="mt-0.5 accent-[#5A634D]"
                />
                <div>
                  <span className="text-xs font-bold text-text block">Can Administer Users</span>
                  <span className="text-[11px] text-secondary">Create, edit and reset staff logins</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-border cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={canExportReports}
                  onChange={(e) => setCanExportReports(e.target.checked)}
                  className="mt-0.5 accent-[#5A634D]"
                />
                <div>
                  <span className="text-xs font-bold text-text block">Export CSV / Reports</span>
                  <span className="text-[11px] text-secondary">Download financial, POS and payroll data</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-border cursor-pointer hover:bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={role === 'admin' ? true : canDeleteRecords}
                  disabled={role === 'admin'}
                  onChange={(e) => setCanDeleteRecords(e.target.checked)}
                  className="mt-0.5 accent-[#5A634D]"
                />
                <div>
                  <span className="text-xs font-bold text-text block">Delete Records</span>
                  <span className="text-[11px] text-secondary">Void transactions and delete entries</span>
                </div>
              </label>
            </div>

            {/* Account Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border">
              <div>
                <span className="text-xs font-bold text-text block">Account Active Status</span>
                <span className="text-[11px] text-secondary">Suspended accounts cannot log in to the ERP</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-focus after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className={`ml-2 text-xs font-bold ${isActive ? 'text-primary' : 'text-red-600'}`}>
                  {isActive ? 'Active' : 'Suspended'}
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Warning inside Modal */}
        {showDeleteConfirm && editUser && (
          <div className="p-4 bg-red-50 border-t border-red-200 shrink-0 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-red-900">Permanently delete user profile "{editUser.name}"?</h5>
                <p className="text-[11px] text-red-700 mt-0.5">
                  This action cannot be undone. Staff account access and active PIN logins will be immediately revoked.
                </p>
                {deleteErrorMessage && (
                  <p className="text-xs font-bold text-red-800 bg-red-100 p-2 rounded-lg mt-2 border border-red-300">
                    {deleteErrorMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteErrorMessage('');
                }}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg border border-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteThisUser}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-border text-text font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
            >
              Cancel
            </button>

            {isEditing && editUser && !showDeleteConfirm && (
              <button
                type="button"
                disabled={isSelf || isLastAdmin}
                onClick={() => setShowDeleteConfirm(true)}
                title={isSelf ? 'Cannot delete your own active profile' : isLastAdmin ? 'Cannot delete the last admin' : 'Delete this staff profile'}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl border border-red-200 transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete User</span>
              </button>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Save User Changes' : 'Create User Profile'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
