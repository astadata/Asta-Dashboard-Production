-- Run this SQL in your Supabase SQL Editor
-- (Supabase Dashboard → SQL Editor → New Query → paste and run)

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'CUSTOMER',
  vendor_id TEXT NOT NULL,
  subuser_id TEXT NOT NULL,
  service TEXT NOT NULL,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create index on vendor_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_customers_vendor_id ON customers(vendor_id);

-- Optional: Add RLS policies if you want row-level security
-- For now, we'll use service_role key which bypasses RLS
-- Uncomment below if you want to enable RLS later:
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Insert a test customer (optional - remove if not needed)
INSERT INTO customers (email, role, vendor_id, subuser_id, service, password)
VALUES ('test@example.com', 'CUSTOMER', 'dataimpulse', 'test-subuser-1', 'analytics', 'demo123')
ON CONFLICT (email) DO NOTHING;

-- Verify the table was created
SELECT * FROM customers;

-- ================================================================
-- Create billing_details table
-- ================================================================
CREATE TABLE IF NOT EXISTS billing_details (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  
  -- Business Address
  business_address_line1 VARCHAR(255),
  business_address_line2 VARCHAR(255),
  business_city VARCHAR(100),
  business_state VARCHAR(100),
  business_country VARCHAR(100),
  business_postal_code VARCHAR(20),
  business_phone VARCHAR(50),
  
  -- Billing Address
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_country VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_phone VARCHAR(50),
  
  -- GST/TAX
  gst_tax_registration_no VARCHAR(100),
  
  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  primary_contact_mobile VARCHAR(50),
  primary_contact_department VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on customer_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_details_customer_email ON billing_details(customer_email);

-- Add updated_at trigger for billing_details
CREATE OR REPLACE FUNCTION update_billing_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_billing_details_updated_at
  BEFORE UPDATE ON billing_details
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_details_updated_at();

-- Verify billing_details table was created
SELECT * FROM billing_details;
