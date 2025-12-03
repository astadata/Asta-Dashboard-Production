-- Manually populate customer_vendor_services table with known mappings
-- This script adds the vendor-service mappings for existing customers

-- Example: Add mapping for sales@astitva.ai with DataImpulse Residential Proxy
-- You need to replace these values with actual customer mappings

-- First, let's get the service IDs we need
-- Run this to see available services:
-- SELECT id, name, vendor_id FROM services ORDER BY vendor_id, name;

-- Template for adding mappings:
-- INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
-- VALUES (
--   'customer@email.com',
--   'vendor-dataimpulse',
--   (SELECT id FROM services WHERE vendor_id = 'vendor-dataimpulse' AND name = 'Residential Proxy'),
--   'your-subuser-id'
-- );

-- Actual customer mappings:

-- sales@astitva.ai - DataImpulse Residential Proxy
INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
VALUES (
  'sales@astitva.ai',
  'vendor-dataimpulse',
  (SELECT id FROM services WHERE vendor_id = 'vendor-dataimpulse' AND name = 'Residential Proxy' LIMIT 1),
  '595045'
)
ON CONFLICT (customer_email, vendor_id, service_id) DO NOTHING;

-- Add more mappings as needed for other customers:
-- INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
-- VALUES (
--   'another@customer.com',
--   'vendor-brightdata',
--   (SELECT id FROM services WHERE vendor_id = 'vendor-brightdata' AND name = 'Datacenter Proxy' LIMIT 1),
--   'subuser-789'
-- )
-- ON CONFLICT (customer_email, vendor_id, service_id) DO NOTHING;

-- Verify the mappings
SELECT 
  cvs.customer_email,
  v.name as vendor_name,
  s.name as service_name,
  cvs.subuser_id
FROM customer_vendor_services cvs
JOIN vendors v ON v.id = cvs.vendor_id
JOIN services s ON s.id = cvs.service_id
ORDER BY cvs.customer_email;
