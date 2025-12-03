-- Create customer_rates table
CREATE TABLE IF NOT EXISTS customer_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,
  service TEXT NOT NULL,
  rate_per_gb DECIMAL(10, 4) NOT NULL,
  rate_per_request DECIMAL(10, 6),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id, service)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_rates_customer_id ON customer_rates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_rates_vendor_service ON customer_rates(vendor_id, service);
