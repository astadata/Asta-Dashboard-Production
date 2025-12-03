const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // don't throw here to allow server to start without supabase configured
  console.warn('Supabase credentials not set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — Supabase repo will be inactive');
}

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

function rowToEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    customerName: row.customer_name || row.customerName,
    role: row.role,
    vendorId: row.vendor_id || row.vendorId,
    subuserId: row.subuser_id || row.subuserId,
    service: row.service,
    password: row.password,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = function createCustomersSupabaseRepo() {
  if (!supabase) {
    return null;
  }

  async function listAll() {
    const { data, error } = await supabase.from('customers').select('*').order('email', { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToEntry);
  }

  async function listAllWithVendorServices() {
    // Get all customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .order('email', { ascending: true });
    
    if (customerError) throw customerError;

    // Get vendor-service mappings for all customers
    const { data: mappings, error: mappingsError } = await supabase
      .from('customer_vendor_services')
      .select(`
        customer_email,
        vendor_id,
        service_id,
        subuser_id,
        vendors (id, name, slug),
        services (id, name, slug)
      `);

    if (mappingsError) {
      // If table doesn't exist yet, return customers with legacy data
      return customers.map(rowToEntry);
    }

    // Combine customers with their mappings
    return customers.map(customer => {
      const customerMappings = mappings.filter(m => m.customer_email === customer.email);
      return {
        ...rowToEntry(customer),
        vendorServices: customerMappings
      };
    });
  }

  async function findByEmail(email) {
    const { data, error } = await supabase.from('customers').select('*').eq('email', email);
    if (error) throw error;
    return (data || []).map(rowToEntry);
  }

  async function findByEmailWithVendorServices(email) {
    // Get customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email);
    
    if (customerError) throw customerError;
    if (!customers || customers.length === 0) return [];

    // Get vendor-service mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('customer_vendor_services')
      .select(`
        customer_email,
        vendor_id,
        service_id,
        subuser_id,
        vendors (id, name, slug),
        services (id, name, slug)
      `)
      .eq('customer_email', email);

    if (mappingsError) {
      // If table doesn't exist yet, return customer with legacy data
      return customers.map(rowToEntry);
    }

    return customers.map(customer => ({
      ...rowToEntry(customer),
      vendorServices: mappings || []
    }));
  }

  async function addEntry({ email, customerName, role = 'CUSTOMER', vendorId, subuserId, service, password }) {
    const payload = {
      email,
      customer_name: customerName,
      role,
      vendor_id: vendorId,
      subuser_id: subuserId,
      service,
      password
    };
    const { data, error } = await supabase.from('customers').insert(payload).select().single();
    if (error) throw error;
    return rowToEntry(data);
  }

  async function deleteById(id) {
    const { data, error } = await supabase.from('customers').delete().eq('id', id).select().single();
    if (error) throw error;
    return rowToEntry(data);
  }

  async function updateById(id, patch) {
    const payload = {};
    if (patch.email !== undefined) payload.email = patch.email;
    if (patch.customerName !== undefined) payload.customer_name = patch.customerName;
    if (patch.role !== undefined) payload.role = patch.role;
    if (patch.vendorId !== undefined) payload.vendor_id = patch.vendorId;
    if (patch.subuserId !== undefined) payload.subuser_id = patch.subuserId;
    if (patch.service !== undefined) payload.service = patch.service;
    if (patch.password !== undefined) payload.password = patch.password;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return rowToEntry(data);
  }

  return { 
    listAll, 
    listAllWithVendorServices,
    findByEmail, 
    findByEmailWithVendorServices,
    addEntry, 
    deleteById, 
    updateById 
  };
};

