import ReactEcharts from "echarts-for-react";
import { useTheme } from "@mui/material/styles";

export default function LineChart({ data = [], service = "all", height = "240px" }) {
  const theme = useTheme();

  // Determine colors based on service type
  const isMobileProxy = service && service.toLowerCase().includes("mobile");
  const lineColor = isMobileProxy ? "#9C27B0" : "#2196F3"; // Purple for mobile, blue for residential
  const areaColor = isMobileProxy ? "rgba(156, 39, 176, 0.1)" : "rgba(33, 150, 243, 0.1)"; // Light purple or light blue

  // prepare points: parse dates and numeric values
  const points = data
    .map((d) => ({
      date: new Date(d.date),
      label: d.date,
      value: parseFloat(String(d.trafficGb).replace(/,/g, "")) || 0
    }))
    .sort((a, b) => a.date - b.date);

  const xData = points.map((p) => {
    // show day+month short
    return p.date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  });
  const yData = points.map((p) => p.value);

  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: xData,
      axisLine: { lineStyle: { color: theme.palette.text.secondary } }
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: theme.palette.text.secondary } },
      splitLine: { lineStyle: { color: theme.palette.divider } }
    },
    grid: { left: 10, right: 10, bottom: 30, top: 10 },
    series: [
      {
        data: yData,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: lineColor },
        itemStyle: { color: lineColor },
        areaStyle: { color: areaColor }
      }
    ]
  };

  return <ReactEcharts style={{ height }} option={option} />;
}
