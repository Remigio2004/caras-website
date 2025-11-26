import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Image,
  Layout,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "applications",
    label: "Applications",
    icon: FileText,
    path: "/dashboard?view=applications",
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    path: "/dashboard?view=members",
  },
  {
    id: "events",
    label: "Events",
    icon: Calendar,
    path: "/dashboard?view=events",
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: Image,
    path: "/dashboard?view=gallery",
  },
  {
    id: "hero",
    label: "Hero Content",
    icon: Layout,
    path: "/dashboard?view=hero",
  },
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentView =
    new URLSearchParams(location.search).get("view") || "dashboard";

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "relative bg-primary text-primary-foreground transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-primary-foreground/20">
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display text-xl font-bold text-accent">
              CARAS
            </h1>
            <p className="text-xs text-primary-foreground/70">Admin Panel</p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="font-display font-bold text-primary text-sm">
                C
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-primary-foreground/10",
                isActive && "bg-accent text-accent-foreground font-medium"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-primary-foreground/20 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
