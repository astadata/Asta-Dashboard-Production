import { Small } from "app/components/Typography";
import { MatxProgressBar, SimpleCard } from "app/components";
import { usageList } from "./TopSellingTable";

export default function Campaigns({ title = "Usage Split by Vendor", topN = 6 }) {
  // aggregate trafficGb per vendor
  const totals = {};
  let grandTotal = 0;

  usageList.forEach((row) => {
    const v = row.vendor || "Unknown";
    const val = parseFloat(String(row.trafficGb).replace(/,/g, "")) || 0;
    totals[v] = (totals[v] || 0) + val;
    grandTotal += val;
  });

  const vendors = Object.keys(totals)
    .map((v) => ({ vendor: v, value: totals[v] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);

  return (
    <div>
      <SimpleCard title={title}>
        {vendors.map((v) => {
          const percent = grandTotal > 0 ? Math.round((v.value / grandTotal) * 100) : 0;
          return (
            <div key={v.vendor} style={{ marginBottom: 8 }}>
              <Small color="text.secondary" display="block">
                {v.vendor}
              </Small>
              <MatxProgressBar value={percent} color="primary" text={`${v.vendor} (${v.value} GB)`} />
            </div>
          );
        })}
      </SimpleCard>
    </div>
  );
}
