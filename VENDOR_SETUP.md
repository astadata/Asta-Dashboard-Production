# Vendor and Services Management - Database Setup

## Overview
This document explains how to set up the vendors and services database tables in Supabase to enable admin functionality for managing vendors and services.

## Database Tables

### 1. Vendors Table
Stores vendor configurations including authentication details and API endpoints.

**File:** `server/create-vendors-table.sql`

**Run this SQL in your Supabase SQL Editor:**
```sql
-- See server/create-vendors-table.sql for the complete schema
```

**Columns:**
- `id` (VARCHAR, Primary Key): Unique vendor identifier (e.g., vendor-dataimpulse)
- `name` (VARCHAR): Display name of the vendor
- `slug` (VARCHAR, Unique): URL-friendly identifier
- `enabled` (BOOLEAN): Whether vendor is active
- `auth_type` (VARCHAR): Authentication type (api_key, custom_token, basic)
- `token_endpoint` (TEXT): Optional token generation endpoint
- `api_base_url` (TEXT): Base URL for API calls
- `credentials` (JSONB): Authentication credentials (API keys, username/password, etc.)
- `default_headers` (JSONB): Default HTTP headers for API requests
- `created_at`, `updated_at` (TIMESTAMP): Audit fields

### 2. Services Table
Stores service types available for each vendor (e.g., Residential Proxy, Mobile Proxy).

**File:** `server/create-services-table.sql`

**Run this SQL in your Supabase SQL Editor:**
```sql
-- See server/create-services-table.sql for the complete schema
```

**Columns:**
- `id` (UUID, Primary Key): Unique service identifier
- `name` (VARCHAR): Service name (e.g., Residential Proxy)
- `slug` (VARCHAR): URL-friendly identifier
- `vendor_id` (VARCHAR, Foreign Key): References vendors(id)
- `description` (TEXT): Service description
- `enabled` (BOOLEAN): Whether service is active
- `created_at`, `updated_at` (TIMESTAMP): Audit fields

**Constraint:** Each vendor can only have one service with a given slug (unique vendor_id + slug).

## Setup Instructions

### Step 1: Create Tables in Supabase

1. Log in to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Create a new query
4. Copy the contents of `server/create-vendors-table.sql`
5. Execute the query
6. Create another new query
7. Copy the contents of `server/create-services-table.sql`
8. Execute the query

### Step 2: Verify Table Creation

Run this query to verify the tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vendors', 'services');
```

### Step 3: Check Default Data

The SQL scripts include default vendor and service data. Verify it was inserted:

```sql
-- Check vendors
SELECT id, name, enabled FROM vendors;

-- Check services
SELECT name, vendor_id, enabled FROM services;
```

## API Endpoints

Once the database is set up, the following API endpoints are available:

### Vendors
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get single vendor
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Services
- `GET /api/services` - List all services
- `GET /api/services?vendorId=xxx` - List services for a vendor
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

## Frontend Usage

### Accessing Vendor Admin Page

1. Log in as an admin user (role: SA or ADMIN)
2. Navigate to the **Vendor Admin** page from the menu
3. You will see:
   - **Configured Vendors** section with:
     - List of all vendors
     - "Add Vendor" button to create new vendors
     - Edit/Delete icons for each vendor
     - Fetch Usage/Raw buttons for testing API calls
   - **Services** section with:
     - List of all services grouped by vendor
     - "Add Service" button to create new services
     - Edit/Delete icons for each service

### Adding a New Vendor

1. Click **"Add Vendor"** button
2. Fill in the form:
   - **Vendor ID**: Unique identifier (e.g., `vendor-newproxy`)
   - **Name**: Display name (e.g., `New Proxy Provider`)
   - **Slug**: URL-friendly name (e.g., `newproxy`)
   - **Auth Type**: Select authentication method
   - **API Base URL**: Base endpoint URL
   - **Token Endpoint**: Optional token generation URL
   - **Credentials**: JSON object with auth details
   - **Default Headers**: JSON object with HTTP headers
   - **Enabled**: Toggle to activate/deactivate
3. Click **"Create"**

### Adding a New Service

1. Click **"Add Service"** button
2. Fill in the form:
   - **Service Name**: Display name (e.g., `Residential Proxy`)
   - **Slug**: URL-friendly name (e.g., `residential-proxy`)
   - **Vendor**: Select the parent vendor
   - **Description**: Optional service description
   - **Enabled**: Toggle to activate/deactivate
3. Click **"Create"**

### Editing Vendors/Services

1. Click the **Edit** icon (pencil) next to any vendor or service
2. Modify the fields
3. Click **"Update"**

### Deleting Vendors/Services

1. Click the **Delete** icon (trash) next to any vendor or service
2. Confirm the deletion
3. **Note**: Deleting a vendor will also delete all its associated services (CASCADE)

## Data Format Examples

### Vendor Credentials JSON
```json
{
  "apiKey": "your-api-key-here",
  "headerName": "Authorization"
}
```

or for custom token:
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

### Default Headers JSON
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

## Migration from JSON Config

The system previously used `server/src/config/vendors.json` for vendor configuration. The SQL scripts automatically migrate this data to the database. After verification:

1. The API now reads from the database instead of JSON
2. The JSON file can be kept as a backup
3. All new vendors/services should be added via the admin UI

## Troubleshooting

### Tables not showing in Supabase
- Ensure you're in the correct project
- Check the **Table Editor** in Supabase dashboard
- Verify SQL execution completed without errors

### API returning empty arrays
- Check that the SQL INSERT statements executed successfully
- Verify Supabase connection in `.env` file:
  ```
  SUPABASE_URL=your-project-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### Cannot create vendor/service
- Check browser console for errors
- Verify the API server is running on port 3030
- Check server logs for error messages
- Ensure JSONB fields contain valid JSON

## Security Notes

- Vendor credentials are stored in JSONB format in the database
- Use Supabase RLS (Row Level Security) policies if needed
- Service role key is required for admin operations
- Never expose service role key in frontend code

## Related Files

- `server/create-vendors-table.sql` - Vendors table schema
- `server/create-services-table.sql` - Services table schema
- `server/src/repos/vendorsSupabase.js` - Vendors repository
- `server/src/repos/servicesSupabase.js` - Services repository
- `server/src/routes/vendors.js` - Vendors API routes
- `server/src/routes/services.js` - Services API routes
- `src/app/views/admin/vendors/VendorAdmin.jsx` - Admin UI
