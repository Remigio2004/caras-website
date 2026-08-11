import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface FundSourcesChartProps {
  contributionsCollected: number;
  penaltiesCollected: number;
  donationsCollected: number;
  isLoading?: boolean;
}

const COLORS = {
  contributions: "hsl(var(--brand-gold))",
  penalties: "hsl(var(--brand-maroon))",
  donations: "#22c55e",
};

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
}

export default function FundSourcesChart({
  contributionsCollected,
  penaltiesCollected,
  donationsCollected,
  isLoading,
}: FundSourcesChartProps) {
  const data = [
    { name: "Contributions", value: contributionsCollected, color: COLORS.contributions },
    { name: "Penalties", value: penaltiesCollected, color: COLORS.penalties },
    { name: "Donations", value: donationsCollected, color: COLORS.donations },
  ].filter((d) => d.value > 0);

  const total = contributionsCollected + penaltiesCollected + donationsCollected;

  return (
    <Card className="p-4 md:p-6 border-2">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-display font-semibold">
          Fund Sources Breakdown
        </h3>
        <p className="text-xs text-muted-foreground">
          Where Total Funds is coming from
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Loading chart...
        </div>
      ) : total === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Wala pang funds na na-record.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-56 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="40%"
                  outerRadius="90%"
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatPeso(value),
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}