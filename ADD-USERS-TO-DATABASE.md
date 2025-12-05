# Add Users to Database - Quick Guide

## ⚠️ IMPORTANT: You MUST add these users to see your dashboard!

Without these users in the database:
- ❌ Login won't work
- ❌ Dashboard will be blank
- ❌ No data will display

---

## 📝 Step-by-Step Instructions

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/vxffdngspxwhmlgfkmjm/editor

### 2. Click "New Query"

### 3. Copy and paste this ENTIRE SQL script:

```sql
-- Add Admin User
INSERT INTO customers (email, customer_name, role, password, created_at, updated_at)
VALUES (
  'admin@astadata.com', 
  'AstaData Admin', 
  'ADMIN', 
  'Admin@123',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = 'Admin@123',
  role = 'ADMIN',
  updated_at = NOW();

-- Add Customer User (Astitva)
INSERT INTO customers (email, customer_name, role, password, created_at, updated_at)
VALUES (
  'sales@astitva.ai', 
  'Astitva Techlabs', 
  'CUSTOMER', 
  'India@123',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = 'India@123',
  role = 'CUSTOMER',
  updated_at = NOW();

-- Verify users were created
SELECT email, customer_name, role, created_at FROM customers ORDER BY created_at DESC;
```

### 4. Click "Run" (or press Cmd+Enter)

You should see a success message and a table showing both users.

---

## ✅ Test Your Login

After adding users, go to your application:
https://asta-frontend-533746513056.us-central1.run.app

**Login as Admin:**
- Email: `admin@astadata.com`
- Password: `Admin@123`

**Login as Customer:**
- Email: `sales@astitva.ai`
- Password: `India@123`

---

## 🔍 If Dashboard is Still Blank

The dashboard needs vendor-service mappings. Add some test data:

```sql
-- Add a test vendor-service mapping for the customer
-- (Replace the customer_id with the actual ID from the customers table)

-- First, get the customer ID
SELECT id, email FROM customers WHERE email = 'sales@astitva.ai';

-- Then add a mapping (replace 'YOUR_CUSTOMER_ID' with the actual UUID)
INSERT INTO customer_vendor_services (customer_id, vendor_id, service_name, subuser_id, created_at)
VALUES (
  'YOUR_CUSTOMER_ID',
  'vendor-dataimpulse',
  'SMS',
  '12345',
  NOW()
);
```

---

## 📞 Need Help?

If you still see issues:
1. Check browser console for errors (F12)
2. Make sure you cleared browser cache (Cmd+Shift+R)
3. Try logging in again

The users MUST be in the database for login to work!
