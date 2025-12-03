const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Find all customer payment records with optional filters
 */
async function findAll(filters = {}) {
  try {
    let query = supabase
      .from('customer_payments')
      .select('*')
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.customerEmail) {
      query = query.eq('customer_email', filters.customerEmail);
    }
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }
    if (filters.service) {
      query = query.eq('service', filters.service);
    }
    if (filters.month) {
      query = query.eq('month', filters.month);
    }
    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer payments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in findAll:', error);
    throw error;
  }
}

/**
 * Find customer payment records by customer email
 */
async function findByCustomer(customerEmail) {
  try {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_email', customerEmail)
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching customer payments by email:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in findByCustomer:', error);
    throw error;
  }
}

/**
 * Find a single customer payment record by ID
 */
async function findById(id) {
  try {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer payment by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in findById:', error);
    throw error;
  }
}

/**
 * Create a new customer payment record
 */
async function create(paymentData) {
  try {
    const { data, error } = await supabase
      .from('customer_payments')
      .insert([{
        customer_email: paymentData.customerEmail,
        month: paymentData.month,
        invoice_no: paymentData.invoiceNo,
        invoice_date: paymentData.invoiceDate,
        invoice_amount: Number(paymentData.invoiceAmount) || 0,
        total_amount: Number(paymentData.totalAmount) || 0,
        amount_due: Number(paymentData.amountDue) || 0,
        payment_received: Number(paymentData.paymentReceived) || 0,
        currency: paymentData.currency || 'USD',
        payment_status: paymentData.paymentStatus || 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer payment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in create:', error);
    throw error;
  }
}

/**
 * Update an existing customer payment record
 */
async function update(id, paymentData) {
  try {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (paymentData.customerEmail !== undefined) updateData.customer_email = paymentData.customerEmail;
    if (paymentData.month !== undefined) updateData.month = paymentData.month;
    if (paymentData.invoiceNo !== undefined) updateData.invoice_no = paymentData.invoiceNo;
    if (paymentData.invoiceDate !== undefined) updateData.invoice_date = paymentData.invoiceDate;
    if (paymentData.invoiceAmount !== undefined) updateData.invoice_amount = Number(paymentData.invoiceAmount) || 0;
    if (paymentData.totalAmount !== undefined) updateData.total_amount = Number(paymentData.totalAmount) || 0;
    if (paymentData.amountDue !== undefined) updateData.amount_due = Number(paymentData.amountDue) || 0;
    if (paymentData.paymentReceived !== undefined) updateData.payment_received = Number(paymentData.paymentReceived) || 0;
    if (paymentData.currency !== undefined) updateData.currency = paymentData.currency;
    if (paymentData.paymentStatus !== undefined) updateData.payment_status = paymentData.paymentStatus;

    const { data, error } = await supabase
      .from('customer_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer payment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in update:', error);
    throw error;
  }
}

/**
 * Delete a customer payment record
 */
async function deleteById(id) {
  try {
    const { error } = await supabase
      .from('customer_payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer payment:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteById:', error);
    throw error;
  }
}

/**
 * Bulk insert customer payment records
 */
async function bulkInsert(paymentsArray) {
  try {
    const formattedData = paymentsArray.map(payment => ({
      customer_email: payment.customerEmail,
      month: payment.month,
      invoice_no: payment.invoiceNo,
      invoice_date: payment.invoiceDate,
      invoice_amount: Number(payment.invoiceAmount) || 0,
      total_amount: Number(payment.totalAmount) || 0,
      amount_due: Number(payment.amountDue) || 0,
      payment_received: Number(payment.paymentReceived) || 0,
      currency: payment.currency || 'USD',
      payment_status: payment.paymentStatus || 'pending'
    }));

    const { data, error } = await supabase
      .from('customer_payments')
      .insert(formattedData)
      .select();

    if (error) {
      console.error('Error bulk inserting customer payments:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in bulkInsert:', error);
    throw error;
  }
}

module.exports = {
  findAll,
  findByCustomer,
  findById,
  create,
  update,
  deleteById,
  bulkInsert
};
