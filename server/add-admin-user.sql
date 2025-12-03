-- Add admin user to the customers table
-- This user will have ADMIN role and can access all admin pages

-- Insert admin user (will be skipped if email already exists)
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
  'admin@astadata.com',
  'AstaData Admin',
  'ADMIN',
  'Admin@123',  -- Change this to a secure password
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Verify the admin was added
SELECT 
  id,
  email,
  customer_name,
  role,
  created_at
FROM customers
WHERE email = 'admin@astadata.com';
