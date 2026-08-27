import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  FileText, 
  CreditCard, 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Layers, 
  Calendar,
  AlertTriangle,
  Download,
  Upload,
  MoreVertical,
  FileCode,
  FileJson
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { useApp } from '../../context/AppContext';
import { MasterSupplier } from '../../types';
import { NewSupplierModal } from './NewSupplierModal';
import { SupplierStatementModal } from './SupplierStatementModal';
import { RecordSupplierPurchaseModal } from './RecordSupplierPurchaseModal';
import { RecordSupplierPaymentModal } from './RecordSupplierPaymentModal';
import { ImportSuppliersModal } from './ImportSuppliersModal';
import { exportMasterSuppliersToExcel, exportMasterSuppliersToJSON, parseSuppliersFromJSON } from '../../utils/excelSupplierUtils';
import { useSuppliers } from '../../hooks/useMasters';

export const SuppliersMasterTab: React.FC = () => {
  const { 
    supplierPurchases, 
    settings 
  } = useApp();

  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const deleteSupplierMut = useSuppliers.useDelete();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<MasterSupplier | null>(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<MasterSupplier | null>(null);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<MasterSupplier | null>(null);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<MasterSupplier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAll = () => {
    if (masterSuppliers.length === 0) return;
    if (window.confirm(`⚠️ Are you sure you want to delete ALL ${masterSuppliers.length} suppliers? This action cannot be undone.`)) {
      const confirmText = window.prompt(`Type "DELETE ALL" to confirm wiping all ${masterSuppliers.length} suppliers:`);
      if (confirmText === 'DELETE ALL') {
        masterSuppliers.forEach(s => deleteSupplierMut.mutate(s.id));
      }
    }
  };

  const handleJSONFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const jsonSuppliers = await parseSuppliersFromJSON(file);
      if (window.confirm(`Found ${jsonSuppliers.length} suppliers in JSON backup. Do you want to import them into your master catalog?`)) {
        const response = await apiClient.post('masters/suppliers/bulk', { suppliers: jsonSuppliers });
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        alert(`Successfully imported ${response.data.count || jsonSuppliers.length} suppliers from JSON backup!`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to parse JSON backup file.');
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsMenuOpen]);



  const filteredSuppliers = useMemo(() => {
    return masterSuppliers.filter(sup => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sup.companyName.toLowerCase().includes(q) ||
          sup.contactPerson.toLowerCase().includes(q) ||
          sup.phone.toLowerCase().includes(q) ||
          sup.email.toLowerCase().includes(q) ||
          sup.address.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [masterSuppliers, searchQuery]);

  // Overall Financial Metrics
  const totalBalanceOwedUSD = masterSuppliers.reduce((sum, s) => sum + s.currentBalanceOwedUSD, 0);
  const totalInvoicesCount = supplierPurchases.length;
  const unpaidInvoicesCount = supplierPurchases.filter(p => p.status !== 'PAID').length;

  const handleDelete = (sup: MasterSupplier) => {
    setActionError(null);
    if (window.confirm(`Are you sure you want to delete supplier "${sup.companyName}"?`)) {
      deleteSupplierMut.mutate(sup.id, {
        onError: (err: any) => setActionError(err.message || 'Cannot delete supplier.')
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Suppliers</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{masterSuppliers.length}</div>
          <div className="text-[11px] text-secondary mt-0.5">Registered vendors & estates</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total AP Balance Owed</span>
            <DollarSign className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-900">${totalBalanceOwedUSD.toFixed(2)}</div>
          <div className="text-[11px] text-secondary mt-0.5">
            Rs. {(totalBalanceOwedUSD * settings.usdToLkrRate).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending AP Invoices</span>
            <ShoppingBag className="w-4 h-4 text-secondary-dark" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{unpaidInvoicesCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">Unpaid / partially paid bills</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchases</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{totalInvoicesCount} Bills</div>
          <div className="text-[11px] text-secondary mt-0.5">Historical procurement volume</div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers, contact person, phone..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-text placeholder-secondary/60 focus:outline-hidden focus:border-primary focus:bg-white transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedSupplierForPurchase(masterSuppliers[0] || null)}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Record Purchase</span>
          </button>

          <button
            onClick={() => { setSupplierToEdit(null); setIsNewSupplierModalOpen(true); }}
            className="flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Supplier</span>
          </button>

          {/* Hidden JSON File Input */}
          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleJSONFileSelected}
            accept=".json"
            className="hidden"
          />

          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
              className="p-2 rounded-xl border border-border bg-white text-secondary hover:text-text hover:bg-surface-muted transition shadow-xs cursor-pointer"
              title="Supplier Catalog Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isActionsMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 text-xs py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary/70">
                  Excel Options
                </div>
                <button 
                  onClick={() => {
                    exportMasterSuppliersToExcel(masterSuppliers);
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-text hover:bg-surface-muted transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Export Excel (.xlsx)
                </button>
                <button 
                  onClick={() => {
                    setIsImportModalOpen(true);
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-text hover:bg-surface-muted transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-sky-600" />
                  Import Excel (.xlsx)
                </button>

                <div className="h-px bg-border/60 my-1" />

                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary/70">
                  Full JSON Backup
                </div>
                <button 
                  onClick={() => {
                    exportMasterSuppliersToJSON(masterSuppliers);
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-text hover:bg-surface-muted transition flex items-center gap-2 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  Export Full Backup (.json)
                </button>
                <button 
                  onClick={() => {
                    jsonInputRef.current?.click();
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-text hover:bg-surface-muted transition flex items-center gap-2 cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-purple-600" />
                  Import Full Backup (.json)
                </button>

                <div className="h-px bg-border/60 my-1" />

                <button 
                  onClick={() => {
                    handleDeleteAll();
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-600 font-bold hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Suppliers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-secondary uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-4">Company & Contact</th>
                <th className="py-3.5 px-4">Phone & Email</th>
                <th className="py-3.5 px-4">Location / Address</th>
                <th className="py-3.5 px-4 text-right">Balance Owed (AP)</th>
                <th className="py-3.5 px-4">Payment Terms & Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">
                    <Building2 className="w-8 h-8 mx-auto text-secondary/40 mb-2" />
                    <p className="font-semibold text-text">No suppliers found</p>
                    <p className="text-xs mt-0.5">Add a new supplier to start tracking vendor accounts payable.</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const hasDebt = sup.currentBalanceOwedUSD > 0;

                  return (
                    <tr key={sup.id} className="hover:bg-surface-muted/30 transition group">
                      {/* Company Name & Contact */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shrink-0 shadow-2xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-text block leading-tight">
                              {sup.companyName}
                            </span>
                            <span className="text-[11px] text-secondary">
                              Contact: {sup.contactPerson}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-secondary">
                        <div className="space-y-0.5 text-[11px]">
                          {sup.phone && <div>{sup.phone}</div>}
                          {sup.email && <div className="text-secondary/70">{sup.email}</div>}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-secondary max-w-[200px] truncate" title={sup.address}>
                        <div className="text-[11px] truncate">{sup.address || '—'}</div>
                      </td>

                      {/* Running Balance Owed */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold text-sm ${
                            hasDebt ? 'text-amber-900' : 'text-emerald-700'
                          }`}>
                            ${sup.currentBalanceOwedUSD.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-secondary font-mono">
                            Rs. {(sup.currentBalanceOwedUSD * settings.usdToLkrRate).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Notes / Terms */}
                      <td className="py-3.5 px-4 text-secondary max-w-[180px] truncate" title={sup.notes}>
                        <span className="text-[11px] text-secondary truncate block">
                          {sup.notes || '14-day credit terms'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Statement Button */}
                          <button
                            onClick={() => setSelectedSupplierForStatement(sup)}
                            className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary-light hover:bg-primary/20 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="View AP Statement of Account"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Statement</span>
                          </button>

                          {/* Make Payment Button */}
                          {hasDebt && (
                            <button
                              onClick={() => setSelectedSupplierForPayment(sup)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Make Payment against Balance"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => { setSupplierToEdit(sup); setIsNewSupplierModalOpen(true); }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-muted rounded-lg transition cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(sup)}
                            className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => { setIsNewSupplierModalOpen(false); setSupplierToEdit(null); }}
        supplierToEdit={supplierToEdit}
      />

      <SupplierStatementModal
        isOpen={Boolean(selectedSupplierForStatement)}
        onClose={() => setSelectedSupplierForStatement(null)}
        supplier={selectedSupplierForStatement}
        onRecordPayment={(sup) => setSelectedSupplierForPayment(sup)}
      />

      <RecordSupplierPurchaseModal
        isOpen={Boolean(selectedSupplierForPurchase)}
        onClose={() => setSelectedSupplierForPurchase(null)}
        preselectedSupplier={selectedSupplierForPurchase}
      />

      <RecordSupplierPaymentModal
        isOpen={Boolean(selectedSupplierForPayment)}
        onClose={() => setSelectedSupplierForPayment(null)}
        supplier={selectedSupplierForPayment}
      />

      <ImportSuppliersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
