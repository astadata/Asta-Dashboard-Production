# Vendor-Service Database Mapping - Setup Guide

## Overview
This guide explains how to migrate from text-based vendor/service fields to a proper relational database structure using foreign keys.

## Database Changes

### New Tables

#### 1. `vendors` Table
Stores all vendor configurations with authentication details.

**Key Fields:**
- `id` (VARCHAR, Primary Key): e.g., `vendor-dataimpulse`
- `name`: Display name
- `slug`: URL-friendly identifier
- `enabled`: Active status
- `auth_type`, `api_base_url`, `credentials`, etc.

#### 2. `services` Table
Stores service types (Residential Proxy, Mobile Proxy, etc.).

**Key Fields:**
- `id` (UUID, Primary Key)
- `name`: Service name
- `slug`: URL-friendly identifier
- `vendor_id`: Foreign key to vendors table
- `enabled`: Active status

#### 3. `customer_vendor_services` Table (NEW)
Maps customers to their authorized vendor-service combinations.

**Key Fields:**
- `id` (UUID, Primary Key)
- `customer_email`: Foreign key to customers.email
- `vendor_id`: Foreign key to vendors.id
- `service_id`: Foreign key to services.id
- `subuser_id`: Vendor-specific subuser identifier

**Constraints:**
- Unique combination of (customer_email, vendor_id, service_id)
- Cascade deletes when customer, vendor, or service is deleted

## Setup Instructions

### Step 1: Create Base Tables

Run these SQL files in Supabase SQL Editor (in order):

```bash
1. server/create-vendors-table.sql
2. server/create-services-table.sql
```

### Step 2: Migrate Customer Data

Run the migration script:

```bash
server/migrate-customers-vendor-service-fk.sql
```

This script will:
1. Update existing `vendor_id` values to match vendor table IDs
2. Create `customer_vendor_services` mapping table
3. Migrate data from old `customers.vendor_id` and `customers.service` columns
4. Set up foreign key constraints

### Step 3: Restart Backend Server

The new API endpoints will be automatically available:

```bash
cd server
node src/index.js
```

## API Endpoints

### Vendors API

**GET `/api/vendors`**
- List all vendors from database
- Returns: Array of vendor objects with full details

**POST `/api/vendors`**
- Create new vendor
- Body: `{ id, name, slug, authType, apiBaseUrl, credentials, ... }`

**PUT `/api/vendors/:id`**
- Update vendor
- Body: Fields to update

**DELETE `/api/vendors/:id`**
- Delete vendor (cascades to services and customer mappings)

### Services API

**GET `/api/services`**
- List all services
- Query param: `?vendorId=xxx` to filter by vendor

**GET `/api/services/vendor/:vendorId`**
- Get all services for a specific vendor

**POST `/api/services`**
- Create new service
- Body: `{ name, slug, vendorId, description, enabled }`

**PUT `/api/services/:id`**
- Update service
- Body: Fields to update

**DELETE `/api/services/:id`**
- Delete service

### Customer Vendor Services API (NEW)

**GET `/api/customer-vendor-services`**
- List all customer-vendor-service mappings
- Query param: `?customerEmail=xxx` to filter by customer

**GET `/api/customer-vendor-services/customer/:email/vendor/:vendorId`**
- Get services for a specific customer-vendor combination

**POST `/api/customer-vendor-services`**
- Add new mapping
- Body: `{ customerEmail, vendorId, serviceId, subuserId }`

**PUT `/api/customer-vendor-services/:id`**
- Update mapping
- Body: Fields to update

**DELETE `/api/customer-vendor-services/:id`**
- Delete mapping

**PUT `/api/customer-vendor-services/customer/:email/mappings`**
- Bulk update all mappings for a customer
- Body: `{ mappings: [{ vendorId, serviceId, subuserId }, ...] }`

### Enhanced Customers API

**GET `/api/customers?includeVendorServices=true`**
- Get customers with their vendor-service mappings included
- Returns customers with `vendorServices` array containing vendor and service details

**GET `/api/customers?email=xxx&includeVendorServices=true`**
- Get specific customer with vendor-service mappings

## Frontend Integration

### VendorAdmin Page

The vendor admin page now supports:

1. **Multi-select Services Dropdown**
   - When editing a vendor, select multiple services to assign
   - Services are automatically associated/disassociated on save

2. **Services Display**
   - Vendors table shows assigned services as chips
   - "No services" displayed for vendors without services

3. **Database Synchronization**
   - All changes to vendors and services update the database in real-time
   - Foreign key constraints ensure data integrity

### Example: Assigning Services to Vendor

```javascript
// Frontend code (already implemented in VendorAdmin.jsx)
const handleSaveVendor = async () => {
  // Save vendor
  await fetch(`http://localhost:3030/api/vendors/${vendorId}`, {
    method: 'PUT',
    body: JSON.stringify(vendorData)
  });
  
  // Update service assignments
  await updateVendorServices(vendorId, selectedServiceIds);
};
```

### Example: Fetching Customer with Vendor-Service Data

```javascript
// Fetch customer with their authorized vendor-service combinations
const response = await fetch(
  'http://localhost:3030/api/customers?email=customer@example.com&includeVendorServices=true'
);
const customers = await response.json();

// customers[0].vendorServices will contain:
// [
//   {
//     vendor_id: 'vendor-dataimpulse',
//     service_id: 'uuid-123',
//     subuser_id: 'subuser-1',
//     vendors: { id, name, slug },
//     services: { id, name, slug }
//   }
// ]
```

## Data Migration Notes

### Before Migration
```javascript
// Old structure in customers table
{
  email: 'customer@example.com',
  vendor_id: 'dataimpulse',  // Just text
  service: 'Residential Proxy'  // Just text
}
```

### After Migration
```javascript
// New structure with relational data
// Customer table (minimal)
{
  email: 'customer@example.com',
  role: 'CUSTOMER',
  // vendor_id and service columns can be removed after migration
}

// customer_vendor_services table (mappings)
{
  customer_email: 'customer@example.com',
  vendor_id: 'vendor-dataimpulse',  // FK to vendors.id
  service_id: 'uuid-for-residential',  // FK to services.id
  subuser_id: 'subuser-1'
}
```

## Benefits

1. **Data Integrity**: Foreign keys prevent invalid vendor/service assignments
2. **Cascading Deletes**: Removing a vendor automatically cleans up related data
3. **Normalization**: No duplicate vendor/service information
4. **Flexibility**: Customers can have multiple vendor-service combinations
5. **Joins**: Easy to query customer data with full vendor/service details
6. **Admin UI**: Centralized vendor and service management

## Backward Compatibility

The system maintains backward compatibility:

- Old `customers.vendor_id` and `customers.service` columns still work
- API returns both old format and new `vendorServices` array
- Migration can be gradual - old data coexists with new structure
- Frontend can detect and use either format

## Troubleshooting

### Foreign Key Constraint Violations

If you get FK errors when migrating:

```sql
-- Check for invalid vendor_id values
SELECT DISTINCT vendor_id FROM customers 
WHERE vendor_id NOT IN (SELECT id FROM vendors);

-- Check for service mismatches
SELECT c.email, c.vendor_id, c.service 
FROM customers c
LEFT JOIN services s ON s.vendor_id = c.vendor_id AND s.name = c.service
WHERE s.id IS NULL;
```

Fix by updating customer records or adding missing vendors/services.

### Migration Failed Midway

If migration fails:

```sql
-- Rollback: Drop the new table
DROP TABLE IF EXISTS customer_vendor_services CASCADE;

-- Re-run migration after fixing data issues
```

## Production Deployment Checklist

- [ ] Backup database before migration
- [ ] Run SQL scripts in test environment first
- [ ] Verify foreign key constraints work correctly
- [ ] Test API endpoints with Postman/curl
- [ ] Update frontend to use new endpoints
- [ ] Monitor logs for errors after deployment
- [ ] Keep old vendor_id/service columns for 1-2 releases
- [ ] Remove deprecated columns after confirming stability

## Related Files

**Database:**
- `server/create-vendors-table.sql`
- `server/create-services-table.sql`
- `server/migrate-customers-vendor-service-fk.sql`

**Backend:**
- `server/src/repos/vendorsSupabase.js`
- `server/src/repos/servicesSupabase.js`
- `server/src/repos/customerVendorServicesSupabase.js`
- `server/src/routes/vendors.js`
- `server/src/routes/services.js`
- `server/src/routes/customerVendorServices.js`
- `server/src/index.js` (route registration)

**Frontend:**
- `src/app/views/admin/vendors/VendorAdmin.jsx`
