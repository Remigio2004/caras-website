import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { CashFlowPoint } from "@/hooks/useCashFlowTrend";

interface CashFlowTrendChartProps {
  data: CashFlowPoint[];
  isLoading?: boolean;
}

function formatPesoShort(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}₱${(abs / 1000).toFixed(1)}k`;
  return `${sign}₱${abs}`;
}

export default function CashFlowTrendChart({
  data,
  isLoading,
}: CashFlowTrendChartProps) {
  return (
    <Card className="p-4 md:p-6 border-2">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-display font-semibold">
          Monthly Cash Flow
        </h3>
        <p className="text-xs text-muted-foreground">
          Cumulative Total Funds over time
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Loading chart...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Wala pang data para sa cash flow.
        </div>
      ) : (
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                width={52}
              />
              <Tooltip
                cursor={false}
                formatter={(value: number) => [
                  `₱${value.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}`,
                  "Total Funds",
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
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--brand-gold))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--brand-gold))", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}