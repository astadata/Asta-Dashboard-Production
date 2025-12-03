# Astadata Backend Skeleton

This folder contains a minimal Node.js/Express skeleton demonstrating:

- Vendor adapter pattern
- TokenManager that caches tokens in Redis with a locking mechanism
- VendorManager that loads vendor configs and provides adapters
- Example admin routes to list vendors and trigger a fetch
- Supabase integration for customer data, rates, and billing details

## How to run (locally):

1. cd server
2. npm install
3. Start Redis locally (e.g., `redis-server`)
4. Set up environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   REDIS_URL=redis://localhost:6379
   PORT=3030
   ```
5. npm start

## Database Setup:

### Create the billing_details table in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase-setup.sql` OR `create-billing-details-table.sql`
5. Run the query

This will create the `billing_details` table with all necessary fields:
- Company information
- Business address with phone
- Billing address with phone
- GST/TAX/Registration number
- Primary contact person details (name, email, phone, mobile, department)

The table is automatically managed by the API endpoints:
- GET `/api/billing-details?email=user@example.com` - Get billing details for a customer
- POST `/api/billing-details` - Create or update billing details
- GET `/api/billing-details/all` - Get all billing details (admin)

Notes:
- The sample adapters here are minimal and intended as a starting point. Replace mock endpoints with real vendor endpoints and secure credentials (use a secrets manager and encryption in production).
- The code uses Redis to cache tokens and avoid concurrent token refreshes.
- All billing details are stored in the Supabase `billing_details` table
