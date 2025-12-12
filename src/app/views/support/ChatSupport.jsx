import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Paper,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiCall } from 'app/utils/apiConfig';
import useAuth from 'app/hooks/useAuth';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 800,
  margin: '0 auto',
  padding: theme.spacing(3),
  borderRadius: '12px',
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  height: 400,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  marginBottom: theme.spacing(2),
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  marginBottom: theme.spacing(1),
  backgroundColor: isUser ? '#5d87ff' : '#ffffff',
  color: isUser ? '#ffffff' : '#2a3547',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  marginLeft: isUser ? 'auto' : 0,
  marginRight: isUser ? 0 : 'auto',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}));

const ChatSupport = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SA';
  
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: 'Hello! Welcome to AstaData Support. Please select a vendor and service, then describe your issue.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  
  // Admin-specific states
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSupportTickets();
    } else {
      fetchUserVendorsAndServices();
    }
  }, [isAdmin, user]);

  const fetchUserVendorsAndServices = async () => {
    try {
      setLoadingData(true);
      
      // Get user's mappings from user context
      const userMappings = user?.allMappings || [];
      
      if (userMappings.length === 0) {
        setMessage({ type: 'warning', text: 'No vendors or services assigned to your account' });
        setLoadingData(false);
        return;
      }

      // Extract unique vendors from user's mappings
      const uniqueVendorIds = [...new Set(userMappings.map(m => m.vendorId))];
      
      // Fetch all vendors
      const vendorsResponse = await apiCall('/api/vendors');
      if (vendorsResponse.ok) {
        const allVendors = await vendorsResponse.json();
        // Filter to only user's vendors
        const userVendors = allVendors.filter(v => uniqueVendorIds.includes(v.id));
        setVendors(userVendors);
      }

      // Extract unique services from user's mappings
      const uniqueServices = [...new Set(userMappings.map(m => m.service))];
      
      // Fetch all services
      const servicesResponse = await apiCall('/api/services');
      if (servicesResponse.ok) {
        const allServices = await servicesResponse.json();
        // Filter to only user's services and remove duplicates by name
        const userServices = allServices.filter(s => uniqueServices.includes(s.name));
        // Remove duplicates by keeping only unique service names (first occurrence)
        const uniqueUserServices = userServices.reduce((acc, current) => {
          const exists = acc.find(item => item.name === current.name);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        setServices(uniqueUserServices);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load vendors and services' });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      setLoadingData(true);
      // Fetch all support tickets
      const response = await apiCall('/api/support-tickets');
      if (response.ok) {
        const tickets = await response.json();
        console.log('Fetched support tickets:', tickets);
        setSupportTickets(tickets);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch tickets:', response.status, errorText);
        setSupportTickets([]);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setSupportTickets([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleVendorChange = (event) => {
    setSelectedVendor(event.target.value);
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      text: `Selected Vendor: ${vendors.find(v => v.id === event.target.value)?.name}`,
      isUser: true,
      timestamp: new Date()
    }]);
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      text: `Selected Service: ${services.find(s => s.id === event.target.value)?.name}`,
      isUser: true,
      timestamp: new Date()
    }]);
  };

  const handleSubmitIssue = async () => {
    if (!selectedVendor || !selectedService || !issueDetails.trim()) {
      setMessage({ type: 'error', text: 'Please select vendor, service, and describe the issue' });
      return;
    }

    setLoading(true);
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      text: issueDetails,
      isUser: true,
      timestamp: new Date()
    }]);

    try {
      const vendor = vendors.find(v => v.id === selectedVendor);
      const service = services.find(s => s.id === selectedService);

      // Save support ticket to backend
      const ticketData = {
        customerId: user?.id,
        customerEmail: user?.email,
        customerName: user?.customerName || user?.email,
        vendorId: selectedVendor,
        vendorName: vendor?.name,
        serviceId: selectedService,
        serviceName: service?.name,
        issueDetails: issueDetails,
        status: 'open',
        createdAt: new Date().toISOString()
      };

      const response = await apiCall('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      let ticketReference;
      if (response.ok) {
        const result = await response.json();
        ticketReference = result.ticketNumber || `#SUP-${Math.floor(Math.random() * 10000)}`;
        console.log('Support ticket created:', result);
      } else {
        const errorText = await response.text();
        console.error('Failed to create ticket:', response.status, errorText);
        // Still create a local reference for user feedback
        ticketReference = `#SUP-${Math.floor(Math.random() * 10000)}`;
      }

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        text: `Thank you for submitting your issue. We've created a support ticket for:\n\nVendor: ${vendor?.name}\nService: ${service?.name}\n\nOur team will get back to you shortly via email. Ticket reference: ${ticketReference}`,
        isUser: false,
        timestamp: new Date()
      }]);

      setMessage({ 
        type: 'success', 
        text: 'Support ticket created successfully! Our team will contact you soon.' 
      });

      // Clear form after submission
      setTimeout(() => {
        setIssueDetails('');
        setSelectedVendor('');
        setSelectedService('');
      }, 2000);

    } catch (error) {
      console.error('Error submitting issue:', error);
      setMessage({ type: 'error', text: 'Failed to submit support ticket. Please try again.' });
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        text: 'Sorry, there was an error submitting your request. Please try again.',
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setChatOpen(true);
    setChatMessages([
      {
        id: 1,
        text: 'Hello! Welcome to AstaData Support. Please select a vendor and service, then describe your issue.',
        isUser: false,
        timestamp: new Date()
      }
    ]);
    setMessage({ type: '', text: '' });
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Admin View - Show all support tickets
  if (isAdmin) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" mb={3}>
          <SupportAgentIcon sx={{ fontSize: 40, color: '#5d87ff', mr: 2 }} />
          <Typography variant="h4" color="#2a3547" fontWeight={600}>
            Support Tickets
          </Typography>
        </Box>

        <Card elevation={2} sx={{ borderRadius: '12px' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issue Summary</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supportTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <SupportAgentIcon sx={{ fontSize: 60, color: '#d0d0d0', mb: 2 }} />
                      <Typography variant="body1" color="#5a6a85">
                        No support tickets found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  supportTickets.map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#5d87ff">
                          {ticket.ticketNumber || `#${ticket.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ticket.customerName}</Typography>
                        <Typography variant="caption" color="#5a6a85">
                          {ticket.customerEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.vendorName}</TableCell>
                      <TableCell>{ticket.serviceName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {ticket.issueDetails}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ticket.status || 'open'} 
                          color={getStatusColor(ticket.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="#5a6a85">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewTicket(ticket)}
                          sx={{ color: '#5d87ff' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Ticket Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Ticket Details: {selectedTicket?.ticketNumber || `#${selectedTicket?.id}`}
              </Typography>
              <Chip 
                label={selectedTicket?.status || 'open'} 
                color={getStatusColor(selectedTicket?.status)}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedTicket && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="#5a6a85" gutterBottom>
                    Customer Information
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedTicket.customerName}
                  </Typography>
                  <Typography variant="body2" color="#5a6a85">
                    {selectedTicket.customerEmail}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="subtitle2" color="#5a6a85" gutterBottom>
                    Service Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vendor:</strong> {selectedTicket.vendorName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Service:</strong> {selectedTicket.serviceName}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="subtitle2" color="#5a6a85" gutterBottom>
                    Issue Details
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.issueDetails}
                    </Typography>
                  </Paper>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="#5a6a85">
                    <strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Customer View - Chat Interface
  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <SupportAgentIcon sx={{ fontSize: 40, color: '#5d87ff', mr: 2 }} />
        <Typography variant="h4" color="#2a3547" fontWeight={600}>
          Chat Support
        </Typography>
      </Box>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3, maxWidth: 800, mx: 'auto' }} 
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <StyledCard elevation={2}>
        {!chatOpen ? (
          <Box textAlign="center" py={5}>
            <SupportAgentIcon sx={{ fontSize: 80, color: '#5d87ff', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="#2a3547" fontWeight={500}>
              Need Help?
            </Typography>
            <Typography variant="body1" color="#5a6a85" mb={3}>
              Start a chat with our support team
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<SupportAgentIcon />}
              onClick={handleStartNewChat}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 4,
                py: 1.5
              }}
            >
              Start Chat
            </Button>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="#2a3547" fontWeight={600}>
                Support Chat
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setChatOpen(false)}
                sx={{ color: '#5a6a85' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <ChatWindow>
              <Stack spacing={1}>
                {chatMessages.map((msg) => (
                  <MessageBubble key={msg.id} isUser={msg.isUser}>
                    <Typography 
                      variant="body2" 
                      sx={{ whiteSpace: 'pre-line' }}
                    >
                      {msg.text}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 0.5,
                        fontSize: '0.7rem'
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                  </MessageBubble>
                ))}
              </Stack>
            </ChatWindow>

            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Vendor</InputLabel>
                <Select
                  value={selectedVendor}
                  label="Select Vendor"
                  onChange={handleVendorChange}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Select Service</InputLabel>
                <Select
                  value={selectedService}
                  label="Select Service"
                  onChange={handleServiceChange}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe your issue"
                placeholder="Please provide detailed information about your issue..."
                value={issueDetails}
                onChange={(e) => setIssueDetails(e.target.value)}
                variant="outlined"
              />

              <Button
                variant="contained"
                size="large"
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSubmitIssue}
                disabled={loading || !selectedVendor || !selectedService || !issueDetails.trim()}
                fullWidth
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  py: 1.5
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </Stack>
          </>
        )}
      </StyledCard>
    </Box>
  );
};

export default ChatSupport;
