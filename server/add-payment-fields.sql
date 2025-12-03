-- Add new financial fields and currency to customer_payments table

-- Add new columns if they don't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_received DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Update existing records to set default values
UPDATE customer_payments 
SET 
  total_amount = COALESCE(total_amount, 0),
  amount_due = COALESCE(amount_due, 0),
  payment_received = COALESCE(payment_received, 0),
  currency = COALESCE(currency, 'USD')
WHERE total_amount IS NULL OR amount_due IS NULL OR payment_received IS NULL OR currency IS NULL;

-- Add index on currency for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);

-- Add comments to document the fields
COMMENT ON COLUMN customer_payments.total_amount IS 'Total invoice amount for the billing period';
COMMENT ON COLUMN customer_payments.amount_due IS 'Outstanding amount yet to be paid';
COMMENT ON COLUMN customer_payments.payment_received IS 'Amount already received/paid';
COMMENT ON COLUMN customer_payments.currency IS 'Currency code (USD, EUR, GBP, INR, etc.)';
