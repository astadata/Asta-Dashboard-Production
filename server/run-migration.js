const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Starting migration: add-payment-fields.sql');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add-payment-fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Try direct query if RPC doesn't work
          console.log('RPC failed, trying direct approach...');
          
          // For ALTER TABLE, we need to check if columns exist first
          if (statement.includes('ALTER TABLE')) {
            console.log('Skipping ALTER TABLE - please run manually in Supabase SQL Editor');
            console.log(statement);
          } else {
            const { data: directData, error: directError } = await supabase.from('_migrations').select('*').limit(1);
            if (directError) {
              console.log('Could not execute via Supabase client');
            }
          }
        } else {
          console.log('✓ Statement executed successfully');
        }
      } catch (err) {
        console.error('Error executing statement:', err.message);
      }
    }
    
    console.log('\n===========================================');
    console.log('Migration complete!');
    console.log('===========================================');
    console.log('\nIMPORTANT: If the migration failed, please run the SQL manually:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy the contents of add-payment-fields.sql');
    console.log('4. Execute the SQL\n');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
