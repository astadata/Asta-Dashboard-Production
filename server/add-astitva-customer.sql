-- Add Astitva Techlabs customer to the customers table
-- This customer will be able to login and see their payment/invoice data

-- Insert customer (will be skipped if email already exists)
INSERT INTO customers (
  id,
  email,
  customer_name,
  role,
  password,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'sales@astitva.ai',
  'Astitva Techlabs',
  'CUSTOMER',
  'astitva123',  -- Change this to your desired password
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Verify the customer was added
SELECT 
  id,
  email,
  customer_name,
  role,
  created_at
FROM customers
WHERE email = 'sales@astitva.ai';

-- Check their vendor-service mappings (should already exist from populate-customer-vendor-services.sql)
SELECT 
  cvs.customer_email,
  v.name as vendor_name,
  s.name as service_name,
  cvs.subuser_id
FROM customer_vendor_services cvs
JOIN vendors v ON v.id = cvs.vendor_id
JOIN services s ON s.id = cvs.service_id
WHERE cvs.customer_email = 'sales@astitva.ai';
