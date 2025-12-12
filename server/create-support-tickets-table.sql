-- Create support_tickets table for customer support system
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  vendor_id VARCHAR(255),
  vendor_name VARCHAR(255) NOT NULL,
  service_id VARCHAR(255),
  service_name VARCHAR(255) NOT NULL,
  issue_details TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on customer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Add comment to table
COMMENT ON TABLE support_tickets IS 'Support tickets submitted by customers for vendor/service issues';
