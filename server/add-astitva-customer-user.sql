-- Add Astitva customer user to the database
-- Password: India@123

INSERT INTO customers (id, email, customer_name, role, password, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'sales@astitva.ai', 
  'Astitva Techlabs', 
  'CUSTOMER', 
  'India@123', 
  NOW(), 
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  customer_name = 'Astitva Techlabs',
  password = 'India@123',
  role = 'CUSTOMER',
  updated_at = NOW();

-- Verify the user was created
SELECT id, email, customer_name, role, created_at FROM customers WHERE email = 'sales@astitva.ai';
