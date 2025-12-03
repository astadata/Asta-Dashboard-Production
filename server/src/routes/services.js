const express = require('express');
const router = express.Router();
const servicesRepo = require('../repos/servicesSupabase');

// Get all services, optionally filtered by vendor_id
router.get('/', async (req, res) => {
  try {
    const { vendorId, vendor_id } = req.query;
    const vendorFilter = vendorId || vendor_id || null;
    const services = await servicesRepo.getAllServices(vendorFilter);
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get services by vendor ID
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const services = await servicesRepo.getServicesByVendor(req.params.vendorId);
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by vendor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await servicesRepo.getServiceById(req.params.id);
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(404).json({ error: 'Service not found' });
  }
});

// Create new service
router.post('/', async (req, res) => {
  try {
    const service = await servicesRepo.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const service = await servicesRepo.updateService(req.params.id, req.body);
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    await servicesRepo.deleteService(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
