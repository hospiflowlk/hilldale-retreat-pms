import * as XLSX from 'xlsx';
import { MasterSupplier } from '../types';

export interface ParsedSupplierRow {
  rowNumber: number;
  id?: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  openingBalanceUSD: number;
  bankDetails?: string;
  notes?: string;
  isActive: boolean;
  action: 'create' | 'update';
  matchedExistingId?: string;
  errors: string[];
}

export const exportMasterSuppliersToExcel = (suppliers: MasterSupplier[], customFileName?: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Hilldale_Master_Suppliers_${dateStr}.xlsx`;

  const data = suppliers.map((sup, idx) => {
    return {
      'No': idx + 1,
      'Supplier ID': sup.id,
      'Company Name': sup.companyName,
      'Contact Person': sup.contactPerson || '',
      'Phone': sup.phone || '',
      'Email': sup.email || '',
      'Address': sup.address || '',
      'Tax Number': sup.taxNumber || '',
      'Opening Balance (USD)': sup.openingBalanceUSD || 0,
      'Current Owed (USD)': sup.currentBalanceOwedUSD || 0,
      'Bank Details': sup.bankDetails || '',
      'Notes': sup.notes || '',
      'Status': sup.isActive ? 'Active' : 'Inactive'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');

  const wscols = [
    { wch: 5 }, // No
    { wch: 25 }, // ID
    { wch: 30 }, // Company
    { wch: 20 }, // Contact
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 35 }, // Address
    { wch: 15 }, // Tax Number
    { wch: 20 }, // Opening Balance
    { wch: 20 }, // Current Owed
    { wch: 35 }, // Bank Details
    { wch: 30 }, // Notes
    { wch: 10 }  // Status
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, fileName);
};

export const downloadSampleSupplierTemplateExcel = () => {
  const data = [
    {
      'Supplier ID': '',
      'Company Name': 'Keells Food Products PLC',
      'Contact Person': 'Rohan Jayawardena',
      'Phone': '+94 11 234 5678',
      'Email': 'orders@keellsfoods.lk',
      'Address': 'No. 117, Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
      'Tax Number': 'VAT-998877',
      'Opening Balance (USD)': 0,
      'Bank Details': 'Commercial Bank, Acc: 1122334455',
      'Notes': 'Poultry and processed meats',
      'Status': 'Active'
    },
    {
      'Supplier ID': '',
      'Company Name': 'Ceylon Cold Stores PLC',
      'Contact Person': 'Kasun Bandara',
      'Phone': '+94 11 293 8472',
      'Email': 'wholesale@elephanthouse.lk',
      'Address': 'Kaduwela Road, Ranala',
      'Tax Number': 'VAT-445566',
      'Opening Balance (USD)': 150.50,
      'Bank Details': '',
      'Notes': 'Carbonated beverages, mineral water',
      'Status': 'Active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers Template');

  const wscols = [
    { wch: 20 }, // ID
    { wch: 30 }, // Company
    { wch: 20 }, // Contact
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 35 }, // Address
    { wch: 15 }, // Tax Number
    { wch: 20 }, // Opening Balance
    { wch: 35 }, // Bank Details
    { wch: 30 }, // Notes
    { wch: 10 }  // Status
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, 'Hilldale_Suppliers_Template.xlsx');
};

export const parseSuppliersFromExcel = async (
  file: File, 
  existingSuppliers: MasterSupplier[]
): Promise<ParsedSupplierRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        const parsedRows: ParsedSupplierRow[] = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; 
          const errors: string[] = [];

          const id = row['Supplier ID']?.toString().trim();
          const companyName = row['Company Name']?.toString().trim();
          const contactPerson = row['Contact Person']?.toString().trim() || '';
          const phone = row['Phone']?.toString().trim() || '';
          const email = row['Email']?.toString().trim() || '';
          const address = row['Address']?.toString().trim() || '';
          const taxNumber = row['Tax Number']?.toString().trim() || '';
          const bankDetails = row['Bank Details']?.toString().trim() || '';
          const notes = row['Notes']?.toString().trim() || '';
          let openingBalanceUSD = parseFloat(row['Opening Balance (USD)']);
          if (isNaN(openingBalanceUSD)) openingBalanceUSD = 0;
          
          const statusStr = row['Status']?.toString().trim().toLowerCase();
          const isActive = statusStr === 'inactive' ? false : true;

          if (!companyName) {
            errors.push('Company Name is required.');
          }

          let action: 'create' | 'update' = 'create';
          let matchedId: string | undefined = undefined;

          if (id) {
            const existing = existingSuppliers.find(s => s.id === id);
            if (existing) {
              action = 'update';
              matchedId = existing.id;
            } else {
              errors.push(`Supplier ID "${id}" provided but not found in system.`);
            }
          } else {
            // Check for exact company name match for updates if no ID
            if (companyName) {
              const exactMatch = existingSuppliers.find(s => s.companyName.toLowerCase() === companyName.toLowerCase());
              if (exactMatch) {
                action = 'update';
                matchedId = exactMatch.id;
              }
            }
          }

          parsedRows.push({
            rowNumber: rowNum,
            id,
            companyName: companyName || 'Unknown Company',
            contactPerson,
            phone,
            email,
            address,
            taxNumber,
            openingBalanceUSD,
            bankDetails,
            notes,
            isActive,
            action,
            matchedExistingId: matchedId,
            errors
          });
        });

        resolve(parsedRows);
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid format.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Export full Master Suppliers array to a loss-less JSON backup file
 */
export const exportMasterSuppliersToJSON = (suppliers: MasterSupplier[], customFileName?: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Hilldale_Master_Suppliers_Full_Backup_${dateStr}.json`;
  const jsonStr = JSON.stringify(suppliers, null, 2);
  
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import Master Suppliers array from a JSON file backup
 */
export const parseSuppliersFromJSON = (file: File): Promise<MasterSupplier[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('JSON file must contain an array of suppliers.');
        }
        resolve(parsed as MasterSupplier[]);
      } catch (err: any) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read JSON file.'));
    reader.readAsText(file);
  });
};
