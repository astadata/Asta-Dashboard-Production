-- Make vendor_id and service columns nullable in customer_payments table
-- This allows creating payment records without specifying vendor or service

ALTER TABLE customer_payments 
ALTER COLUMN vendor_id DROP NOT NULL,
ALTER COLUMN service DROP NOT NULL;

-- Also drop any old columns that are no longer needed
ALTER TABLE customer_payments 
DROP COLUMN IF EXISTS opening_balance,
DROP COLUMN IF EXISTS closing_balance,
DROP COLUMN IF EXISTS data_added;
