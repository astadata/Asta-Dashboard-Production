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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import useAuth from 'app/hooks/useAuth';

export default function VendorAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  // Static list of available services for selection
  const availableServices = [
    { id: 'datacenter-proxy', name: 'Datacenter Proxy', slug: 'datacenter-proxy' },
    { id: 'residential-proxy', name: 'Residential Proxy', slug: 'residential-proxy' },
    { id: 'mobile-proxy', name: 'Mobile Proxy', slug: 'mobile-proxy' },
    { id: 'web-unblocker', name: 'Web Unblocker', slug: 'web-unblocker' },
    { id: 'isp', name: 'ISP', slug: 'isp' },
    { id: 'datasets', name: 'Datasets', slug: 'datasets' },
    { id: 'scraper-api', name: 'Scraper API', slug: 'scraper-api' }
  ];
  // Configured services from database (what vendors actually offer)
  const [configuredServices, setConfiguredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState({});
  const [results, setResults] = useState({});
  const [openVendorDialog, setOpenVendorDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    id: '',
    name: '',
    slug: '',
    enabled: true,
    authType: 'api_key',
    tokenEndpoint: '',
    apiBaseUrl: '',
    credentialsJson: '{}',
    defaultHeadersJson: '{}',
    selectedServices: []
  });

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard/default');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadVendorsAndServices();
  }, []);

  async function loadVendorsAndServices() {
    await loadVendors();
    await loadConfiguredServices();
  }

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3030/api/vendors', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadConfiguredServices() {
    try {
      const res = await fetch('http://localhost:3030/api/services', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      setConfiguredServices(data);
    } catch (err) {
      console.error('Error loading configured services:', err);
    }
  }



  function handleOpenVendorDialog(vendor = null) {
    if (vendor) {
      setEditingVendor(vendor);
      // Get services for this vendor from configured services
      const vendorServices = configuredServices.filter(s => s.vendor_id === vendor.id).map(s => s.id);
      setVendorForm({
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        enabled: vendor.enabled,
        authType: vendor.auth_type,
        tokenEndpoint: vendor.token_endpoint || '',
        apiBaseUrl: vendor.api_base_url || '',
        credentialsJson: JSON.stringify(vendor.credentials || {}, null, 2),
        defaultHeadersJson: JSON.stringify(vendor.default_headers || {}, null, 2),
        selectedServices: vendorServices
      });
    } else {
      setEditingVendor(null);
      setVendorForm({
        id: '',
        name: '',
        slug: '',
        enabled: true,
        authType: 'api_key',
        tokenEndpoint: '',
        apiBaseUrl: '',
        credentialsJson: '{}',
        defaultHeadersJson: '{}',
        selectedServices: []
      });
    }
    setOpenVendorDialog(true);
  }



  async function handleSaveVendor() {
    try {
      let credentials, defaultHeaders;
      try {
        credentials = JSON.parse(vendorForm.credentialsJson);
        defaultHeaders = JSON.parse(vendorForm.defaultHeadersJson);
      } catch (e) {
        alert('Invalid JSON in credentials or headers');
        return;
      }

      const payload = {
        id: vendorForm.id,
        name: vendorForm.name,
        slug: vendorForm.slug,
        enabled: vendorForm.enabled,
        authType: vendorForm.authType,
        tokenEndpoint: vendorForm.tokenEndpoint,
        apiBaseUrl: vendorForm.apiBaseUrl,
        credentials,
        defaultHeaders
      };

      const url = editingVendor 
        ? `http://localhost:3030/api/vendors/${editingVendor.id}`
        : 'http://localhost:3030/api/vendors';
      
      const method = editingVendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save vendor');
      }

      // Update services for this vendor
      await updateVendorServices(vendorForm.id, vendorForm.selectedServices);

      setOpenVendorDialog(false);
      loadVendors();
      loadConfiguredServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function updateVendorServices(vendorId, selectedServiceIds) {
    try {
      // Get current configured services for this vendor
      const currentServices = configuredServices.filter(s => s.vendor_id === vendorId);
      const currentServiceSlugs = currentServices.map(s => s.slug);

      // Find services to add (selected but not currently configured)
      const toAdd = selectedServiceIds.filter(id => {
        const availableService = availableServices.find(s => s.id === id);
        return availableService && !currentServiceSlugs.includes(availableService.slug);
      });
      
      // Find services to remove (currently configured but not selected)
      const toRemove = currentServices.filter(cs => {
        const matchingAvailable = availableServices.find(as => as.slug === cs.slug);
        return matchingAvailable && !selectedServiceIds.includes(matchingAvailable.id);
      });

      // Create new service entries for selected services
      for (const serviceId of toAdd) {
        const availableService = availableServices.find(s => s.id === serviceId);
        if (availableService) {
          await fetch(`http://localhost:3030/api/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: availableService.name,
              slug: availableService.slug,
              vendorId: vendorId,
              enabled: true
            })
          });
        }
      }

      // Delete service entries that are no longer selected
      for (const service of toRemove) {
        await fetch(`http://localhost:3030/api/services/${service.id}`, { 
          method: 'DELETE' 
        });
      }
    } catch (err) {
      console.error('Error updating vendor services:', err);
    }
  }



  async function handleDeleteVendor(vendorId) {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const res = await fetch(`http://localhost:3030/api/vendors/${vendorId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete vendor');
      }

      loadVendors();
      loadConfiguredServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }



  async function fetchUsage(v) {
    setFetching((s) => ({ ...s, [v.id]: true }));
    try {
      const res = await fetch(`/api/vendors/${v.id}/usage`);
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
      const res = await fetch(`/api/vendors/${v.id}/fetch?path=/usage`);
      const json = await res.json();
      setResults((r) => ({ ...r, [v.id]: json }));
    } catch (err) {
      setResults((r) => ({ ...r, [v.id]: { ok: false, error: err.message } }));
    } finally {
      setFetching((s) => ({ ...s, [v.id]: false }));
    }
  }

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Vendor Admin</Typography>

      <Grid container spacing={2}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Configured Vendors</Typography>
                <Box>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenVendorDialog()}
                    sx={{ mr: 1 }}
                  >
                    Add Vendor
                  </Button>
                  <Button variant="outlined" onClick={loadVendors}>Refresh</Button>
                </Box>
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
                        <TableCell>Services</TableCell>
                        <TableCell>Manage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vendors.map((v) => {
                        const vendorServices = configuredServices.filter(s => s.vendor_id === v.id);
                        return (
                          <TableRow key={v.id}>
                            <TableCell>{v.name}</TableCell>
                            <TableCell>{v.slug} / {v.id}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {vendorServices.length > 0 ? (
                                  vendorServices.map((s) => (
                                    <Chip key={s.id} label={s.name} size="small" />
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">No services</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleOpenVendorDialog(v)} color="primary">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteVendor(v.id)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}

            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Available Services</Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These services are available for vendors to offer. Configure them when adding/editing a vendor in the section above.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="Datacenter Proxy" size="medium" color="primary" variant="outlined" />
                <Chip label="Residential Proxy" size="medium" color="primary" variant="outlined" />
                <Chip label="Mobile Proxy" size="medium" color="primary" variant="outlined" />
                <Chip label="Web Unblocker" size="medium" color="primary" variant="outlined" />
                <Chip label="ISP" size="medium" color="primary" variant="outlined" />
                <Chip label="Datasets" size="medium" color="primary" variant="outlined" />
                <Chip label="Scraper API" size="medium" color="primary" variant="outlined" />
              </Box>
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

      {/* Vendor Dialog */}
      <Dialog open={openVendorDialog} onClose={() => setOpenVendorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Vendor ID"
              value={vendorForm.id}
              onChange={(e) => setVendorForm({ ...vendorForm, id: e.target.value })}
              disabled={!!editingVendor}
              fullWidth
              required
              helperText="Unique identifier (e.g., vendor-example)"
            />
            <TextField
              label="Name"
              value={vendorForm.name}
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={vendorForm.slug}
              onChange={(e) => setVendorForm({ ...vendorForm, slug: e.target.value })}
              fullWidth
              required
              helperText="URL-friendly name (e.g., example)"
            />
            <FormControl fullWidth>
              <InputLabel>Services</InputLabel>
              <Select
                multiple
                value={vendorForm.selectedServices}
                onChange={(e) => setVendorForm({ ...vendorForm, selectedServices: e.target.value })}
                input={<OutlinedInput label="Services" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((serviceId) => {
                      const service = availableServices.find(s => s.id === serviceId);
                      return service ? <Chip key={serviceId} label={service.name} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {availableServices.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Auth Type</InputLabel>
              <Select
                value={vendorForm.authType}
                onChange={(e) => setVendorForm({ ...vendorForm, authType: e.target.value })}
                label="Auth Type"
              >
                <MenuItem value="api_key">API Key</MenuItem>
                <MenuItem value="custom_token">Custom Token</MenuItem>
                <MenuItem value="basic">Basic Auth</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="API Base URL"
              value={vendorForm.apiBaseUrl}
              onChange={(e) => setVendorForm({ ...vendorForm, apiBaseUrl: e.target.value })}
              fullWidth
              placeholder="https://api.example.com"
            />
            <TextField
              label="Token Endpoint (optional)"
              value={vendorForm.tokenEndpoint}
              onChange={(e) => setVendorForm({ ...vendorForm, tokenEndpoint: e.target.value })}
              fullWidth
              placeholder="https://api.example.com/token"
            />
            <TextField
              label="Credentials (JSON)"
              value={vendorForm.credentialsJson}
              onChange={(e) => setVendorForm({ ...vendorForm, credentialsJson: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder='{"apiKey": "your-key-here"}'
            />
            <TextField
              label="Default Headers (JSON)"
              value={vendorForm.defaultHeadersJson}
              onChange={(e) => setVendorForm({ ...vendorForm, defaultHeadersJson: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder='{}'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={vendorForm.enabled}
                  onChange={(e) => setVendorForm({ ...vendorForm, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVendorDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveVendor} variant="contained">
            {editingVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
