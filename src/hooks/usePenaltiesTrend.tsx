import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PenaltiesTrendPoint {
  monthKey: string;
  label: string;
  incurred: number;
  collected: number;
  outstanding: number;
}

// Groups all penalty records by the month of date_absent, then sums the
// total amount incurred that month vs. how much of it has actually been
// collected (status = "paid"). Mirrors useContributionsTrend's shape so
// PenaltiesTrendChart can reuse the same chart styling.
export const usePenaltiesTrend = () => {
  return useQuery({
    queryKey: ["penalties-trend"],
    queryFn: async (): Promise<PenaltiesTrendPoint[]> => {
      const { data, error } = await supabase
        .from("penalties")
        .select("date_absent, penalty_amount, status")
        .order("date_absent", { ascending: true });
      if (error) throw error;

      const byMonth = new Map<string, { incurred: number; collected: number }>();

      (data || []).forEach((p) => {
        const d = new Date(p.date_absent);
        const monthKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;

        const entry = byMonth.get(monthKey) || { incurred: 0, collected: 0 };
        entry.incurred += Number(p.penalty_amount || 0);
        if (p.status === "paid") {
          entry.collected += Number(p.penalty_amount || 0);
        }
        byMonth.set(monthKey, entry);
      });

      return Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, totals]) => {
          const [year, month] = monthKey.split("-").map(Number);
          const label = new Date(year, month - 1).toLocaleDateString(
            "en-US",
            { month: "short", year: "numeric" }
          );
          return {
            monthKey,
            label,
            ...totals,
            outstanding: totals.incurred - totals.collected,
          };
        });
    },
    refetchOnWindowFocus: true,
  });
};