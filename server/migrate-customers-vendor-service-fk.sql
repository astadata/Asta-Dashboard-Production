-- Migration: Add foreign key constraints to customers table for vendor_id and service
-- This ensures data integrity and enables cascading updates/deletes

-- Step 1: First, ensure vendors and services tables exist
-- (Run create-vendors-table.sql and create-services-table.sql first if not done)

-- Step 2: Consolidate customers table - one row per email
-- Since one customer can have multiple vendor-service combinations,
-- we'll keep customer base info in customers table and move vendor-service mappings
-- to customer_vendor_services table

-- Step 2a: First, remove NOT NULL constraints from vendor_id, service, and subuser_id
ALTER TABLE customers ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN service DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN subuser_id DROP NOT NULL;

-- Step 2b: Create a temporary table with unique customer base information
CREATE TEMP TABLE customers_consolidated AS
SELECT DISTINCT ON (email)
    id,
    email,
    role,
    password,
    customer_name,
    created_at,
    updated_at
FROM customers
ORDER BY email, created_at DESC; -- Keep the most recent record for each email

-- Step 2c: Store all vendor-service combinations before modifying customers table
CREATE TEMP TABLE customer_mappings_backup AS
SELECT 
    email,
    vendor_id,
    service,
    subuser_id
FROM customers;

-- Step 2d: Clear customers table and insert consolidated records
TRUNCATE customers CASCADE;

INSERT INTO customers (id, email, role, password, customer_name, created_at, updated_at)
SELECT id, email, role, password, customer_name, created_at, updated_at
FROM customers_consolidated;

-- Step 2e: Add UNIQUE constraint on email (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_email_key' 
        AND conrelid = 'customers'::regclass
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);
    END IF;
END $$;

-- Step 3: Update existing vendor_id values in the backup table to match vendor table IDs
-- Note: We update the backup table, not the customers table since customers is now consolidated
UPDATE customer_mappings_backup SET vendor_id = 'vendor-dataimpulse' WHERE vendor_id = 'dataimpulse';
UPDATE customer_mappings_backup SET vendor_id = 'vendor-oxylabs' WHERE vendor_id = 'oxylabs';
UPDATE customer_mappings_backup SET vendor_id = 'vendor-brightdata' WHERE vendor_id = 'brightdata';
UPDATE customer_mappings_backup SET vendor_id = 'vendor-smartproxy' WHERE vendor_id = 'smartproxy';
UPDATE customer_mappings_backup SET vendor_id = 'vendor-soax' WHERE vendor_id = 'soax';

-- Step 4: Create a services mapping table for customers (many-to-many relationship)
-- Since a customer can have multiple services from different vendors
CREATE TABLE IF NOT EXISTS customer_vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL REFERENCES customers(email) ON DELETE CASCADE,
  vendor_id VARCHAR(100) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  subuser_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a customer can't have duplicate vendor-service combinations
  CONSTRAINT unique_customer_vendor_service UNIQUE (customer_email, vendor_id, service_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cvs_customer_email ON customer_vendor_services(customer_email);
CREATE INDEX IF NOT EXISTS idx_cvs_vendor_id ON customer_vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_cvs_service_id ON customer_vendor_services(service_id);

-- Step 5: Migrate vendor-service mappings from backup to customer_vendor_services
-- This preserves ALL vendor-service combinations for each customer
INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
SELECT DISTINCT
  cmb.email,
  cmb.vendor_id,
  s.id as service_id,
  cmb.subuser_id
FROM customer_mappings_backup cmb
JOIN services s ON s.vendor_id = cmb.vendor_id AND s.name = cmb.service
WHERE s.id IS NOT NULL
ON CONFLICT (customer_email, vendor_id, service_id) DO NOTHING;

-- Clean up temporary tables
DROP TABLE IF EXISTS customers_consolidated;
DROP TABLE IF EXISTS customer_mappings_backup;

-- Step 6: Optional - You can now remove the old vendor_id and service columns from customers
-- (Keep them for now if you want a transition period)
-- ALTER TABLE customers DROP COLUMN vendor_id;
-- ALTER TABLE customers DROP COLUMN service;
-- ALTER TABLE customers DROP COLUMN subuser_id;

-- Step 7: Add comment for documentation
COMMENT ON TABLE customer_vendor_services IS 'Maps customers to their authorized vendor-service combinations';

-- Verify the migration
SELECT 
  cvs.customer_email,
  v.name as vendor_name,
  s.name as service_name,
  cvs.subuser_id
FROM customer_vendor_services cvs
JOIN vendors v ON v.id = cvs.vendor_id
JOIN services s ON s.id = cvs.service_id
ORDER BY cvs.customer_email;
