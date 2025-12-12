# Support Tickets Setup

## Database Setup

To enable the support tickets feature, you need to create the `support_tickets` table in your Supabase database.

### Run the SQL Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `create-support-tickets-table.sql`

Or use the command line:

```bash
cd server
psql $DATABASE_URL < create-support-tickets-table.sql
```

## Features

### For Customers
- Access via "Chat Support" menu item (below Services)
- Can only select vendors and services assigned to their account
- Submit support tickets with issue details
- Get ticket reference number upon submission

### For Admins
- View all support tickets from all customers
- See ticket details including:
  - Ticket number
  - Customer information
  - Vendor and service
  - Issue details
  - Status (open, in_progress, resolved)
  - Creation date/time
- Click to view full ticket details
- Filter and sort tickets

## API Endpoints

- `GET /api/support-tickets` - Get all tickets (admin only)
- `GET /api/support-tickets/customer/:customerId` - Get tickets by customer
- `POST /api/support-tickets` - Create new ticket
- `PATCH /api/support-tickets/:id/status` - Update ticket status
- `DELETE /api/support-tickets/:id` - Delete ticket

## Ticket Statuses

- `open` - New ticket, not yet addressed
- `in_progress` - Being worked on
- `resolved` - Issue resolved

## Security Notes

- Customers can only see vendors/services from their dashboard
- Admin role required to view all tickets
- Ticket creation requires authentication
