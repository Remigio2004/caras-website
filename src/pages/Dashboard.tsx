import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ApplicationsView from "@/components/dashboard/ApplicationsView";
import MembersView from "@/components/dashboard/MembersView";
import EventsView from "@/components/dashboard/EventsView";
import GalleryView from "@/components/dashboard/GalleryView";
import AdminProfileSettings from "@/components/dashboard/AdminProfileSettings";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Calendar, FileText } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  useInactivityLogout(!!user, 30 * 60 * 1000, () => navigate("/login"));

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderView = () => {
    switch (view) {
      case "applications":
        return <ApplicationsView />;
      case "members":
        return <MembersView />;
      case "events":
        return <EventsView />;
      case "gallery":
        return <GalleryView />;
      case "profile":
        return <AdminProfileSettings />;
      default:
        return (
          <>
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-3xl font-display font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">
                {user.email} • {user.role || "Admin"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <StatsCard
                title="Total Members"
                value={statsLoading ? "..." : stats?.totalMembers || 0}
                icon={Users}
                description="Approved applications"
              />
              <StatsCard
                title="Events Overview"
                value={statsLoading ? "..." : stats?.totalEvents || 0}
                icon={Calendar}
                description="Total events created"
              />
              <StatsCard
                title="Pending Applications"
                value={statsLoading ? "..." : stats?.pendingApplications || 0}
                icon={FileText}
                description="Awaiting review"
              />
            </div>
          </>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">{renderView()}</div>
    </DashboardLayout>
  );
}
