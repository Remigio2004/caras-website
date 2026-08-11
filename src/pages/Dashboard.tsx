import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ApplicationsView from "@/components/dashboard/ApplicationsView";
import MembersView from "@/components/dashboard/MembersView";
import EventsView from "@/components/dashboard/EventsView";
import GalleryView from "@/components/dashboard/GalleryView";
import DocumentsView from "@/components/dashboard/DocumentsView";
import PenaltiesView from "@/components/dashboard/PenaltiesView";
import ContributionsView from "@/components/dashboard/ContributionsView";
import FinanceView from "@/components/dashboard/FinanceView";
import AdminProfileSettings from "@/components/dashboard/AdminProfileSettings";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTreasurerStats } from "@/hooks/useTreasurerStats";
import { useContributionsTrend } from "@/hooks/useContributionsTrend";
import ContributionsTrendChart from "@/components/dashboard/ContributionsTrendChart";
import { usePenaltiesTrend } from "@/hooks/usePenaltiesTrend";
import PenaltiesTrendChart from "@/components/dashboard/PenaltiesTrendChart";
import { useCashFlowTrend } from "@/hooks/useCashFlowTrend";
import CashFlowTrendChart from "@/components/dashboard/CashFlowTrendChart";
import FundSourcesChart from "@/components/dashboard/FundSourcesChart";
import TreasurerReportPreviewDialog from "@/components/dashboard/TreasurerReportPreviewDialog";
import {
  Users,
  Calendar,
  FileText,
  Wallet,
  HandCoins,
  Receipt,
  Gift,
  TrendingDown,
  AlertCircle,
  Download,
} from "lucide-react";

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: treasurerStats, isLoading: treasurerStatsLoading } =
    useTreasurerStats();
  const { data: trendData, isLoading: trendLoading } =
    useContributionsTrend();
  const { data: penaltiesTrendData, isLoading: penaltiesTrendLoading } =
    usePenaltiesTrend();
  const { data: cashFlowData, isLoading: cashFlowLoading } =
    useCashFlowTrend();
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);

  useInactivityLogout(!!user, 30 * 60 * 1000, () => navigate("/login"));

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Treasurer accounts only have access to Penalties + Profile. This is a
  // UX-level guard (sidebar hides other links already) — the RLS policies
  // on each table are still the real security boundary.
  const treasurerAllowedViews = [
    "dashboard",
    "penalties",
    "contributions",
    "finance",
    "profile",
  ];
  useEffect(() => {
    if (
      !loading &&
      user?.role === "treasurer" &&
      !treasurerAllowedViews.includes(view)
    ) {
      navigate("/dashboard?view=penalties", { replace: true });
    }
  }, [user, loading, view, navigate]);

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
      case "documents":
        return <DocumentsView />;
      case "penalties":
        return <PenaltiesView />;
      case "contributions":
        return <ContributionsView />;
      case "finance":
        return <FinanceView />;
      case "profile":
        return <AdminProfileSettings />;
      default:
        if (user.role === "treasurer") {
          return (
            <>
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-display font-bold">
                    Welcome back!
                  </h1>
                  <p className="text-muted-foreground">
                    {user.email} • Treasurer
                  </p>
                </div>
                <Button onClick={() => setReportPreviewOpen(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Treasurer stats */}
              <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatsCard
                  title="Total Funds"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.totalFunds || 0)
                  }
                  icon={Wallet}
                  description="Contributions + Donations + Penalties collected"
                />
                <StatsCard
                  title="Contributions Collected"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.contributionsCollected || 0)
                  }
                  icon={HandCoins}
                  description="All paid contributions"
                  valueClassName="text-green-600"
                />
                <StatsCard
                  title="Penalties Collected"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.penaltiesCollected || 0)
                  }
                  icon={Receipt}
                  description="All paid penalties"
                  valueClassName="text-green-600"
                />
                <StatsCard
                  title="Donations Received"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.donationsCollected || 0)
                  }
                  icon={Gift}
                  description="All donations received"
                  valueClassName="text-green-600"
                />
                <StatsCard
                  title="Total Expenses"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.expensesTotal || 0)
                  }
                  icon={TrendingDown}
                  description="All recorded expenses"
                  valueClassName="text-destructive"
                />
                <StatsCard
                  title="Outstanding"
                  value={
                    treasurerStatsLoading
                      ? "..."
                      : formatPeso(treasurerStats?.totalOutstanding || 0)
                  }
                  icon={AlertCircle}
                  description="Unpaid contributions + unpaid penalties"
                  valueClassName="text-accent"
                />
              </div>

              {/* Trend charts */}
              <div className="grid gap-4 lg:grid-cols-2">
                <ContributionsTrendChart
                  data={trendData || []}
                  isLoading={trendLoading}
                />
                <PenaltiesTrendChart
                  data={penaltiesTrendData || []}
                  isLoading={penaltiesTrendLoading}
                />
              </div>

              {/* Fund sources + cash flow */}
              <div className="grid gap-4 lg:grid-cols-2">
                <FundSourcesChart
                  contributionsCollected={treasurerStats?.contributionsCollected || 0}
                  penaltiesCollected={treasurerStats?.penaltiesCollected || 0}
                  donationsCollected={treasurerStats?.donationsCollected || 0}
                  isLoading={treasurerStatsLoading}
                />
                <CashFlowTrendChart
                  data={cashFlowData || []}
                  isLoading={cashFlowLoading}
                />
              </div>

              <TreasurerReportPreviewDialog
                open={reportPreviewOpen}
                onOpenChange={setReportPreviewOpen}
                stats={
                  treasurerStats || {
                    totalFunds: 0,
                    contributionsCollected: 0,
                    penaltiesCollected: 0,
                    donationsCollected: 0,
                    expensesTotal: 0,
                    totalOutstanding: 0,
                  }
                }
                contributionsTrend={trendData || []}
                penaltiesTrend={penaltiesTrendData || []}
                cashFlow={cashFlowData || []}
              />
            </>
          );
        }

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
