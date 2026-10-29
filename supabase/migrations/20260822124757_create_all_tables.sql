/*
# Create MANOJ AI ERP Schema - All Tables

1. Purpose
   This migration creates the complete enterprise Order-to-Cash database schema for MANOJ AI.
   It models a multi-agent AI orchestration platform that processes sales orders through
   validation, inventory, invoicing, and risk assessment agents.

2. New Tables (12 total)
   - customers: 20 company profiles with credit scores, payment histories, and status
   - products: 30 product catalog entries with SKUs, categories, and pricing
   - inventory: real-time stock levels linked to products, with reserved quantities
   - orders: 20 sales orders with workflow status tracking
   - order_items: line items for each order (product, quantity, unit price)
   - invoices: generated invoices with tax calculations and payment status
   - risk_reports: payment risk assessments with deterministic scores and AI explanations
   - payments: payment records tracking amounts, methods, and due dates
   - shipments: fulfillment tracking with carrier and delivery info
   - agent_logs: audit trail of every agent handoff with JSON payloads
   - system_events: system-level events for monitoring and alerting
   - settings: configurable system parameters (tax rate, risk thresholds, retry limits)

3. Relationships
   - orders → customers (many-to-one)
   - order_items → orders, products (many-to-one each)
   - invoices → orders (one-to-one)
   - risk_reports → orders, customers (many-to-one each)
   - payments → orders, invoices (many-to-one each)
   - shipments → orders (one-to-one)
   - agent_logs → orders (many-to-one)
   - inventory → products (one-to-one)

4. Security
   - Row Level Security enabled on ALL tables.
   - Single-tenant app (no sign-in): policies allow anon + authenticated full CRUD
     because all data is intentionally shared/public for this demo ERP.
   - No user_id columns or auth.uid() checks — this is a shared demo dataset.
*/

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  country text DEFAULT 'United States',
  tax_id text,
  credit_score integer NOT NULL DEFAULT 700,
  payment_terms_days integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'active',
  total_orders integer NOT NULL DEFAULT 0,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0,
  outstanding_balance numeric(12,2) NOT NULL DEFAULT 0,
  late_payment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  min_order_qty integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse text NOT NULL DEFAULT 'Main Warehouse',
  quantity_on_hand integer NOT NULL DEFAULT 0,
  quantity_reserved integer NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 10,
  last_restock_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  final_decision text,
  risk_level text,
  exception_type text,
  exception_details jsonb,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0,
  fulfilled_quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.0875,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);

-- ============================================================
-- RISK REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  credit_score integer NOT NULL DEFAULT 700,
  late_payment_count integer NOT NULL DEFAULT 0,
  outstanding_balance numeric(12,2) NOT NULL DEFAULT 0,
  order_value numeric(12,2) NOT NULL DEFAULT 0,
  explanation text,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_risk_reports_order ON risk_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_risk_reports_customer ON risk_reports(customer_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text,
  status text NOT NULL DEFAULT 'pending',
  payment_date date,
  due_date date,
  reference_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- ============================================================
-- SHIPMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier text,
  tracking_number text,
  shipping_address text,
  status text NOT NULL DEFAULT 'pending',
  shipped_date date,
  estimated_delivery date,
  delivered_date date,
  items jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

-- ============================================================
-- AGENT LOGS (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  from_agent text,
  to_agent text,
  status text NOT NULL DEFAULT 'started',
  confidence integer NOT NULL DEFAULT 100,
  message text,
  payload jsonb,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_logs_order ON agent_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);

-- ============================================================
-- SYSTEM EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES (Single-tenant: anon + authenticated)
-- All tables allow full CRUD for anon and authenticated roles
-- because this is a shared demo ERP with no user accounts.
-- ============================================================

-- Helper: create 4 CRUD policies for a table
-- We use a DO block to apply them uniformly

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'customers', 'products', 'inventory', 'orders', 'order_items',
    'invoices', 'risk_reports', 'payments', 'shipments',
    'agent_logs', 'system_events', 'settings'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true);', t || '_select', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', t || '_insert', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t || '_update', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true);', t || '_delete', t);
  END LOOP;
END $$;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'customers', 'products', 'inventory', 'orders',
    'invoices', 'payments', 'shipments', 'settings'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', 'trg_' || t || '_updated', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', 'trg_' || t || '_updated', t);
  END LOOP;
END $$;
