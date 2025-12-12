import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from "app/utils/apiConfig";
import {
  Box,
  Card,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Icon,
  TablePagination,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  TableSortLabel,
  TableContainer,
  Paper
} from '@mui/material';
import { SimpleCard } from 'app/components';
import useAuth from 'app/hooks/useAuth';
import * as XLSX from 'xlsx';

const StyledTable = styled(Table)(() => ({
  whiteSpace: 'nowrap',
  '& thead': {
    '& tr': { 
      '& th': { 
        paddingLeft: '8px', 
        paddingRight: '8px', 
        fontSize: '0.813rem', 
        fontWeight: 600,
        borderBottom: '2px solid rgba(224, 224, 224, 1)'
      } 
    }
  },
  '& tbody': {
    '& tr': { 
      '& td': { 
        paddingLeft: '8px', 
        paddingRight: '8px', 
        textTransform: 'capitalize', 
        fontSize: '0.813rem',
        borderBottom: '1px solid rgba(224, 224, 224, 1)'
      } 
    }
  }
}));

const Container = styled('div')(({ theme }) => ({
  margin: '30px',
  [theme.breakpoints.down('sm')]: { margin: '16px' },
  '& .breadcrumb': {
    marginBottom: '30px',
    [theme.breakpoints.down('sm')]: { marginBottom: '16px' }
  }
}));

export default function CustomerPayments() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SA';
  const fileInputRef = useRef(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importAnchorEl, setImportAnchorEl] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [allVendors, setAllVendors] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderBy, setOrderBy] = useState('month');
  const [order, setOrder] = useState('desc');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [formData, setFormData] = useState({
    month: '',
    customerEmail: '',
    invoiceNo: '',
    invoiceDate: '',
    invoiceAmount: '',
    totalAmount: '',
    amountDue: '',
    paymentReceived: '',
    currency: 'USD',
    paymentStatus: 'pending'
  });
  
  // Invoice summary totals
  const [invoiceSummary, setInvoiceSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalAmountDue: 0,
    totalPaymentReceived: 0
  });

  // Currency formatter helper
  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$'
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Number(amount || 0).toFixed(2)}`;
  };

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    // Filter vendors and services based on selected customer
    if (isAdmin && selectedCustomer && allCustomers.length > 0) {
      const customerMappings = allCustomers.filter(c => c.email === selectedCustomer);
      const customerVendorIds = [...new Set(customerMappings.map(c => c.vendorId).filter(Boolean))];
      const customerServices = [...new Set(customerMappings.map(c => c.service).filter(Boolean))];
      
      setVendors(allVendors.filter(v => customerVendorIds.includes(v.id)));
      setServices(customerServices.map(service => ({ id: service, name: service })));
    } else if (!isAdmin && allCustomers.length > 0) {
      // For non-admin, use their own mappings
      const userVendorIds = [...new Set(allCustomers.map(c => c.vendorId).filter(Boolean))];
      const userServices = [...new Set(allCustomers.map(c => c.service).filter(Boolean))];
      
      setVendors(allVendors.filter(v => userVendorIds.includes(v.id)));
      setServices(userServices.map(service => ({ id: service, name: service })));
    } else if (isAdmin && !selectedCustomer) {
      // Admin with no customer selected - show all
      setVendors(allVendors);
      const allServices = [...new Set(allCustomers.map(c => c.service).filter(Boolean))];
      setServices(allServices.map(service => ({ id: service, name: service })));
    }
  }, [selectedCustomer, allCustomers, allVendors, isAdmin]);

  useEffect(() => {
    if (allCustomers.length > 0) {
      loadRecords();
    }
  }, [selectedCustomer, isAdmin, user?.email, allCustomers]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch vendors
      const vendorsRes = await apiCall('/api/vendors', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const vendorsData = await vendorsRes.json();
      setAllVendors(vendorsData);

      // Fetch customers with vendor services
      const customersRes = await apiCall('/api/customers?includeVendorServices=true', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const customersData = await customersRes.json();
      
      // Expand customers to include all their vendor-service mappings
      const expandedCustomers = [];
      customersData.forEach(customer => {
        if (customer.vendorServices && customer.vendorServices.length > 0) {
          customer.vendorServices.forEach(vs => {
            expandedCustomers.push({
              id: customer.id,
              email: customer.email,
              customerName: customer.customerName,
              role: customer.role,
              vendorId: vs.vendor_id || vs.vendors?.id,
              service: vs.services?.name,
              subuserId: vs.subuser_id
            });
          });
        } else {
          expandedCustomers.push(customer);
        }
      });
      
      setAllCustomers(expandedCustomers);

      if (isAdmin) {
        // Admin sees all initially
        setVendors(vendorsData);
        const allServices = [...new Set(customersData.map(c => c.service).filter(Boolean))];
        setServices(allServices.map(service => ({ id: service, name: service })));
      } else {
        // Non-admin sees only their configured vendors/services
        const userVendorIds = [...new Set(customersData.map(c => c.vendorId).filter(Boolean))];
        const userServices = [...new Set(customersData.map(c => c.service).filter(Boolean))];
        
        setVendors(vendorsData.filter(v => userVendorIds.includes(v.id)));
        setServices(userServices.map(service => ({ id: service, name: service })));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMessage({ type: 'error', text: 'Failed to load initial data' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      let url = `${apiUrl}/api/customer-payments`;
      const params = new URLSearchParams();
      
      // For non-admin users, automatically filter by their email
      if (!isAdmin && user?.email) {
        params.append('customerEmail', user.email);
      } else if (isAdmin && selectedCustomer) {
        params.append('customerEmail', selectedCustomer);
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      // Transform data from snake_case to camelCase
      const transformedData = data.map(record => ({
        id: record.id,
        month: record.month,
        customerEmail: record.customer_email,
        invoiceNo: record.invoice_no,
        invoiceDate: record.invoice_date,
        invoiceAmount: parseFloat(record.invoice_amount) || 0,
        totalAmount: parseFloat(record.total_amount) || 0,
        amountDue: parseFloat(record.amount_due) || 0,
        paymentReceived: parseFloat(record.payment_received) || 0,
        currency: record.currency || 'USD',
        paymentStatus: record.payment_status
      }));
      
      setRecords(transformedData);
    } catch (error) {
      console.error('Error loading records:', error);
      setMessage({ type: 'error', text: 'Failed to load records' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (record = null) => {
    if (!isAdmin) return; // Only admin can open dialog
    
    if (record) {
      setFormData({
        id: record.id,
        month: record.month,
        customerEmail: record.customerEmail,
        invoiceNo: record.invoiceNo,
        invoiceDate: record.invoiceDate,
        invoiceAmount: record.invoiceAmount,
        totalAmount: record.totalAmount || '',
        amountDue: record.amountDue || '',
        paymentReceived: record.paymentReceived || '',
        currency: record.currency || 'USD',
        paymentStatus: record.paymentStatus
      });
    } else {
      setFormData({
        month: '',
        customerEmail: '',
        invoiceNo: '',
        invoiceDate: '',
        invoiceAmount: '',
        totalAmount: '',
        amountDue: '',
        paymentReceived: '',
        currency: 'USD',
        paymentStatus: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.customerEmail || !formData.month) {
        setMessage({ type: 'error', text: 'Customer Email and Month are required fields' });
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      const url = formData.id 
        ? `${apiUrl}/api/customer-payments/${formData.id}` 
        : `${apiUrl}/api/customer-payments`;
      const method = formData.id ? 'PUT' : 'POST';
      
      // Convert empty strings to 0 for numeric fields to ensure valid data
      const dataToSend = {
        ...formData,
        invoiceAmount: formData.invoiceAmount === '' ? 0 : Number(formData.invoiceAmount),
        totalAmount: formData.totalAmount === '' ? 0 : Number(formData.totalAmount),
        amountDue: formData.amountDue === '' ? 0 : Number(formData.amountDue),
        paymentReceived: formData.paymentReceived === '' ? 0 : Number(formData.paymentReceived)
      };
      
      console.log('Sending data to:', url);
      console.log('Data:', dataToSend);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save record');
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      
      setMessage({ type: 'success', text: 'Record saved successfully' });
      handleCloseDialog();
      loadRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save record' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRecords = React.useMemo(() => {
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
      if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
      return 0;
    };
    return [...records].sort(comparator);
  }, [records, order, orderBy]);

  const handleImportMenuOpen = (event) => {
    setImportAnchorEl(event.currentTarget);
  };

  const handleImportMenuClose = () => {
    setImportAnchorEl(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process and validate imported data
        const processedData = jsonData.map((row, index) => ({
          id: Date.now() + index,
          customerEmail: row.customerEmail || row['Customer Email'] || '',
          month: row.month || row.Month || '',
          vendorId: row.vendorId || row['Vendor ID'] || '',
          vendorName: row.vendorName || row['Vendor Name'] || '',
          service: row.service || row.Service || '',
          openingBalance: parseFloat(row.openingBalance || row['Opening Balance'] || 0),
          closingBalance: parseFloat(row.closingBalance || row['Closing Balance'] || 0),
          dataAdded: parseFloat(row.dataAdded || row['Data Added'] || 0),
          invoiceNo: row.invoiceNo || row['Invoice No'] || '',
          invoiceDate: row.invoiceDate || row['Invoice Date'] || '',
          invoiceAmount: parseFloat(row.invoiceAmount || row['Invoice Amount'] || 0),
          paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending'
        }));

        // Send to API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
        const response = await fetch(`${apiUrl}/api/customer-payments/bulk-import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processedData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to import data');
        }

        const result = await response.json();
        setMessage({ type: 'success', text: `Successfully imported ${result.count} records` });
        handleImportMenuClose();
        loadRecords(); // Reload data from server
      } catch (error) {
        console.error('Error importing file:', error);
        setMessage({ type: 'error', text: 'Failed to import file. Please check the format.' });
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl) {
      setMessage({ type: 'error', text: 'Please enter a Google Sheet URL' });
      return;
    }

    try {
      // Extract sheet ID from URL
      const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        setMessage({ type: 'error', text: 'Invalid Google Sheet URL' });
        return;
      }

      const sheetId = match[1];
      // Use Google Sheets CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const csvResponse = await fetch(csvUrl);
      const csvText = await csvResponse.text();

      // Parse CSV data
      const rows = csvText.split('\n').map(row => row.split(','));
      const headers = rows[0];
      const jsonData = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header.trim()] = row[i]?.trim() || '';
        });
        return obj;
      });

      // Process data same as file upload
      const processedData = jsonData.filter(row => row.customerEmail || row['Customer Email']).map((row, index) => ({
        id: Date.now() + index,
        customerEmail: row.customerEmail || row['Customer Email'] || '',
        month: row.month || row.Month || '',
        vendorId: row.vendorId || row['Vendor ID'] || '',
        vendorName: row.vendorName || row['Vendor Name'] || '',
        service: row.service || row.Service || '',
        openingBalance: parseFloat(row.openingBalance || row['Opening Balance'] || 0),
        closingBalance: parseFloat(row.closingBalance || row['Closing Balance'] || 0),
        dataAdded: parseFloat(row.dataAdded || row['Data Added'] || 0),
        invoiceNo: row.invoiceNo || row['Invoice No'] || '',
        invoiceDate: row.invoiceDate || row['Invoice Date'] || '',
        invoiceAmount: parseFloat(row.invoiceAmount || row['Invoice Amount'] || 0),
        paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending'
      }));

      // Send to API
      const response = await fetch('http://localhost:3030/api/customer-payments/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import data');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `Successfully imported ${result.count} records from Google Sheet` });
      setOpenImportDialog(false);
      setGoogleSheetUrl('');
      handleImportMenuClose();
      loadRecords(); // Reload data from server
    } catch (error) {
      console.error('Error importing Google Sheet:', error);
      setMessage({ type: 'error', text: 'Failed to import Google Sheet. Make sure it is publicly accessible.' });
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Customer Name': 'Example Customer',
        'Customer Email': 'customer@example.com',
        'Month': '2024-12',
        'Vendor ID': 'vendor-dataimpulse',
        'Vendor Name': 'Dataimpulse',
        'Service': 'Residential Proxy',
        'Opening Balance': 100.5,
        'Data Added': 50.0,
        'Closing Balance': 50.5,
        'Invoice No': 'INV-001',
        'Invoice Date': '2024-12-01',
        'Invoice Amount': 75.50,
        'Payment Status': 'pending'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'customer_payments_template.xlsx');
    handleImportMenuClose();
  };

  const exportToExcel = () => {
    const exportData = sortedRecords.map(record => {
      const customer = allCustomers.find(c => c.email === record.customerEmail);
      const data = {
        'Customer Email': record.customerEmail,
        'Month': record.month,
        'Vendor ID': record.vendorId,
        'Vendor Name': record.vendorName,
        'Service': record.service,
        'Opening Balance': record.openingBalance,
        'Data Added': record.dataAdded,
        'Closing Balance': record.closingBalance,
        'Invoice No': record.invoiceNo,
        'Invoice Date': record.invoiceDate,
        'Invoice Amount': record.invoiceAmount,
        'Payment Status': record.paymentStatus
      };
      
      // Add customer name for admin
      if (isAdmin) {
        return {
          'Customer Name': customer?.customerName || '',
          ...data
        };
      }
      return data;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Payments');
    XLSX.writeFile(wb, `customer_payments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!user) {
    return (
      <Container>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info">Loading user information...</Alert>
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

      {/* Invoice Summary Section */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0d6b6b' }}>Invoice Summary</h3>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>Total Invoices</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#0d6b6b' }}>{records.length}</Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>Total Amount</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1976d2' }}>
                {records.length > 0 && records[0].currency ? 
                  formatCurrency(records.reduce((sum, r) => sum + (r.totalAmount || 0), 0), records[0].currency) :
                  `$${records.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}`
                }
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>Amount Due</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#f57c00' }}>
                {records.length > 0 && records[0].currency ? 
                  formatCurrency(records.reduce((sum, r) => sum + (r.amountDue || 0), 0), records[0].currency) :
                  `$${records.reduce((sum, r) => sum + (r.amountDue || 0), 0).toFixed(2)}`
                }
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>Payment Received</Box>
              <Box sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#388e3c' }}>
                {records.length > 0 && records[0].currency ? 
                  formatCurrency(records.reduce((sum, r) => sum + (r.paymentReceived || 0), 0), records[0].currency) :
                  `$${records.reduce((sum, r) => sum + (r.paymentReceived || 0), 0).toFixed(2)}`
                }
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <SimpleCard title="Payment & Invoice Details">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
            {isAdmin && (
              <TextField
                select
                label="Filter by Customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Customers</MenuItem>
                {Array.from(
                  new Map(allCustomers.map(c => [c.email, c])).values()
                ).map((customer) => (
                  <MenuItem key={customer.email} value={customer.email}>
                    {customer.customerName || customer.email}
                  </MenuItem>
                ))}
              </TextField>
            )}

          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Icon>download</Icon>} onClick={exportToExcel}>
              Export
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Icon>upload</Icon>}
                  onClick={handleImportMenuOpen}
                >
                  Import
                </Button>
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                  Add New Record
                </Button>
              </>
            )}
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <StyledTable>
            <TableHead>
              <TableRow>
                {isAdmin && (
                  <TableCell align="left">
                    <TableSortLabel
                      active={orderBy === 'customerName'}
                      direction={orderBy === 'customerName' ? order : 'asc'}
                      onClick={() => handleSort('customerName')}
                    >
                      Customer Name
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell align="left">
                  <TableSortLabel
                    active={orderBy === 'month'}
                    direction={orderBy === 'month' ? order : 'asc'}
                    onClick={() => handleSort('month')}
                  >
                    Month
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Invoice No</TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'invoiceDate'}
                    direction={orderBy === 'invoiceDate' ? order : 'asc'}
                    onClick={() => handleSort('invoiceDate')}
                  >
                    Invoice Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'invoiceAmount'}
                    direction={orderBy === 'invoiceAmount' ? order : 'asc'}
                    onClick={() => handleSort('invoiceAmount')}
                  >
                    Invoice Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'totalAmount'}
                    direction={orderBy === 'totalAmount' ? order : 'asc'}
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'amountDue'}
                    direction={orderBy === 'amountDue' ? order : 'asc'}
                    onClick={() => handleSort('amountDue')}
                  >
                    Amount Due
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'paymentReceived'}
                    direction={orderBy === 'paymentReceived' ? order : 'asc'}
                    onClick={() => handleSort('paymentReceived')}
                  >
                    Payment Received
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'paymentStatus'}
                    direction={orderBy === 'paymentStatus' ? order : 'asc'}
                    onClick={() => handleSort('paymentStatus')}
                  >
                    Payment Status
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRecords
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => {
                  const customer = allCustomers.find(c => c.email === record.customerEmail);
                  return (
                  <TableRow key={record.id}>
                    {isAdmin && (
                      <TableCell align="left">{customer?.customerName || record.customerEmail}</TableCell>
                    )}
                    <TableCell align="left">{record.month}</TableCell>
                    <TableCell align="center">{record.invoiceNo}</TableCell>
                    <TableCell align="center">{new Date(record.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{formatCurrency(record.invoiceAmount, record.currency)}</TableCell>
                    <TableCell align="center">{formatCurrency(record.totalAmount, record.currency)}</TableCell>
                    <TableCell align="center">{formatCurrency(record.amountDue, record.currency)}</TableCell>
                    <TableCell align="center">{formatCurrency(record.paymentReceived, record.currency)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.paymentStatus}
                        color={getStatusColor(record.paymentStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <IconButton onClick={() => handleOpenDialog(record)}>
                          <Icon>edit</Icon>
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
            </TableBody>
          </StyledTable>

          <TablePagination
            sx={{ px: 2 }}
            page={page}
            component="div"
            rowsPerPage={rowsPerPage}
            count={sortedRecords.length}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            nextIconButtonProps={{ 'aria-label': 'Next Page' }}
            backIconButtonProps={{ 'aria-label': 'Previous Page' }}
          />
        </TableContainer>
      </SimpleCard>

      {/* Import Menu */}
      <Menu
        anchorEl={importAnchorEl}
        open={Boolean(importAnchorEl)}
        onClose={handleImportMenuClose}
      >
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <ListItemIcon><Icon>upload_file</Icon></ListItemIcon>
          <ListItemText>Upload XLSX File</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setOpenImportDialog(true); handleImportMenuClose(); }}>
          <ListItemIcon><Icon>table_chart</Icon></ListItemIcon>
          <ListItemText>Import from Google Sheets</ListItemText>
        </MenuItem>
        <MenuItem onClick={downloadTemplate}>
          <ListItemIcon><Icon>download</Icon></ListItemIcon>
          <ListItemText>Download Template</ListItemText>
        </MenuItem>
      </Menu>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{formData.id ? 'Edit Record' : 'Add New Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Customer"
                value={formData.customerEmail}
                onChange={handleChange('customerEmail')}
                required
              >
                <MenuItem value="">Select Customer</MenuItem>
                {Array.from(
                  new Map(allCustomers.map(c => [c.email, c])).values()
                ).map((customer) => (
                  <MenuItem key={customer.email} value={customer.email}>
                    {customer.customerName || customer.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Month"
                type="month"
                value={formData.month}
                onChange={handleChange('month')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice No"
                value={formData.invoiceNo}
                onChange={handleChange('invoiceNo')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Date"
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange('invoiceDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Amount"
                type="number"
                value={formData.invoiceAmount}
                onChange={handleChange('invoiceAmount')}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={formData.totalAmount}
                onChange={handleChange('totalAmount')}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount Due"
                type="number"
                value={formData.amountDue}
                onChange={handleChange('amountDue')}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Received"
                type="number"
                value={formData.paymentReceived}
                onChange={handleChange('paymentReceived')}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Currency"
                value={formData.currency}
                onChange={handleChange('currency')}
              >
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="JPY">JPY (¥)</MenuItem>
                <MenuItem value="AUD">AUD (A$)</MenuItem>
                <MenuItem value="CAD">CAD (C$)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Status"
                value={formData.paymentStatus}
                onChange={handleChange('paymentStatus')}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </TextField>
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

      {/* Google Sheets Import Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import from Google Sheets</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
            </Alert>
            <TextField
              fullWidth
              label="Google Sheet URL"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              helperText="Paste the full URL of your Google Sheet"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenImportDialog(false); setGoogleSheetUrl(''); }}>
            Cancel
          </Button>
          <Button onClick={handleGoogleSheetImport} variant="contained" color="primary">
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
