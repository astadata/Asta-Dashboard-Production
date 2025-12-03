import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import { CUSTOMER_VENDORS, CUSTOMER_SERVICES } from 'app/utils/vendorServiceConfig';
import useAuth from 'app/hooks/useAuth';

export default function CustomerAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  // Bulk add state
  const [bulkForm, setBulkForm] = useState({ email: '', customerName: '', role: 'CUSTOMER', vendorId: '', password: '', mappings: [{ subuserId: '', service: '' }] });
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard/default');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadVendors();
    loadCustomers();
  }, []);

  async function loadVendors() {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Customers management
  async function loadCustomers() {
    setCustLoading(true);
    try {
      const res = await fetch('/api/customers?includeVendorServices=true');
      const data = await res.json();
      
      // Transform customers to show all their vendor-service mappings
      const expandedCustomers = [];
      data.forEach(customer => {
        if (customer.vendorServices && customer.vendorServices.length > 0) {
          // Create a row for each vendor-service mapping
          customer.vendorServices.forEach(vs => {
            expandedCustomers.push({
              id: customer.id,
              email: customer.email,
              customerName: customer.customerName,
              role: customer.role,
              password: customer.password,
              vendorId: vs.vendor_id || vs.vendors?.id,
              service: vs.services?.name,
              subuserId: vs.subuser_id,
              mappingId: vs.id || `${customer.email}-${vs.vendor_id}-${vs.service_id}` // For identification
            });
          });
        } else {
          // Customer with no mappings
          expandedCustomers.push(customer);
        }
      });
      
      setCustomers(expandedCustomers);
    } catch (e) { console.error(e); }
    setCustLoading(false);
  }

  async function deleteCustomer(mappingId) {
    try {
      // Delete the specific customer-vendor-service mapping
      await fetch(`/api/customer-vendor-services/${mappingId}`, { method: 'DELETE' });
      loadCustomers();
    } catch (e) { console.error(e); }
  }

  function addBulkMapping() {
    setBulkForm({ ...bulkForm, mappings: [...bulkForm.mappings, { subuserId: '', service: '' }] });
  }

  function removeBulkMapping(index) {
    const newMappings = bulkForm.mappings.filter((_, i) => i !== index);
    setBulkForm({ ...bulkForm, mappings: newMappings });
  }

  function updateBulkMapping(index, field, value) {
    const newMappings = [...bulkForm.mappings];
    newMappings[index][field] = value;
    setBulkForm({ ...bulkForm, mappings: newMappings });
  }

  async function createBulkCustomers(e) {
    e.preventDefault();
    setBulkError('');
    setBulkSuccess('');
    setBulkSubmitting(true);

    // Validate
    if (!bulkForm.email) {
      setBulkError('Email is required');
      setBulkSubmitting(false);
      return;
    }
    if (!bulkForm.customerName) {
      setBulkError('Customer name is required');
      setBulkSubmitting(false);
      return;
    }
    if (!bulkForm.vendorId) {
      setBulkError('Vendor is required');
      setBulkSubmitting(false);
      return;
    }
    if (!bulkForm.password) {
      setBulkError('Password is required');
      setBulkSubmitting(false);
      return;
    }
    if (bulkForm.mappings.length === 0 || bulkForm.mappings.some(m => !m.subuserId || !m.service)) {
      setBulkError('All mappings must have subuserId and service');
      setBulkSubmitting(false);
      return;
    }

    try {
      // Step 1: Create/update the customer (one record per email)
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: bulkForm.email,
          customerName: bulkForm.customerName,
          role: bulkForm.role,
          password: bulkForm.password
        })
      });

      if (!customerRes.ok) {
        const error = await customerRes.text();
        setBulkError(`Failed to create customer: ${error}`);
        setBulkSubmitting(false);
        return;
      }

      // Step 2: Get service IDs for the mappings
      const servicesRes = await fetch('/api/services');
      const allServices = await servicesRes.json();

      // Step 3: Create customer-vendor-service mappings
      const mappingPromises = bulkForm.mappings.map(async mapping => {
        // Find the service ID
        const service = allServices.find(s => 
          s.vendor_id === bulkForm.vendorId && s.name === mapping.service
        );
        
        if (!service) {
          console.error(`Service not found: ${mapping.service} for vendor ${bulkForm.vendorId}`);
          return { ok: false };
        }

        return fetch('/api/customer-vendor-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_email: bulkForm.email,
            vendor_id: bulkForm.vendorId,
            service_id: service.id,
            subuser_id: mapping.subuserId
          })
        });
      });

      const responses = await Promise.all(mappingPromises);
      const allOk = responses.every(r => r.ok);

      if (!allOk) {
        setBulkError('Some entries failed to create. Check server logs.');
        setBulkSubmitting(false);
        return;
      }

      setBulkSuccess(`Created ${bulkForm.mappings.length} mappings for ${bulkForm.email}`);
      setBulkForm({ email: '', customerName: '', role: 'CUSTOMER', vendorId: '', password: '', mappings: [{ subuserId: '', service: '' }] });
      setTimeout(() => setBulkSuccess(''), 3000);
      await loadCustomers();
    } catch (err) {
      console.error('Bulk create error:', err);
      setBulkError(`Error: ${err.message}`);
    } finally {
      setBulkSubmitting(false);
    }
  }

  function startEdit(c) {
    setEditError('');
    setEditCustomer({ ...c });
    // ensure role defaults
    if (!c.role) setEditCustomer((s) => ({ ...s, role: 'CUSTOMER' }));
  }

  function cancelEdit() {
    setEditCustomer(null);
    setEditError('');
    setEditSubmitting(false);
  }

  async function submitEdit(e) {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    if (!editCustomer) {
      setEditError('No customer selected');
      setEditSubmitting(false);
      return;
    }
    // basic validation
    if (!editCustomer.email) {
      setEditError('Email is required');
      setEditSubmitting(false);
      return;
    }
    if (!editCustomer.vendorId) {
      setEditError('Vendor is required');
      setEditSubmitting(false);
      return;
    }
    if (!editCustomer.subuserId) {
      setEditError('SubuserId is required');
      setEditSubmitting(false);
      return;
    }
    if (!editCustomer.service) {
      setEditError('Service is required');
      setEditSubmitting(false);
      return;
    }

    try {
      // Step 1: Update customer base info (if password changed)
      if (editCustomer.password) {
        const customerPayload = {
          email: editCustomer.email,
          customerName: editCustomer.customerName,
          role: editCustomer.role,
          password: editCustomer.password
        };

        const customerRes = await fetch(`/api/customers/${editCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerPayload)
        });

        if (!customerRes.ok) {
          const error = await customerRes.text();
          setEditError(`Failed to update customer: ${error}`);
          setEditSubmitting(false);
          return;
        }
      }

      // Step 2: Get service ID
      const servicesRes = await fetch('/api/services');
      const services = await servicesRes.json();
      const service = services.find(s => s.name === editCustomer.service && s.vendor_id === editCustomer.vendorId);
      
      if (!service) {
        setEditError(`Service "${editCustomer.service}" not found for vendor`);
        setEditSubmitting(false);
        return;
      }

      // Step 3: Update customer-vendor-service mapping
      const mappingPayload = {
        customer_email: editCustomer.email,
        vendor_id: editCustomer.vendorId,
        service_id: service.id,
        subuser_id: editCustomer.subuserId
      };

      const mappingRes = await fetch(`/api/customer-vendor-services/${editCustomer.mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingPayload)
      });

      if (!mappingRes.ok) {
        const error = await mappingRes.text();
        setEditError(`Failed to update mapping: ${error}`);
        setEditSubmitting(false);
        return;
      }

      // success
      setEditCustomer(null);
      await loadCustomers();
    } catch (err) {
      console.error('Edit customer error:', err);
      setEditError(err.message || String(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  // Filter customers based on search query
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const vendorName = (vendors.find(v=>v.id===c.vendorId)||{}).name || c.vendorId;
    return (
      c.email?.toLowerCase().includes(query) ||
      c.customerName?.toLowerCase().includes(query) ||
      c.role?.toLowerCase().includes(query) ||
      vendorName?.toLowerCase().includes(query) ||
      c.vendorId?.toLowerCase().includes(query) ||
      c.subuserId?.toLowerCase().includes(query) ||
      c.service?.toLowerCase().includes(query)
    );
  });

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Customer Admin</Typography>

      <Grid container spacing={2}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Customer Mappings</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px', minWidth: '200px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <Button variant="contained" onClick={loadCustomers}>Refresh</Button>
                </Box>
              </Box>

              {/* Bulk Add Form */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Add Customer Mappings</Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>Add one or more SubuserID/Service mappings for a customer. Add multiple rows for the same email to create multiple access mappings.</Typography>
              {bulkError && <Typography color="error" sx={{ mb: 1, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>❌ {bulkError}</Typography>}
              {bulkSuccess && <Typography color="success" sx={{ mb: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>✅ {bulkSuccess}</Typography>}
              <Box component="form" onSubmit={createBulkCustomers} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Email</Typography>
                    <input autoComplete="off" value={bulkForm.email || ''} onChange={(e) => setBulkForm({ ...bulkForm, email: e.target.value })} style={{ padding: '8px', minWidth: '200px' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Customer Name</Typography>
                    <input autoComplete="off" value={bulkForm.customerName || ''} onChange={(e) => setBulkForm({ ...bulkForm, customerName: e.target.value })} style={{ padding: '8px', minWidth: '200px' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Role</Typography>
                    <select value={bulkForm.role} onChange={(e) => setBulkForm({ ...bulkForm, role: e.target.value })} style={{ padding: '8px' }}>
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Vendor</Typography>
                    <select value={bulkForm.vendorId} onChange={(e) => setBulkForm({ ...bulkForm, vendorId: e.target.value })} style={{ padding: '8px', minWidth: '200px' }}>
                      <option value="">Select vendor</option>
                      {vendors.length > 0 ? (
                        vendors.map((v) => <option key={v.id} value={v.id}>{v.name || v.id}</option>)
                      ) : (
                        CUSTOMER_VENDORS.map((vname) => <option key={vname} value={vname}>{vname}</option>)
                      )}
                    </select>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Password</Typography>
                    <input type="password" autoComplete="new-password" value={bulkForm.password || ''} onChange={(e) => setBulkForm({ ...bulkForm, password: e.target.value })} style={{ padding: '8px', minWidth: '150px' }} />
                  </Box>
                </Box>
                
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>SubuserID / Service Mappings:</Typography>
                {bulkForm.mappings.map((mapping, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <input 
                      placeholder={`subuserId ${idx + 1}`} 
                      value={mapping.subuserId || ''} 
                      onChange={(e) => updateBulkMapping(idx, 'subuserId', e.target.value)} 
                      style={{ padding: '8px', flex: 1 }} 
                    />
                    <select 
                      value={mapping.service || ''} 
                      onChange={(e) => updateBulkMapping(idx, 'service', e.target.value)} 
                      style={{ padding: '8px', flex: 1 }}
                    >
                      <option value="">Select service</option>
                      {CUSTOMER_SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {bulkForm.mappings.length > 1 && (
                      <Button size="small" color="error" onClick={() => removeBulkMapping(idx)}>Remove</Button>
                    )}
                  </Box>
                ))}
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" variant="outlined" onClick={addBulkMapping}>+ Add Another Mapping</Button>
                  <Button type="submit" variant="contained" disabled={bulkSubmitting}>
                    {bulkSubmitting ? 'Adding...' : `Add ${bulkForm.mappings.length} Mapping(s)`}
                  </Button>
                </Box>
              </Box>

              {/* Edit form (appears when editing a customer) */}
              {editCustomer && (
                <Box component="form" onSubmit={submitEdit} sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end', bgcolor: '#fff8e1', p: 1, borderRadius: 1 }}>
                  {editError && <Typography color="error" sx={{ mr: 1 }}>❌ {editError}</Typography>}
                  <input placeholder="email" value={editCustomer.email || ''} onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })} style={{ padding: '8px' }} />
                  <input placeholder="customer name" value={editCustomer.customerName || ''} onChange={(e) => setEditCustomer({ ...editCustomer, customerName: e.target.value })} style={{ padding: '8px' }} />
                  <select value={editCustomer.role || 'CUSTOMER'} onChange={(e) => setEditCustomer({ ...editCustomer, role: e.target.value })} style={{ padding: '8px' }}>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <select value={editCustomer.vendorId || ''} onChange={(e) => setEditCustomer({ ...editCustomer, vendorId: e.target.value })} style={{ padding: '8px' }}>
                    <option value="">Select vendor ({vendors.length} available)</option>
                    {vendors.length > 0 ? (
                      vendors.map((v) => <option key={v.id} value={v.id}>{v.name || v.id}</option>)
                    ) : (
                      CUSTOMER_VENDORS.map((vname) => <option key={vname} value={vname}>{vname}</option>)
                    )}
                  </select>
                  <input placeholder="subuserId" value={editCustomer.subuserId || ''} onChange={(e) => setEditCustomer({ ...editCustomer, subuserId: e.target.value })} style={{ padding: '8px' }} />
                  <select value={editCustomer.service || ''} onChange={(e) => setEditCustomer({ ...editCustomer, service: e.target.value })} style={{ padding: '8px' }}>
                    <option value="">Select service</option>
                    {CUSTOMER_SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input placeholder="password (leave blank to keep)" type="password" value={editCustomer.password || ''} onChange={(e) => setEditCustomer({ ...editCustomer, password: e.target.value })} style={{ padding: '8px' }} />
                  <Button type="submit" variant="contained" disabled={editSubmitting} sx={{ mr: 1 }}>{editSubmitting ? 'Saving...' : 'Save'}</Button>
                  <Button type="button" variant="outlined" onClick={cancelEdit}>Cancel</Button>
                </Box>
              )}

              {custLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>SubuserID</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.customerName}</TableCell>
                        <TableCell>{c.role}</TableCell>
                        <TableCell>{(vendors.find(v=>v.id===c.vendorId)||{}).name || c.vendorId}</TableCell>
                        <TableCell>{c.subuserId}</TableCell>
                        <TableCell>{c.service}</TableCell>
                        <TableCell>
                          <Button size="small" sx={{ mr: 1 }} onClick={() => startEdit(c)}>Edit</Button>
                          <Button size="small" color="error" onClick={() => deleteCustomer(c.mappingId)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
