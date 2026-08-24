import React, { useState, useMemo } from 'react';
import { 
  Coffee, 
  ChefHat, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  AlertCircle,
  Search,
  Filter,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePOS } from '../hooks/usePOS';
import { Order, OrderStatus } from '../types';
import { NewWalkInModal } from './pos/NewWalkInModal';
import { WalkInSessionCheckoutModal } from './pos/WalkInSessionCheckoutModal';

export const ActiveOrdersView: React.FC = () => {
  const { 
    loadOrderIntoCart, 
    openDeleteOrderModal,
    setSelectedOrderForReceipt, 
    setSelectedOrderForKOT,
    setIsPaymentModalOpen,
    setActiveTab,
    settings,
    loadWalkInSessionIntoCart
  } = useApp();

  const {
    orders,
    updateOrder,
    walkInSessions,
    updateWalkInSession,
    checkoutWalkInSession: posCheckoutWalkInSession,
  } = usePOS();

  const updateOrderStatus = (orderId: string, status: any) => {
    updateOrder({ id: orderId, status });
  };
  const cancelOrder = (orderId: string) => {
    updateOrder({ id: orderId, status: 'cancelled' });
  };
  const unCheckoutWalkInSession = (sessionId: string) => {
    updateWalkInSession({ id: sessionId, status: 'ACTIVE' });
  };
  const deleteWalkInSession = (sessionId: string) => {
    updateWalkInSession({ id: sessionId, status: 'CHECKED_OUT' });
  };
  const checkoutWalkInSession = (sessionId: string, paymentMethod?: any) => {
    posCheckoutWalkInSession(sessionId);
  };

  const [filterStatus, setFilterStatus] = useState<string>('all_active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewWalkInModalOpen, setIsNewWalkInModalOpen] = useState(false);
  const [sessionToCheckout, setSessionToCheckout] = useState<string | null>(null);

  // In-house room orders (excluding child orders of a walk-in session)
  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.sessionId) return false; // Walk-in child orders belong to their WalkInSession card
      if (o.status === 'cancelled') return false;
      if (filterStatus === 'all_active') return o.status !== 'paid';
      if (filterStatus === 'paid') return o.status === 'paid';
      return o.status === filterStatus;
    }).filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.location.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.guestName?.toLowerCase().includes(q)
      );
    });
  }, [orders, filterStatus, searchQuery]);

  // Walk-in sessions filter
  const activeSessions = useMemo(() => {
    return walkInSessions.filter(s => {
      const sessionOrders = orders.filter(o => o.sessionId === s.id && o.status !== 'cancelled');
      
      if (filterStatus === 'all_active') {
        return s.status === 'ACTIVE';
      }
      if (filterStatus === 'paid') {
        return s.status === 'CHECKED_OUT';
      }
      if (filterStatus === 'preparing') {
        return s.status === 'ACTIVE' && sessionOrders.some(o => o.status === 'preparing');
      }
      if (filterStatus === 'served') {
        return s.status === 'ACTIVE' && sessionOrders.some(o => o.status === 'served');
      }
      if (filterStatus === 'active') {
        return s.status === 'ACTIVE' && (sessionOrders.length === 0 || sessionOrders.some(o => o.status === 'active'));
      }
      return false;
    }).filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.guestName.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    });
  }, [walkInSessions, orders, filterStatus, searchQuery]);

  // Metrics
  const activeSessionsCount = walkInSessions.filter(s => s.status === 'ACTIVE').length;
  const totalUnpaidBalance = walkInSessions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => {
      const sOrders = orders.filter(o => o.sessionId === s.id && o.status !== 'cancelled' && o.status !== 'paid');
      return sum + sOrders.reduce((oSum, o) => oSum + (Number(o.grandTotal) || 0), 0);
    }, 0);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-light text-secondary border border-border">Order Taken</span>;
      case 'preparing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-light text-primary border border-border-focus animate-pulse">In Kitchen</span>;
      case 'served':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-border-focus text-primary-dark border border-primary/30">Served to Guest</span>;
      case 'billed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-light text-secondary border border-border">Check Printed</span>;
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-white">Paid & Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Real-Time Floor Management
            </span>
            {activeSessionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-light text-primary border border-border-focus">
                {activeSessionsCount} Active Walk-In {activeSessionsCount === 1 ? 'Tab' : 'Tabs'} (${totalUnpaidBalance.toFixed(2)})
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold font-serif text-text mt-0.5">
            Walk-In Guests & Active Orders
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewWalkInModalOpen(true)}
            className="px-4 py-2 bg-[#FAF8F5] hover:bg-surface-muted-hover text-primary font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition cursor-pointer border border-primary/20 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Walk-In Tab</span>
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Open POS Menu</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all_active', label: 'All Open Tables' },
            { id: 'active', label: 'New Orders' },
            { id: 'preparing', label: 'In Kitchen' },
            { id: 'served', label: 'Served' },
            { id: 'paid', label: 'Completed History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-muted text-secondary-dark hover:bg-white border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, table, reference..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {activeOrders.length === 0 && activeSessions.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-secondary space-y-3 shadow-xs">
          <Coffee className="w-10 h-10 mx-auto text-secondary/40 mb-2" />
          <h3 className="text-base font-semibold text-text">No active tables in this view</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            All guest orders are either settled or no walk-in tabs have been opened in this category.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsNewWalkInModalOpen(true)}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              + Open Walk-In Tab
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2 bg-surface-muted hover:bg-white text-primary text-xs font-bold rounded-xl border border-border transition cursor-pointer"
            >
              Create an Order in POS
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* 1. Walk-In Sessions Cards */}
          {activeSessions.map((session) => {
            const timeAgo = new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // All non-cancelled orders for this walk-in session
            const sessionOrders = orders.filter(o => o.sessionId === session.id && o.status !== 'cancelled' && o.status !== 'paid');
            const posBalance = sessionOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
            const totalItemsCount = sessionOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

            return (
              <div
                key={session.id}
                className="bg-white border border-border hover:border-primary/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between transition duration-150 relative"
              >
                {/* Session Card Header */}
                <div className="p-4 bg-surface-muted border-b border-border flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-text font-serif">
                        {session.guestName}
                      </h3>
                      {session.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-2xs">
                          Active Tab
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                          Checked Out & Paid
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-secondary flex-wrap">
                      <span className="font-mono font-bold text-primary">{session.id}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-border text-primary-dark">
                        {session.location || 'Walk-in Table'}
                      </span>
                      <span>•</span>
                      <span className="text-[11px]">
                        {session.numberOfGuests} {session.numberOfGuests === 1 ? 'Guest' : 'Guests'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-secondary" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (sessionOrders.length === 0 || window.confirm(`Are you sure you want to delete the walk-in tab for ${session.guestName}?`)) {
                        deleteWalkInSession(session.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-white border border-transparent hover:border-accent/30 transition cursor-pointer shrink-0"
                    title="Void / Delete Walk-In Tab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Session Orders & Items Breakdown */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary pb-1 border-b border-border/50">
                    <span>Tab Orders & Items ({sessionOrders.length} tickets • {totalItemsCount} items)</span>
                  </div>

                  <div className="max-h-[170px] overflow-y-auto pr-1 space-y-3 text-xs text-text scrollbar-thin">
                    {sessionOrders.length > 0 ? (
                      sessionOrders.map((ord, ordIdx) => (
                        <div key={ord.id} className="p-2 rounded-xl bg-surface-muted/60 border border-border/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-primary text-[11px]">
                              Round {ordIdx + 1} ({ord.orderNumber})
                            </span>
                            {getStatusBadge(ord.status)}
                          </div>
                          
                          <div className="space-y-1 pl-1">
                            {ord.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-[11px]">
                                <span className="font-medium text-text">
                                  <span className="font-bold text-primary mr-1">{item.quantity}x</span>
                                  {item.name}
                                </span>
                                <span className="font-mono text-secondary">
                                  ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-secondary italic text-center py-4 bg-surface-muted/30 rounded-xl border border-dashed border-border">
                        No orders recorded yet. Click "Take Order" below to add dishes.
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Balance & Actions */}
                <div className="p-4 bg-surface-muted/50 border-t border-border mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Running POS Balance</span>
                      <span className="text-xs font-mono text-secondary">
                        ≈ Rs. {Math.round(posBalance * settings.usdToLkrRate).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-primary-dark">
                        ${(Number(posBalance) || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-secondary ml-1 font-sans">USD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {session.status === 'ACTIVE' ? (
                      <>
                        <button
                          onClick={() => {
                            loadWalkInSessionIntoCart(session.id);
                          }}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-surface-muted text-primary border border-border text-xs flex items-center gap-1.5 transition cursor-pointer font-bold shadow-2xs"
                          title="Add items / Take Order for this tab"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>+ Add Items</span>
                        </button>

                        <button
                          onClick={() => {
                            let text = `🧾 *HILLDALE RETREAT - WALK-IN TAB*\n`;
                            text += `Guest: ${session.guestName}\n`;
                            text += `Ref: ${session.id}\n`;
                            text += `Location: ${session.location || 'Walk-in Table'}\n`;
                            text += `-----------------\n`;
                            sessionOrders.flatMap(o => o.items).forEach(item => {
                              text += `☑️ ${item.quantity}x ${item.name} - $${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}\n`;
                            });
                            text += `-----------------\n`;
                            text += `*Total Balance: $${(Number(posBalance) || 0).toFixed(2)} USD*\n`;
                            text += `(Rs. ${Math.round(posBalance * settings.usdToLkrRate).toLocaleString()})\n`;
                            
                            const encoded = encodeURIComponent(text);
                            window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-[#25D366]/10 text-[#25D366] border border-border text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                          title="WhatsApp Bill"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (posBalance === 0) {
                              if (window.confirm('This tab has $0.00 balance. Close tab now?')) {
                                checkoutWalkInSession(session.id, 'cash');
                              }
                            } else {
                              setSessionToCheckout(session.id);
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Checkout & Post Bill</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if(window.confirm(`Are you sure you want to un-checkout and reopen the tab for ${session.guestName}?`)) {
                              unCheckoutWalkInSession(session.id);
                            }
                          }}
                          className="px-3 py-2 bg-white hover:bg-surface-muted text-secondary font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-border"
                          title="Undo Checkout / Reopen Tab"
                        >
                          <span>Undo Checkout</span>
                        </button>

                        <button
                          onClick={() => {
                            const masterInv = orders.find(o => o.id === session.invoiceId);
                            if (masterInv) {
                              setSelectedOrderForReceipt(masterInv);
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-white hover:bg-surface-muted text-primary font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-primary"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Master Invoice</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 2. In-House Room / Suite Orders (orders not attached to a walk-in session) */}
          {activeOrders.map((order) => {
            const timeAgo = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={order.id}
                className="bg-white border border-border hover:border-secondary rounded-2xl overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between transition duration-150"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-surface-muted border-b border-border flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-text font-serif">
                        {order.location}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                      <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-semibold bg-white px-2 py-0.5 rounded-full border border-border">
                        {order.orderType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-secondary" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-right text-xs">
                      <span className="text-secondary block text-[10px]">Guest:</span>
                      <span className="font-semibold text-text">{order.guestName || 'Walk-in Guest'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDeleteOrderModal(order)}
                      className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-white border border-transparent hover:border-accent/30 transition cursor-pointer"
                      title="Void / Delete Order (Manager PIN Required)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-4 space-y-2 flex-1">
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs text-[#424242]">
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-primary mr-1.5">{item.quantity}x</span>
                          <span className="font-medium text-text">{item.name}</span>
                          {item.selectedSides && item.selectedSides.length > 0 && (
                            <p className="text-[10px] text-secondary italic pl-5">
                              {item.selectedSides.join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-secondary font-semibold">
                          ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-secondary bg-secondary-light/60 p-2 rounded-lg border border-border italic">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Financial Bottom & Actions */}
                <div className="p-4 border-t border-border bg-surface-muted space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-secondary uppercase font-semibold">Total:</span>
                      <p className="text-xs text-primary font-mono font-bold">
                        ≈ Rs. {Math.round((Number(order.grandTotal) || 0) * settings.usdToLkrRate).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-serif text-text">
                        ${(Number(order.grandTotal) || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-secondary ml-1">USD</span>
                    </div>
                  </div>

                  {/* Status update steps */}
                  {order.status !== 'paid' && (
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className={`py-1 rounded-lg font-medium border transition cursor-pointer ${
                          order.status === 'preparing'
                            ? 'bg-primary text-white font-bold border-primary'
                            : 'bg-white text-secondary-dark hover:text-text border-border'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className={`py-1 rounded-lg font-medium border transition cursor-pointer ${
                          order.status === 'served'
                            ? 'bg-primary text-white font-bold border-primary'
                            : 'bg-white text-secondary-dark hover:text-text border-border'
                        }`}
                      >
                        Served
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'billed')}
                        className={`py-1 rounded-lg font-medium border transition cursor-pointer ${
                          order.status === 'billed'
                            ? 'bg-secondary text-white font-bold border-secondary'
                            : 'bg-white text-secondary-dark hover:text-text border-border'
                        }`}
                      >
                        Billed
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedOrderForKOT(order)}
                      className="p-2 rounded-xl bg-white hover:bg-surface-muted text-primary border border-border text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                      title="Print KOT"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">KOT</span>
                    </button>

                    <button
                      onClick={() => {
                        let text = `🧾 *HILLDALE RETREAT - CHECK*\n`;
                        text += `Location: ${order.location}\n`;
                        if (order.guestName) text += `Guest: ${order.guestName}\n`;
                        text += `Order #: ${order.orderNumber}\n`;
                        text += `-----------------\n`;
                        order.items.forEach(item => {
                          text += `☑️ ${item.quantity}x ${item.name} - $${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}\n`;
                        });
                        text += `-----------------\n`;
                        text += `*Total: $${(Number(order.grandTotal) || 0).toFixed(2)} USD*\n`;
                        
                        const encoded = encodeURIComponent(text);
                        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-[#25D366]/10 text-[#25D366] border border-border hover:border-[#25D366]/50 text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                      title="Send Bill via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => openDeleteOrderModal(order)}
                      className="p-2 rounded-xl bg-white hover:bg-accent/10 text-secondary hover:text-accent border border-border hover:border-accent/30 text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                      title="Void / Delete Order (Manager PIN Required)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {order.status !== 'paid' ? (
                      <>
                        <button
                          onClick={() => loadOrderIntoCart(order)}
                          className="p-2 rounded-xl bg-white hover:bg-surface-muted text-text border border-border text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                          title={order.items.length === 0 ? "Take initial order" : "Add more dishes"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{order.items.length === 0 ? 'Take Order' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedOrderForReceipt(order);
                          }}
                          className="flex-1 py-2 px-3 bg-primary hover:bg-[#4d5541] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Settle Check</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if(window.confirm('Are you sure you want to un-checkout and reopen this tab?')) {
                              updateOrderStatus(order.id, 'served');
                            }
                          }}
                          className="px-3 py-2 bg-white hover:bg-surface-muted text-secondary font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-border"
                          title="Undo Checkout / Reopen Tab"
                        >
                          <span>Undo</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="flex-1 py-2 px-3 bg-white hover:bg-surface-muted text-primary font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-primary"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewWalkInModal
        isOpen={isNewWalkInModalOpen}
        onClose={() => setIsNewWalkInModalOpen(false)}
        onSuccess={() => {}}
      />

      {sessionToCheckout && (
        <WalkInSessionCheckoutModal
          isOpen={!!sessionToCheckout}
          onClose={() => setSessionToCheckout(null)}
          sessionId={sessionToCheckout}
        />
      )}
    </div>
  );
};
