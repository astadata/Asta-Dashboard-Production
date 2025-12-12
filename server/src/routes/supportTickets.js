const express = require('express');
const router = express.Router();
const supportTicketsRepo = require('../repos/supportTicketsSupabase');

// Get all support tickets (admin only)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all support tickets...');
    const tickets = await supportTicketsRepo.getAllTickets();
    console.log('Found tickets:', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to fetch support tickets', details: error.message });
  }
});

// Get support tickets by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const tickets = await supportTicketsRepo.getTicketsByCustomer(customerId);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.status(500).json({ error: 'Failed to fetch customer tickets' });
  }
});

// Create a new support ticket
router.post('/', async (req, res) => {
  try {
    console.log('Received support ticket data:', req.body);
    const ticketData = req.body;
    
    // Generate ticket number
    const ticketNumber = `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newTicket = {
      ...ticketData,
      ticketNumber,
      status: ticketData.status || 'open',
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating ticket with data:', newTicket);
    const ticket = await supportTicketsRepo.createTicket(newTicket);
    console.log('Ticket created successfully:', ticket);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create support ticket', details: error.message });
  }
});

// Update ticket status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedTicket = await supportTicketsRepo.updateTicketStatus(id, status);
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Delete a support ticket
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supportTicketsRepo.deleteTicket(id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
