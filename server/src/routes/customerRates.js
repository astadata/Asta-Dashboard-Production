const express = require('express');
const router = express.Router();

module.exports = ({ customerRatesRepo }) => {
  // List all customer rates
  router.get('/', async (req, res) => {
    try {
      if (!customerRatesRepo) {
        return res.status(500).json({ error: 'Customer rates repository not configured' });
      }
      const rates = await customerRatesRepo.list();
      res.json(rates);
    } catch (err) {
      console.error('Error fetching customer rates:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Get rates by customer ID
  router.get('/customer/:customerId', async (req, res) => {
    try {
      if (!customerRatesRepo) {
        return res.status(500).json({ error: 'Customer rates repository not configured' });
      }
      const rates = await customerRatesRepo.getByCustomerId(req.params.customerId);
      res.json(rates);
    } catch (err) {
      console.error('Error fetching customer rates:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Create new rate
  router.post('/', async (req, res) => {
    try {
      if (!customerRatesRepo) {
        return res.status(500).json({ error: 'Customer rates repository not configured' });
      }

      const { customerId, vendorId, service, ratePerGb, ratePerRequest, currency } = req.body;

      if (!customerId || !vendorId || !service || ratePerGb === undefined) {
        return res.status(400).json({ error: 'Missing required fields: customerId, vendorId, service, ratePerGb' });
      }

      const entry = await customerRatesRepo.addEntry({
        customerId,
        vendorId,
        service,
        ratePerGb: parseFloat(ratePerGb),
        ratePerRequest: ratePerRequest ? parseFloat(ratePerRequest) : null,
        currency: currency || 'USD'
      });

      res.status(201).json(entry);
    } catch (err) {
      console.error('Error creating customer rate:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Update rate by ID
  router.put('/:id', async (req, res) => {
    try {
      if (!customerRatesRepo) {
        return res.status(500).json({ error: 'Customer rates repository not configured' });
      }

      const { ratePerGb, ratePerRequest, currency } = req.body;
      const updates = {};
      
      if (ratePerGb !== undefined) updates.ratePerGb = parseFloat(ratePerGb);
      if (ratePerRequest !== undefined) updates.ratePerRequest = ratePerRequest ? parseFloat(ratePerRequest) : null;
      if (currency !== undefined) updates.currency = currency;

      const entry = await customerRatesRepo.updateById(req.params.id, updates);
      res.json(entry);
    } catch (err) {
      console.error('Error updating customer rate:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete rate by ID
  router.delete('/:id', async (req, res) => {
    try {
      if (!customerRatesRepo) {
        return res.status(500).json({ error: 'Customer rates repository not configured' });
      }

      await customerRatesRepo.deleteById(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting customer rate:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
