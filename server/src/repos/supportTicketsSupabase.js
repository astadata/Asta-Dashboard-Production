const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAME = 'support_tickets';

// Get all support tickets
async function getAllTickets() {
  console.log('Querying Supabase for all tickets from table:', TABLE_NAME);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
  
  console.log('Raw data from Supabase:', data);
  
  // Transform snake_case to camelCase
  return data.map(ticket => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    customerId: ticket.customer_id,
    customerEmail: ticket.customer_email,
    customerName: ticket.customer_name,
    vendorId: ticket.vendor_id,
    vendorName: ticket.vendor_name,
    serviceId: ticket.service_id,
    serviceName: ticket.service_name,
    issueDetails: ticket.issue_details,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at
  }));
}

// Get tickets by customer
async function getTicketsByCustomer(customerId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false});
  
  if (error) throw error;
  
  // Transform snake_case to camelCase
  return data.map(ticket => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    customerId: ticket.customer_id,
    customerEmail: ticket.customer_email,
    customerName: ticket.customer_name,
    vendorId: ticket.vendor_id,
    vendorName: ticket.vendor_name,
    serviceId: ticket.service_id,
    serviceName: ticket.service_name,
    issueDetails: ticket.issue_details,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at
  }));
}

// Create a new support ticket
async function createTicket(ticketData) {
  console.log('Inserting ticket into Supabase:', ticketData);
  
  const insertData = {
    ticket_number: ticketData.ticketNumber,
    customer_id: ticketData.customerId,
    customer_email: ticketData.customerEmail,
    customer_name: ticketData.customerName,
    vendor_id: ticketData.vendorId,
    vendor_name: ticketData.vendorName,
    service_id: ticketData.serviceId,
    service_name: ticketData.serviceName,
    issue_details: ticketData.issueDetails,
    status: ticketData.status,
    created_at: ticketData.createdAt
  };
  
  console.log('Insert data:', insertData);
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([insertData])
    .select()
    .single();
  
  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  
  console.log('Supabase insert result:', data);
  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    customerId: data.customer_id,
    customerEmail: data.customer_email,
    customerName: data.customer_name,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    serviceId: data.service_id,
    serviceName: data.service_name,
    issueDetails: data.issue_details,
    status: data.status,
    createdAt: data.created_at
  };
}

// Update ticket status
async function updateTicketStatus(id, status) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    status: data.status,
    updatedAt: data.updated_at
  };
}

// Delete a ticket
async function deleteTicket(id) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

module.exports = {
  getAllTickets,
  getTicketsByCustomer,
  createTicket,
  updateTicketStatus,
  deleteTicket
};
