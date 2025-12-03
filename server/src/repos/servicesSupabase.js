const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all services with optional vendor filter
 */
async function getAllServices(vendorId = null) {
  let query = supabase
    .from('services')
    .select('*')
    .order('vendor_id', { ascending: true })
    .order('name', { ascending: true });

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get service by ID
 */
async function getServiceById(id) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get services by vendor ID
 */
async function getServicesByVendor(vendorId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create new service
 */
async function createService(serviceData) {
  const { data, error } = await supabase
    .from('services')
    .insert([{
      name: serviceData.name,
      slug: serviceData.slug,
      vendor_id: serviceData.vendor_id || serviceData.vendorId,
      description: serviceData.description || '',
      enabled: serviceData.enabled !== undefined ? serviceData.enabled : true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update service
 */
async function updateService(id, serviceData) {
  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (serviceData.name !== undefined) updateData.name = serviceData.name;
  if (serviceData.slug !== undefined) updateData.slug = serviceData.slug;
  if (serviceData.vendor_id !== undefined) updateData.vendor_id = serviceData.vendor_id;
  if (serviceData.vendorId !== undefined) updateData.vendor_id = serviceData.vendorId;
  if (serviceData.description !== undefined) updateData.description = serviceData.description;
  if (serviceData.enabled !== undefined) updateData.enabled = serviceData.enabled;

  const { data, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete service
 */
async function deleteService(id) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

/**
 * Get enabled services only
 */
async function getEnabledServices(vendorId = null) {
  let query = supabase
    .from('services')
    .select('*')
    .eq('enabled', true)
    .order('name', { ascending: true });

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = {
  getAllServices,
  getServiceById,
  getServicesByVendor,
  createService,
  updateService,
  deleteService,
  getEnabledServices
};
