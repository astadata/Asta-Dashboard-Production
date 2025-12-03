import ReactEcharts from "echarts-for-react";
import { useTheme } from "@mui/material/styles";

export default function BarChart({ data = [], height = "300px" }) {
  const theme = useTheme();

  // collect unique vendors and services
  const vendorsSet = new Set();
  const servicesSet = new Set();
  data.forEach((d) => {
    if (d.vendor) vendorsSet.add(d.vendor);
    if (d.service) servicesSet.add(d.service);
  });

  const vendors = Array.from(vendorsSet).sort();
  const services = Array.from(servicesSet).sort();

  // build map vendor -> service -> sum(trafficGb)
  const map = {};
  vendors.forEach((v) => {
    map[v] = {};
    services.forEach((s) => (map[v][s] = 0));
  });

  data.forEach((d) => {
    const v = d.vendor || "Unknown";
    const s = d.service || "Other";
    const val = parseFloat(String(d.trafficGb).replace(/,/g, "")) || 0;
    if (!map[v]) map[v] = {};
    if (map[v][s] === undefined) map[v][s] = 0;
    map[v][s] += val;
  });

  // prepare series per service (stacked)
  const colors = [
    theme.palette.primary.main,
    theme.palette.info?.main || "#36a2eb",
    theme.palette.success?.main || "#4caf50",
    theme.palette.warning?.main || "#ff9800",
    theme.palette.error?.main || "#f44336",
    theme.palette.secondary?.main || "#9c27b0"
  ];

  const series = services.map((s, idx) => ({
    name: s,
    type: "bar",
    stack: "total",
    data: vendors.map((v) => map[v][s] || 0),
    emphasis: { focus: "series" },
    itemStyle: { color: colors[idx % colors.length] }
  }));

  const option = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0, textStyle: { color: theme.palette.text.secondary } },
    grid: { left: 10, right: 10, bottom: 30, top: 40 },
    xAxis: {
      type: "category",
      data: vendors,
      axisLine: { lineStyle: { color: theme.palette.text.secondary } }
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: theme.palette.text.secondary } },
      splitLine: { lineStyle: { color: theme.palette.divider } }
    },
    series
  };

  return <ReactEcharts style={{ height }} option={option} />;
}
