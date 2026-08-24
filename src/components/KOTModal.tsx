import React from 'react';
import { X, Printer, ChefHat, Clock, AlertTriangle } from 'lucide-react';
import { Order } from '../types';

interface KOTModalProps {
  order: Order | null;
  onClose: () => void;
}

export const KOTModal: React.FC<KOTModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white border border-border rounded-2xl shadow-2xl max-w-md w-full text-text flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Controls */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-muted shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text">Kitchen Order Ticket (KOT)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-[#4d5541] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print KOT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KOT Slip */}
        <div className="p-6 bg-white text-text font-mono text-xs overflow-y-auto shadow-md print:overflow-visible print:shadow-none print:p-0">
          <div className="text-center pb-3 border-b-2 border-primary space-y-1">
            <h2 className="text-lg font-extrabold tracking-tight text-text">KITCHEN TICKET (KOT)</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Hilldale Retreat Kitchen</p>
          </div>

          <div className="py-3 border-b border-border space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span className="text-secondary">LOCATION:</span>
              <span className="bg-primary text-white px-2.5 py-0.5 rounded-md">{order.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Order #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Type:</span>
              <span className="uppercase font-bold">{order.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Time:</span>
              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {order.guestName && (
              <div className="flex justify-between">
                <span className="text-secondary">Guest:</span>
                <span className="font-bold">{order.guestName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondary">Server:</span>
              <span>{order.cashierName}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-4 border-b-2 border-primary space-y-3">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="border-b border-dashed border-border pb-2.5">
                <div className="flex items-start justify-between text-sm">
                  <span className="font-extrabold text-base w-8 text-primary">{item.quantity}x</span>
                  <div className="flex-1 font-bold text-sm text-text">
                    {item.name}
                  </div>
                </div>
                {item.selectedSides && item.selectedSides.length > 0 && (
                  <div className="pl-8 text-xs font-semibold text-secondary mt-0.5">
                    ▶ SIDES: {item.selectedSides.join(' + ')}
                  </div>
                )}
                {item.notes && (
                  <div className="pl-8 text-xs font-bold text-accent mt-0.5">
                    *** NOTE: {item.notes} ***
                  </div>
                )}
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="py-2.5 border-b border-border text-xs font-bold text-accent">
              SPECIAL REQUEST: {order.notes}
            </div>
          )}

          <div className="pt-3 text-center text-[10px] text-secondary flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span>Standard prep time: 15-30 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
