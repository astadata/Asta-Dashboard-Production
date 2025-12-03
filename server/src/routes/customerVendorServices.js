const express = require('express');
const router = express.Router();
const cvsRepo = require('../repos/customerVendorServicesSupabase');

// Get all customer-vendor-service mappings
router.get('/', async (req, res) => {
  try {
    const { customerEmail, customer_email } = req.query;
    
    if (customerEmail || customer_email) {
      const email = customerEmail || customer_email;
      const mappings = await cvsRepo.getCustomerVendorServices(email);
      res.json(mappings);
    } else {
      const allMappings = await cvsRepo.getAllCustomerVendorServices();
      res.json(allMappings);
    }
  } catch (error) {
    console.error('Error fetching customer vendor services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get services by vendor for a customer
router.get('/customer/:email/vendor/:vendorId', async (req, res) => {
  try {
    const { email, vendorId } = req.params;
    const services = await cvsRepo.getCustomerServicesByVendor(email, vendorId);
    res.json(services);
  } catch (error) {
    console.error('Error fetching customer services by vendor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new vendor-service mapping for a customer
router.post('/', async (req, res) => {
  try {
    const mapping = await cvsRepo.addCustomerVendorService(req.body);
    res.status(201).json(mapping);
  } catch (error) {
    console.error('Error creating customer vendor service mapping:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update vendor-service mapping
router.put('/:id', async (req, res) => {
  try {
    const mapping = await cvsRepo.updateCustomerVendorService(req.params.id, req.body);
    res.json(mapping);
  } catch (error) {
    console.error('Error updating customer vendor service mapping:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete vendor-service mapping
router.delete('/:id', async (req, res) => {
  try {
    await cvsRepo.deleteCustomerVendorService(req.params.id);
    res.json({ success: true, message: 'Mapping deleted' });
  } catch (error) {
    console.error('Error deleting customer vendor service mapping:', error);
    res.status(400).json({ error: error.message });
  }
});

// Bulk update customer mappings
router.put('/customer/:email/mappings', async (req, res) => {
  try {
    const { email } = req.params;
    const { mappings } = req.body;
    const result = await cvsRepo.updateCustomerMappings(email, mappings);
    res.json(result);
  } catch (error) {
    console.error('Error updating customer mappings:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
