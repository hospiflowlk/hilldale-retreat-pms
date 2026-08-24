import * as XLSX from 'xlsx';
import { MasterItem, ItemType, UnitOfMeasure } from '../types';

export interface ParsedItemRow {
  rowNumber: number;
  id?: string;
  name: string;
  type: ItemType;
  categoryName: string;
  unit: UnitOfMeasure;
  costPriceUSD: number;
  sellingPriceUSD: number;
  currentStock: number;
  reorderThreshold: number;
  barcode?: string;
  description?: string;
  isAvailable: boolean;
  action: 'create' | 'update';
  matchedExistingId?: string;
  errors: string[];
}

/**
 * Export full Master Items list to an Excel (.xlsx) file
 */
export const exportMasterItemsToExcel = (items: MasterItem[], customFileName?: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Hilldale_Master_Items_${dateStr}.xlsx`;

  const formatItemType = (type: ItemType) => {
    if (type === 'RESALE') return 'Resale / Raw Stock';
    if (type === 'RECIPE') return 'Recipe (BOM)';
    if (type === 'EXPENSE') return 'Non-Stock Expense';
    return type;
  };

  // Format data for sheet
  const data = items.map((item, idx) => ({
    'No': idx + 1,
    'Item ID': item.id,
    'Item / Service Name': item.name,
    'Item Classification & Preparation Type': formatItemType(item.type),
    'Master Category': item.categoryName,
    'Unit of Measure': item.unit,
    'Cost Price (USD)': item.costPriceUSD,
    'Selling Price (USD)': item.type === 'EXPENSE' ? 0 : item.sellingPriceUSD,
    'Current Stock Level': item.type === 'EXPENSE' ? 0 : item.currentStock,
    'Reorder Level (Low Stock Alert)': item.type === 'EXPENSE' ? 0 : item.reorderThreshold,
    'Barcode / SKU (Optional)': item.barcode || '',
    'Status': item.isAvailable !== false ? 'Active' : 'Inactive',
    'Description & Guest Menu Notes': item.description || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // Item ID
    { wch: 36 }, // Item Name
    { wch: 36 }, // Classification Type
    { wch: 28 }, // Category
    { wch: 16 }, // Unit
    { wch: 16 }, // Cost Price
    { wch: 18 }, // Selling Price
    { wch: 20 }, // Current Stock
    { wch: 30 }, // Reorder Threshold
    { wch: 24 }, // Barcode
    { wch: 12 }, // Status
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Items');

  // Trigger browser download
  XLSX.writeFile(workbook, fileName);
};

/**
 * Generate and download a sample template Excel (.xlsx) file with pre-filled examples and instructions
 */
export const downloadSampleItemTemplateExcel = () => {
  const sampleData = [
    {
      'Item ID': '', // Leave blank for new item, or provide existing ID to update
      'Item / Service Name': 'Ceylon Ginger Tea (BOPF)',
      'Item Classification & Preparation Type': 'Resale / Raw Stock', // Resale / Raw Stock | Recipe (BOM) | Non-Stock Expense
      'Master Category': 'Beverages & Packaged Drinks',
      'Unit of Measure': 'pcs', // pcs, kg, g, l, ml, portion, bottle, can, pack, box, service, month, trip
      'Cost Price (USD)': 0.80,
      'Selling Price (USD)': 3.00,
      'Current Stock Level': 50,
      'Reorder Level (Low Stock Alert)': 15,
      'Barcode / SKU (Optional)': '4790001234567',
      'Status': 'Active',
      'Description & Guest Menu Notes': 'Hand-picked highland tea infused with organic dried ginger'
    },
    {
      'Item ID': '',
      'Item / Service Name': 'Electricity & Power Grid (CEB)',
      'Item Classification & Preparation Type': 'Non-Stock Expense',
      'Master Category': 'Operational Overheads',
      'Unit of Measure': 'month',
      'Cost Price (USD)': 280.00,
      'Selling Price (USD)': 0,
      'Current Stock Level': 0,
      'Reorder Level (Low Stock Alert)': 0,
      'Barcode / SKU (Optional)': '',
      'Status': 'Active',
      'Description & Guest Menu Notes': 'Monthly commercial grid power consumption'
    },
    {
      'Item ID': '',
      'Item / Service Name': 'Fresh Chicken Breast (Boneless)',
      'Item Classification & Preparation Type': 'Resale / Raw Stock',
      'Master Category': 'Meats, Poultry & Seafood',
      'Unit of Measure': 'kg',
      'Cost Price (USD)': 5.50,
      'Selling Price (USD)': 0,
      'Current Stock Level': 20,
      'Reorder Level (Low Stock Alert)': 5,
      'Barcode / SKU (Optional)': '',
      'Status': 'Active',
      'Description & Guest Menu Notes': 'Raw ingredient for kitchen recipes'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 18 }, // Item ID
    { wch: 34 }, // Item Name
    { wch: 36 }, // Classification Type
    { wch: 30 }, // Category
    { wch: 18 }, // Unit of Measure
    { wch: 16 }, // Cost Price (USD)
    { wch: 18 }, // Selling Price (USD)
    { wch: 20 }, // Current Stock
    { wch: 30 }, // Reorder Threshold
    { wch: 24 }, // Barcode / SKU
    { wch: 12 }, // Status
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Template');

  XLSX.writeFile(workbook, 'Hilldale_Items_Import_Template.xlsx');
};

/**
 * Parse an uploaded Excel (.xlsx/.xls) file and validate rows against current master items
 */
export const parseItemsFromExcel = async (
  file: File, 
  existingItems: MasterItem[]
): Promise<ParsedItemRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded Excel file contains no worksheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          throw new Error('The uploaded Excel sheet contains no data rows.');
        }

        const parsedRows: ParsedItemRow[] = rawRows.map((row, idx) => {
          const rowNum = idx + 2; // Accounting for 1-based index + header row
          const errors: string[] = [];

          // Column name flexibility: support both standard template headers and common variations
          const rawId = String(row['Item ID'] || row['id'] || row['ID'] || '').trim();
          const name = String(row['Item / Service Name'] || row['Item Name'] || row['Name'] || row['Item'] || row['name'] || '').trim();
          
          let rawType = String(row['Item Classification & Preparation Type'] || row['Classification Type'] || row['Type'] || row['Item Type'] || row['type'] || 'RESALE').trim().toUpperCase();
          if (rawType.includes('EXPENSE') || rawType.includes('SERVICE') || rawType.includes('OVERHEAD') || rawType.includes('NON-STOCK')) {
            rawType = 'EXPENSE';
          } else if (rawType.includes('RECIPE') || rawType.includes('BOM') || rawType.includes('PREPARED')) {
            rawType = 'RECIPE';
          } else {
            rawType = 'RESALE';
          }
          const type: ItemType = rawType as ItemType;

          const categoryName = String(row['Master Category'] || row['Category'] || row['Category Name'] || row['category'] || 'General').trim();
          
          let unit = String(row['Unit of Measure'] || row['Unit'] || row['unit'] || 'pcs').trim().toLowerCase();
          const validUnits: UnitOfMeasure[] = ['pcs', 'kg', 'g', 'l', 'ml', 'portion', 'bottle', 'can', 'pack', 'tray', 'box', 'service', 'month', 'trip'];
          if (!validUnits.includes(unit as UnitOfMeasure)) {
            unit = 'pcs';
          }

          const costPriceUSD = parseFloat(row['Cost Price (USD)'] || row['Cost Price'] || row['Cost'] || row['costPriceUSD'] || '0') || 0;
          const sellingPriceUSD = parseFloat(row['Selling Price (USD)'] || row['Selling Price'] || row['Price'] || row['sellingPriceUSD'] || '0') || 0;
          const currentStock = parseFloat(row['Current Stock Level'] || row['Current Stock'] || row['Stock'] || row['currentStock'] || '0') || 0;
          const reorderThreshold = parseFloat(row['Reorder Level (Low Stock Alert)'] || row['Reorder Threshold'] || row['Reorder Level'] || row['reorderThreshold'] || '0') || 0;
          const barcode = String(row['Barcode / SKU (Optional)'] || row['Barcode / SKU'] || row['Barcode'] || row['SKU'] || row['barcode'] || '').trim();
          const description = String(row['Description & Guest Menu Notes'] || row['Description / Notes'] || row['Description'] || row['Notes'] || row['description'] || '').trim();
          
          const rawStatus = String(row['Status'] || row['Active'] || row['status'] || 'Active').trim().toLowerCase();
          const isAvailable = rawStatus !== 'inactive' && rawStatus !== 'false' && rawStatus !== '0' && rawStatus !== 'no';

          // Validation
          if (!name) {
            errors.push('Item Name is required');
          }

          // Determine action: create vs update
          let matchedExisting = existingItems.find(i => 
            (rawId && i.id === rawId) ||
            (barcode && barcode !== '' && i.barcode === barcode) ||
            (i.name.toLowerCase() === name.toLowerCase())
          );

          return {
            rowNumber: rowNum,
            id: rawId || undefined,
            name,
            type,
            categoryName,
            unit: unit as UnitOfMeasure,
            costPriceUSD,
            sellingPriceUSD: type === 'EXPENSE' ? 0 : sellingPriceUSD,
            currentStock: type === 'EXPENSE' ? 0 : currentStock,
            reorderThreshold: type === 'EXPENSE' ? 0 : reorderThreshold,
            barcode: barcode || undefined,
            description: description || undefined,
            isAvailable,
            action: matchedExisting ? 'update' : 'create',
            matchedExistingId: matchedExisting?.id,
            errors
          };
        });

        resolve(parsedRows);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
};
