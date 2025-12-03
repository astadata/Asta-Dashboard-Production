-- Add Mobile Proxy service for Astitva Techlabs (sales@astitva.ai)
-- This adds a second service for the same customer with DataImpulse

INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
VALUES (
  'sales@astitva.ai',
  'vendor-dataimpulse',
  '1b7e4771-571f-44d0-a0ea-9acdd3012e43',  -- Mobile Proxy service ID
  'REPLACE_WITH_SUBUSER_ID'  -- Replace with actual subuser_id for mobile proxy
)
ON CONFLICT (customer_email, vendor_id, service_id) DO UPDATE
SET subuser_id = EXCLUDED.subuser_id;

-- Verify the mappings
SELECT 
  cvs.customer_email,
  v.name as vendor_name,
  s.name as service_name,
  cvs.subuser_id
FROM customer_vendor_services cvs
JOIN vendors v ON v.id = cvs.vendor_id
JOIN services s ON s.id = cvs.service_id
WHERE cvs.customer_email = 'sales@astitva.ai'
ORDER BY s.name;
