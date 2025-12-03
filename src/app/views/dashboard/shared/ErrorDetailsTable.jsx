import { useState, useEffect } from "react";
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

export default function ErrorDetailsTable({ subuserId, vendorId, period = "month" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subuserId || !vendorId) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/vendors/${vendorId}/fetch?path=/reseller/sub-user/usage-stat/errors&subuser_id=${subuserId}&period=${period}&limit=50&offset=0&datetime_aggregate=day`
        );
        
        if (res.ok) {
          const result = await res.json();
          let errorData = [];
          
          if (result.ok && result.data) {
            if (Array.isArray(result.data)) {
              errorData = result.data;
            } else if (result.data.errors && Array.isArray(result.data.errors)) {
              errorData = result.data.errors;
            } else if (result.data.usage && Array.isArray(result.data.usage)) {
              errorData = result.data.usage;
            }
            
            // Sort by date descending
            const sortedData = [...errorData].sort((a, b) => {
              const dateA = new Date(a.datetime || a.date || a.d_usage);
              const dateB = new Date(b.datetime || b.date || b.d_usage);
              return dateB - dateA;
            });
            setData(sortedData);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching error details:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subuserId, vendorId, period]);

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

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Date/Time", "Error", "Host", "Port", "Count"];
    
    const rows = data.map(item => [
      formatDate(item.datetime || item.date || item.d_usage),
      item.error || "N/A",
      item.host || "N/A",
      item.port || "N/A",
      item.count || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `error_details_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CardRoot elevation={6}>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <H4>Error Details</H4>
        <Button
          variant="contained"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={exportToCSV}
          disabled={!data.length}
          sx={{ textTransform: "none" }}
        >
          Export to CSV
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: data.length > 10 ? 440 : "auto" }}>
          <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { padding: '8px 12px' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Error</TableCell>
                <TableCell>Host</TableCell>
                <TableCell align="right">Port</TableCell>
                <TableCell align="right">Count</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.datetime || item.date || item.d_usage)}</TableCell>
                    <TableCell>{item.error || "N/A"}</TableCell>
                    <TableCell>{item.host || "N/A"}</TableCell>
                    <TableCell align="right">{item.port || "N/A"}</TableCell>
                    <TableCell align="right">{formatNumber(item.count)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No error details available
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
