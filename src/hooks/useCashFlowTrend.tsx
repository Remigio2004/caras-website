import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CashFlowPoint {
  monthKey: string;
  label: string;
  net: number;
  cumulative: number;
}

function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Pulls every paid contribution, paid penalty, donation, and expense, then
// nets them out per calendar month (inflows minus outflows) and rolls that
// into a running cumulative total — i.e. how Total Funds has moved over time.
export const useCashFlowTrend = () => {
  return useQuery({
    queryKey: ["cash-flow-trend"],
    queryFn: async (): Promise<CashFlowPoint[]> => {
      const byMonth = new Map<string, number>();

      const addTo = (monthKey: string, amount: number) => {
        byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + amount);
      };

      const { data: contributions, error: contribError } = await supabase
        .from("contributions")
        .select("paid_date, amount_paid")
        .eq("status", "paid");
      if (contribError) throw contribError;
      (contributions || []).forEach((c) => {
        if (!c.paid_date) return;
        addTo(monthKeyOf(c.paid_date), Number(c.amount_paid || 0));
      });

      const { data: penalties, error: penaltyError } = await supabase
        .from("penalties")
        .select("paid_date, penalty_amount")
        .eq("status", "paid");
      if (penaltyError) throw penaltyError;
      (penalties || []).forEach((p) => {
        if (!p.paid_date) return;
        addTo(monthKeyOf(p.paid_date), Number(p.penalty_amount || 0));
      });

      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("date_received, amount");
      if (donationsError) throw donationsError;
      (donations || []).forEach((d) => {
        addTo(monthKeyOf(d.date_received), Number(d.amount || 0));
      });

      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("date_spent, amount");
      if (expensesError) throw expensesError;
      (expenses || []).forEach((e) => {
        addTo(monthKeyOf(e.date_spent), -Number(e.amount || 0));
      });

      const sortedMonths = Array.from(byMonth.keys()).sort((a, b) =>
        a.localeCompare(b)
      );

      let running = 0;
      return sortedMonths.map((monthKey) => {
        const net = byMonth.get(monthKey) || 0;
        running += net;
        const [year, month] = monthKey.split("-").map(Number);
        const label = new Date(year, month - 1).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        return { monthKey, label, net, cumulative: running };
      });
    },
    refetchOnWindowFocus: true,
  });
};