import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Check, 
  Phone, 
  Globe, 
  MapPin,
  Trash2
} from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { settings, openDeleteOrderModal } = useApp();
  const [viewMode, setViewMode] = useState<'thermal' | 'a4'>('thermal');
  const [isCopied, setIsCopied] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
=== ${settings.retreatName.toUpperCase()} ===
${settings.retreatTagline}
${settings.address}
Tel: ${settings.phone} | Web: ${settings.website}
----------------------------------------
Invoice #: ${order.invoiceNumber}
Order #: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleString()}
Location: ${order.location} (${order.orderType})
${order.guestName ? `Guest: ${order.guestName}` : ''}
Cashier: ${order.cashierName}
----------------------------------------
ITEMS:
${(order.items || []).map(i => `${i.quantity}x ${i.name} - $${(i.price * i.quantity).toFixed(2)}${i.selectedSides?.length ? `\n   Sides: ${i.selectedSides.join(', ')}` : ''}`).join('\n')}
----------------------------------------
Subtotal: $${order.subtotal.toFixed(2)}
${order.discountAmount > 0 ? `Discount (${order.discountPercent}%): -$${order.discountAmount.toFixed(2)}\n` : ''}Service Charge (10%): $${order.serviceChargeAmount.toFixed(2)}
GRAND TOTAL: $${order.grandTotal.toFixed(2)} USD
(Rs. ${Math.round(order.grandTotal * settings.usdToLkrRate).toLocaleString()} LKR)
Payment: ${order.paymentMethod?.toUpperCase() || 'PAID'}
----------------------------------------
Thank you for dining at Hilldale Retreat!
    `.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalLKR = Math.round(order.grandTotal * settings.usdToLkrRate);

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-border rounded-2xl shadow-2xl max-w-2xl w-full text-text overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-muted print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Invoice #{order.invoiceNumber}
            </span>
            <div className="flex bg-white rounded-full p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setViewMode('thermal')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'thermal' ? 'bg-primary text-white shadow-xs' : 'text-secondary hover:text-text'
                }`}
              >
                Thermal Slip (80mm)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'a4' ? 'bg-primary text-white shadow-xs' : 'text-secondary hover:text-text'
                }`}
              >
                Resort Folio (A4)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openDeleteOrderModal(order);
                onClose();
              }}
              className="p-2 rounded-xl bg-white hover:bg-accent/15 text-secondary hover:text-accent border border-border hover:border-accent/40 transition text-xs flex items-center gap-1.5 cursor-pointer"
              title="Void / Delete Order (Manager PIN Required)"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Void Order</span>
            </button>
            <button
              onClick={handleCopyText}
              className="p-2 rounded-xl bg-white hover:bg-surface-hover text-secondary border border-border transition text-xs flex items-center gap-1.5 cursor-pointer"
              title="Copy Receipt Text"
            >
              {isCopied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-[#4d5541] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Container */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto flex justify-center items-start bg-background print:max-h-none print:p-0 print:bg-white">
          {viewMode === 'thermal' ? (
            /* Thermal POS Slip Format (80mm width) */
            <div className="w-full max-w-sm bg-white text-text p-6 rounded-2xl font-mono text-xs shadow-md border border-border print:shadow-none print:border-none print:w-full print:max-w-none">
              {/* Header */}
              <div className="text-center pb-4 border-b border-dashed border-border space-y-1">
                <div className="w-8 h-8 mx-auto rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm mb-1">
                  HR
                </div>
                <h2 className="text-base font-extrabold tracking-wider text-text font-serif">
                  HILLDALE RETREAT
                </h2>
                <p className="text-[11px] text-secondary italic">Ala Carte Restaurant & Bar</p>
                <p className="text-[10px] text-secondary-dark leading-tight">
                  {settings.address}
                </p>
                <p className="text-[10px] text-secondary">
                  Tel: {settings.phone} • {settings.website}
                </p>
              </div>

              {/* Order Meta */}
              <div className="py-3 border-b border-dashed border-border space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-secondary">Invoice No:</span>
                  <span className="font-bold text-primary">{order.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Order Ref:</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Date & Time:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Location:</span>
                  <span className="font-bold">{order.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Service Type:</span>
                  <span className="uppercase font-semibold">{order.orderType}</span>
                </div>
                {order.guestName && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Guest:</span>
                    <span className="font-semibold">{order.guestName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-secondary">Server / Cashier:</span>
                  <span>{order.cashierName}</span>
                </div>
              </div>

              {/* Itemized list */}
              <div className="py-3 border-b border-dashed border-border">
                <div className="grid grid-cols-12 font-bold pb-2 text-[10px] text-secondary border-b border-border uppercase">
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-7">Item Description</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="grid grid-cols-12">
                        <div className="col-span-2 font-bold text-primary">{item.quantity}x</div>
                        <div className="col-span-7 font-medium text-text leading-tight">
                          {item.name}
                        </div>
                        <div className="col-span-3 text-right font-mono font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      {item.selectedSides && item.selectedSides.length > 0 && (
                        <div className="pl-6 text-[10px] text-secondary italic">
                          Sides: {item.selectedSides.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="pl-6 text-[10px] text-secondary italic">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-3 border-b border-dashed border-border space-y-1 text-[11px]">
                <div className="flex justify-between text-secondary-dark">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Discount ({order.discountPercent}%):</span>
                    <span className="font-mono font-semibold">-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-secondary-dark">
                  <span>Service Charge (10%):</span>
                  <span className="font-mono font-semibold">${order.serviceChargeAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-extrabold uppercase">TOTAL USD:</span>
                  <span className="text-base font-extrabold font-mono text-primary">
                    ${order.grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-secondary-dark font-medium">
                  <span className="text-[10px]">TOTAL LKR (Rs.):</span>
                  <span className="text-xs font-bold font-mono text-text">
                    Rs. {totalLKR.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Settlement Info */}
              <div className="py-2.5 border-b border-dashed border-border text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-secondary">Payment Mode:</span>
                  <span className="font-bold uppercase text-text">
                    {order.paymentMethod || 'PAID'}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 text-center space-y-1 text-[10px] text-secondary">
                <p className="font-semibold text-text">Thank you for visiting Hilldale Retreat!</p>
                <p>All prices subject to 10% Service Charge.</p>
                <p className="font-mono text-[9px]">www.hilldaleretreat.com</p>
              </div>
            </div>
          ) : (
            /* Luxury A4 Resort Guest Folio View */
            <div className="w-full bg-white text-text p-8 rounded-2xl font-sans text-sm shadow-md border border-border print:shadow-none print:border-none print:w-full">
              {/* Top Luxury Banner */}
              <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-text tracking-wide">
                    HILLDALE RETREAT
                  </h1>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wider mt-0.5">
                    Luxury Boutique Mountain Retreat • Nuwara Eliya
                  </p>
                  <div className="text-xs text-secondary-dark mt-2 space-y-0.5">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> {settings.address}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary" /> {settings.phone}</p>
                    <p className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-primary" /> {settings.website}</p>
                  </div>
                </div>

                <div className="text-right bg-surface-muted p-4 rounded-2xl border border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    GUEST FOLIO / INVOICE
                  </span>
                  <p className="text-xl font-bold font-mono text-primary mt-1">
                    {order.invoiceNumber}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-semibold text-primary uppercase mt-0.5">
                    Status: {order.status === 'paid' ? 'Paid in Full' : 'Open Bill'}
                  </p>
                </div>
              </div>

              {/* Guest & Room Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-border text-xs">
                <div>
                  <span className="text-secondary block font-semibold">Guest Name:</span>
                  <span className="font-bold text-text text-sm">{order.guestName || 'Walk-in Guest'}</span>
                </div>
                <div>
                  <span className="text-secondary block font-semibold">Room / Table:</span>
                  <span className="font-bold text-text text-sm">{order.location}</span>
                </div>
                <div>
                  <span className="text-secondary block font-semibold">Service Type:</span>
                  <span className="font-semibold text-text uppercase">{order.orderType}</span>
                </div>
                <div>
                  <span className="text-secondary block font-semibold">Payment Method:</span>
                  <span className="font-bold text-primary uppercase">{order.paymentMethod || 'Settled'}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border text-secondary font-bold uppercase text-[11px]">
                      <th className="py-2.5 w-12">#</th>
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center w-20">Qty</th>
                      <th className="py-2.5 text-right w-24">Unit (USD)</th>
                      <th className="py-2.5 text-right w-28">Total (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D6]">
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="py-3">
                        <td className="py-3 text-secondary font-mono">{idx + 1}</td>
                        <td className="py-3">
                          <p className="font-bold text-text">{item.name}</p>
                          {item.selectedSides && item.selectedSides.length > 0 && (
                            <p className="text-[11px] text-secondary italic">
                              Choice of Sides: {item.selectedSides.join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-secondary italic">Note: {item.notes}</p>
                          )}
                        </td>
                        <td className="py-3 text-center font-bold text-text">{item.quantity}</td>
                        <td className="py-3 text-right font-mono text-secondary-dark">${item.price.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-text">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Totals */}
              <div className="border-t-2 border-border pt-4 flex justify-between items-start">
                <div className="max-w-xs text-xs text-secondary space-y-1">
                  <p className="font-semibold text-text">Hilldale Retreat Hospitality Policy</p>
                  <p>All ala carte menu items are freshly prepared to order. Standard 10% service charge applied.</p>
                  {order.notes && <p className="text-secondary italic mt-2">Special instructions: {order.notes}</p>}
                </div>

                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-secondary-dark">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-secondary font-semibold">
                      <span>Discount ({order.discountPercent}%):</span>
                      <span className="font-mono">-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-secondary-dark">
                    <span>10% Service Charge:</span>
                    <span className="font-mono font-semibold">${order.serviceChargeAmount.toFixed(2)}</span>
                  </div>

                  <div className="border-t-2 border-primary pt-2 flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-text uppercase">Grand Total (USD):</span>
                    <span className="text-lg font-extrabold font-mono text-primary">
                      ${order.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-secondary-dark font-semibold pt-1 border-t border-border">
                    <span>Equivalent in LKR:</span>
                    <span className="font-mono font-bold text-text">Rs. {totalLKR.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border text-center text-xs text-secondary">
                <p>Hilldale Retreat • www.hilldaleretreat.com • Thank you for dining with us.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
