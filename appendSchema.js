const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'server', 'db', 'schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

const newTable = `
// ---- System Settings ----
export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 50 }).primaryKey(),
  retreatName: varchar('retreat_name', { length: 255 }),
  retreatTagline: varchar('retreat_tagline', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 100 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  currency: varchar('currency', { length: 10 }),
  usdToLkrRate: numeric('usd_to_lkr_rate', { precision: 10, scale: 2 }),
  defaultServiceChargeRate: numeric('default_service_charge_rate', { precision: 5, scale: 4 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }),
  pmsTaxRate: numeric('pms_tax_rate', { precision: 5, scale: 4 }),
  pmsServiceChargeRate: numeric('pms_service_charge_rate', { precision: 5, scale: 4 }),
  updatedAt: timestamp('updated_at').defaultNow(),
});
`;

// Check if old system_settings exists
const oldTableRegex = /\/\/\s*---- System Settings ----\s*export const systemSettings = pgTable\('system_settings', {[\s\S]*?}\);/g;

if (content.match(oldTableRegex)) {
  content = content.replace(oldTableRegex, newTable.trim());
} else if (!content.includes("export const systemSettings = pgTable('system_settings'")) {
  content += '\n' + newTable;
} else {
  console.log("systemSettings already updated.");
}

fs.writeFileSync(schemaPath, content);
console.log("Schema updated.");
