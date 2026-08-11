import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContributionsTrendPoint {
  periodId: string;
  label: string;
  paid: number;
  unpaid: number;
}

export const useContributionsTrend = () => {
  return useQuery({
    queryKey: ["contributions-trend"],
    queryFn: async (): Promise<ContributionsTrendPoint[]> => {
      const { data: periods, error: periodsError } = await supabase
        .from("contribution_periods")
        .select("id, label, period_month, amount_due")
        .order("period_month", { ascending: true });
      if (periodsError) throw periodsError;

      const { data: contributions, error: contribError } = await supabase
        .from("contributions")
        .select("period_id, status, amount_paid");
      if (contribError) throw contribError;

      return (periods || []).map((p) => {
        const rowsForPeriod = (contributions || []).filter(
          (c) => c.period_id === p.id
        );

        // Paid rows carry their own recorded amount.
        const paid = rowsForPeriod
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);

        // Unpaid rows don't carry their own amount yet, so each one is
        // valued at the period's amount_due (mirrors useTreasurerStats).
        const unpaid =
          rowsForPeriod.filter((c) => c.status === "unpaid").length *
          Number(p.amount_due || 0);

        return {
          periodId: p.id,
          label: p.label,
          paid,
          unpaid,
        };
      });
    },
    refetchOnWindowFocus: true,
  });
};