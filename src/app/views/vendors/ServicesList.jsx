import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import { CUSTOMER_VENDORS, CUSTOMER_SERVICES } from 'app/utils/vendorServiceConfig';

// Mapping of vendors to their available services
const VENDOR_SERVICES_MAP = {
  "Astadata": ["Data Center Proxy", "ISP", "Mobile Proxy", "Residential Proxy"],
  "Dataimpulse": ["Mobile Proxy", "Residential Proxy"],
  "Decodo": ["Residential Proxy", "Data Center Proxy"],
  "Geonode": ["Residential Proxy", "Mobile Proxy"],
  "Hydraproxy": ["Residential Proxy", "ISP"],
  "Infatica": ["Residential Proxy", "Mobile Proxy"],
  "Luna Proxy": ["Residential Proxy", "ISP"],
  "Netnut": ["Residential Proxy", "Data Center Proxy", "ISP"],
  "Novada": ["Residential Proxy", "Mobile Proxy"],
  "Oxylabs": ["Residential Proxy", "Data Center Proxy", "Mobile Proxy", "Web Unblocker", "web Scraper API"],
  "Packet Stream": ["Residential Proxy"],
  "Proxies.fo": ["Residential Proxy", "Data Center Proxy"],
  "Proxy Cheap": ["Residential Proxy", "Data Center Proxy", "ISP", "Mobile Proxy"],
  "PyProxy": ["Residential Proxy", "Data Center Proxy"],
  "Rayobyte": ["Residential Proxy", "Data Center Proxy", "ISP"],
  "Scraper API": ["web Scraper API", "Web Unblocker"],
  "SOAX": ["Residential Proxy", "Mobile Proxy", "ISP"]
};

export default function ServicesList() {
  // Get custom color for service type
  const getServiceColor = (service) => {
    const colorMap = {
      "Mobile Proxy": "#9C27B0", // Purple
      "Residential Proxy": "#2196F3", // Blue
      "Data Center Proxy": "#DAA520", // Mustard/Goldenrod
      "ISP": "#4CAF50", // Green
      "web Scraper API": "#8B00FF", // Violet
      "Web Unblocker": "#00CED1" // Cyan
    };
    return colorMap[service] || "#757575";
  };

  return (
    <Box sx={{ m: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Vendor Services</Typography>
      
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Overview of all vendors and their available proxy services
          </Typography>
          
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Available Services</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'center' }}>Service Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CUSTOMER_VENDORS.map((vendor) => {
                const services = VENDOR_SERVICES_MAP[vendor] || [];
                return (
                  <TableRow key={vendor} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{vendor}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {services.length > 0 ? (
                          services.map((service) => (
                            <Chip
                              key={service}
                              label={service}
                              size="small"
                              sx={{ 
                                fontSize: '0.75rem',
                                backgroundColor: getServiceColor(service),
                                color: '#fff',
                                fontWeight: 500
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No services configured
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={services.length} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service Summary Card */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Service Type Summary</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Service Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Number of Vendors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CUSTOMER_SERVICES.map((service) => {
                const vendorCount = CUSTOMER_VENDORS.filter(
                  vendor => VENDOR_SERVICES_MAP[vendor]?.includes(service)
                ).length;
                return (
                  <TableRow key={service} hover>
                    <TableCell>
                      <Chip
                        label={service}
                        size="small"
                        sx={{ 
                          backgroundColor: getServiceColor(service),
                          color: '#fff',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={vendorCount} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
