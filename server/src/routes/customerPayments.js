const express = require('express');
const customerPaymentsRepo = require('../repos/customerPaymentsSupabase');

const router = express.Router();

/**
 * GET /api/customer-payments
 * Get all customer payment records with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.customerEmail) filters.customerEmail = req.query.customerEmail;
    if (req.query.vendorId) filters.vendorId = req.query.vendorId;
    if (req.query.service) filters.service = req.query.service;
    if (req.query.month) filters.month = req.query.month;
    if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;

    const payments = await customerPaymentsRepo.findAll(filters);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ error: 'Failed to fetch customer payments' });
  }
});

/**
 * GET /api/customer-payments/customer/:email
 * Get all payment records for a specific customer
 */
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const payments = await customerPaymentsRepo.findByCustomer(email);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching customer payments by email:', error);
    res.status(500).json({ error: 'Failed to fetch customer payments' });
  }
});

/**
 * GET /api/customer-payments/:id
 * Get a specific customer payment record by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await customerPaymentsRepo.findById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Customer payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching customer payment by ID:', error);
    res.status(500).json({ error: 'Failed to fetch customer payment' });
  }
});

/**
 * POST /api/customer-payments
 * Create a new customer payment record
 */
router.post('/', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Validate required fields
    if (!paymentData.customerEmail || !paymentData.month) {
      return res.status(400).json({ 
        error: 'Missing required fields: customerEmail and month are required' 
      });
    }

    const newPayment = await customerPaymentsRepo.create(paymentData);
    res.status(201).json(newPayment);
  } catch (error) {
    console.error('Error creating customer payment:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'A payment record for this customer, vendor, service, and month already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create customer payment' });
  }
});

/**
 * PUT /api/customer-payments/:id
 * Update an existing customer payment record
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const updatedPayment = await customerPaymentsRepo.update(id, paymentData);
    
    if (!updatedPayment) {
      return res.status(404).json({ error: 'Customer payment not found' });
    }
    
    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating customer payment:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'A payment record for this customer, vendor, service, and month already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update customer payment' });
  }
});

/**
 * DELETE /api/customer-payments/:id
 * Delete a customer payment record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await customerPaymentsRepo.deleteById(id);
    res.json({ message: 'Customer payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer payment:', error);
    res.status(500).json({ error: 'Failed to delete customer payment' });
  }
});

/**
 * POST /api/customer-payments/bulk-import
 * Bulk import customer payment records
 */
router.post('/bulk-import', async (req, res) => {
  try {
    const paymentsArray = req.body;
    
    if (!Array.isArray(paymentsArray) || paymentsArray.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of payment records' });
    }

    // Validate each record
    const invalidRecords = paymentsArray.filter(payment => 
      !payment.customerEmail || !payment.month
    );

    if (invalidRecords.length > 0) {
      return res.status(400).json({ 
        error: 'Some records are missing required fields',
        invalidCount: invalidRecords.length
      });
    }

    const insertedPayments = await customerPaymentsRepo.bulkInsert(paymentsArray);
    
    res.status(201).json({
      message: 'Bulk import successful',
      count: insertedPayments.length,
      data: insertedPayments
    });
  } catch (error) {
    console.error('Error bulk importing customer payments:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Some records already exist. Duplicate entries were skipped.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to bulk import customer payments' });
  }
});

module.exports = router;
