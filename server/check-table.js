require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function checkTable() {
  try {
    console.log('Checking if billing_details table exists...');
    const { data, error } = await supabase
      .from('billing_details')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table does not exist or error:', error.message);
      console.log('\nPlease run the SQL from create-billing-details-table.sql in Supabase SQL Editor');
      console.log('URL: https://vfgoysnyxknvfaeemuxz.supabase.co/project/vfgoysnyxknvfaeemuxz/sql/new');
    } else {
      console.log('✓ Table exists!');
      console.log('Current row count:', data.length);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTable();
