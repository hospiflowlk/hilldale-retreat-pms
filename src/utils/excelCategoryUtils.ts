import * as XLSX from 'xlsx';
import { MasterCategory, MasterCategoryType } from '../types';

export interface ParsedCategoryRow {
  rowNumber: number;
  id?: string;
  name: string;
  type: MasterCategoryType;
  parentName?: string;
  description?: string;
  color?: string;
  isActive: boolean;
  action: 'create' | 'update';
  matchedExistingId?: string;
  errors: string[];
}

export const exportMasterCategoriesToExcel = (categories: MasterCategory[], customFileName?: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `Hilldale_Master_Categories_${dateStr}.xlsx`;

  const formatCategoryType = (type: MasterCategoryType) => {
    return type === 'INCOME' ? 'Income / Revenue' : 'Expense / COGS';
  };

  const data = categories.map((cat, idx) => {
    const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
    return {
      'No': idx + 1,
      'Category ID': cat.id,
      'Category Name': cat.name,
      'Type': formatCategoryType(cat.type),
      'Parent Category': parent ? parent.name : '',
      'Status': cat.isActive !== false ? 'Active' : 'Inactive',
      'Color Code': cat.color || '',
      'Description': cat.description || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // ID
    { wch: 36 }, // Name
    { wch: 20 }, // Type
    { wch: 30 }, // Parent
    { wch: 12 }, // Status
    { wch: 14 }, // Color
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Categories');

  XLSX.writeFile(workbook, fileName);
};

export const downloadSampleCategoryTemplateExcel = () => {
  const sampleData = [
    {
      'Category ID': '',
      'Category Name': 'Food & Beverage Sales',
      'Type': 'Income / Revenue',
      'Parent Category': '',
      'Status': 'Active',
      'Color Code': '#10b981',
      'Description': 'Root category for restaurant sales'
    },
    {
      'Category ID': '',
      'Category Name': 'Beverages',
      'Type': 'Income / Revenue',
      'Parent Category': 'Food & Beverage Sales',
      'Status': 'Active',
      'Color Code': '',
      'Description': 'Sales from drinks'
    },
    {
      'Category ID': '',
      'Category Name': 'Direct Cost of Goods (COGS)',
      'Type': 'Expense / COGS',
      'Parent Category': '',
      'Status': 'Active',
      'Color Code': '#ef4444',
      'Description': 'Raw ingredients and bar stock purchases'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 22 }, // ID
    { wch: 36 }, // Name
    { wch: 20 }, // Type
    { wch: 30 }, // Parent
    { wch: 12 }, // Status
    { wch: 14 }, // Color
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories Template');

  XLSX.writeFile(workbook, 'Hilldale_Categories_Import_Template.xlsx');
};

export const parseCategoriesFromExcel = async (
  file: File, 
  existingCategories: MasterCategory[]
): Promise<ParsedCategoryRow[]> => {
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

        const parsedRows: ParsedCategoryRow[] = rawRows.map((row, idx) => {
          const rowNum = idx + 2; 
          const errors: string[] = [];

          const rawId = String(row['Category ID'] || row['id'] || row['ID'] || '').trim();
          const name = String(row['Category Name'] || row['Name'] || row['Category'] || row['name'] || '').trim();
          
          let rawType = String(row['Type'] || row['Category Type'] || row['type'] || 'EXPENSE').trim().toUpperCase();
          if (rawType.includes('INCOME') || rawType.includes('REVENUE')) {
            rawType = 'INCOME';
          } else {
            rawType = 'EXPENSE';
          }
          const type: MasterCategoryType = rawType as MasterCategoryType;

          const parentName = String(row['Parent Category'] || row['Parent'] || row['parent'] || '').trim();
          
          const rawStatus = String(row['Status'] || row['Active'] || row['status'] || 'Active').trim().toLowerCase();
          const isActive = rawStatus !== 'inactive' && rawStatus !== 'false' && rawStatus !== '0' && rawStatus !== 'no';

          const color = String(row['Color Code'] || row['Color'] || row['color'] || '').trim();
          const description = String(row['Description'] || row['Notes'] || row['description'] || '').trim();

          if (!name) {
            errors.push('Category Name is required.');
          }

          let matchedExistingId = undefined;
          let action: 'create' | 'update' = 'create';

          if (rawId) {
            const existing = existingCategories.find(c => c.id === rawId);
            if (existing) {
              matchedExistingId = existing.id;
              action = 'update';
            } else {
              errors.push(`Provided ID "${rawId}" does not exist in the system.`);
            }
          } else {
            const existingByName = existingCategories.find(
              c => c.name.toLowerCase() === name.toLowerCase() && c.type === type
            );
            if (existingByName) {
              matchedExistingId = existingByName.id;
              action = 'update';
            }
          }

          return {
            rowNumber: rowNum,
            id: rawId || undefined,
            name,
            type,
            parentName: parentName || undefined,
            description: description || undefined,
            color: color || undefined,
            isActive,
            action,
            matchedExistingId,
            errors
          };
        });

        resolve(parsedRows);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
