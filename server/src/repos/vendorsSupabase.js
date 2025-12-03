const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all vendors
 */
async function getAllVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get vendor by ID
 */
async function getVendorById(id) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new vendor
 */
async function createVendor(vendorData) {
  const { data, error } = await supabase
    .from('vendors')
    .insert([{
      id: vendorData.id,
      name: vendorData.name,
      slug: vendorData.slug,
      enabled: vendorData.enabled !== undefined ? vendorData.enabled : true,
      auth_type: vendorData.auth_type || vendorData.authType,
      token_endpoint: vendorData.token_endpoint || vendorData.tokenEndpoint,
      api_base_url: vendorData.api_base_url || vendorData.apiBaseUrl,
      credentials: vendorData.credentials || {},
      default_headers: vendorData.default_headers || vendorData.defaultHeaders || {}
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update vendor
 */
async function updateVendor(id, vendorData) {
  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (vendorData.name !== undefined) updateData.name = vendorData.name;
  if (vendorData.slug !== undefined) updateData.slug = vendorData.slug;
  if (vendorData.enabled !== undefined) updateData.enabled = vendorData.enabled;
  if (vendorData.auth_type !== undefined) updateData.auth_type = vendorData.auth_type;
  if (vendorData.authType !== undefined) updateData.auth_type = vendorData.authType;
  if (vendorData.token_endpoint !== undefined) updateData.token_endpoint = vendorData.token_endpoint;
  if (vendorData.tokenEndpoint !== undefined) updateData.token_endpoint = vendorData.tokenEndpoint;
  if (vendorData.api_base_url !== undefined) updateData.api_base_url = vendorData.api_base_url;
  if (vendorData.apiBaseUrl !== undefined) updateData.api_base_url = vendorData.apiBaseUrl;
  if (vendorData.credentials !== undefined) updateData.credentials = vendorData.credentials;
  if (vendorData.default_headers !== undefined) updateData.default_headers = vendorData.default_headers;
  if (vendorData.defaultHeaders !== undefined) updateData.default_headers = vendorData.defaultHeaders;

  const { data, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete vendor
 */
async function deleteVendor(id) {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

/**
 * Get enabled vendors only
 */
async function getEnabledVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('enabled', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getEnabledVendors
};
