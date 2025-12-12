-- Fix support_tickets table to handle UUID/VARCHAR IDs instead of BIGINT

-- Drop the existing table if you want to start fresh
DROP TABLE IF EXISTS support_tickets;

-- Recreate with correct types
CREATE TABLE support_tickets (
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

-- Recreate indexes
CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Add comment
COMMENT ON TABLE support_tickets IS 'Support tickets submitted by customers for vendor/service issues';
