const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_PATH = path.join(__dirname, '..', 'config', 'customers.json');

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading customers.json:', e);
    return [];
  }
}

function writeAll(list) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing customers.json:', e);
    throw e;
  }
}

module.exports = ({ customersRepo } = {}) => {
  const router = express.Router();

  // list / filter by email
  router.get('/', async (req, res) => {
    try {
      const email = req.query.email;
      const includeVendorServices = req.query.includeVendorServices === 'true';
      
      if (customersRepo) {
        if (email) {
          if (includeVendorServices && customersRepo.findByEmailWithVendorServices) {
            const found = await customersRepo.findByEmailWithVendorServices(email);
            return res.json(found || []);
          }
          const found = await customersRepo.findByEmail(email);
          return res.json(found || []);
        }
        
        if (includeVendorServices && customersRepo.listAllWithVendorServices) {
          const list = await customersRepo.listAllWithVendorServices();
          return res.json(list || []);
        }
        
        const list = await customersRepo.listAll();
        return res.json(list || []);
      }

      // fallback to file-based storage
      const list = readAll();
      if (email) return res.json(list.filter((c) => c.email === email));
      res.json(list);
    } catch (err) {
      console.error('Error in GET /api/customers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // create or update customer (vendor/service mappings now handled via customer_vendor_services table)
  router.post('/', async (req, res) => {
    try {
      const { email, customerName, role, vendorId, subuserId, service, password } = req.body;
      console.log('POST /api/customers received:', { email, customerName, role, vendorId, subuserId, service, hasPassword: !!password });
      
      // Only email is required now - vendor/service mappings are optional (legacy support)
      if (!email) {
        console.log('Validation failed - email is required');
        return res.status(400).json({ error: 'email is required' });
      }

      if (customersRepo) {
        try {
          // Check if customer already exists
          const existing = await customersRepo.findByEmail(email);
          
          if (existing && existing.length > 0) {
            // Customer exists - update if needed
            const customer = existing[0];
            if (customerName || role || password) {
              const updates = {};
              if (customerName) updates.customerName = customerName;
              if (role) updates.role = role;
              if (password) updates.password = password;
              const updated = await customersRepo.updateById(customer.id, updates);
              console.log('Customer updated (supabase):', updated);
              return res.json(updated);
            }
            console.log('Customer already exists:', customer);
            return res.json(customer);
          }
          
          // Create new customer (without vendor/service - those go to customer_vendor_services)
          const entry = await customersRepo.addEntry({ 
            email, 
            customerName, 
            role: role || 'CUSTOMER', 
            password,
            // Legacy fields (optional, kept for backward compatibility)
            vendorId: vendorId || null,
            subuserId: subuserId || null,
            service: service || null
          });
          console.log('Customer entry created (supabase):', entry);
          return res.json(entry);
        } catch (e) {
          console.error('Supabase create error:', e.message || e);
          return res.status(500).json({ error: e.message || 'Supabase create error' });
        }
      }

      // fallback to file-based storage
      const list = readAll();
      const entry = { id: uuidv4(), email, customerName, role: role || 'CUSTOMER' };
      if (password) entry.password = password;
      if (vendorId) entry.vendorId = vendorId;
      if (subuserId) entry.subuserId = subuserId;
      if (service) entry.service = service;
      list.push(entry);
      writeAll(list);
      console.log('Customer entry created:', entry);
      res.json(entry);
    } catch (err) {
      console.error('Error creating customer:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // update mapping
  router.put('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      if (customersRepo && customersRepo.updateById) {
        const updated = await customersRepo.updateById(id, req.body);
        return res.json(updated);
      }
      const list = readAll();
      const idx = list.findIndex((x) => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not found' });
      const updated = { ...list[idx], ...req.body };
      list[idx] = updated;
      writeAll(list);
      res.json(updated);
    } catch (err) {
      console.error('Error in PUT /api/customers/:id:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // delete mapping
  router.delete('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      if (customersRepo) {
        const removed = await customersRepo.deleteById(id);
        return res.json(removed);
      }
      let list = readAll();
      const idx = list.findIndex((x) => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not found' });
      const removed = list.splice(idx, 1)[0];
      writeAll(list);
      res.json(removed);
    } catch (err) {
      console.error('Error in DELETE /api/customers/:id:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
