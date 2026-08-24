import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/hilldale_pms');

async function migrate() {
  console.log('?? Migrating POS & Orders schema...');
  try {
    await sql`DROP TABLE IF EXISTS kitchen_tickets CASCADE`;
    await sql`DROP TABLE IF EXISTS order_items CASCADE`;
    await sql`DROP TABLE IF EXISTS invoices CASCADE`;
    await sql`DROP TABLE IF EXISTS orders CASCADE`;
    await sql`DROP TABLE IF EXISTS walkin_sessions CASCADE`;

    await sql`
      CREATE TABLE walkin_sessions (
        id VARCHAR(100) PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        guest_name VARCHAR(255),
        number_of_guests INTEGER DEFAULT 1,
        location VARCHAR(100) DEFAULT 'Table 01 (Main Dining)',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        pos_balance NUMERIC(12, 2) DEFAULT 0,
        invoice_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checked_out_at TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE orders (
        id VARCHAR(100) PRIMARY KEY,
        order_number VARCHAR(100),
        invoice_number VARCHAR(100),
        session_id VARCHAR(100) REFERENCES walkin_sessions(id),
        reservation_id INTEGER REFERENCES reservations(id),
        booking_id VARCHAR(100),
        room_number VARCHAR(50),
        order_type VARCHAR(50) DEFAULT 'dine-in',
        location VARCHAR(100) DEFAULT 'Table 01',
        guest_name VARCHAR(255),
        guest_count INTEGER DEFAULT 1,
        items JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        subtotal NUMERIC(12, 2) DEFAULT 0,
        service_charge_rate NUMERIC(6, 4) DEFAULT 0.10,
        service_charge_amount NUMERIC(12, 2) DEFAULT 0,
        discount_percent NUMERIC(6, 2) DEFAULT 0,
        discount_amount NUMERIC(12, 2) DEFAULT 0,
        tax_percent NUMERIC(6, 2) DEFAULT 0,
        tax_amount NUMERIC(12, 2) DEFAULT 0,
        grand_total NUMERIC(12, 2) DEFAULT 0,
        payment_method VARCHAR(50),
        account_id VARCHAR(100),
        account_name VARCHAR(255),
        cash_received NUMERIC(12, 2),
        change_due NUMERIC(12, 2),
        cashier_name VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id),
        quantity NUMERIC(10, 2) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        note TEXT
      )
    `;

    await sql`
      CREATE TABLE kitchen_tickets (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`DROP TABLE IF EXISTS expense_items CASCADE`;
    await sql`DROP TABLE IF EXISTS expenses CASCADE`;
    await sql`DROP TABLE IF EXISTS account_transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;

    await sql`
      CREATE TABLE accounts (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        account_number VARCHAR(100),
        bank_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'LKR',
        balance NUMERIC(15, 2) DEFAULT 0,
        opening_balance NUMERIC(15, 2) DEFAULT 0,
        opening_date VARCHAR(50),
        branch VARCHAR(255),
        credit_limit NUMERIC(15, 2),
        billing_cycle_day INTEGER,
        initial_loan_amount NUMERIC(15, 2),
        principal_amount NUMERIC(15, 2),
        loan_term_months INTEGER,
        monthly_installment NUMERIC(15, 2),
        interest_rate NUMERIC(6, 2),
        due_date VARCHAR(50),
        monthly_payment NUMERIC(15, 2),
        inter_bank_transfer_fee NUMERIC(10, 2) DEFAULT 0,
        inter_bank_fee_type VARCHAR(50) DEFAULT 'flat',
        card_commission_percent NUMERIC(6, 2) DEFAULT 0,
        cheque_clearing_fee NUMERIC(10, 2) DEFAULT 0,
        color VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE account_transactions (
        id VARCHAR(100) PRIMARY KEY,
        account_id VARCHAR(100) REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
        account_name VARCHAR(255),
        date VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        amount_usd NUMERIC(15, 2) DEFAULT 0,
        amount_lkr NUMERIC(15, 2) DEFAULT 0,
        running_balance NUMERIC(15, 2) DEFAULT 0,
        fee_amount NUMERIC(12, 2) DEFAULT 0,
        net_amount NUMERIC(15, 2) DEFAULT 0,
        payee_or_payer VARCHAR(255),
        category VARCHAR(255),
        reference VARCHAR(255),
        related_entity_type VARCHAR(50),
        related_entity_id VARCHAR(100),
        transfer_related_account_id VARCHAR(100),
        transfer_related_account_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE expenses (
        id VARCHAR(100) PRIMARY KEY,
        expense_number VARCHAR(100),
        date VARCHAR(50),
        category VARCHAR(255),
        description TEXT,
        amount_usd NUMERIC(15, 2) DEFAULT 0,
        amount_lkr NUMERIC(15, 2) DEFAULT 0,
        paid_amount_usd NUMERIC(15, 2) DEFAULT 0,
        paid_amount_lkr NUMERIC(15, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PAID',
        payment_method VARCHAR(50),
        account_id VARCHAR(100) REFERENCES accounts(id),
        account_name VARCHAR(255),
        supplier_id INTEGER REFERENCES suppliers(id),
        supplier_name VARCHAR(255),
        invoice_number VARCHAR(100),
        receipt_url TEXT,
        notes TEXT,
        items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE expense_items (
        id SERIAL PRIMARY KEY,
        expense_id VARCHAR(100) REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
        item_id INTEGER REFERENCES items(id),
        note VARCHAR(255),
        price NUMERIC(12, 2) NOT NULL,
        qty NUMERIC(10, 2) NOT NULL,
        vat_percent NUMERIC(5, 2) DEFAULT 0,
        line_total NUMERIC(15, 2) NOT NULL
      )
    `;

    // Seed default treasury accounts
    await sql`
      INSERT INTO accounts (id, name, type, account_number, bank_name, currency, balance, opening_balance, opening_date, branch, inter_bank_transfer_fee, card_commission_percent, color, description, is_active)
      VALUES 
      ('acc-bank-cml-lkr', 'Commercial Bank - Main Operations (LKR)', 'bank', '1000492817', 'Commercial Bank of Ceylon', 'LKR', 1250000, 1250000, '2026-08-01', 'Bandarawela Branch', 50, 2.5, '#2B5329', 'Primary operational current account for merchant settlements, payroll transfers, and supplier payments', true),
      ('acc-bank-sampath-usd', 'Sampath Bank - Foreign Currency (USD)', 'bank', '0039281940', 'Sampath Bank PLC', 'USD', 10000, 10000, '2026-08-01', 'Colombo Corporate Branch', 15, 3.0, '#1D4ED8', 'Dedicated USD account for international OTA transfers, stripe payouts and overseas wire settlements', true),
      ('acc-cash-frontdesk', 'Front Desk Cash Float & Register (LKR)', 'cash', 'REG-01', 'Front Office Reception', 'LKR', 50000, 50000, '2026-08-01', 'Hilldale Main Lobby', 0, 0, '#5A634D', 'Front desk petty cash drawer and restaurant currency float for walk-in and guest checkouts', true),
      ('acc-cash-petty', 'General Manager Petty Cash (LKR)', 'cash', 'PETTY-01', 'GM Office', 'LKR', 25000, 25000, '2026-08-01', 'Administrative Office', 0, 0, '#8C735D', 'Petty cash fund for emergency repairs, local produce purchases and direct tips/gratuity disbursement', true),
      ('acc-cc-corporate-visa', 'Commercial Bank Corporate VISA (LKR)', 'credit_card', '4111-XXXX-XXXX-8821', 'Commercial Bank of Ceylon', 'LKR', 0, 0, '2026-08-01', 'Bandarawela Branch', 0, 0, '#C25E00', 'Corporate purchasing card for OTA advertising, booking engine subscriptions, and emergency imports', true)
      ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance
    `;

    console.log('✅ Accounts & Expenses tables created and seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('? Migration failed:', err);
    process.exit(1);
  }
}

migrate();
