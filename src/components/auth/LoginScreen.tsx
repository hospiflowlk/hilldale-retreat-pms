import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building, 
  Bed, 
  UtensilsCrossed, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Landmark, 
  Coffee, 
  MenuSquare,
  ShieldAlert,
  Clock,
  ChevronRight,
  Info,
  RefreshCw,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { AppModuleId, UserProfile, UserRole } from '../../types';
import { SYSTEM_MODULES } from '../../data/userData';

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

export const LoginScreen: React.FC = () => {
  const { users } = useApp();
  const { login, pinLogin, isLoggingIn } = useAuth();
  
  // Also get the internal AppContext methods for updating local state after success
  const { setCurrentUserById, setSession } = useApp();

  const [activeMode, setActiveMode] = useState<'terminal' | 'credentials' | 'demo'>('terminal');
  
  // Terminal Quick PIN State
  const [selectedStaffUser, setSelectedStaffUser] = useState<UserProfile>(users[0]);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Credentials Form State
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [credError, setCredError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string>('');

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update selected staff user if users change
  useEffect(() => {
    if (users.length > 0 && !selectedStaffUser) {
      setSelectedStaffUser(users[0]);
    }
  }, [users, selectedStaffUser]);

  // Handle PIN Keypad press
  const handlePinKeyPress = async (digit: string) => {
    if (pinInput.length < 6) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setPinError('');

      if (newPin.length === 4 || newPin.length === 5 || newPin.length === 6) {
        setIsSubmitting(true);
        const res = await pinLogin({ userId: selectedStaffUser.id, pinCode: newPin });
        setIsSubmitting(false);
        if (!res.success) {
          if (newPin.length === 6) {
            setPinError(res.error || 'Incorrect PIN code.');
            setPinInput('');
          }
        } else {
          setSession(res.user!.id, res.token!);
          setLoginSuccessMessage(`Welcome back, ${res.user?.name}!`);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handleTerminalPinSubmit = async () => {
    if (!pinInput) {
      setPinError('Please enter your security PIN.');
      return;
    }
    setIsSubmitting(true);
    const res = await pinLogin({ userId: selectedStaffUser.id, pinCode: pinInput });
    setIsSubmitting(false);
    if (!res.success) {
      setPinError(res.error || 'Incorrect PIN code.');
      setPinInput('');
    } else {
      setSession(res.user!.id, res.token!);
      setLoginSuccessMessage(`Welcome back, ${res.user?.name}!`);
    }
  };

  const handleDeleteDigit = () => {
    setPinInput('');
    setPinError('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    if (!identifierInput || !passwordInput) {
      setCredError('Please provide both identifier and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login({ identifier: identifierInput, pinCode: passwordInput });
    setIsSubmitting(false);
    
    if (!res.success) {
      setCredError(res.error || 'Authentication failed. Please check your credentials.');
    } else {
      setSession(res.user!.id, res.token!);
      setLoginSuccessMessage(`Access Granted. Launching session for ${res.user?.name}...`);
    }
  };

  const handleDemoQuickLogin = async (user: UserProfile) => {
    setIsSubmitting(true);
    const pin = user.pinCode || '1234';
    const res = await pinLogin({ userId: user.id, pinCode: pin });
    setIsSubmitting(false);
    
    if (res.success) {
      setSession(res.user!.id, res.token!);
      setLoginSuccessMessage(`Logged in as ${user.name} (${user.designation})`);
    } else {
      setPinError(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#1E231B] text-text flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background Decor & Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#DDA15E] rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#283618] rounded-full blur-3xl"></div>
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-secondary-light flex items-center justify-center font-serif font-bold text-xl shadow-md border border-primary-light/20">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg text-background tracking-wide">
                Hilldale Retreat
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-primary/60 text-primary-light border border-primary-light/30">
                Ella, Sri Lanka
              </span>
            </div>
            <p className="text-[11px] text-[#A69F91]">
              Suites PMS • Channel Sync • Restaurant POS • Financial Ledger & RBAC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-border">
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[#DDA15E]" />
            <span className="font-mono font-medium text-white">{currentTime || '12:00:00'}</span>
            <span className="text-[10px] text-white/50">(SLST GMT+5:30)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/30 border border-border-focus/20 px-3 py-1.5 rounded-full text-[11px] text-primary-light">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-light" />
            <span>Role-Based Access Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl bg-background rounded-3xl shadow-2xl border border-border overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Left Column: Mode Switcher & Authentication Form (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3 h-3" />
                  <span>Secure Staff Access Terminal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text">
                  Sign In to Your Shift
                </h2>
                <p className="text-xs sm:text-sm text-secondary mt-1">
                  Authenticate using your 4-digit staff PIN, user credentials, or quick terminal role switch.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex p-1 bg-surface-muted rounded-xl border border-border mb-6">
                <button
                  type="button"
                  id="tab-mode-terminal"
                  onClick={() => { setActiveMode('terminal'); setPinError(''); setCredError(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'terminal'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-[#6E6355] hover:text-text hover:bg-white/50'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Staff PIN Pad</span>
                </button>

                <button
                  type="button"
                  id="tab-mode-credentials"
                  onClick={() => { setActiveMode('credentials'); setPinError(''); setCredError(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'credentials'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-[#6E6355] hover:text-text hover:bg-white/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>User & Password</span>
                </button>

                <button
                  type="button"
                  id="tab-mode-demo"
                  onClick={() => { setActiveMode('demo'); setPinError(''); setCredError(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'demo'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-[#6E6355] hover:text-text hover:bg-white/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Roles</span>
                </button>
              </div>

              {/* Success Notification */}
              {loginSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{loginSuccessMessage}</span>
                </div>
              )}

              {/* MODE 1: TERMINAL / STAFF PIN PAD */}
              {activeMode === 'terminal' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                      Select Your Staff Profile:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {users.map(u => {
                        const isSelected = selectedStaffUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffUser(u);
                              setPinInput('');
                              setPinError('');
                            }}
                            className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF8F5] border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-white border-border hover:bg-[#FAF8F5] opacity-80 hover:opacity-100'
                            } ${!u.isActive ? 'opacity-40 line-through' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-full ${u.avatarColor || 'bg-primary'} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                              {u.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-text truncate">{u.name.split(' ')[0]}</p>
                              <p className="text-[10px] text-secondary truncate">{u.designation.split(' ')[0]}</p>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Profile Banner & PIN Input Display */}
                  <div className="bg-[#FAF8F5] border border-border-focus/60 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${selectedStaffUser?.avatarColor || 'bg-primary'} text-white font-bold text-xs flex items-center justify-center`}>
                          {selectedStaffUser?.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-text">{selectedStaffUser?.name}</span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                              selectedStaffUser?.role === 'admin' 
                                ? 'bg-primary-light text-primary' 
                                : selectedStaffUser?.role === 'manager' 
                                  ? 'bg-secondary-light text-secondary' 
                                  : 'bg-teal-50 text-teal-700'
                            }`}>
                              {selectedStaffUser?.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-secondary">{selectedStaffUser?.designation}</p>
                        </div>
                      </div>

                      {/* Demo PIN Hint */}
                      <span className="text-[10px] text-secondary bg-white border border-border px-2 py-0.5 rounded-full font-mono">
                        PIN: <span className="font-bold text-text">{selectedStaffUser?.pinCode || '1234'}</span>
                      </span>
                    </div>

                    {/* PIN Dots Display */}
                    <div className="flex items-center justify-center gap-3 my-2">
                      {[0, 1, 2, 3].map(i => {
                        const hasVal = pinInput.length > i;
                        return (
                          <div 
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-150 ${
                              hasVal 
                                ? 'bg-primary scale-110 shadow-xs' 
                                : 'bg-border border border-border-focus'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {pinError && (
                      <p className="text-center text-xs font-semibold text-rose-600 mt-2 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{pinError}</span>
                      </p>
                    )}
                  </div>

                  {/* On-screen Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePinKeyPress(num)}
                        className="h-11 bg-white hover:bg-[#FAF8F5] active:bg-primary-light border border-border hover:border-primary/40 rounded-xl text-base font-bold text-text transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleDeleteDigit}
                      className="h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinKeyPress('0')}
                      className="h-11 bg-white hover:bg-[#FAF8F5] active:bg-primary-light border border-border hover:border-primary/40 rounded-xl text-base font-bold text-text transition shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="h-11 bg-surface-muted hover:bg-border border border-border rounded-xl text-xs font-bold text-primary transition flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      ⌫ Del
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTerminalPinSubmit()}
                    disabled={isSubmitting || pinInput.length === 0}
                    className="w-full py-3 bg-primary hover:bg-[#4D5541] disabled:bg-primary/50 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Authenticate & Enter Station</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* MODE 2: USERNAME & PASSWORD FORM */}
              {activeMode === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                      Username, Email, or Staff ID
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                      <input
                        type="text"
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder="e.g. arthur.gm or gm@hilldaleretreat.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-focus rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary text-text"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                        Password or 4-Digit PIN
                      </label>
                      <span className="text-[11px] text-secondary">
                        Demo: <code className="font-bold text-text">admin123</code> or user PIN
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password or PIN"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-border-focus rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary text-text"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-text p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {credError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{credError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-secondary">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                      <span>Keep station session active</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifierInput('arthur.gm');
                        setPasswordInput('1001');
                      }}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Fill Admin Demo
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary hover:bg-[#4D5541] disabled:bg-primary/50 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In Securely</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 3: 1-CLICK ROLES DEMO EXPLORER */}
              {activeMode === 'demo' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-secondary-light/60 border border-[#DDA15E]/40 rounded-xl text-xs text-secondary flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-text">Instant Role Evaluation Suite:</span> Click any staff member below to immediately launch the application from their permission perspective.
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleDemoQuickLogin(u)}
                        disabled={!u.isActive}
                        className="w-full p-2.5 bg-white hover:bg-[#FAF8F5] border border-border hover:border-primary rounded-xl text-left transition flex items-center justify-between group cursor-pointer shadow-xs disabled:opacity-40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${u.avatarColor || 'bg-primary'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                            {u.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-text group-hover:text-primary transition">{u.name}</span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                                u.role === 'admin' 
                                  ? 'bg-primary-light text-primary' 
                                  : u.role === 'manager' 
                                    ? 'bg-secondary-light text-secondary' 
                                    : 'bg-teal-50 text-teal-700'
                              }`}>
                                {u.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-secondary truncate">{u.designation} • {u.department}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-secondary bg-surface-muted px-2 py-0.5 rounded-md font-mono">
                            <span>{u.role === 'admin' ? '10/10' : `${u.allowedModules?.length || 0}/10`} Mods</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center group-hover:translate-x-0.5 transition">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="pt-4 mt-6 border-t border-border flex items-center justify-between text-[11px] text-secondary">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Station Session Security</span>
              </span>
              <span>Hilldale Retreat ERP v3.2</span>
            </div>
          </div>

          {/* Right Column: Permission Matrix & Role Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-primary text-white p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#4D5541]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-secondary-light">
                  Role Scope & Matrix
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  Live Preview
                </span>
              </div>

              <p className="text-xs text-white/80 leading-relaxed mb-4">
                The selected staff profile will be granted access strictly to authorized ERP modules upon signing in:
              </p>

              {/* Selected Profile Card */}
              <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${selectedStaffUser?.avatarColor || 'bg-white/20'} text-white font-bold text-sm flex items-center justify-center ring-2 ring-white/30`}>
                    {selectedStaffUser?.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{selectedStaffUser?.name}</h4>
                    <p className="text-xs text-primary-light">{selectedStaffUser?.designation}</p>
                    <span className="text-[10px] text-white/60">{selectedStaffUser?.department}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Role Tier:</span>
                    <span className="font-bold uppercase tracking-wider text-secondary-light text-[11px]">
                      {selectedStaffUser?.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">User Status:</span>
                    <span className={`font-bold text-[11px] ${selectedStaffUser?.isActive ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {selectedStaffUser?.isActive ? '● Active Staff' : '● Deactivated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">User Management:</span>
                    <span className="font-mono text-white/90 text-[11px]">
                      {selectedStaffUser?.canManageUsers || selectedStaffUser?.role === 'admin' ? 'Yes (Admin)' : 'Restricted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Access Badges */}
              <div>
                <label className="block text-xs font-bold text-primary-light uppercase tracking-wider mb-2">
                  Permitted Modules ({selectedStaffUser?.role === 'admin' ? 'All 10 Modules' : `${selectedStaffUser?.allowedModules?.length || 0} Modules`}):
                </label>
                
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {SYSTEM_MODULES.map(mod => {
                    const isAllowed = selectedStaffUser?.role === 'admin' || (selectedStaffUser?.allowedModules && selectedStaffUser.allowedModules.includes(mod.id));
                    return (
                      <div
                        key={mod.id}
                        className={`p-2 rounded-xl text-xs flex items-center gap-2 border transition ${
                          isAllowed
                            ? 'bg-white/15 border-white/20 text-white font-medium'
                            : 'bg-black/20 border-white/5 text-white/30'
                        }`}
                      >
                        <div className={isAllowed ? 'text-secondary-light' : 'text-white/20'}>
                          {MODULE_ICONS[mod.id]}
                        </div>
                        <span className="truncate text-[11px]">{mod.shortName}</span>
                        {isAllowed && (
                          <Check className="w-3 h-3 text-primary-light ml-auto shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Help Tip */}
            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/70 flex items-start gap-2 bg-white/5 p-3 rounded-xl">
              <Info className="w-4 h-4 text-secondary-light shrink-0 mt-0.5" />
              <span>
                Need access to additional modules or new staff onboarding? Contact General Manager or IT Administrator.
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-xs text-secondary/80 border-t border-white/5 bg-black/30">
        © 2026 Hilldale Retreat Ella, Sri Lanka • Proprietary Hospitality ERP, PMS & Point of Sale System
      </footer>
    </div>
  );
};
