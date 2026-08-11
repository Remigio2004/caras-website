import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { PenaltiesTrendPoint } from "@/hooks/usePenaltiesTrend";

interface PenaltiesTrendChartProps {
  data: PenaltiesTrendPoint[];
  isLoading?: boolean;
}

function formatPesoShort(amount: number) {
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}k`;
  return `₱${amount}`;
}

export default function PenaltiesTrendChart({
  data,
  isLoading,
}: PenaltiesTrendChartProps) {
  return (
    <Card className="p-4 md:p-6 border-2">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-display font-semibold">
          Monthly Penalties Summary
        </h3>
        <p className="text-xs text-muted-foreground">
          Per month, oldest to newest
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Loading chart...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Wala pang penalty records.
        </div>
      ) : (
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatPesoShort}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                cursor={false}
                formatter={(value: number) => [
                  `₱${value.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}`,
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="incurred"
                name="Incurred"
                fill="hsl(var(--brand-maroon))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="collected"
                name="Collected"
                fill="hsl(var(--brand-gold))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outstanding"
                name="Outstanding"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}