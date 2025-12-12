-- Quick check if support_tickets table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'support_tickets'
);

-- If the above returns false, run the migration:
-- Copy and paste the contents of create-support-tickets-table.sql into Supabase SQL Editor
