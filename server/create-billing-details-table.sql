-- Create billing_details table
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

-- Add updated_at trigger
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
