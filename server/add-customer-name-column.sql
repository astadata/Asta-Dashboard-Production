-- Add customer_name column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add index for faster searches on customer_name
CREATE INDEX IF NOT EXISTS idx_customers_customer_name ON customers(customer_name);

-- Update existing records to have a default customer_name based on email (optional)
-- UPDATE customers SET customer_name = split_part(email, '@', 1) WHERE customer_name IS NULL;
