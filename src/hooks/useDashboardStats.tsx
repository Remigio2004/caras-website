import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get total members (approved applications)
      const { count: membersCount } = await supabase
        .from("membership_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Get pending applications
      const { count: pendingCount } = await supabase
        .from("membership_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get events count
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      return {
        totalMembers: membersCount || 0,
        pendingApplications: pendingCount || 0,
        totalEvents: eventsCount || 0,
      };
    },
  });
}
