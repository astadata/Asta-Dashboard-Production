const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all vendor-service mappings for a customer
 */
async function getCustomerVendorServices(customerEmail) {
  const { data, error } = await supabase
    .from('customer_vendor_services')
    .select(`
      id,
      customer_email,
      vendor_id,
      service_id,
      subuser_id,
      vendors (
        id,
        name,
        slug
      ),
      services (
        id,
        name,
        slug,
        description
      )
    `)
    .eq('customer_email', customerEmail);

  if (error) throw error;
  return data;
}

/**
 * Get all customers with their vendor-service mappings
 */
async function getAllCustomerVendorServices() {
  const { data, error } = await supabase
    .from('customer_vendor_services')
    .select(`
      id,
      customer_email,
      vendor_id,
      service_id,
      subuser_id,
      vendors (
        id,
        name,
        slug
      ),
      services (
        id,
        name,
        slug,
        description
      )
    `)
    .order('customer_email', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add vendor-service mapping for a customer
 */
async function addCustomerVendorService(mappingData) {
  const { data, error } = await supabase
    .from('customer_vendor_services')
    .insert([{
      customer_email: mappingData.customerEmail || mappingData.customer_email,
      vendor_id: mappingData.vendorId || mappingData.vendor_id,
      service_id: mappingData.serviceId || mappingData.service_id,
      subuser_id: mappingData.subuserId || mappingData.subuser_id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update vendor-service mapping
 */
async function updateCustomerVendorService(id, mappingData) {
  const updateData = {};
  
  if (mappingData.vendorId !== undefined) updateData.vendor_id = mappingData.vendorId;
  if (mappingData.vendor_id !== undefined) updateData.vendor_id = mappingData.vendor_id;
  if (mappingData.serviceId !== undefined) updateData.service_id = mappingData.serviceId;
  if (mappingData.service_id !== undefined) updateData.service_id = mappingData.service_id;
  if (mappingData.subuserId !== undefined) updateData.subuser_id = mappingData.subuserId;
  if (mappingData.subuser_id !== undefined) updateData.subuser_id = mappingData.subuser_id;

  const { data, error } = await supabase
    .from('customer_vendor_services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete vendor-service mapping
 */
async function deleteCustomerVendorService(id) {
  const { error } = await supabase
    .from('customer_vendor_services')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

/**
 * Delete all mappings for a customer
 */
async function deleteAllCustomerMappings(customerEmail) {
  const { error } = await supabase
    .from('customer_vendor_services')
    .delete()
    .eq('customer_email', customerEmail);

  if (error) throw error;
  return { success: true };
}

/**
 * Bulk update customer vendor-service mappings
 * Removes old mappings and adds new ones
 */
async function updateCustomerMappings(customerEmail, mappings) {
  // Start by deleting all existing mappings
  await deleteAllCustomerMappings(customerEmail);

  // Add new mappings
  if (mappings && mappings.length > 0) {
    const { data, error } = await supabase
      .from('customer_vendor_services')
      .insert(mappings.map(m => ({
        customer_email: customerEmail,
        vendor_id: m.vendorId || m.vendor_id,
        service_id: m.serviceId || m.service_id,
        subuser_id: m.subuserId || m.subuser_id
      })))
      .select();

    if (error) throw error;
    return data;
  }

  return [];
}

/**
 * Get services by vendor for a customer
 */
async function getCustomerServicesByVendor(customerEmail, vendorId) {
  const { data, error } = await supabase
    .from('customer_vendor_services')
    .select(`
      id,
      service_id,
      subuser_id,
      services (
        id,
        name,
        slug,
        description
      )
    `)
    .eq('customer_email', customerEmail)
    .eq('vendor_id', vendorId);

  if (error) throw error;
  return data;
}

module.exports = {
  getCustomerVendorServices,
  getAllCustomerVendorServices,
  addCustomerVendorService,
  updateCustomerVendorService,
  deleteCustomerVendorService,
  deleteAllCustomerMappings,
  updateCustomerMappings,
  getCustomerServicesByVendor
};
