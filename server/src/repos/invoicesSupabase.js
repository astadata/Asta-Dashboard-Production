const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not set for invoices — repo will be inactive');
}

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

/**
 * Get all invoices for a customer
 */
async function getInvoicesByCustomer(customerEmail) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_email', customerEmail)
    .order('invoice_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single invoice by ID
 */
async function getInvoiceById(invoiceId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Create a new invoice
 */
async function createInvoice(invoiceData) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing invoice
 */
async function updateInvoice(invoiceId, invoiceData) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an invoice
 */
async function deleteInvoice(invoiceId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
  return true;
}

/**
 * Get all invoices (admin only)
 */
async function getAllInvoices() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('invoice_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

module.exports = {
  getInvoicesByCustomer,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getAllInvoices
};
