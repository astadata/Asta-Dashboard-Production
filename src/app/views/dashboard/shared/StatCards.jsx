import { useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid2";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Group from "@mui/icons-material/Group";
import AttachMoney from "@mui/icons-material/AttachMoney";
import Storage from "@mui/icons-material/Storage";
import SwapCalls from "@mui/icons-material/SwapCalls";
import ArrowRightAlt from "@mui/icons-material/ArrowRightAlt";
import { Small } from "app/components/Typography";

// STYLED COMPONENTS
const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px !important",
  background: theme.palette.background.paper,
  [theme.breakpoints.down("sm")]: { padding: "16px !important" }
}));

const ContentBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  "& small": { 
    color: "#0d6b6b", 
    fontSize: "13px",
    fontWeight: "400",
    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif"
  },
  "& .icon": { opacity: 0.6, fontSize: "38px", color: theme.palette.primary.main }
}));

const Heading = styled("h6")(({ theme }) => ({
  margin: 0,
  marginTop: "4px",
  fontSize: "13px",
  fontWeight: "500",
  color: theme.palette.primary.main
}));

export default function StatCards({ usageData = [], customerRate = null }) {
  // Calculate totals from usage data (memoized for performance)
  const totalBandwidth = useMemo(() => 
    usageData.reduce((sum, item) => sum + (Number(item.trafficGb) || 0), 0),
    [usageData]
  );
  
  const totalRequests = useMemo(() => 
    usageData.reduce((sum, item) => sum + (Number(item.requests) || 0), 0).toLocaleString(),
    [usageData]
  );
  
  // Calculate total spend: rate per GB * total bandwidth (memoized)
  const totalSpend = useMemo(() => 
    customerRate && customerRate.ratePerGb 
      ? (totalBandwidth * Number(customerRate.ratePerGb)).toFixed(2)
      : "0.00",
    [customerRate, totalBandwidth]
  );
  
  // Memoize card list to prevent recreation on every render
  const cardList = useMemo(() => [
    { name: "Total Bandwidth Usage", amount: `${totalBandwidth.toFixed(2)} GB`, Icon: Storage },
    { name: "Total Requests", amount: totalRequests, Icon: SwapCalls },
    { name: "Total Spend", amount: `$${totalSpend}`, Icon: AttachMoney }
  ], [totalBandwidth, totalRequests, totalSpend]);

  return (
    <Grid container spacing={3} sx={{ mb: "24px" }}>
      {cardList.map(({ amount, Icon, name, color }) => (
        <Grid size={{ md: 4, xs: 12 }} key={name}>
          <StyledCard elevation={6}>
            <ContentBox>
              {name === "Wallet Balance" ? (
                <Box className="icon" sx={{ color: "#FFC107", fontSize: "44px" }}>$$</Box>
              ) : (
                <Icon className="icon" sx={color ? { color: color } : {}} />
              )}

              <Box ml="12px">
                <Small>{name}</Small>
                <Heading style={color ? { color: color } : name === "Wallet Balance" ? { color: "#FFC107" } : {}}>{amount}</Heading>
              </Box>
            </ContentBox>

            <Tooltip title="View Details" placement="top">
              <IconButton>
                <ArrowRightAlt />
              </IconButton>
            </Tooltip>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );
}
