import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTreasurerStats = () => {
  return useQuery({
    queryKey: ["treasurer-stats"],
    queryFn: async () => {
      // Paid contributions — actual amounts already collected
      const { data: paidContributions, error: paidContribError } =
        await supabase
          .from("contributions")
          .select("amount_paid")
          .eq("status", "paid");
      if (paidContribError) throw paidContribError;

      const contributionsCollected = (paidContributions || []).reduce(
        (sum, c) => sum + Number(c.amount_paid || 0),
        0
      );

      // Unpaid contributions — they don't carry their own amount until
      // paid, so the outstanding value comes from each row's period
      // amount_due instead.
      const { data: unpaidContributions, error: unpaidContribError } =
        await supabase
          .from("contributions")
          .select("period_id, contribution_periods(amount_due)")
          .eq("status", "unpaid");
      if (unpaidContribError) throw unpaidContribError;

      const contributionsOutstanding = (unpaidContributions || []).reduce(
        (sum, c: any) =>
          sum + Number(c.contribution_periods?.amount_due || 0),
        0
      );

      // Paid penalties
      const { data: paidPenalties, error: paidPenaltyError } = await supabase
        .from("penalties")
        .select("penalty_amount")
        .eq("status", "paid");
      if (paidPenaltyError) throw paidPenaltyError;

      const penaltiesCollected = (paidPenalties || []).reduce(
        (sum, p) => sum + Number(p.penalty_amount || 0),
        0
      );

      // Unpaid penalties — these DO carry their own amount already
      const { data: unpaidPenalties, error: unpaidPenaltyError } =
        await supabase
          .from("penalties")
          .select("penalty_amount")
          .eq("status", "unpaid");
      if (unpaidPenaltyError) throw unpaidPenaltyError;

      const penaltiesOutstanding = (unpaidPenalties || []).reduce(
        (sum, p) => sum + Number(p.penalty_amount || 0),
        0
      );

      // All donations received
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("amount");
      if (donationsError) throw donationsError;

      const donationsCollected = (donations || []).reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      // All expenses recorded
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount");
      if (expensesError) throw expensesError;

      const expensesTotal = (expenses || []).reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      return {
        totalFunds:
          contributionsCollected +
          penaltiesCollected +
          donationsCollected -
          expensesTotal,
        contributionsCollected,
        penaltiesCollected,
        donationsCollected,
        expensesTotal,
        totalOutstanding: contributionsOutstanding + penaltiesOutstanding,
      };
    },
    refetchOnWindowFocus: true,
  });
};