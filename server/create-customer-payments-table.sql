-- Create customer_payments table for storing monthly payment and invoice details
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(100) NOT NULL,
  service VARCHAR(100) NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  opening_balance DECIMAL(10, 2) DEFAULT 0.00, -- Opening data balance in GB
  closing_balance DECIMAL(10, 2) DEFAULT 0.00, -- Closing data balance in GB
  data_added DECIMAL(10, 2) DEFAULT 0.00, -- Data added during month in GB
  invoice_no VARCHAR(50),
  invoice_date DATE,
  invoice_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraint to ensure month format
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-\d{2}$'),
  
  -- Add constraint for payment status
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  
  -- Unique constraint to prevent duplicate entries for same customer, vendor, service and month
  CONSTRAINT unique_customer_vendor_service_month UNIQUE (customer_email, vendor_id, service, month)
);

-- Create indexes for faster lookups
CREATE INDEX idx_customer_payments_email ON customer_payments(customer_email);
CREATE INDEX idx_customer_payments_vendor ON customer_payments(vendor_id);
CREATE INDEX idx_customer_payments_service ON customer_payments(service);
CREATE INDEX idx_customer_payments_month ON customer_payments(month);
CREATE INDEX idx_customer_payments_status ON customer_payments(payment_status);

-- Add comment to the table
COMMENT ON TABLE customer_payments IS 'Stores monthly payment and invoice details for customers with vendor and service tracking';
