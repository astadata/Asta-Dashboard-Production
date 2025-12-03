const express = require('express');
const router = express.Router();
const invoicesRepo = require('../repos/invoicesSupabase');

/**
 * GET /api/invoices
 * Get invoices by customer email (query param)
 * If no email provided and admin, return all invoices
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    const invoices = await invoicesRepo.getInvoicesByCustomer(email);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invoices/all
 * Get all invoices (admin only - no auth implemented yet)
 */
router.get('/all', async (req, res) => {
  try {
    const invoices = await invoicesRepo.getAllInvoices();
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invoices/:id
 * Get a single invoice by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoicesRepo.getInvoiceById(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invoices
 * Create a new invoice (admin only)
 */
router.post('/', async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Basic validation
    if (!invoiceData.customer_email || !invoiceData.invoice_number || !invoiceData.amount) {
      return res.status(400).json({ 
        error: 'Customer email, invoice number, and amount are required' 
      });
    }

    const newInvoice = await invoicesRepo.createInvoice(invoiceData);
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/invoices/:id
 * Update an existing invoice (admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceData = req.body;
    
    const updatedInvoice = await invoicesRepo.updateInvoice(id, invoiceData);
    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await invoicesRepo.deleteInvoice(id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
