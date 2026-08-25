import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Package, 
  ChefHat, 
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  parseItemsFromExcel, 
  downloadSampleItemTemplateExcel, 
  ParsedItemRow 
} from '../../utils/excelItemUtils';
import { useItems } from '../../hooks/useMasters';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({ isOpen, onClose }) => {
  const { data: masterItems = [] } = useItems.useGetAll();
  const createItemMut = useItems.useCreate();
  const updateItemMut = useItems.useUpdate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errorCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setError('Please upload a valid Excel (.xlsx / .xls) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const rows = await parseItemsFromExcel(file, masterItems);
      setParsedRows(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file. Please ensure valid sheet format.');
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setError('Please upload a valid Excel (.xlsx / .xls) file.');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const rows = await parseItemsFromExcel(file, masterItems);
      setParsedRows(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file. Please check column format.');
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      setError('No valid items found to import.');
      return;
    }

    setIsLoading(true);
    try {
      let inserted = 0;
      let updated = 0;

      for (const row of validRows) {
        if (row.action === 'update' && row.matchedExistingId && updateExisting) {
          await updateItemMut.mutateAsync({
            id: row.matchedExistingId,
            name: row.name,
            type: row.type,
            categoryName: row.categoryName,
            unit: row.unit,
            costPriceUSD: row.costPriceUSD,
            sellingPriceUSD: row.sellingPriceUSD,
            currentStock: row.currentStock,
            reorderThreshold: row.reorderThreshold,
            barcode: row.barcode,
            description: row.description,
            isAvailable: row.isAvailable,
            showInPos: row.showInPos,
            useInInvoices: row.useInInvoices,
            useInExpenses: row.useInExpenses
          });
          updated++;
        } else if (row.action === 'create') {
          await createItemMut.mutateAsync({
            name: row.name,
            type: row.type,
            categoryName: row.categoryName,
            unit: row.unit,
            costPriceUSD: row.costPriceUSD,
            sellingPriceUSD: row.sellingPriceUSD,
            currentStock: row.currentStock,
            reorderThreshold: row.reorderThreshold,
            barcode: row.barcode,
            description: row.description,
            isAvailable: row.isAvailable,
            showInPos: row.showInPos,
            useInInvoices: row.useInInvoices,
            useInExpenses: row.useInExpenses
          });
          inserted++;
        }
      }

      setImportResult({ inserted, updated, errorCount: parsedRows.length - validRows.length });
    } catch (err: any) {
      setError(err.message || 'Error executing bulk import.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const newItemsCount = parsedRows.filter(r => r.action === 'create' && r.errors.length === 0).length;
  const updateItemsCount = parsedRows.filter(r => r.action === 'update' && r.errors.length === 0).length;
  const errorItemsCount = parsedRows.filter(r => r.errors.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                Bulk Import Items from Excel (.xlsx)
              </h3>
              <p className="text-xs text-secondary">
                Upload a spreadsheet to bulk-create or update items, prices, categories, and stock levels.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* Success State Screen */}
          {importResult ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-serif text-text">Import Completed Successfully!</h4>
                <p className="text-xs text-secondary mt-1 max-w-md mx-auto">
                  Master items catalog has been updated in real-time.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Created New</span>
                  <span className="text-2xl font-bold font-serif text-emerald-900">{importResult.inserted}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-800 uppercase block">Updated</span>
                  <span className="text-2xl font-bold font-serif text-sky-900">{importResult.updated}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-muted border border-border">
                  <span className="text-[11px] font-bold text-secondary uppercase block">Skipped / Errors</span>
                  <span className="text-2xl font-bold font-serif text-text">{importResult.errorCount}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text bg-surface-muted transition cursor-pointer"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white shadow-xs transition cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </span>
                  <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs">Dismiss</button>
                </div>
              )}

              {/* Upload Dropzone & Sample Download Header */}
              {!selectedFile ? (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 bg-surface-muted/30 hover:bg-primary-light/10 transition rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-text block">
                        Click to select or drag & drop Excel (.xlsx) file
                      </span>
                      <span className="text-xs text-secondary mt-0.5 block">
                        Supports standard columns: Item Name, Classification Type, Category, Unit, Cost Price, Selling Price, Stock
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white border border-border text-secondary shadow-2xs">
                      Browse Computer
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Template download banner */}
                  <div className="p-4 rounded-xl bg-surface-muted border border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-text block">Need the standard spreadsheet format?</span>
                        <span className="text-[11px] text-secondary">Download our clean Excel template with pre-filled examples for Resale, Recipes, and Expenses.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleItemTemplateExcel}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-surface-muted text-primary border border-primary/30 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File status toolbar */}
                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-text block leading-tight">{selectedFile.name}</span>
                        <span className="text-[11px] text-secondary">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {parsedRows.length} items parsed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={downloadSampleItemTemplateExcel}
                        className="px-2.5 py-1 text-[11px] font-semibold text-secondary hover:text-text bg-white border border-border rounded-lg transition cursor-pointer flex items-center gap-1"
                        title="Download sample template"
                      >
                        <Download className="w-3 h-3" />
                        <span>Template</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Change File</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">New to Insert</span>
                        <span className="text-lg font-bold font-serif text-emerald-900">{newItemsCount} items</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Existing to Update</span>
                        <span className="text-lg font-bold font-serif text-sky-900">{updateItemsCount} items</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-muted border border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Errors / Invalid</span>
                        <span className={`text-lg font-bold font-serif ${errorItemsCount > 0 ? 'text-rose-700' : 'text-text'}`}>
                          {errorItemsCount} items
                        </span>
                      </div>
                      {errorItemsCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    </div>
                  </div>

                  {/* Import Config Options */}
                  <div className="p-3 rounded-xl bg-surface-muted/50 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <span className="font-medium text-text">
                        Update existing items if Item ID, Barcode or Name matches
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createMissingCategories}
                        onChange={(e) => setCreateMissingCategories(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <span className="font-medium text-text">
                        Auto-create missing master categories
                      </span>
                    </label>
                  </div>

                  {/* Table Preview */}
                  <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-surface-muted border-b border-border text-secondary uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Unit</th>
                          <th className="py-2 px-3 text-right">Cost</th>
                          <th className="py-2 px-3 text-right">Selling</th>
                          <th className="py-2 px-3 text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {parsedRows.map((row, idx) => {
                          const hasErr = row.errors.length > 0;
                          return (
                            <tr key={idx} className={`hover:bg-surface-muted/40 transition ${
                              hasErr ? 'bg-rose-50/50' : ''
                            }`}>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {hasErr ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800" title={row.errors.join(', ')}>
                                    ERROR
                                  </span>
                                ) : row.action === 'update' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800">
                                    UPDATE
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    NEW
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-text max-w-[200px] truncate" title={row.name}>
                                {row.name}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  row.type === 'RECIPE' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : row.type === 'EXPENSE'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-primary-light text-primary'
                                }`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-secondary whitespace-nowrap">
                                {row.categoryName}
                              </td>
                              <td className="py-2 px-3 text-secondary whitespace-nowrap">
                                {row.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-secondary whitespace-nowrap">
                                ${row.costPriceUSD.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-text font-bold whitespace-nowrap">
                                {row.type === 'EXPENSE' ? '—' : `$${row.sellingPriceUSD.toFixed(2)}`}
                              </td>
                              <td className="py-2 px-3 text-center font-mono whitespace-nowrap">
                                {row.type === 'EXPENSE' ? 'N/A' : row.currentStock}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {!importResult && (
          <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between bg-surface-muted/30 shrink-0">
            <div className="text-xs text-secondary">
              {selectedFile && `${newItemsCount + updateItemsCount} valid items ready for import`}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted border border-border transition cursor-pointer"
              >
                Cancel
              </button>

              {selectedFile && (
                <button
                  type="button"
                  disabled={isLoading || (newItemsCount + updateItemsCount === 0)}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] disabled:opacity-50 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isLoading ? 'Importing...' : `Import ${newItemsCount + updateItemsCount} Items`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
