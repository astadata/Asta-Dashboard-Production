require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');
const TokenManager = require('./tokenManager');
const VendorManager = require('./vendorManager');

async function main() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = createClient({ url: redisUrl });
  
  // Don't wait for Redis - connect in background
  redis.on('error', (err) => console.warn('⚠ Redis error:', err.message));
  redis.on('connect', () => console.log('✓ Redis connected'));
  
  // Try to connect but don't block if it fails
  redis.connect().catch((err) => {
    console.warn('⚠ Redis connection failed, continuing without Redis:', err.message);
  });

  const tokenManager = new TokenManager(redis);

  // load vendor configs (for demo we load from JSON)
  const cfgPath = path.join(__dirname, 'config', 'vendors.json');
  let configs = [];
  try {
    const cfgRaw = fs.readFileSync(cfgPath, 'utf8');
    configs = JSON.parse(cfgRaw);
    console.log(`✓ Loaded ${configs.length} vendors from config`);
  } catch (err) {
    console.error('Error loading vendors config:', err.message);
  }

  const vendorManager = new VendorManager(configs, tokenManager);

  const app = express();
  app.use(cors()); // Enable CORS for all routes
  app.use(express.json());

  // Add request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // mount vendors routes
  const vendorsRouter = require('./routes/vendors')({ vendorManager });
  app.use('/api/vendors', vendorsRouter);
  // instantiate customers repo (Supabase) if configured
  let customersRepo = null;
  try {
    const createCustomersSupabaseRepo = require('./repos/customersSupabase');
    customersRepo = createCustomersSupabaseRepo();
    if (!customersRepo) console.log('Supabase repo not configured — using file-based fallback');
    else console.log('Supabase customers repo initialized');
  } catch (err) {
    console.warn('Could not initialize Supabase repo:', err.message);
  }

  const customersRouter = require('./routes/customers')({ customersRepo });
  app.use('/api/customers', customersRouter);

  // instantiate customer rates repo (Supabase) if configured
  let customerRatesRepo = null;
  try {
    const createCustomerRatesSupabaseRepo = require('./repos/customerRatesSupabase');
    customerRatesRepo = createCustomerRatesSupabaseRepo();
    if (!customerRatesRepo) console.log('Customer rates repo not configured');
    else console.log('Supabase customer rates repo initialized');
  } catch (err) {
    console.warn('Could not initialize customer rates repo:', err.message);
  }

  const customerRatesRouter = require('./routes/customerRates')({ customerRatesRepo });
  app.use('/api/customer-rates', customerRatesRouter);

  // billing details routes
  const billingDetailsRouter = require('./routes/billingDetails');
  app.use('/api/billing-details', billingDetailsRouter);

  // invoices routes
  const invoicesRouter = require('./routes/invoices');
  app.use('/api/invoices', invoicesRouter);

  // customer payments routes
  const customerPaymentsRouter = require('./routes/customerPayments');
  app.use('/api/customer-payments', customerPaymentsRouter);

  // services routes
  const servicesRouter = require('./routes/services');
  app.use('/api/services', servicesRouter);

  // customer vendor services routes
  const customerVendorServicesRouter = require('./routes/customerVendorServices');
  app.use('/api/customer-vendor-services', customerVendorServicesRouter);

  // Add error handling middleware AFTER routes
  app.use((err, req, res, next) => {
    console.error('Express error:', err.message);
    res.status(500).json({ error: err.message });
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`✓ Server running on http://localhost:${port}`));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
