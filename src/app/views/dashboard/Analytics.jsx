import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material/styles";

import { VENDORS, SERVICES } from "app/utils/vendorServiceConfig";
import useAuth from "app/hooks/useAuth";
import StatCards from "./shared/StatCards";
import TopSellingTable, { usageList } from "./shared/TopSellingTable";
import UsageDetailsTable from "./shared/UsageDetailsTable";
import ErrorDetailsTable from "./shared/ErrorDetailsTable";
import LineChart from "./shared/LineChart";

// STYLED COMPONENTS
const ContentBox = styled("div")(({ theme }) => ({
  margin: "2rem",
  [theme.breakpoints.down("sm")]: { margin: "1rem" }
}));

const Title = styled("span")(() => ({
  fontSize: "0.85rem",
  fontWeight: "500",
  marginRight: ".5rem",
  textTransform: "capitalize"
}));

const SubTitle = styled("span")(({ theme }) => ({
  fontSize: "0.8rem",
  color: theme.palette.text.secondary
}));

const H4 = styled("h4")(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: "400",
  marginBottom: "1rem",
  textTransform: "capitalize",
  color: "#0d6b6b",
  fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif"
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "1rem",
  [theme.breakpoints.down("sm")]: { flexDirection: "column", alignItems: "flex-start", gap: "1rem" }
}));

const FilterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "1rem",
  marginBottom: "1.5rem",
  flexWrap: "wrap",
  [theme.breakpoints.down("sm")]: { flexDirection: "column" }
}));

export default function Analytics() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const [vendor, setVendor] = useState("all");
  const [service, setService] = useState("all");
  const [period, setPeriod] = useState("week");
  const [vendorsList, setVendorsList] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerRate, setCustomerRate] = useState(null);
  const [dataBalance, setDataBalance] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hasApiSupport, setHasApiSupport] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Admin-specific states
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [activeMappings, setActiveMappings] = useState([]);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SA';

  // Extract available vendors and services from activeMappings (memoized)
  const userVendors = useMemo(() => 
    activeMappings ? [...new Set(activeMappings.map(m => m.vendorId))] : [],
    [activeMappings]
  );
  
  // Filter services based on selected vendor
  const userServices = useMemo(() => {
    if (!activeMappings) return [];
    
    // If a specific vendor is selected, only show services for that vendor
    if (vendor && vendor !== "all") {
      const vendorMappings = activeMappings.filter(m => m.vendorId === vendor);
      return [...new Set(vendorMappings.map(m => m.service))];
    }
    
    // If "all" or no vendor selected, show all services
    return [...new Set(activeMappings.map(m => m.service))];
  }, [activeMappings, vendor]);

  // Fetch vendors list from API
  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await fetch('/api/vendors');
        const data = await res.json();
        setVendorsList(data);
      } catch (err) {
        console.error('Error loading vendors:', err);
      }
    }
    loadVendors();
  }, []);

  // Fetch all customers for admin users
  useEffect(() => {
    async function loadAllCustomers() {
      if (!isAdmin) return;
      
      try {
        const res = await fetch('/api/customers?includeVendorServices=true');
        const data = await res.json();
        
        // Transform each customer's vendorServices into allMappings format
        const customersWithMappings = data.map(customer => ({
          ...customer,
          allMappings: (customer.vendorServices || []).map(vs => ({
            id: customer.id,
            email: customer.email,
            customerName: customer.customerName,
            role: customer.role,
            vendorId: vs.vendor_id || vs.vendors?.id,
            service: vs.services?.name || vs.serviceName,
            subuserId: vs.subuser_id,
            vendor: vs.vendors?.name || vs.vendorName
          }))
        }));
        
        setAllCustomers(customersWithMappings);
        // Auto-select first customer if available
        if (customersWithMappings.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customersWithMappings[0].email);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
      }
    }
    loadAllCustomers();
  }, [isAdmin]);

  // Update activeMappings when customer selection or user changes
  useEffect(() => {
    if (isAdmin && selectedCustomer) {
      const customer = allCustomers.find(c => c.email === selectedCustomer);
      setActiveMappings(customer?.allMappings || []);
    } else if (user?.allMappings) {
      setActiveMappings(user.allMappings);
    } else {
      setActiveMappings([]);
    }
  }, [isAdmin, selectedCustomer, allCustomers, user?.allMappings]);

  // Memoize current mapping to avoid recalculation
  const currentMapping = useMemo(() => {
    if (!activeMappings || activeMappings.length === 0) return null;
    
    // Find exact match for both vendor AND service
    const exactMatch = activeMappings.find(
      m => m.vendorId === vendor && m.service === service
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match and "all" is selected, return first mapping
    if (vendor === "all" || service === "all") {
      return activeMappings[0];
    }
    
    // No match found - return null to show "no data" message
    return null;
  }, [activeMappings, vendor, service]);

  // If user has mappings, auto-set to first vendor/service
  useEffect(() => {
    if (activeMappings && activeMappings.length > 0) {
      setVendor(activeMappings[0].vendorId || "all");
      setService(activeMappings[0].service || "all");
    }
  }, [activeMappings]);

  // When vendor changes, reset service to first available for that vendor
  useEffect(() => {
    if (!activeMappings || activeMappings.length === 0) return;
    if (!vendor || vendor === "all") return;
    
    // Get services for the selected vendor
    const vendorMappings = activeMappings.filter(m => m.vendorId === vendor);
    
    if (vendorMappings.length > 0) {
      // Check if current service exists for this vendor
      const hasCurrentService = vendorMappings.some(m => m.service === service);
      
      if (!hasCurrentService) {
        // Always reset to first service of this vendor when switching vendors
        setService(vendorMappings[0].service);
      }
    } else {
      // No mappings for this vendor, reset to "all"
      setService("all");
    }
  }, [vendor]);

  // Fetch customer rate for current selection
  useEffect(() => {
    async function loadCustomerRate() {
      if (!currentMapping) {
        setCustomerRate(null);
        return;
      }

      try {

        // Fetch rate for this customer/vendor/service combination
        const res = await fetch(`/api/customer-rates/customer/${currentMapping.id}`);
        if (res.ok) {
          const rates = await res.json();
          // Find matching rate for current vendor and service
          const matchingRate = rates.find(
            r => r.vendorId === currentMapping.vendorId && r.service === currentMapping.service
          );
          setCustomerRate(matchingRate || null);
        } else {
          setCustomerRate(null);
        }
      } catch (err) {
        console.error('Error loading customer rate:', err);
        setCustomerRate(null);
      }
    }
    loadCustomerRate();
  }, [activeMappings, vendor, service, activeMappings.length]);

  // Fetch data balance from DataImpulse (only for DataImpulse vendor)
  useEffect(() => {
    async function loadDataBalance() {
      if (!currentMapping || !currentMapping.subuserId) {
        setDataBalance(null);
        return;
      }
      
      // Only fetch balance for DataImpulse
      if (currentMapping.vendorId !== 'vendor-dataimpulse') {
        setDataBalance('Not available');
        return;
      }

      try {
        // Fetch subuser list from DataImpulse
        const res = await fetch(
          `/api/vendors/${currentMapping.vendorId}/fetch?path=/reseller/sub-user/list&limit=100&offset=0`
        );
        
        if (res.ok) {
          const result = await res.json();
          
          if (result.ok && result.data && result.data.subusers) {
            // Find the subuser with matching subuserId
            const subuser = result.data.subusers.find(
              item => item.id === parseInt(currentMapping.subuserId)
            );
            
            if (subuser && subuser.balance_format) {
              setDataBalance(subuser.balance_format);
            } else {
              setDataBalance('Not found');
            }
          } else {
            setDataBalance('Not available');
          }
        } else {
          setDataBalance('Not available');
        }
      } catch (err) {
        console.error('Error loading data balance:', err);
        setDataBalance('Error');
      }
    }
    loadDataBalance();
  }, [currentMapping]);

  // Consolidated fetch function using useCallback for performance
  const fetchUsageData = useCallback(async () => {
    if (!currentMapping || !currentMapping.subuserId) {
      setUsageData([]);
      setHasApiSupport(false);
      setApiError('No subuser ID configured');
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(
        `/api/vendors/${currentMapping.vendorId}/usage?subuserId=${currentMapping.subuserId}&period=${period}&service=${encodeURIComponent(currentMapping.service || 'N/A')}`
      );
      
      if (res.ok) {
        const result = await res.json();
        if (result.ok && result.data) {
          setUsageData(result.data);
          setHasApiSupport(true);
        } else if (result.error) {
          setUsageData([]);
          setHasApiSupport(false);
          setApiError(result.error || 'API not configured for this vendor/service');
        } else {
          setUsageData([]);
          setHasApiSupport(false);
          setApiError('No data available');
        }
      } else if (res.status === 404 || res.status === 501) {
        setUsageData([]);
        setHasApiSupport(false);
        setApiError('API integration not available for this vendor');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUsageData([]);
        setHasApiSupport(false);
        setApiError(errorData.error || 'Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error loading usage data:', err);
      setUsageData([]);
      setHasApiSupport(false);
      setApiError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMapping, period]);

  // Fetch usage data when dependencies change
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // Auto-refresh every 1 minute using the consolidated fetch function
  useEffect(() => {
    if (!currentMapping) return;
    
    const interval = setInterval(() => {
      fetchUsageData();
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, [currentMapping, fetchUsageData]);

  // Helper function to get vendor name from ID (memoized)
  const getVendorName = useCallback((vendorId) => {
    const vendorObj = vendorsList.find(v => v.id === vendorId);
    return vendorObj?.name || vendorId;
  }, [vendorsList]);

  if (!user) {
    return (
      <ContentBox className="analytics" sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading user information...</Typography>
      </ContentBox>
    );
  }

  return (
    <Fragment>
      <ContentBox className="analytics">
        {!isAdmin && user?.customerName && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Typography sx={{ fontSize: '1.25rem', color: '#0d6b6b', fontWeight: 600 }}>
              {user.customerName}
            </Typography>
          </Box>
        )}
        
        <HeaderBox>
          <H4>Astadata Usage Overview</H4>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Card sx={{ px: 2, py: 2, bgcolor: '#FFC107', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 180 }}>
              <Title sx={{ color: '#000', mb: 0.5 }}>Data Balance</Title>
              <SubTitle sx={{ color: '#000', fontWeight: 600, fontSize: '1rem' }}>{dataBalance || 'N/A'}</SubTitle>
            </Card>
          </Box>
        </HeaderBox>

        <FilterBox>
          {isAdmin && (
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel sx={{ fontSize: "0.85rem", color: "#0d6b6b", "&.Mui-focused": { color: "#0d6b6b" } }}>Select Customer</InputLabel>
              <Select 
                value={selectedCustomer} 
                label="Select Customer" 
                onChange={(e) => setSelectedCustomer(e.target.value)}
                sx={{ 
                  fontSize: "0.85rem", 
                  color: "#0d6b6b",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" }
                }}
              >
                {[...new Set(allCustomers.map(c => c.email))].map((email) => {
                  const customer = allCustomers.find(c => c.email === email);
                  return (
                    <MenuItem key={email} value={email}>
                      {customer?.customerName || email}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontSize: "0.85rem", color: "#0d6b6b", "&.Mui-focused": { color: "#0d6b6b" } }}>Vendor</InputLabel>
            <Select 
              value={vendor} 
              label="Vendor" 
              onChange={(e) => setVendor(e.target.value)}
              sx={{ 
                fontSize: "0.85rem", 
                color: "#0d6b6b",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" }
              }}
            >
              {/* If user has mappings, show only their vendors, otherwise show all */}
              {userVendors.length > 0 ? (
                userVendors.map((v) => (
                  <MenuItem key={v} value={v}>
                    {getVendorName(v)}
                  </MenuItem>
                ))
              ) : (
                VENDORS.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v === "all" ? "All Vendors" : v}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontSize: "0.85rem", color: "#0d6b6b", "&.Mui-focused": { color: "#0d6b6b" } }}>Service</InputLabel>
            <Select 
              value={service} 
              label="Service" 
              onChange={(e) => setService(e.target.value)}
              sx={{ 
                fontSize: "0.85rem", 
                color: "#0d6b6b",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d6b6b" }
              }}
            >
              {/* If user has mappings, show only their services, otherwise show all */}
              {userServices.length > 0 ? (
                userServices.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))
              ) : (
                SERVICES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "all" ? "All Services" : s}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </FilterBox>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            {!hasApiSupport && apiError ? (
              <Card sx={{ mb: 3, p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, mb: 2, color: 'warning.main' }}>
                  ⚠️ Data Not Available
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  {apiError}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Vendor: {getVendorName(currentMapping?.vendorId || 'Unknown')} | Service: {currentMapping?.service || 'Unknown'}
                </Typography>
              </Card>
            ) : (
              <>
                <StatCards usageData={usageData} customerRate={customerRate} />

                <Card sx={{ mb: 3, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {loading ? 'Loading usage data...' : 'Usage Over Time'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        Data refreshes automatically every minute
                      </Typography>
                    </Box>
                    <FormControl sx={{ minWidth: 150 }} size="small">
                      <InputLabel sx={{ fontSize: "0.8rem" }}>Period</InputLabel>
                      <Select 
                        value={period} 
                        label="Period"
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ fontSize: "0.8rem" }}
                      >
                        <MenuItem value="week">Week</MenuItem>
                        <MenuItem value="month">Month</MenuItem>
                        <MenuItem value="3months">3 Months</MenuItem>
                        <MenuItem value="6months">6 Months</MenuItem>
                        <MenuItem value="year">Year</MenuItem>
                        <MenuItem value="2years">2 Years</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {usageData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No usage data available for the selected period
                      </Typography>
                    </Box>
                  ) : (
                    <LineChart data={usageData} service={service} height="240px" />
                  )}
                </Card>

                <TopSellingTable usageData={usageData} />

                <UsageDetailsTable 
                  subuserId={activeMappings.length > 0 ? (activeMappings.find(m => (vendor === "all" || m.vendorId === vendor) && (service === "all" || m.service === service)) || activeMappings[0])?.subuserId : null}
                  vendorId={activeMappings.length > 0 ? (activeMappings.find(m => (vendor === "all" || m.vendorId === vendor) && (service === "all" || m.service === service)) || activeMappings[0])?.vendorId : null}
                  period={period}
                />

                <ErrorDetailsTable 
                  subuserId={activeMappings.length > 0 ? (activeMappings.find(m => (vendor === "all" || m.vendorId === vendor) && (service === "all" || m.service === service)) || activeMappings[0])?.subuserId : null}
                  vendorId={activeMappings.length > 0 ? (activeMappings.find(m => (vendor === "all" || m.vendorId === vendor) && (service === "all" || m.service === service)) || activeMappings[0])?.vendorId : null}
                  period={period}
                />
              </>
            )}
          </Grid>
        </Grid>
      </ContentBox>
    </Fragment>
  );
}
