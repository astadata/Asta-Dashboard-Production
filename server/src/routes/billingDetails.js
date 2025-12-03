const express = require('express');
const router = express.Router();
const {
  getBillingDetails,
  upsertBillingDetails,
  getAllBillingDetails
} = require('../repos/billingDetailsSupabase');

/**
 * GET /api/billing-details?email=user@example.com
 * Get billing details for a specific customer
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const billingDetails = await getBillingDetails(email);
    res.json(billingDetails || {});
  } catch (error) {
    console.error('Error fetching billing details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/billing-details/all
 * Get all billing details (admin only)
 */
router.get('/all', async (req, res) => {
  try {
    const allDetails = await getAllBillingDetails();
    res.json(allDetails);
  } catch (error) {
    console.error('Error fetching all billing details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/billing-details
 * Create or update billing details
 */
router.post('/', async (req, res) => {
  try {
    const billingData = req.body;

    if (!billingData.customer_email) {
      return res.status(400).json({ error: 'customer_email is required' });
    }

    const result = await upsertBillingDetails(billingData);
    res.json(result);
  } catch (error) {
    console.error('Error upserting billing details:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
