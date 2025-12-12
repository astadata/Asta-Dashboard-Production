import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TableContainer from "@mui/material/TableContainer";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { styled } from "@mui/material/styles";

// simple heading style
const H4 = styled("h4")(({ theme }) => ({
  margin: 0,
  marginBottom: "1rem",
  fontSize: "1rem",
  fontWeight: 500,
  textTransform: "capitalize",
  color: theme.palette.text.secondary
}));

const CardRoot = styled(Card)(({ theme }) => ({
  padding: "24px",
  marginBottom: "24px",
  [theme.breakpoints.down("sm")]: {
    padding: "16px"
  }
}));

// fake usage data for now
export const usageList = [
  {
    service: "Residential Proxy",
    vendor: "Astadata",
    date: "20 Nov 2025",
    trafficGb: "4.5",
    requests: "17,986"
  },
  {
    service: "Mobile Proxy",
    vendor: "Oxylabs",
    date: "19 Nov 2025",
    trafficGb: "2.1",
    requests: "9,432"
  },
  {
    service: "ISP",
    vendor: "Netnut",
    date: "18 Nov 2025",
    trafficGb: "3.7",
    requests: "14,220"
  }
];

export default function TopSellingTable({ usageData = usageList }) {
  // Sort data by date descending (most recent first)
  const sortedData = [...usageData].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA; // Descending order
  });

  // Format numbers with commas
  const formatNumber = (num) => {
    if (typeof num === 'string' && num.includes(',')) return num;
    return Number(num).toLocaleString();
  };

  // Format date if it's in ISO format
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (dateStr.includes('/') || dateStr.includes('Nov') || dateStr.includes('Dec')) return dateStr;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!sortedData || sortedData.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV headers
    const headers = ['Service', 'Vendor', 'Date', 'Traffic in GB', 'Requests'];
    
    // CSV rows
    const rows = sortedData.map(item => [
      item.service || 'N/A',
      item.vendor || 'N/A',
      formatDate(item.date),
      item.trafficGb || '0',
      item.requests || '0'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usage_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CardRoot elevation={6}>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <H4>Usage Summary</H4>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={exportToCSV}
          sx={{ textTransform: 'none' }}
        >
          Export to CSV
        </Button>
      </Box>

        <TableContainer sx={{ maxHeight: sortedData.length > 10 ? 440 : "auto" }}>
          <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { padding: '8px 12px' } }}>
        <TableHead>
          <TableRow>
            <TableCell>Service</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell sx={{ paddingRight: '8px' }}>Date</TableCell>
            <TableCell align="right" sx={{ paddingLeft: '8px', paddingRight: '8px' }}>Traffic in GB</TableCell>
            <TableCell align="right" sx={{ paddingLeft: '8px' }}>Requests</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.service || 'N/A'}</TableCell>
                <TableCell>{item.vendor || 'N/A'}</TableCell>
                <TableCell sx={{ paddingRight: '8px' }}>{formatDate(item.date)}</TableCell>
                <TableCell align="right" sx={{ paddingLeft: '8px', paddingRight: '8px' }}>{formatNumber(item.trafficGb)}</TableCell>
                <TableCell align="right" sx={{ paddingLeft: '8px' }}>{formatNumber(item.requests)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No usage data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </TableContainer>
    </CardRoot>
  );
}
