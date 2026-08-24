const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/context/AppContext.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add the React Query hooks import
if (!content.includes('useItems')) {
  const importTarget = "import { INITIAL_MASTER_CATEGORIES";
  const newImport = `import { useItems, useCategories, useCustomers, useSuppliers, useBusinessSources } from '../hooks/useMasters';\nimport { INITIAL_MASTER_CATEGORIES`;
  content = content.replace(importTarget, newImport);
}

// 2. Replace the initial useState definitions (approx line 560+) inside AppProvider
const startRegex = /\/\/ Masters Module State[\s\S]*?(?=\/\/ Authentication & Session Lock)/m;

const replacementState = `// Masters Module State
  const { data: masterItems = [] } = useItems.useGetAll();
  const createItemMut = useItems.useCreate();
  const updateItemMut = useItems.useUpdate();
  const deleteItemMut = useItems.useDelete();

  const { data: masterCategories = [] } = useCategories.useGetAll();
  const createCategoryMut = useCategories.useCreate();
  const updateCategoryMut = useCategories.useUpdate();
  const deleteCategoryMut = useCategories.useDelete();

  const { data: masterCustomers = [] } = useCustomers.useGetAll();
  const createCustomerMut = useCustomers.useCreate();
  const updateCustomerMut = useCustomers.useUpdate();
  const deleteCustomerMut = useCustomers.useDelete();

  const { data: masterSuppliers = [] } = useSuppliers.useGetAll();
  const createSupplierMut = useSuppliers.useCreate();
  const updateSupplierMut = useSuppliers.useUpdate();
  const deleteSupplierMut = useSuppliers.useDelete();

  const { data: masterBusinessSources = [] } = useBusinessSources.useGetAll();
  const createSourceMut = useBusinessSources.useCreate();
  const updateSourceMut = useBusinessSources.useUpdate();
  const deleteSourceMut = useBusinessSources.useDelete();

  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchaseInvoice[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SUPPLIER_PURCHASES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SUPPLIER_PURCHASES;
  });

  `;

content = content.replace(startRegex, replacementState);

// 3. Remove localStorage effects for the masters (approx line 785)
const effectRegex = /useEffect\(\(\) => \{\s*localStorage\.setItem\(LOCAL_STORAGE_KEYS\.MASTER_CATEGORIES[\s\S]*?(?=useEffect\(\(\) => \{\s*localStorage\.setItem\(LOCAL_STORAGE_KEYS\.SUPPLIER_PURCHASES)/m;
content = content.replace(effectRegex, '');

const effectCustRegex = /useEffect\(\(\) => \{\s*localStorage\.setItem\(LOCAL_STORAGE_KEYS\.MASTER_CUSTOMERS[\s\S]*?(?=  \/\/ Authentication & Session Lock)/m;
content = content.replace(effectCustRegex, '\n');

// 4. Update the CRUD function bodies (approx line 2690+)
// Categories
content = content.replace(
  /const addMasterCategory = [\s\S]*?(?=const updateMasterCategory = )/m,
  `const addMasterCategory = (categoryData: Omit<MasterCategory, 'id' | 'createdAt' | 'updatedAt'>): MasterCategory => {
    createCategoryMut.mutate(categoryData);
    return { id: 'temp-id', ...categoryData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MasterCategory;
  };\n\n  `
);
content = content.replace(
  /const updateMasterCategory = [\s\S]*?(?=const deleteMasterCategory = )/m,
  `const updateMasterCategory = (id: string, updates: Partial<MasterCategory>) => {
    updateCategoryMut.mutate({ id, ...updates });
  };\n\n  `
);
content = content.replace(
  /const deleteMasterCategory = [\s\S]*?(?=const deleteAllMasterCategories = )/m,
  `const deleteMasterCategory = (id: string) => {
    deleteCategoryMut.mutate(id);
    return { success: true };
  };\n\n  `
);
content = content.replace(
  /const deleteAllMasterCategories = [\s\S]*?(?=const bulkImportMasterCategories = )/m,
  `const deleteAllMasterCategories = () => {
    masterCategories.forEach(c => deleteCategoryMut.mutate(c.id));
  };\n\n  `
);

// Items
content = content.replace(
  /const addMasterItem = [\s\S]*?(?=const updateMasterItem = )/m,
  `const addMasterItem = (itemData: Omit<MasterItem, 'id' | 'createdAt' | 'updatedAt'>): MasterItem => {
    createItemMut.mutate(itemData);
    return { id: 'temp', ...itemData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MasterItem;
  };\n\n  `
);
content = content.replace(
  /const updateMasterItem = [\s\S]*?(?=const deleteMasterItem = )/m,
  `const updateMasterItem = (id: string, updates: Partial<MasterItem>) => {
    updateItemMut.mutate({ id, ...updates });
  };\n\n  `
);
content = content.replace(
  /const deleteMasterItem = [\s\S]*?(?=const deleteAllMasterItems = )/m,
  `const deleteMasterItem = (id: string) => {
    deleteItemMut.mutate(id);
    return { success: true };
  };\n\n  `
);
content = content.replace(
  /const deleteAllMasterItems = [\s\S]*?(?=const adjustItemStock = )/m,
  `const deleteAllMasterItems = () => {
    masterItems.forEach(i => deleteItemMut.mutate(i.id));
  };\n\n  `
);
content = content.replace(
  /const adjustItemStock = [\s\S]*?(?=const bulkImportMasterItems = )/m,
  `const adjustItemStock = (itemId: string, delta: number, reason?: string) => {
    const item = masterItems.find(i => i.id === itemId);
    if (item) updateItemMut.mutate({ id: itemId, currentStock: item.currentStock + delta });
  };\n\n  `
);

// Suppliers
content = content.replace(
  /const addMasterSupplier = [\s\S]*?(?=const updateMasterSupplier = )/m,
  `const addMasterSupplier = (supplierData: Omit<MasterSupplier, 'id' | 'createdAt' | 'updatedAt'>): MasterSupplier => {
    createSupplierMut.mutate(supplierData);
    return { id: 'temp', ...supplierData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MasterSupplier;
  };\n\n  `
);
content = content.replace(
  /const updateMasterSupplier = [\s\S]*?(?=const deleteMasterSupplier = )/m,
  `const updateMasterSupplier = (id: string, updates: Partial<MasterSupplier>) => {
    updateSupplierMut.mutate({ id, ...updates });
  };\n\n  `
);
content = content.replace(
  /const deleteMasterSupplier = [\s\S]*?(?=const deleteAllMasterSuppliers = )/m,
  `const deleteMasterSupplier = (id: string) => {
    deleteSupplierMut.mutate(id);
    return { success: true };
  };\n\n  `
);
content = content.replace(
  /const deleteAllMasterSuppliers = [\s\S]*?(?=const bulkImportMasterSuppliers = )/m,
  `const deleteAllMasterSuppliers = () => {
    masterSuppliers.forEach(s => deleteSupplierMut.mutate(s.id));
  };\n\n  `
);

// Customers
content = content.replace(
  /const addOrUpdateCustomer = [\s\S]*?(?=const deleteCustomer = )/m,
  `const addOrUpdateCustomer = (customerData: Partial<MasterCustomer> & { name: string; phone\?: string; email\?: string }): MasterCustomer => {
    if (customerData.id) {
      updateCustomerMut.mutate(customerData as any);
      return customerData as MasterCustomer;
    } else {
      createCustomerMut.mutate(customerData);
      return { id: 'temp', ...customerData } as MasterCustomer;
    }
  };\n\n  `
);
content = content.replace(
  /const deleteCustomer = [\s\S]*?(?=const addMasterBusinessSource = )/m,
  `const deleteCustomer = (id: string) => {
    deleteCustomerMut.mutate(id);
    return { success: true };
  };\n\n  `
);

// Business Sources
content = content.replace(
  /const addMasterBusinessSource = [\s\S]*?(?=const updateMasterBusinessSource = )/m,
  `const addMasterBusinessSource = (sourceData: Omit<MasterBusinessSource, 'id' | 'createdAt' | 'updatedAt'>): MasterBusinessSource => {
    createSourceMut.mutate(sourceData);
    return { id: 'temp', ...sourceData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as MasterBusinessSource;
  };\n\n  `
);
content = content.replace(
  /const updateMasterBusinessSource = [\s\S]*?(?=const deleteMasterBusinessSource = )/m,
  `const updateMasterBusinessSource = (id: string, updates: Partial<MasterBusinessSource>) => {
    updateSourceMut.mutate({ id, ...updates });
  };\n\n  `
);
content = content.replace(
  /const deleteMasterBusinessSource = [\s\S]*?(?=const formatCurrency = )/m,
  `const deleteMasterBusinessSource = (id: string) => {
    deleteSourceMut.mutate(id);
    return { success: true };
  };\n\n  `
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Migration complete');
