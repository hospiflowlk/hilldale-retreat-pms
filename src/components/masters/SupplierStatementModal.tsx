import React, { useMemo } from 'react';
import { 
  X, 
  Building2, 
  Printer, 
  Download, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CreditCard,
  Landmark,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterSupplier, SupplierLedgerEntry } from '../../types';

interface SupplierStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: MasterSupplier | null;
  onRecordPayment?: (supplier: MasterSupplier) => void;
}

export const SupplierStatementModal: React.FC<SupplierStatementModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onRecordPayment
}) => {
  const { getSupplierLedger, settings } = useApp();

  const ledgerEntries = useMemo(() => {
    if (!supplier) return [];
    return getSupplierLedger(supplier.id);
  }, [supplier, getSupplierLedger]);

  if (!isOpen || !supplier) return null;

  const totalBilled = ledgerEntries.reduce((sum, e) => sum + e.debitUSD, 0);
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + e.creditUSD, 0);
  const netOutstanding = supplier.currentBalanceOwedUSD;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-text">
                  Statement of Account (AP Ledger)
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-primary-light text-primary">
                  Official Statement
                </span>
              </div>
              <p className="text-xs text-secondary">
                {supplier.companyName} • Running Accounts Payable Debt Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-secondary hover:text-text hover:bg-white rounded-xl border border-border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-secondary hover:text-text hover:bg-white border border-border transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Body (Printable Area) */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Header Dossier Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-surface-muted/40 border border-border">
            <div>
              <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block mb-1">
                Vendor / Supplier Details
              </span>
              <h4 className="font-serif font-bold text-base text-text">{supplier.companyName}</h4>
              <div className="text-xs text-secondary space-y-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-text">Attn:</span>
                  <span>{supplier.contactPerson}</span>
                </div>
                {supplier.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-secondary/70" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-secondary/70" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.taxNumber && (
                  <div className="text-[11px] font-mono text-secondary mt-1">
                    Tax / VAT: <strong>{supplier.taxNumber}</strong>
                  </div>
                )}
                {supplier.bankDetails && (
                  <div className="text-xs text-sky-800 bg-sky-50 p-2 rounded border border-sky-100 mt-2 whitespace-pre-wrap leading-relaxed">
                    <span className="font-bold text-[10px] uppercase block mb-0.5 text-sky-900">Bank Details</span>
                    {supplier.bankDetails}
                  </div>
                )}
              </div>
            </div>

            <div className="md:text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block mb-1">
                  Issued By Customer
                </span>
                <h4 className="font-serif font-bold text-base text-text">{settings.retreatName}</h4>
                <p className="text-xs text-secondary">{settings.address}</p>
                <p className="text-xs text-secondary font-mono mt-0.5">As of: {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              {/* Financial Balance Summary Pills */}
              <div className="flex items-center justify-start md:justify-end gap-2 mt-4">
                <div className="px-3 py-1.5 rounded-xl bg-white border border-border text-left">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Total Purchases</span>
                  <span className="font-mono font-bold text-xs text-text">${totalBilled.toFixed(2)}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white border border-border text-left">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Total Paid</span>
                  <span className="font-mono font-bold text-xs text-emerald-700">${totalPaid.toFixed(2)}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-left ${
                  netOutstanding > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="text-[9px] uppercase font-bold block opacity-80">Net Balance Due</span>
                  <span className="font-mono font-bold text-xs">${netOutstanding.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Ledger Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-white shadow-2xs">
            <div className="p-3.5 bg-surface-muted/60 border-b border-border flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-text">
                Chronological Transactions & Running Balance
              </span>
              <span className="text-[11px] font-mono text-secondary">
                {ledgerEntries.length} Ledger Postings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/30 text-secondary uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (Purchased)</th>
                    <th className="py-3 px-4 text-right">Credit (Paid)</th>
                    <th className="py-3 px-4 text-right">Balance Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-secondary italic">
                        No transactions recorded for this supplier yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => {
                      const isPurchase = entry.debitUSD > 0;
                      const isPayment = entry.creditUSD > 0;

                      return (
                        <tr key={entry.id} className="hover:bg-surface-muted/30 transition">
                          {/* Date */}
                          <td className="py-3 px-4 font-mono text-secondary whitespace-nowrap">
                            {entry.date}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {entry.type === 'OPENING_BALANCE' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-muted text-secondary">
                                Opening Bal
                              </span>
                            )}
                            {entry.type === 'PURCHASE_INVOICE' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Purchase Bill
                              </span>
                            )}
                            {entry.type === 'PAYMENT' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Payment Out
                              </span>
                            )}
                          </td>

                          {/* Reference */}
                          <td className="py-3 px-4 font-mono font-semibold text-text whitespace-nowrap">
                            {entry.reference}
                          </td>

                          {/* Description */}
                          <td className="py-3 px-4 text-secondary max-w-[240px] truncate" title={entry.description}>
                            {entry.description}
                          </td>

                          {/* Debit */}
                          <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">
                            {isPurchase ? (
                              <span className="text-text font-bold">+${entry.debitUSD.toFixed(2)}</span>
                            ) : (
                              <span className="text-secondary/40">—</span>
                            )}
                          </td>

                          {/* Credit */}
                          <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">
                            {isPayment ? (
                              <span className="text-emerald-700 font-bold">-${entry.creditUSD.toFixed(2)}</span>
                            ) : (
                              <span className="text-secondary/40">—</span>
                            )}
                          </td>

                          {/* Running Balance */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-text whitespace-nowrap">
                            ${entry.runningBalanceUSD.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface-muted/50 font-bold text-xs">
                    <td colSpan={4} className="py-3 px-4 text-text uppercase">
                      Total Ledger Summary
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text">
                      ${totalBilled.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      ${totalPaid.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-800 text-sm">
                      ${netOutstanding.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-muted/30 flex items-center justify-between shrink-0">
          <div className="text-xs text-secondary">
            Outstanding AP Debt: <strong className="font-mono text-text">${netOutstanding.toFixed(2)}</strong> (Rs. {(netOutstanding * settings.usdToLkrRate).toLocaleString()})
          </div>

          <div className="flex items-center gap-2">
            {onRecordPayment && netOutstanding > 0 && (
              <button
                onClick={() => { onClose(); onRecordPayment(supplier); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Make Payment</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-white border border-border transition cursor-pointer"
            >
              Close Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
