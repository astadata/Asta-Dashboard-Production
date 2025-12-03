# Production Setup Guide - User Authentication & Data Access

## Issues Fixed

1. ✅ **API URLs**: Changed all hardcoded `localhost:3030` to use `VITE_API_URL` environment variable
2. ✅ **Authentication**: Fixed FirebaseAuthContext to work in production by using correct API URL
3. ✅ **Customer Database Auth**: Enabled customer authentication from Supabase database (not just Firebase)

## Critical: Run These SQL Scripts in Supabase

You need to add users to your Supabase database. Go to your Supabase Dashboard → SQL Editor and run these scripts:

### Step 1: Add Admin User

```sql
-- Run this in Supabase SQL Editor
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
  'Admin@123',  -- CHANGE THIS PASSWORD!
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  updated_at = NOW();
```

### Step 2: Add Astitva Customer

```sql
-- Run this in Supabase SQL Editor
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
  'astitva123',  -- CHANGE THIS PASSWORD!
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  updated_at = NOW();
```

### Step 3: Verify Customer-Vendor Mapping Exists

```sql
-- Check if astitva.ai has vendor/service mappings
SELECT 
  cvs.customer_email,
  v.name as vendor_name,
  s.name as service_name,
  cvs.subuser_id
FROM customer_vendor_services cvs
JOIN vendors v ON v.id = cvs.vendor_id
JOIN services s ON s.id = cvs.service_id
WHERE cvs.customer_email = 'sales@astitva.ai';
```

If the query returns no results, you need to run the mapping script:

```sql
-- Add DataImpulse Residential Proxy mapping for Astitva
INSERT INTO customer_vendor_services (customer_email, vendor_id, service_id, subuser_id)
VALUES (
  'sales@astitva.ai',
  'vendor-dataimpulse',
  (SELECT id FROM services WHERE vendor_id = 'vendor-dataimpulse' AND name = 'Residential Proxy' LIMIT 1),
  '595045'
)
ON CONFLICT (customer_email, vendor_id, service_id) DO NOTHING;
```

## How Authentication Now Works

### For Admin Users (role: 'ADMIN' or 'SA')
- Login with email: `admin@astadata.com` (or the email you set in Step 1)
- Password: Whatever you set in the SQL script
- Will see all admin menu items:
  - ASTADATA ADMIN section
  - Vendor Admin
  - Customer dropdown (Add/Edit Customer, Customer Rates, Customer Billing Details)
  - Payment/Invoice Details (with access to all customers)

### For Customer Users (role: 'CUSTOMER')
- Login with email: `sales@astitva.ai` (or the email you set in Step 2)
- Password: Whatever you set in the SQL script
- Will see:
  - Dashboard
  - Payment/Invoice Details (only their own data)
  - Vendors
  - Services

### Special Admin Bypass (Works in both dev and production)
- Email: `sales@astadata.com`
- Password: `Astadata@123`
- This is hardcoded in the app for admin testing

## Navigation Visibility Rules

The sidebar navigation uses role-based access control:

```javascript
// Items with auth array are only shown to matching roles
{ name: "Vendor Admin", auth: ["SA", "ADMIN"] }  // Only SA and ADMIN see this
{ name: "Payment Details", auth: ["CUSTOMER"] }   // Only CUSTOMER sees this
{ name: "Vendors", auth: ["SA", "ADMIN", "EDITOR", "GUEST"] }  // Multiple roles
```

## Testing Checklist

### After running SQL scripts and Netlify redeploys:

1. **Test Admin Login**:
   - Go to your Netlify URL
   - Login with admin credentials
   - Verify you see "ASTADATA ADMIN" section in sidebar
   - Verify you can access Vendor Admin, Customer pages

2. **Test Customer Login**:
   - Logout
   - Login with sales@astitva.ai credentials
   - Verify you see Payment/Invoice Details
   - Verify you DON'T see admin sections

3. **Test Data Loading**:
   - As customer, go to Payment/Invoice Details
   - Should see data for astitva.ai
   - Check browser console (F12) for any API errors
   - Verify API calls go to your Render URL (not localhost)

## Troubleshooting

### "No data available"
- Check: Did you run the SQL scripts in Supabase?
- Check: Does the customer_vendor_services table have a mapping for the customer?
- Check: In browser console, verify API calls are going to Render URL (not localhost)
- Check: In Render logs, verify backend received the request

### "Admin menu not showing"
- Check: User role in database should be 'ADMIN' or 'SA'
- Check: Browser localStorage → Should have 'userRole' = 'ADMIN'
- Try: Logout and login again to refresh role

### API calls failing
- Check: VITE_API_URL in Netlify environment variables
- Check: Render backend is running (visit backend URL/health)
- Check: Browser console for CORS errors

## Database Schema Required

Make sure these tables exist in Supabase:

1. **customers** - User accounts with authentication
2. **customer_vendor_services** - Customer-to-vendor-service mappings
3. **vendors** - Vendor definitions
4. **services** - Service definitions per vendor
5. **customer_payments** - Payment/invoice records
6. **billing_details** - Billing information per customer
7. **customer_rates** - Custom pricing per customer

## Files Changed in This Fix

1. **FirebaseAuthContext.jsx** - Uses VITE_API_URL, allows database authentication
2. **CustomerBillingDetails.jsx** - Uses VITE_API_URL
3. **CustomerPayments.jsx** - Uses VITE_API_URL
4. **VendorAdmin.jsx** - Uses VITE_API_URL

## SQL Scripts Available

Located in `/server/` directory:
- `add-admin-user.sql` - Add admin account
- `add-astitva-customer.sql` - Add Astitva customer account
- `populate-customer-vendor-services.sql` - Add vendor/service mappings
- `add-payment-fields.sql` - Add payment fields to table
- `make-vendor-service-optional.sql` - Make vendor/service nullable

Run these in Supabase SQL Editor in order.
