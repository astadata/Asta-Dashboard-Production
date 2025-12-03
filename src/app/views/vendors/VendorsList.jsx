import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import useAuth from 'app/hooks/useAuth';

export default function VendorsList() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  useEffect(() => { load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);

      if (user?.email) {
        const r2 = await fetch(`/api/customers?email=${encodeURIComponent(user.email)}&includeVendorServices=true`);
        const customers = await r2.json();
        
        // Expand vendor-service mappings
        const expandedMappings = [];
        customers.forEach(customer => {
          if (customer.vendorServices && customer.vendorServices.length > 0) {
            customer.vendorServices.forEach(vs => {
              expandedMappings.push({
                id: `${customer.email}-${vs.vendor_id}-${vs.service_id}`,
                email: customer.email,
                vendorId: vs.vendor_id || vs.vendors?.id,
                service: vs.services?.name,
                subuserId: vs.subuser_id
              });
            });
          }
        });
        
        setMappings(expandedMappings);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchUsageForMapping(m) {
    try {
      const res = await fetch(`/api/vendors/${m.vendorId}/usage?subuserId=${encodeURIComponent(m.subuserId || '')}&service=${encodeURIComponent(m.service || '')}`);
      const json = await res.json();
      setResults((r) => ({ ...r, [m.id || m.email]: json }));
    } catch (e) { setResults((r) => ({ ...r, [m.id || m.email]: { ok: false, error: e.message } })); }
  }

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Vendors</Typography>
      <Card>
        <CardContent>
          <Button variant="contained" onClick={load} sx={{ mb: 2 }}>Refresh</Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Auth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>{v.slug}</TableCell>
                  <TableCell>{v.auth_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {user?.email && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Your Mappings</Typography>
            {mappings.length === 0 ? (
              <Typography variant="body2">No vendor mappings found for {user.email}</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>SubuserId</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow key={m.id || `${m.email}-${m.vendorId}`}>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{m.vendorId}</TableCell>
                      <TableCell>{m.subuserId}</TableCell>
                      <TableCell>{m.service}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => fetchUsageForMapping(m)}>Fetch Usage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {mappings.map((m) => {
              const key = m.id || m.email;
              const res = results[key];
              return res ? (
                <Box key={`res-${key}`} sx={{ mt: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Result for {m.vendorId}</Typography>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(res, null, 2)}</pre>
                </Box>
              ) : null;
            })}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
