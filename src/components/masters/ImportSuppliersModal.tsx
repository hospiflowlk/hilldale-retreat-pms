import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  AlertTriangle,
  ArrowRight,
  Info,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  parseSuppliersFromExcel, 
  downloadSampleSupplierTemplateExcel, 
  ParsedSupplierRow 
} from '../../utils/excelSupplierUtils';
import { useSuppliers } from '../../hooks/useMasters';

interface ImportSuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportSuppliersModal: React.FC<ImportSuppliersModalProps> = ({ isOpen, onClose }) => {
  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const createSupplierMut = useSuppliers.useCreate();
  const updateSupplierMut = useSuppliers.useUpdate();
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedSupplierRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.type === 'application/vnd.ms-excel' ||
                    file.name.endsWith('.xlsx') || 
                    file.name.endsWith('.xls');

    if (!isExcel) {
      setParseError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    setParsedRows(null);

    try {
      const rows = await parseSuppliersFromExcel(file, masterSuppliers);
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse the Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedRows) return;

    // Filter out rows with errors
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) return;

    setIsImporting(true);

    try {
      const payload = validRows.map(row => ({
        companyName: row.companyName,
        contactPerson: row.contactPerson || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        taxNumber: row.taxNumber || '',
        openingBalanceUSD: row.openingBalanceUSD || 0,
        currentBalanceOwedUSD: row.openingBalanceUSD || 0,
        bankDetails: row.bankDetails || '',
        notes: row.notes || '',
        isActive: row.isActive
      }));

      for (const row of validRows) {
        if (row.action === 'update' && row.matchedExistingId) {
          await updateSupplierMut.mutateAsync({
            id: row.matchedExistingId,
            companyName: row.companyName,
            contactPerson: row.contactPerson || '',
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            taxNumber: row.taxNumber || undefined,
            openingBalanceUSD: row.openingBalanceUSD || 0,
            bankDetails: row.bankDetails || undefined,
            notes: row.notes || undefined,
            isActive: row.isActive
          });
        } else {
          await createSupplierMut.mutateAsync({
            companyName: row.companyName,
            contactPerson: row.contactPerson || '',
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            taxNumber: row.taxNumber || undefined,
            openingBalanceUSD: row.openingBalanceUSD || 0,
            bankDetails: row.bankDetails || undefined,
            notes: row.notes || undefined,
            isActive: row.isActive
          });
        }
      }

      setImportSuccess(true);
      
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2000);
    } catch (err) {
      setParseError('Failed to import Suppliers. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows(null);
    setParseError(null);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const totalRows = parsedRows?.length || 0;
  const validRows = parsedRows?.filter(r => r.errors.length === 0).length || 0;
  const errorRows = totalRows - validRows;
  const newCount = parsedRows?.filter(r => r.errors.length === 0 && r.action === 'create').length || 0;
  const updateCount = parsedRows?.filter(r => r.errors.length === 0 && r.action === 'update').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-secondary/40 backdrop-blur-sm transition-opacity"
        onClick={isImporting ? undefined : onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Bulk Import Suppliers</h2>
              <p className="text-sm text-secondary">Upload an Excel file to create or update Suppliers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-surface-muted rounded-full transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {importSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce-soft">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Import Successful!</h3>
              <p className="text-secondary mb-6 max-w-sm">
                Successfully imported {validRows} Suppliers ({newCount} new, {updateCount} updated). The Supplier master catalog has been updated.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Upload */}
              {!selectedFile && (
                <div className="flex flex-col gap-6">
                  
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    {/* Upload Dropzone */}
                    <div 
                      className={`flex-1 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls"
                        onChange={handleFileSelect}
                      />
                      
                      <div className="w-14 h-14 bg-surface rounded-full shadow-sm flex items-center justify-center text-primary mb-4 border border-border">
                        <Upload className="w-6 h-6" />
                      </div>
                      
                      <h4 className="text-base font-bold text-text mb-1">Upload Excel File</h4>
                      <p className="text-sm text-secondary mb-4 max-w-xs">
                        Drag and drop your .xlsx file here, or click to browse files on your computer.
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-primary-dark mb-1">How it works</h5>
                      <ul className="text-sm text-primary-dark/80 space-y-1.5 list-disc list-inside">
                        <li>Download the template. Don't change the column headers.</li>
                        <li><strong>New Suppliers:</strong> Leave the "Supplier ID" column blank.</li>
                        <li><strong>Update Existing:</strong> Provide the exact "Supplier ID". If the name and type match exactly, it will also update.</li>
                      </ul>
                      <button 
                        onClick={downloadSampleSupplierTemplateExcel}
                        className="mt-4 px-4 py-2 bg-white border border-primary/20 hover:border-primary/40 rounded-lg text-sm font-semibold text-primary transition shadow-2xs flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Download Template
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Step 2: Parsing & Errors */}
              {isParsing && (
                <div className="py-12 flex flex-col items-center justify-center text-center text-secondary">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p className="font-semibold">Reading Excel file and validating rows...</p>
                </div>
              )}

              {parseError && !isParsing && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                  <h4 className="text-rose-800 font-bold mb-1">Failed to read file</h4>
                  <p className="text-sm text-rose-600 mb-4">{parseError}</p>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-semibold hover:bg-surface-muted transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Step 3: Preview */}
              {parsedRows && !isParsing && !parseError && (
                <div className="flex flex-col gap-4">
                  
                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-muted rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-text font-semibold">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <span>{selectedFile?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex flex-col">
                        <span className="text-secondary text-xs">Total Rows</span>
                        <span className="font-bold text-text">{totalRows}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-emerald-700 text-xs font-semibold">Valid</span>
                        <span className="font-bold text-emerald-700">{validRows}</span>
                      </div>
                      {errorRows > 0 && (
                        <div className="flex flex-col">
                          <span className="text-rose-600 text-xs font-semibold">Errors</span>
                          <span className="font-bold text-rose-600">{errorRows}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleReset}
                      className="text-sm text-secondary hover:text-text underline underline-offset-2 transition"
                    >
                      Change File
                    </button>
                  </div>

                  {errorRows > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <strong>{errorRows} row(s) contain errors and will be skipped.</strong> Review the red rows below.
                      </div>
                    </div>
                  )}

                  {validRows === 0 && (
                    <div className="p-8 text-center text-secondary border border-border rounded-xl">
                      No valid rows found to import. Please check your Excel file.
                    </div>
                  )}

                  {totalRows > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-surface-muted border-b border-border text-secondary uppercase text-[10px] tracking-wider font-bold z-10">
                            <tr>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Company Name</th>
                              <th className="py-2 px-3">Contact Person</th>
                              <th className="py-2 px-3">Phone</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">Tax Number</th>
                              <th className="py-2 px-3 text-right">Opening Balance</th>
                              <th className="py-2 px-3 text-center">Active</th>
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
                                  <td className="py-2 px-3 font-semibold text-text max-w-[200px] truncate" title={row.companyName}>
                                    {row.companyName}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {row.contactPerson || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-secondary truncate max-w-[150px]">
                                    {row.phone || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-secondary truncate max-w-[150px]">
                                    {row.email || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-secondary">
                                    {row.taxNumber || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono">
                                    ${row.openingBalanceUSD.toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {row.isActive ? (
                                      <span className="text-emerald-600">Yes</span>
                                    ) : (
                                      <span className="text-secondary">No</span>
                                    )}
                                  </td>
                                </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {!importSuccess && (
          <div className="p-4 border-t border-border bg-surface-muted/30 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-muted transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !parsedRows || validRows === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-[#4d5541] text-white transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Import {validRows} Suppliers</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

