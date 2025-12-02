import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      const { count: totalEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      const { count: pendingAdult } = await supabase
        .from("adult_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: pendingParent } = await supabase
        .from("parent_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const pendingApplications = (pendingAdult ?? 0) + (pendingParent ?? 0);

      return {
        totalMembers: totalMembers ?? 0,
        totalEvents: totalEvents ?? 0,
        pendingApplications,
      };
    },
    refetchOnWindowFocus: true,
  });
};
