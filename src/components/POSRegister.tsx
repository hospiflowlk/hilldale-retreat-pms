import React, { useState, useMemo, useEffect } from 'react';
import { MessageCircle, CheckCircle, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Clock, 
  Utensils, 
  ChefHat, 
  Sparkles, 
  Leaf, 
  Check, 
  Bed, 
  User, 
  Edit2, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  Grid, 
  Coffee, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  MenuSquare, 
  Users, 
  Landmark, 
  Lock, 
  LogOut, 
  Settings as SettingsIcon,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMenu } from '../hooks/useMenu';
import { useUsers } from '../hooks/useUsers';
import { usePMS } from '../hooks/usePMS';
import { usePOS } from '../hooks/usePOS';
import { MENU_CATEGORIES, RETREAT_LOCATIONS } from '../data/menuData';
import { MenuItem, OrderType, Order } from '../types';
import { POSGuestSelectorModal } from './pos/POSGuestSelectorModal';
import { POSHeader } from './pos/POSHeader';

// Palette of Natural Tones category accents for badges and visual variety
const NATURAL_CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  soup: { bg: 'bg-primary-light', text: 'text-primary', icon: '🍲' },
  omelette: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🍳' },
  salad: { bg: 'bg-[#D4E09B]', text: 'text-primary-dark', icon: '🥗' },
  grilled: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🥩' },
  devilled: { bg: 'bg-accent-light/60', text: 'text-secondary', icon: '🌶️' },
  pasta: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🍝' },
  spaghetti: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🍝' },
  sandwiches: { bg: 'bg-border-focus', text: 'text-primary', icon: '🥪' },
  burgers: { bg: 'bg-accent-light/60', text: 'text-secondary', icon: '🍔' },
  rice: { bg: 'bg-primary-light', text: 'text-primary', icon: '🍚' },
  noodles: { bg: 'bg-border-focus', text: 'text-primary', icon: '🍜' },
  sri_lankan: { bg: 'bg-primary-light', text: 'text-primary', icon: '🍛' },
  kottu: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🥘' },
  extras: { bg: 'bg-border-focus', text: 'text-primary', icon: '🍟' },
  desserts: { bg: 'bg-accent-light/60', text: 'text-secondary', icon: '🍨' },
  from_pan: { bg: 'bg-secondary-light', text: 'text-secondary', icon: '🥞' },
  tea: { bg: 'bg-[#D4E09B]', text: 'text-primary-dark', icon: '🍵' },
  coffee: { bg: 'bg-accent-light', text: 'text-secondary', icon: '☕' },
  fresh_drinks: { bg: 'bg-primary-light', text: 'text-primary', icon: '🍹' },
  smoothies: { bg: 'bg-border-focus', text: 'text-primary', icon: '🥤' },
  fizzy: { bg: 'bg-primary-light', text: 'text-primary', icon: '🥤' },
  alcohol: { bg: 'bg-accent-light/60', text: 'text-secondary', icon: '🥃' },
  cocktails: { bg: 'bg-accent/20', text: 'text-[#9e432c]', icon: '🍸' },
};

export const POSRegister: React.FC = () => {
  const { 
    cartItems, 
    addToCart, 
    updateCartItemQty, 
    removeFromCart, 
    clearCart,
    currentLocation,
    setCurrentLocation,
    currentOrderType,
    setCurrentOrderType,
    guestName,
    setGuestName,
    guestCount,
    setGuestCount,
    currentSessionId,
    setCurrentSessionId,
    orderNotes,
    setOrderNotes,
    discountPercent,
    setDiscountPercent,
    applyServiceCharge,
    setApplyServiceCharge,
    cartSubtotal,
    cartServiceCharge,
    cartDiscount,
    cartTax,
    cartGrandTotal,
    settings,
    setSelectedItemForModifier,
    setSelectedOrderForKOT,
    setSelectedOrderForReceipt,
    setIsPaymentModalOpen,
    activeOrderToEdit,
    openDeleteOrderModal,
    currentUser,
    isUserAllowedModule,
    setActiveTab,
    setIsSwitchUserModalOpen,
    lockSession,
    logout,
    setIsSettingsModalOpen,
    loadOrderIntoCart
  } = useApp();

  const { bookings } = usePMS();
  const { orders, createOrder } = usePOS();
  const { menuItems } = useMenu();

  // Local helper functions
  const extractRoomNumber = (location: string): string => {
    const match = (location || '').match(/Room\s*(\w+)/i);
    return match ? match[1] : '';
  };

  const getCheckedInGuest = (roomNum: string) => {
    return bookings.find(b => b.roomNumber === roomNum && b.status === 'checked_in');
  };

  const { users } = useUsers();

  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(() => {
    return !guestName && !currentSessionId && cartItems.length === 0;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegetarianOnly, setVegetarianOnly] = useState<boolean>(false);
  const [densityMode, setDensityMode] = useState<'compact' | 'comfortable'>('compact');
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Handle rejection silently if blocked by browser policy
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Derive active checked-in room data if current location is a room
  const currentRoomNumber = useMemo(() => {
    return extractRoomNumber(currentLocation);
  }, [currentLocation, extractRoomNumber]);

  const activeCheckedInGuest = useMemo(() => {
    if (!currentRoomNumber) return null;
    return getCheckedInGuest(currentRoomNumber);
  }, [currentRoomNumber, getCheckedInGuest]);

  const inHouseGuestsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'checked_in').length;
  }, [bookings]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
  }, [orders]);

  const totalCartQty = useMemo(() => {
    return (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.isAvailable) return false;
      if ((item as any).showInPos === false) return false;
      if (vegetarianOnly && !item.isVegetarian) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, vegetarianOnly]);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItemForModifier(item);
  };

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (item.requiresSides) {
      setSelectedItemForModifier(item);
    } else {
      addToCart(item, [], '', 1);
    }
  };


  const buildAndCreateOrder = (status: 'active' | 'preparing' | 'served' | 'paid' = 'active'): Order => {
    const generatedId = 'ORD-' + Date.now();
    const orderObj: Partial<Order> = {
      id: generatedId,
      orderNumber: (Math.floor(1000 + Math.random() * 9000)).toString(),
      invoiceNumber: 'INV-' + Date.now(),
      items: cartItems,
      subtotal: cartSubtotal,
      serviceChargeRate: applyServiceCharge ? (settings?.defaultServiceChargeRate || 0.10) : 0,
      serviceChargeAmount: cartServiceCharge,
      discountPercent: discountPercent,
      discountAmount: cartDiscount,
      taxPercent: settings?.taxRate || 0,
      taxAmount: cartTax,
      grandTotal: cartGrandTotal,
      status,
      orderType: currentOrderType,
      location: currentLocation,
      guestName,
      guestCount,
      sessionId: currentSessionId,
      createdAt: new Date().toISOString(),
    };
    createOrder(orderObj);
    return orderObj as Order;
  };

  const handleSendToKitchen = () => {
    if (cartItems.length === 0) return;
    const order = buildAndCreateOrder('preparing');
    setSelectedOrderForKOT(order);
    setActiveTab('orders');
  };

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    buildAndCreateOrder('active');
  };

  const handleOpenPayment = () => {
    if (cartItems.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleSelectGuestFromModal = (details: {
    location: string;
    guestName: string;
    guestCount: number;
    orderType: OrderType;
    sessionId?: string;
  }) => {
    setCurrentLocation(details.location);
    setGuestName(details.guestName);
    setGuestCount(details.guestCount);
    setCurrentOrderType(details.orderType);
    setCurrentSessionId(details.sessionId);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-text overflow-hidden select-none">
      
      {/* 1. Sleek Full-Screen POS Top Navigation Bar (Collapsed & High-Efficiency) */}
      <POSHeader 
        isNavDropdownOpen={isNavDropdownOpen} 
        setIsNavDropdownOpen={setIsNavDropdownOpen} 
        inHouseGuestsCount={inHouseGuestsCount} 
        activeOrdersCount={activeOrdersCount} 
        densityMode={densityMode} 
        setDensityMode={setDensityMode} 
        isNativeFullscreen={isNativeFullscreen} 
        toggleNativeFullscreen={toggleNativeFullscreen} 
        currentTime={currentTime} 
      />

      {/* 2. Main Full-Screen Body: Left Catalog + Right Cart Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT AREA: High-Density Catalog & Fast Category Navigation */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-2 sm:p-3 space-y-2">
          
          {/* Step 1 Compact Destination & Guest Bar */}
          <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                activeCheckedInGuest ? 'bg-primary text-white shadow-2xs' : 'bg-secondary-light text-secondary'
              }`}>
                {activeCheckedInGuest ? <Bed className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Ordering For:
                  </span>
                  {activeCheckedInGuest ? (
                    <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-primary-light text-primary flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>In-House PMS Folio Linked</span>
                    </span>
                  ) : currentSessionId ? (
                    <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-primary text-white flex items-center gap-1 font-mono">
                      <span>Walk-In Tab: {currentSessionId}</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-surface-muted text-secondary border border-border">
                      Walk-In Dining
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-text truncate">
                    {activeCheckedInGuest ? (
                      <span>Room {currentRoomNumber}: {activeCheckedInGuest.guestName}</span>
                    ) : guestName ? (
                      <span>{guestName} ({currentLocation})</span>
                    ) : (
                      <span>{currentLocation}</span>
                    )}
                  </h3>
                  <span className="text-[11px] text-secondary">
                    • {currentOrderType === 'room-service' ? 'Room Delivery' : currentOrderType === 'dine-in' ? 'Dine-In' : currentOrderType} • {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-switch-room-guest"
              onClick={() => setIsGuestModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-muted hover:bg-surface-muted-hover text-primary border border-border hover:border-primary transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Room / Tab</span>
            </button>
          </div>

          {/* Fast Search & Category Filters Bar */}
          <div className="bg-white border border-border rounded-xl p-2 shadow-2xs space-y-2 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-secondary absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="menu-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search devilled, curries, kottu, Ceylon tea, grills, cocktails..."
                  className="w-full bg-surface-muted border border-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1.5 text-xs text-secondary hover:text-text cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Vegetarian & Count Indicators */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="filter-veg-toggle"
                  onClick={() => setVegetarianOnly(!vegetarianOnly)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    vegetarianOnly
                      ? 'bg-primary-light border-primary text-primary'
                      : 'bg-surface-muted border-border text-secondary-dark hover:border-secondary'
                  }`}
                >
                  <Leaf className="w-3 h-3 text-primary" />
                  <span>Veg (V)</span>
                </button>

                <div className="text-[11px] text-secondary px-2 py-1 bg-surface-muted rounded-lg border border-border">
                  <span className="font-bold text-primary">{filteredMenuItems.length}</span> items
                </div>
              </div>
            </div>

            {/* Category Pills Horizontal Scrollbar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white font-bold shadow-2xs'
                    : 'bg-surface-muted text-secondary-dark hover:bg-white border border-border'
                }`}
              >
                All ({menuItems.length})
              </button>

              {MENU_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const meta = NATURAL_CATEGORY_COLORS[cat.id] || { icon: '🍽️' };
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-2xs'
                        : 'bg-surface-muted text-secondary-dark hover:bg-white border border-border'
                    }`}
                  >
                    <span className="text-xs">{meta.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* High-Density Menu Items Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredMenuItems.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center text-secondary space-y-2 shadow-2xs">
                <Utensils className="w-8 h-8 mx-auto text-secondary/50 mb-1" />
                <p className="text-sm font-semibold text-text">No menu items match your filter.</p>
                <p className="text-xs text-secondary">Try adjusting your search or category selection.</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setVegetarianOnly(false); }}
                  className="mt-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className={
                densityMode === 'compact'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5"
                  : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
              }>
                {filteredMenuItems.map((item) => {
                  const isVeg = item.isVegetarian;
                  const inCartItems = cartItems.filter(ci => ci.menuItemId === item.id);
                  const inCartQty = (inCartItems || []).reduce((s, i) => s + i.quantity, 0);
                  const meta = NATURAL_CATEGORY_COLORS[item.category] || { bg: 'bg-primary-light', text: 'text-primary', icon: '🍃' };

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group bg-white hover:bg-surface-hover border rounded-xl p-2.5 sm:p-3 transition duration-150 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md relative overflow-hidden ${
                        inCartQty > 0 
                          ? 'border-primary ring-1 ring-primary bg-surface-hover' 
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {/* Tile Top: Icon, Tags, Name */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className={`w-6 h-6 ${meta.bg} ${meta.text} rounded-md flex items-center justify-center text-xs shrink-0`}>
                            {meta.icon}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {isVeg && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary-light text-primary border border-border-focus font-bold" title="Vegetarian">
                                (V)
                              </span>
                            )}
                            {item.requiresSides && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-secondary-light text-secondary border border-border font-semibold">
                                2 Sides
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs sm:text-sm font-bold text-text group-hover:text-primary transition line-clamp-2 leading-snug">
                          {item.name}
                        </h4>

                        {/* Category / Portion */}
                        <div className="flex items-center justify-between gap-1 mt-0.5 text-[10px] text-secondary">
                          <span className="capitalize truncate">
                            {MENU_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                          </span>
                          {item.portionInfo && (
                            <span className="text-[9px] text-secondary-dark bg-surface-muted px-1 rounded-sm border border-border">
                              {item.portionInfo}
                            </span>
                          )}
                        </div>

                        {/* Subtle Description */}
                        {item.description && (
                          <p className="text-[10px] text-secondary-dark mt-1 line-clamp-1 leading-tight">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Tile Bottom: Price & Quick Action */}
                      <div className="mt-2.5 pt-2 border-t border-border/80 flex items-center justify-between gap-1">
                        <div>
                          <div className="text-xs sm:text-sm font-bold font-mono text-text">
                            ${(Number(item.price) || 0).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-secondary font-mono leading-none">
                            ≈ Rs. {Math.round(item.price * settings.usdToLkrRate).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center">
                          {inCartQty > 0 ? (
                            <div className="flex items-center gap-1 bg-primary text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                              <Check className="w-2.5 h-2.5" />
                              <span>{inCartQty}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(e, item)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface-muted group-hover:bg-primary text-text group-hover:text-white flex items-center justify-center font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
                              title="Add to Bill"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA: Full-Height Bill / Cart & Settlement Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-30 lg:z-auto w-full sm:w-[380px] lg:w-[350px] xl:w-[380px] shrink-0 flex flex-col bg-white border-l border-border shadow-xl lg:shadow-none h-full overflow-hidden transition-transform duration-200
          ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          
          {/* Cart Header */}
          <div className="p-3 border-b border-border bg-surface-muted space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  {activeOrderToEdit ? `Order #${activeOrderToEdit.orderNumber}` : 'Current Guest Bill'}
                </h2>
                {totalCartQty > 0 && (
                  <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.2 rounded-full">
                    {totalCartQty} items
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeOrderToEdit && (
                  <button
                    type="button"
                    onClick={() => openDeleteOrderModal(activeOrderToEdit)}
                    className="text-xs text-accent hover:text-[#c9644a] flex items-center gap-1 cursor-pointer font-bold px-2 py-0.5 rounded-lg hover:bg-accent/10 transition border border-accent/30"
                    title="Void and delete this order (Requires Manager PIN)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Void Order</span>
                  </button>
                )}

                {cartItems.length > 0 && !activeOrderToEdit && (
                  <button
                    id="btn-clear-cart"
                    onClick={clearCart}
                    className="text-xs text-secondary hover:text-accent flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="lg:hidden p-1 text-secondary hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Destination summary in cart */}
            <div className="bg-white border border-border rounded-xl p-2 space-y-1 shadow-2xs text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-text truncate">
                  {activeCheckedInGuest ? (
                    <>
                      <Bed className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Room {currentRoomNumber}: {activeCheckedInGuest.guestName}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span className="truncate">{guestName || currentLocation}</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsGuestModalOpen(true)}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Change</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-secondary">
                <span>{currentLocation} • {guestCount} {guestCount === 1 ? 'Diner' : 'Diners'}</span>
                <span className="font-semibold uppercase bg-surface-muted px-1.5 py-0.2 rounded-sm text-primary">
                  {currentOrderType.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Cart Items Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-secondary space-y-2">
                <Utensils className="w-8 h-8 text-secondary/30 stroke-1" />
                <p className="text-xs font-semibold text-[#424242]">Bill is empty</p>
                <p className="text-[11px] text-secondary">Tap items on the menu catalog to add them to this order.</p>
              </div>
            ) : (
              cartItems.map((ci, idx) => (
                <div key={ci.id || idx} className="bg-surface-hover border border-border rounded-xl p-2 flex justify-between items-start gap-2 text-xs shadow-2xs">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-text truncate">{ci.name}</span>
                    {ci.selectedSides && ci.selectedSides.length > 0 && (
                      <span className="text-[10px] text-secondary line-clamp-1">
                        Sides: {ci.selectedSides.join(', ')}
                      </span>
                    )}
                    {ci.notes && (
                      <span className="text-[10px] text-secondary italic line-clamp-1">
                        "{ci.notes}"
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-secondary mt-0.5">
                      ${(Number(ci.price) || 0).toFixed(2)} each
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="font-mono font-bold text-text text-xs">
                      ${((Number(ci.price) || 0) * ci.quantity).toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-border">
                      <button
                        onClick={() => updateCartItemQty(idx, -1)}
                        className="w-4 h-4 rounded-md flex items-center justify-center text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-4 text-center font-mono font-bold text-text text-xs">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(idx, 1)}
                        className="w-4 h-4 rounded-md flex items-center justify-center text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Calculations & Settlement Actions */}
          <div className="p-3 border-t border-border bg-surface-muted space-y-2 text-xs shrink-0">
            {/* Service Charge & Discounts */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border">
              <label className="flex items-center gap-1.5 text-text font-semibold cursor-pointer text-xs">
                <input
                  type="checkbox"
                  id="checkbox-service-charge"
                  checked={applyServiceCharge}
                  onChange={(e) => setApplyServiceCharge(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>10% Service Charge</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-secondary text-[11px]">Discount:</span>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                  className="bg-white border border-border rounded-md px-1.5 py-0.5 text-xs text-primary font-bold focus:outline-hidden"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                </select>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-secondary-dark text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal ({totalCartQty} items):</span>
                <span className="font-mono text-text font-semibold">${cartSubtotal.toFixed(2)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-secondary font-medium">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-mono">-${cartDiscount.toFixed(2)}</span>
                </div>
              )}
              {applyServiceCharge && (
                <div className="flex justify-between">
                  <span>Service (10%):</span>
                  <span className="font-mono text-text font-semibold">${cartServiceCharge.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="pt-1.5 border-t border-border flex justify-between items-baseline">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Grand Total:</span>
                <p className="text-[10px] text-primary font-mono font-semibold">
                  ≈ Rs. {Math.round(cartGrandTotal * settings.usdToLkrRate).toLocaleString()} LKR
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-serif font-bold text-text">
                  ${cartGrandTotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-secondary ml-1">USD</span>
              </div>
            </div>

                        {/* Action Buttons: Place & WhatsApp */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleSendToKitchen}
                className={`py-3 px-2 rounded-xl text-[10px] uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md text-center ${
                  cartItems.length > 0
                    ? 'bg-secondary hover:bg-secondary-dark text-white shadow-secondary/20'
                    : 'bg-border text-secondary/50 cursor-not-allowed shadow-none'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Send to Kitchen</span>
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleOpenPayment}
                className={`py-3 px-2 rounded-xl text-[10px] uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md text-center ${
                  cartItems.length > 0
                    ? 'bg-primary hover:bg-[#4d5541] text-white shadow-[#5A634D]/20'
                    : 'bg-border text-secondary/50 cursor-not-allowed shadow-none'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay & Settle</span>
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => {
                  buildAndCreateOrder('preparing'); // Save the order as preparing since it's going to the kitchen
                  
                  let text = `🍳 *NEW KOT - ${currentLocation}*\n`;
                  if (guestName) text += `👤 Guest: ${guestName}\n`;
                  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  text += `⏰ Time: ${time}\n`;
                  
                  const getGroup = (category) => {
                    const bevs = ['tea', 'coffee', 'fresh_drinks', 'smoothies', 'fizzy', 'alcohol', 'cocktails'];
                    const starters = ['soup', 'salad', 'omelette', 'from_pan'];
                    const desserts = ['desserts'];
                    if (bevs.includes(category)) return 'Beverages';
                    if (starters.includes(category)) return 'Starters';
                    if (desserts.includes(category)) return 'Dessert';
                    return 'Mains';
                  };

                  const groupedItems = {
                    Starters: [],
                    Mains: [],
                    Dessert: [],
                    Beverages: []
                  };

                  cartItems.forEach(item => {
                    const group = getGroup(menuItems.find(m => m.id === item.menuItemId)?.category || 'Starters');
                    groupedItems[group].push(item);
                  });

                  ['Starters', 'Mains', 'Dessert', 'Beverages'].forEach(groupName => {
                    const items = groupedItems[groupName];
                    if (items && items.length > 0) {
                      text += `\n*[ ${groupName.toUpperCase()} ]*\n`;
                      text += `-----------------\n`;
                      items.forEach(item => {
                        text += `☑️ *${item.quantity}x ${item.name}*\n`;
                        if (item.selectedSides && item.selectedSides.length > 0) {
                          text += `   ➕ ${item.selectedSides.map(s => s.name).join(', ')}\n`;
                        }
                        if (item.notes) {
                          text += `   📝 Note: ${item.notes}\n`;
                        }
                      });
                    }
                  });
                  text += `-----------------\n`;
                  
                  const encoded = encodeURIComponent(text);
                  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
                }}
                className={`py-3 px-2 rounded-xl text-[10px] uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-md text-center ${
                  cartItems.length > 0
                    ? 'bg-[#25D366] hover:bg-[#20b958] text-white shadow-[#25D366]/20'
                    : 'bg-border text-secondary/50 cursor-not-allowed shadow-none'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order & WhatsApp</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Bottom Cart Bar for Small Screens */}
      <div className="lg:hidden p-2 bg-white border-t border-border flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
            {totalCartQty}
          </div>
          <div>
            <div className="text-xs font-bold text-text">
              ${cartGrandTotal.toFixed(2)} USD
            </div>
            <div className="text-[10px] text-secondary">
              {currentLocation}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs"
        >
          View Bill ({totalCartQty})
        </button>
      </div>

      {/* Step 1 Room & Guest Selector Modal */}
      <POSGuestSelectorModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onCancel={() => {
          if (!guestName && cartItems.length === 0) {
            setActiveTab('pms');
          } else {
            setIsGuestModalOpen(false);
          }
        }}
        onSelectGuest={handleSelectGuestFromModal}
        onEditOrder={loadOrderIntoCart}
      />
    </div>
  );
};
