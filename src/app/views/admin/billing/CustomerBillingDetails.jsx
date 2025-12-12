import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  styled,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { SimpleCard } from 'app/components';
import useAuth from 'app/hooks/useAuth';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: '24px',
  boxShadow: theme.shadows[3],
  '&:hover': {
    boxShadow: theme.shadows[6]
  }
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  color: theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    fontSize: '24px'
  }
}));

const InfoRow = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  '&:not(:last-child)': {
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
  }
}));

const Label = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  textAlign: 'right',
  maxWidth: '60%',
  wordBreak: 'break-word'
}));

export default function CustomerBillingDetails() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SA';
  
  const [billingDetails, setBillingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAdmin) {
      loadCustomers();
    } else {
      loadBillingDetails(user?.email);
    }
  }, [user, isAdmin]);

  const loadCustomers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      const response = await fetch(`${apiUrl}/api/customers`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      
      // Get unique customers by email (since each customer can have multiple vendor/service mappings)
      const uniqueCustomers = Array.from(
        new Map(data.map(customer => [customer.email, customer])).values()
      );
      
      setCustomers(uniqueCustomers);
      setLoading(false);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadBillingDetails = async (email) => {
    if (!email) {
      setError('Email not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      const response = await fetch(`${apiUrl}/api/billing-details?email=${encodeURIComponent(email)}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing details');
      }

      const data = await response.json();
      setBillingDetails(data);
      setError('');
    } catch (err) {
      console.error('Error loading billing details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (event) => {
    const email = event.target.value;
    setSelectedCustomerEmail(email);
    if (email) {
      loadBillingDetails(email);
    } else {
      setBillingDetails(null);
    }
  };

  const handleOpenDialog = (isNew = false) => {
    if (isNew) {
      setFormData({
        customer_email: selectedCustomerEmail || '',
        company_name: '',
        business_address_line1: '',
        business_address_line2: '',
        business_city: '',
        business_state: '',
        business_country: '',
        business_postal_code: '',
        business_phone: '',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_country: '',
        billing_postal_code: '',
        billing_phone: '',
        gst_tax_registration_no: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        primary_contact_mobile: '',
        primary_contact_department: ''
      });
    } else {
      setFormData(billingDetails || {});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      const response = await fetch(`${apiUrl}/api/billing-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save billing details');
      }

      const result = await response.json();
      setBillingDetails(result);
      setMessage({ type: 'success', text: 'Billing details saved successfully!' });
      handleCloseDialog();
      
      if (isAdmin && selectedCustomerEmail) {
        loadBillingDetails(selectedCustomerEmail);
      }
    } catch (err) {
      console.error('Error saving billing details:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const renderInfoRow = (label, value) => {
    if (!value) return null;
    return (
      <InfoRow>
        <Label>{label}</Label>
        <Value>{value}</Value>
      </InfoRow>
    );
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isAdmin && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Select Customer"
            value={selectedCustomerEmail}
            onChange={handleCustomerChange}
            sx={{ minWidth: 300 }}
          >
            <MenuItem value="">-- Select Customer --</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.email} value={customer.email}>
                {customer.customerName || customer.email}
              </MenuItem>
            ))}
          </TextField>

          {selectedCustomerEmail && (
            <>
              {billingDetails && Object.keys(billingDetails).length > 0 ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(false)}
                >
                  Edit Details
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog(true)}
                >
                  Add Details
                </Button>
              )}
            </>
          )}
        </Box>
      )}

      {!billingDetails || Object.keys(billingDetails).length === 0 ? (
        <Alert severity="info">
          {isAdmin && !selectedCustomerEmail 
            ? 'Please select a customer to view billing details.'
            : 'No billing details found. Please contact support to set up your billing information.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Company Information */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <SectionTitle>
                  <BusinessIcon />
                  <Typography variant="h6">Company Information</Typography>
                </SectionTitle>
                {renderInfoRow('Company Name', billingDetails.company_name)}
                {renderInfoRow('Email', billingDetails.customer_email)}
                {renderInfoRow('GST/Tax Registration No', billingDetails.gst_tax_registration_no)}
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Business Address */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <SectionTitle>
                  <LocationOnIcon />
                  <Typography variant="h6">Business Address</Typography>
                </SectionTitle>
                {renderInfoRow('Address Line 1', billingDetails.business_address_line1)}
                {renderInfoRow('Address Line 2', billingDetails.business_address_line2)}
                {renderInfoRow('City', billingDetails.business_city)}
                {renderInfoRow('State', billingDetails.business_state)}
                {renderInfoRow('Country', billingDetails.business_country)}
                {renderInfoRow('Postal Code', billingDetails.business_postal_code)}
                {renderInfoRow('Phone', billingDetails.business_phone)}
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Billing Address */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <SectionTitle>
                  <ReceiptIcon />
                  <Typography variant="h6">Billing Address</Typography>
                </SectionTitle>
                {renderInfoRow('Address Line 1', billingDetails.billing_address_line1)}
                {renderInfoRow('Address Line 2', billingDetails.billing_address_line2)}
                {renderInfoRow('City', billingDetails.billing_city)}
                {renderInfoRow('State', billingDetails.billing_state)}
                {renderInfoRow('Country', billingDetails.billing_country)}
                {renderInfoRow('Postal Code', billingDetails.billing_postal_code)}
                {renderInfoRow('Phone', billingDetails.billing_phone)}
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Primary Contact */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <SectionTitle>
                  <PersonIcon />
                  <Typography variant="h6">Primary Contact</Typography>
                </SectionTitle>
                {renderInfoRow('Name', billingDetails.primary_contact_name)}
                {renderInfoRow('Email', billingDetails.primary_contact_email)}
                {renderInfoRow('Phone', billingDetails.primary_contact_phone)}
                {renderInfoRow('Mobile', billingDetails.primary_contact_mobile)}
                {renderInfoRow('Department', billingDetails.primary_contact_department)}
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.id ? 'Edit Billing Details' : 'Add Billing Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Email"
                name="customer_email"
                value={formData.customer_email || ''}
                onChange={handleInputChange}
                disabled={!!formData.id}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST/Tax Registration No"
                name="gst_tax_registration_no"
                value={formData.gst_tax_registration_no || ''}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Business Address */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Business Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                name="business_address_line1"
                value={formData.business_address_line1 || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                name="business_address_line2"
                value={formData.business_address_line2 || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="business_city"
                value={formData.business_city || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                name="business_state"
                value={formData.business_state || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="business_country"
                value={formData.business_country || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="business_postal_code"
                value={formData.business_postal_code || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="business_phone"
                value={formData.business_phone || ''}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Billing Address */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Billing Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                name="billing_address_line1"
                value={formData.billing_address_line1 || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                name="billing_address_line2"
                value={formData.billing_address_line2 || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="billing_city"
                value={formData.billing_city || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                name="billing_state"
                value={formData.billing_state || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="billing_country"
                value={formData.billing_country || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="billing_postal_code"
                value={formData.billing_postal_code || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="billing_phone"
                value={formData.billing_phone || ''}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Primary Contact */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Primary Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="primary_contact_name"
                value={formData.primary_contact_name || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="primary_contact_email"
                value={formData.primary_contact_email || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="primary_contact_phone"
                value={formData.primary_contact_phone || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                name="primary_contact_mobile"
                value={formData.primary_contact_mobile || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                name="primary_contact_department"
                value={formData.primary_contact_department || ''}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
