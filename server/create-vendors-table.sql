-- Create vendors table to store vendor configurations
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  auth_type VARCHAR(50) NOT NULL,
  token_endpoint TEXT,
  api_base_url TEXT,
  credentials JSONB,
  default_headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_enabled ON vendors(enabled);

-- Add comment for documentation
COMMENT ON TABLE vendors IS 'Stores vendor configurations including authentication details and API endpoints';

-- Insert default vendors from JSON config
INSERT INTO vendors (id, name, slug, enabled, auth_type, token_endpoint, api_base_url, credentials, default_headers)
VALUES 
  ('vendor-dataimpulse', 'Dataimpulse', 'dataimpulse', true, 'custom_token', 
   'https://api.dataimpulse.com/reseller/user/token/get', 
   'https://api.dataimpulse.com',
   '{"username": "marketplaceproxy@gmail.com", "password": "cDrdGSkCJ3JDlDxdbiMSVvF6ROKL8uZa"}'::jsonb,
   '{}'::jsonb),
  ('vendor-oxylabs', 'Oxylabs', 'oxylabs', true, 'api_key',
   null,
   'https://api.oxylabs.example',
   '{"headerName": "Authorization", "apiKey": "Bearer demo-key"}'::jsonb,
   '{}'::jsonb),
  ('vendor-brightdata', 'Bright Data', 'brightdata', true, 'api_key',
   null,
   'https://api.brightdata.example',
   '{"headerName": "Authorization", "apiKey": "Bearer demo-key"}'::jsonb,
   '{}'::jsonb),
  ('vendor-smartproxy', 'SmartProxy', 'smartproxy', true, 'api_key',
   null,
   'https://api.smartproxy.example',
   '{"headerName": "X-API-Key", "apiKey": "demo-key"}'::jsonb,
   '{}'::jsonb),
  ('vendor-soax', 'SOAX', 'soax', true, 'api_key',
   null,
   'https://api.soax.example',
   '{"headerName": "Authorization", "apiKey": "Bearer demo-key"}'::jsonb,
   '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
