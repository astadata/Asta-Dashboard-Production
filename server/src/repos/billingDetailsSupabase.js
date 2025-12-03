const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not set for billing_details — repo will be inactive');
}

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

/**
 * Get billing details for a customer
 */
async function getBillingDetails(customerEmail) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('billing_details')
    .select('*')
    .eq('customer_email', customerEmail)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Create or update billing details for a customer
 */
async function upsertBillingDetails(billingData) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('billing_details')
    .upsert(billingData, { onConflict: 'customer_email' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all billing details (admin only)
 */
async function getAllBillingDetails() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('billing_details')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  getBillingDetails,
  upsertBillingDetails,
  getAllBillingDetails
};
