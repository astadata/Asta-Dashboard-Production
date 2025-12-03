const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createCustomerRatesSupabaseRepo() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing for customer rates repo');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const rowToEntry = (row) => ({
    id: row.id,
    customerId: row.customer_id,
    vendorId: row.vendor_id,
    service: row.service,
    ratePerGb: row.rate_per_gb,
    ratePerRequest: row.rate_per_request,
    currency: row.currency || 'USD',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

  return {
    async list() {
      const { data, error } = await supabase
        .from('customer_rates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return (data || []).map(rowToEntry);
    },

    async getByCustomerId(customerId) {
      const { data, error } = await supabase
        .from('customer_rates')
        .select('*')
        .eq('customer_id', customerId);
      
      if (error) throw new Error(error.message);
      return (data || []).map(rowToEntry);
    },

    async getByCustomerAndService(customerId, vendorId, service) {
      const { data, error } = await supabase
        .from('customer_rates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('vendor_id', vendorId)
        .eq('service', service)
        .single();
      
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data ? rowToEntry(data) : null;
    },

    async addEntry({ customerId, vendorId, service, ratePerGb, ratePerRequest, currency }) {
      const { data, error } = await supabase
        .from('customer_rates')
        .insert({
          customer_id: customerId,
          vendor_id: vendorId,
          service: service,
          rate_per_gb: ratePerGb,
          rate_per_request: ratePerRequest,
          currency: currency || 'USD'
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      console.log('Customer rate entry created (supabase):', rowToEntry(data));
      return rowToEntry(data);
    },

    async updateById(id, updates) {
      const dbUpdates = {};
      if (updates.ratePerGb !== undefined) dbUpdates.rate_per_gb = updates.ratePerGb;
      if (updates.ratePerRequest !== undefined) dbUpdates.rate_per_request = updates.ratePerRequest;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('customer_rates')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return rowToEntry(data);
    },

    async deleteById(id) {
      const { error } = await supabase
        .from('customer_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return { success: true };
    }
  };
}

module.exports = createCustomerRatesSupabaseRepo;
