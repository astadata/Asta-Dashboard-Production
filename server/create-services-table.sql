-- Create services table to store service types for vendors
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  vendor_id VARCHAR(100) REFERENCES vendors(id) ON DELETE CASCADE,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique service name per vendor
  CONSTRAINT unique_vendor_service UNIQUE (vendor_id, slug)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_services_enabled ON services(enabled);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);

-- Add comment for documentation
COMMENT ON TABLE services IS 'Stores service types available for each vendor (e.g., Residential Proxy, Mobile Proxy)';

-- Insert default services for vendors
INSERT INTO services (name, slug, vendor_id, description, enabled)
VALUES 
  ('Residential Proxy', 'residential-proxy', 'vendor-dataimpulse', 'Residential proxy service', true),
  ('Mobile Proxy', 'mobile-proxy', 'vendor-dataimpulse', 'Mobile proxy service', true),
  ('Datacenter Proxy', 'datacenter-proxy', 'vendor-dataimpulse', 'Datacenter proxy service', true),
  ('Residential Proxy', 'residential-proxy', 'vendor-oxylabs', 'Residential proxy service', true),
  ('Mobile Proxy', 'mobile-proxy', 'vendor-oxylabs', 'Mobile proxy service', true),
  ('Residential Proxy', 'residential-proxy', 'vendor-brightdata', 'Residential proxy service', true),
  ('Datacenter Proxy', 'datacenter-proxy', 'vendor-brightdata', 'Datacenter proxy service', true),
  ('Residential Proxy', 'residential-proxy', 'vendor-smartproxy', 'Residential proxy service', true),
  ('Mobile Proxy', 'mobile-proxy', 'vendor-soax', 'Mobile proxy service', true)
ON CONFLICT (vendor_id, slug) DO NOTHING;
