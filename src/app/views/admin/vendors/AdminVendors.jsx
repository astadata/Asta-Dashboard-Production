import React, { useEffect, useState } from 'react';
import { apiCall } from "app/utils/apiConfig";
import { useNavigate } from 'react-router-dom';
import { apiCall } from "app/utils/apiConfig";
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

export default function AdminVendors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState({});
  const [results, setResults] = useState({});
  const [customers, setCustomers] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'CUSTOMER', vendorId: '', subuserId: '', service: '', password: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  // Bulk add state
  const [bulkForm, setBulkForm] = useState({ email: '', role: 'CUSTOMER', vendorId: '', password: '', mappings: [{ subuserId: '', service: '' }] });
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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
    setLoading(true);
    try {
      const res = await apiCall('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage(v) {
    setFetching((s) => ({ ...s, [v.id]: true }));
    try {
      const res = await apiCall(`/api/vendors/${v.id}/usage`);
      const json = await res.json();
      setResults((r) => ({ ...r, [v.id]: json }));
    } catch (err) {
      setResults((r) => ({ ...r, [v.id]: { ok: false, error: err.message } }));
    } finally {
      setFetching((s) => ({ ...s, [v.id]: false }));
    }
  }

  async function fetchRaw(v) {
    setFetching((s) => ({ ...s, [v.id]: true }));
    try {
      const res = await apiCall(`/api/vendors/${v.id}/fetch?path=/usage`);
      const json = await res.json();
      setResults((r) => ({ ...r, [v.id]: json }));
    } catch (err) {
      setResults((r) => ({ ...r, [v.id]: { ok: false, error: err.message } }));
    } finally {
      setFetching((s) => ({ ...s, [v.id]: false }));
    }
  }

  // Customers management
  async function loadCustomers() {
    setCustLoading(true);
    try {
      const res = await apiCall('/api/customers?includeVendorServices=true');
      const data = await res.json();
      
      // Expand customers to show all their vendor-service mappings
      const expandedCustomers = [];
      data.forEach(customer => {
        if (customer.vendorServices && customer.vendorServices.length > 0) {
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
              mappingId: vs.id || `${customer.email}-${vs.vendor_id}-${vs.service_id}`
            });
          });
        } else {
          expandedCustomers.push(customer);
        }
      });
      
      setCustomers(expandedCustomers);
    } catch (e) { console.error(e); }
    setCustLoading(false);
  }

  async function createCustomer(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    // Validate form
    if (!form.email) {
      setFormError('Email is required');
      setSubmitting(false);
      return;
    }
    if (!form.vendorId) {
      setFormError('Vendor is required');
      setSubmitting(false);
      return;
    }
    if (!form.subuserId) {
      setFormError('SubuserId is required');
      setSubmitting(false);
      return;
    }
    if (!form.service) {
      setFormError('Service is required');
      setSubmitting(false);
      return;
    }
    if (!form.password) {
      setFormError('Password is required');
      setSubmitting(false);
      return;
    }

    try {
      console.log('Submitting form:', form);
      
      // Step 1: Create/update the customer (one record per email)
      const customerRes = await apiCall('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          customerName: form.customerName || form.email.split('@')[0],
          role: form.role,
          password: form.password
        })
      });
      
      if (!customerRes.ok) {
        const error = await customerRes.text();
        setFormError(`Failed to create customer: ${error}`);
        setSubmitting(false);
        return;
      }
      
      // Step 2: Get service ID
      const servicesRes = await apiCall('/api/services');
      const services = await servicesRes.json();
      const service = services.find(s => s.name === form.service && s.vendor_id === form.vendorId);
      
      if (!service) {
        setFormError(`Service "${form.service}" not found for vendor`);
        setSubmitting(false);
        return;
      }
      
      // Step 3: Create customer-vendor-service mapping
      const mappingRes = await apiCall('/api/customer-vendor-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: form.email,
          vendor_id: form.vendorId,
          service_id: service.id,
          subuser_id: form.subuserId
        })
      });
      
      if (!mappingRes.ok) {
        const error = await mappingRes.text();
        setFormError(`Failed to create mapping: ${error}`);
        setSubmitting(false);
        return;
      }

      console.log('Customer and mapping created successfully');
      setFormSuccess(`Customer added: ${form.email}`);
      setForm({ email: '', role: 'CUSTOMER', vendorId: '', subuserId: '', service: '', password: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(''), 3000);
      
      // Reload customers list
      await loadCustomers();
    } catch (err) {
      console.error('Create customer error:', err);
      setFormError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCustomer(id) {
    try {
      await apiCall(`/api/customers/${id}`, { method: 'DELETE' });
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
      const customerRes = await apiCall('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: bulkForm.email,
          customerName: bulkForm.customerName || bulkForm.email.split('@')[0],
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
      
      // Step 2: Get service IDs
      const servicesRes = await apiCall('/api/services');
      const services = await servicesRes.json();
      
      // Step 3: Create all mappings
      const mappingPromises = bulkForm.mappings.map(async (mapping) => {
        const service = services.find(s => s.name === mapping.service && s.vendor_id === bulkForm.vendorId);
        if (!service) {
          throw new Error(`Service "${mapping.service}" not found for vendor`);
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
        setBulkError('Some mappings failed to create. Check server logs.');
        setBulkSubmitting(false);
        return;
      }

      setBulkSuccess(`Created ${bulkForm.mappings.length} mappings for ${bulkForm.email}`);
      setBulkForm({ email: '', role: 'CUSTOMER', vendorId: '', password: '', mappings: [{ subuserId: '', service: '' }] });
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
      const payload = {
        email: editCustomer.email,
        role: editCustomer.role,
        vendorId: editCustomer.vendorId,
        subuserId: editCustomer.subuserId,
        service: editCustomer.service
      };
      // only include password if provided
      if (editCustomer.password) payload.password = editCustomer.password;

      const res = await apiCall(`/api/customers/${editCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      if (!text) {
        setEditError('Empty response from server');
        setEditSubmitting(false);
        return;
      }
      let data;
      try { data = JSON.parse(text); } catch (pe) {
        setEditError(`JSON parse error: ${pe.message}`);
        setEditSubmitting(false);
        return;
      }
      if (!res.ok) {
        setEditError(data.error || `Server error: ${res.status}`);
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

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Vendors Admin</Typography>

      <Grid container spacing={2}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Configured Vendors</Typography>
                <Button variant="contained" onClick={loadVendors}>Refresh</Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
              ) : (
                <>
                  {vendors.length === 0 && (
                    <Typography color="error" sx={{ mb: 2 }}>⚠️ No vendors loaded from API. Check server connection.</Typography>
                  )}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Slug / ID</TableCell>
                        <TableCell>Auth Type</TableCell>
                        <TableCell>Enabled</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vendors.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell>{v.name}</TableCell>
                          <TableCell>{v.slug} / {v.id}</TableCell>
                          <TableCell>{v.auth_type}</TableCell>
                          <TableCell>{String(v.enabled)}</TableCell>
                          <TableCell>
                            <Button sx={{ mr: 1 }} size="small" variant="outlined" onClick={() => fetchUsage(v)} disabled={fetching[v.id]}>Fetch Usage</Button>
                            <Button sx={{ mr: 1 }} size="small" variant="outlined" onClick={() => fetchRaw(v)} disabled={fetching[v.id]}>Fetch Raw</Button>
                            {fetching[v.id] && <CircularProgress size={18} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12}>
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Customer Mappings</Typography>
                <Box>
                  <Button variant="contained" onClick={loadCustomers} sx={{ mr: 1 }}>Refresh</Button>
                </Box>
              </Box>

              {/* Bulk Add Form */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Add Customer Mappings</Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>Add one or more SubuserID/Service mappings for a customer. Add multiple rows for the same email to create multiple access mappings.</Typography>
              {bulkError && <Typography color="error" sx={{ mb: 1, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>❌ {bulkError}</Typography>}
              {bulkSuccess && <Typography color="success" sx={{ mb: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>✅ {bulkSuccess}</Typography>}
              <Box component="form" onSubmit={createBulkCustomers} sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <input placeholder="email" value={bulkForm.email} onChange={(e) => setBulkForm({ ...bulkForm, email: e.target.value })} style={{ padding: '8px' }} />
                  <select value={bulkForm.role} onChange={(e) => setBulkForm({ ...bulkForm, role: e.target.value })} style={{ padding: '8px' }}>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <select value={bulkForm.vendorId} onChange={(e) => setBulkForm({ ...bulkForm, vendorId: e.target.value })} style={{ padding: '8px' }}>
                    <option value="">Select vendor ({vendors.length} available)</option>
                    {vendors.length > 0 ? (
                      vendors.map((v) => <option key={v.id} value={v.id}>{v.name || v.id}</option>)
                    ) : (
                      CUSTOMER_VENDORS.map((vname) => <option key={vname} value={vname}>{vname}</option>)
                    )}
                  </select>
                  <input placeholder="password" type="password" value={bulkForm.password} onChange={(e) => setBulkForm({ ...bulkForm, password: e.target.value })} style={{ padding: '8px' }} />
                </Box>
                
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>SubuserID / Service Mappings:</Typography>
                {bulkForm.mappings.map((mapping, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <input 
                      placeholder={`subuserId ${idx + 1}`} 
                      value={mapping.subuserId} 
                      onChange={(e) => updateBulkMapping(idx, 'subuserId', e.target.value)} 
                      style={{ padding: '8px', flex: 1 }} 
                    />
                    <select 
                      value={mapping.service} 
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
                      <TableCell>Role</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>SubuserID</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.role}</TableCell>
                        <TableCell>{(vendors.find(v=>v.id===c.vendorId)||{}).name || c.vendorId}</TableCell>
                        <TableCell>{c.subuserId}</TableCell>
                        <TableCell>{c.service}</TableCell>
                        <TableCell>
                          <Button size="small" sx={{ mr: 1 }} onClick={() => startEdit(c)}>Edit</Button>
                          <Button size="small" color="error" onClick={() => deleteCustomer(c.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Results</Typography>
              {Object.keys(results).length === 0 && <Typography color="text.secondary">No results yet. Click "Fetch Usage" on a vendor to load sample data.</Typography>}

              {Object.entries(results).map(([id, res]) => (
                <Box key={id} sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2">{id}</Typography>
                  <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto', background: '#f6f6f6', padding: 8 }}>{JSON.stringify(res, null, 2)}</pre>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
