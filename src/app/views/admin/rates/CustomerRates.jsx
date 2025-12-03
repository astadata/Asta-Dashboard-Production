import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const Container = styled("div")(({ theme }) => ({
  margin: "30px",
  [theme.breakpoints.down("sm")]: { margin: "16px" }
}));

const StyledCard = styled(Card)(() => ({
  padding: "20px",
  marginBottom: "20px"
}));

const HeaderBox = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
}));

export default function CustomerRates() {
  const [rates, setRates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    customerId: "",
    customerEmail: "",
    vendorId: "",
    service: "",
    ratePerGb: "",
    ratePerRequest: "",
    currency: "USD"
  });
  const [customerVendorServices, setCustomerVendorServices] = useState([]);

  // Fetch customers on mount
  useEffect(() => {
    loadCustomers();
    loadRates();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/customers?includeVendorServices=true");
      const data = await res.json();
      
      // Expand customers to include all their vendor-service mappings
      const expandedCustomers = [];
      data.forEach(customer => {
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
      
      setCustomers(expandedCustomers);
    } catch (err) {
      console.error("Error loading customers:", err);
    }
  };

  const loadRates = async () => {
    try {
      const res = await fetch("/api/customer-rates");
      const data = await res.json();
      setRates(data);
    } catch (err) {
      console.error("Error loading rates:", err);
    }
  };

  const handleOpenDialog = (rate = null) => {
    if (rate) {
      setEditingRate(rate);
      setFormData(rate);
      // Load vendor/service options for this customer
      const customerMappings = customers.filter(c => c.id === rate.customerId);
      setCustomerVendorServices(customerMappings);
    } else {
      setEditingRate(null);
      setFormData({
        customerId: "",
        customerEmail: "",
        vendorId: "",
        service: "",
        ratePerGb: "",
        ratePerRequest: "",
        currency: "USD"
      });
      setCustomerVendorServices([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRate(null);
    setCustomerVendorServices([]);
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    // Get all vendor/service combinations for this customer
    const allMappings = customers.filter(c => c.id === customerId);
    
    // Filter out vendor/service combinations that already have rates defined
    const existingRates = rates.filter(r => r.customerId === customerId);
    const availableMappings = allMappings.filter(mapping => {
      return !existingRates.some(rate => 
        rate.vendorId === mapping.vendorId && rate.service === mapping.service
      );
    });
    
    setCustomerVendorServices(availableMappings);
    
    setFormData({
      ...formData,
      customerId,
      customerEmail: customer?.email || "",
      vendorId: "",
      service: ""
    });
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.vendorId || !formData.service || !formData.ratePerGb) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingRate) {
        // Update existing rate
        const res = await fetch(`/api/customer-rates/${editingRate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ratePerGb: formData.ratePerGb,
            ratePerRequest: formData.ratePerRequest || null,
            currency: formData.currency
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update rate");
        }
      } else {
        // Add new rate
        const res = await fetch("/api/customer-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData.error || "Failed to create rate";
          
          // Check for duplicate key error
          if (errorMsg.includes("duplicate key")) {
            throw new Error("A rate already exists for this customer, vendor, and service combination. Please edit the existing rate instead.");
          }
          throw new Error(errorMsg);
        }
      }
      
      loadRates();
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving rate:", err);
      alert(err.message || "Error saving rate");
    }
  };

  const handleDelete = async (rateId) => {
    if (window.confirm("Are you sure you want to delete this rate?")) {
      try {
        const res = await fetch(`/api/customer-rates/${rateId}`, {
          method: "DELETE"
        });
        
        if (!res.ok) throw new Error("Failed to delete rate");
        
        loadRates();
      } catch (err) {
        console.error("Error deleting rate:", err);
        alert("Error deleting rate: " + err.message);
      }
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.customerName || customer?.email || customerId;
  };

  return (
    <Container>
      <StyledCard>
        <HeaderBox>
          <Typography variant="h5" sx={{ fontSize: "1.2rem", fontWeight: 500 }}>
            Customer Rate Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Rate
          </Button>
        </HeaderBox>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Rate per GB</TableCell>
              <TableCell>Rate per Request</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No rates configured. Click "Add Rate" to get started.
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{getCustomerName(rate.customerId)}</TableCell>
                  <TableCell>{rate.vendorId}</TableCell>
                  <TableCell>{rate.service}</TableCell>
                  <TableCell>${rate.ratePerGb}</TableCell>
                  <TableCell>${rate.ratePerRequest || "N/A"}</TableCell>
                  <TableCell>{rate.currency}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(rate)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(rate.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledCard>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRate ? "Edit Customer Rate" : "Add Customer Rate"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={formData.customerId}
                label="Customer"
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={!!editingRate}
              >
                {customers
                  .filter((c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx)
                  .map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.customerName || customer.email}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={formData.vendorId}
                label="Vendor"
                onChange={(e) => {
                  const vendorId = e.target.value;
                  setFormData({ ...formData, vendorId, service: "" });
                }}
                disabled={!formData.customerId || !!editingRate}
              >
                <MenuItem value="">
                  <em>Select Vendor</em>
                </MenuItem>
                {customerVendorServices
                  .filter((c, idx, arr) => arr.findIndex(x => x.vendorId === c.vendorId) === idx)
                  .map((mapping) => (
                    <MenuItem key={mapping.vendorId} value={mapping.vendorId}>
                      {mapping.vendorId}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Service</InputLabel>
              <Select
                value={formData.service}
                label="Service"
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                disabled={!formData.vendorId || !!editingRate}
              >
                <MenuItem value="">
                  <em>Select Service</em>
                </MenuItem>
                {customerVendorServices
                  .filter(c => c.vendorId === formData.vendorId)
                  .map((mapping) => (
                    <MenuItem key={mapping.service} value={mapping.service}>
                      {mapping.service}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Rate per GB"
              type="number"
              value={formData.ratePerGb}
              onChange={(e) => setFormData({ ...formData, ratePerGb: e.target.value })}
              placeholder="0.00"
              inputProps={{ step: "0.01", min: "0" }}
            />

            <TextField
              fullWidth
              label="Rate per Request (Optional)"
              type="number"
              value={formData.ratePerRequest}
              onChange={(e) => setFormData({ ...formData, ratePerRequest: e.target.value })}
              placeholder="0.00"
              inputProps={{ step: "0.0001", min: "0" }}
            />

            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.currency}
                label="Currency"
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="INR">INR</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingRate ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
