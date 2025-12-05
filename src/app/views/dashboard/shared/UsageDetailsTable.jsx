import { useState, useEffect } from "react";
import { apiCall } from "app/utils/apiConfig";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TableContainer from "@mui/material/TableContainer";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { styled } from "@mui/material/styles";

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

export default function UsageDetailsTable({ subuserId, vendorId, period = "month" }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!subuserId || !vendorId) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiCall(
          `/api/vendors/${vendorId}/fetch?path=/reseller/sub-user/usage-stat/detail&subuser_id=${subuserId}&period=${period}&limit=50&offset=0`
        );
        
        if (res.ok) {
          const result = await res.json();
          let usageData = [];
          
          if (result.ok && result.data) {
            // Handle different response structures
            if (Array.isArray(result.data)) {
              usageData = result.data;
            } else if (result.data.usage && Array.isArray(result.data.usage)) {
              usageData = result.data.usage;
            } else if (result.data.details && Array.isArray(result.data.details)) {
              usageData = result.data.details;
            }
            
            // Sort by date descending
            const sortedData = [...usageData].sort((a, b) => {
              const dateA = new Date(a.datetime || a.d_usage);
              const dateB = new Date(b.datetime || b.d_usage);
              return dateB - dateA;
            });
            setData(sortedData);
            setFilteredData(sortedData);
          } else {
            setData([]);
            setFilteredData([]);
          }
        } else {
          setData([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error("Error fetching usage details:", err);
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subuserId, vendorId, period]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => 
        (item.host || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const formatTraffic = (traffic) => {
    // Traffic can be a string like "11.85 KB" or a number in MB
    if (typeof traffic === 'string') {
      return traffic; // Already formatted
    }
    const gb = (Number(traffic || 0) / 1000).toFixed(2);
    return `${gb} GB`;
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Date/Time", "Host", "Traffic", "Requests", "Status"];
    
    const rows = filteredData.map(item => [
      formatDate(item.datetime || item.d_usage),
      item.host || "N/A",
      formatTraffic(item.traffic),
      item.requests || item.request || 0,
      item.status || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `usage_details_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CardRoot elevation={6}>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <H4>Usage Details</H4>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Host"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ width: "250px" }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCSV}
            disabled={!filteredData.length}
            sx={{ textTransform: "none" }}
          >
            Export to CSV
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: filteredData.length > 10 ? 440 : "auto" }}>
          <Table size="small" stickyHeader sx={{ 
            '& .MuiTableCell-root': { padding: '8px 12px' },
            '& .MuiTableCell-root:nth-of-type(4)': { paddingRight: '32px' },
            '& .MuiTableCell-root:nth-of-type(5)': { paddingLeft: '32px' }
          }}>
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Host</TableCell>
                <TableCell align="right">Traffic</TableCell>
                <TableCell align="right">Requests</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.datetime || item.d_usage)}</TableCell>
                    <TableCell>{item.host || "N/A"}</TableCell>
                    <TableCell align="right">{formatTraffic(item.traffic)}</TableCell>
                    <TableCell align="right">{formatNumber(item.requests || item.request)}</TableCell>
                    <TableCell>{item.status || "N/A"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No usage details available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardRoot>
  );
}
