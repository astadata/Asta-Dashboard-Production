const express = require('express');
const router = express.Router();
const vendorsRepo = require('../repos/vendorsSupabase');

module.exports = ({ vendorManager }) => {
  // List vendor configs - now from database
  router.get('/', async (req, res) => {
    try {
      const vendors = await vendorsRepo.getAllVendors();
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch vendor data (proxy) - demo endpoint: /api/vendors/:id/fetch?path=/usage
  // NOTE: This must come before /:id route to avoid route conflicts
  router.get('/:id/fetch', async (req, res) => {
    const id = req.params.id;
    const adapter = vendorManager.getAdapter(id);
    if (!adapter) return res.status(404).json({ error: 'vendor not found' });

    const path = req.query.path || '/';
    try {
      const data = await adapter.fetchData(path, req.query);
      res.json({ ok: true, data });
    } catch (err) {
      console.error('vendor fetch error', err?.message || err);
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // Fetch normalized usage for vendors supporting it (e.g., Dataimpulse)
  router.get('/:id/usage', async (req, res) => {
    const id = req.params.id;
    const adapter = vendorManager.getAdapter(id);
    if (!adapter) return res.status(404).json({ error: 'vendor not found' });

    if (typeof adapter.fetchUsage !== 'function') {
      return res.status(400).json({ error: 'vendor does not support usage endpoint' });
    }

    try {
      // forward any query params (start, end, subuserId, service, etc.) to adapter
      const params = { ...req.query };
      const data = await adapter.fetchUsage(params);
      res.json({ ok: true, data });
    } catch (err) {
      console.error('vendor usage error', err?.message || err);
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // Get single vendor by ID
  router.get('/:id', async (req, res) => {
    try {
      const vendor = await vendorsRepo.getVendorById(req.params.id);
      res.json(vendor);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      res.status(404).json({ error: 'Vendor not found' });
    }
  });

  // Create new vendor
  router.post('/', async (req, res) => {
    try {
      const vendor = await vendorsRepo.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update vendor
  router.put('/:id', async (req, res) => {
    try {
      const vendor = await vendorsRepo.updateVendor(req.params.id, req.body);
      res.json(vendor);
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete vendor
  router.delete('/:id', async (req, res) => {
    try {
      await vendorsRepo.deleteVendor(req.params.id);
      res.json({ success: true, message: 'Vendor deleted' });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};
