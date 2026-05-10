import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getAdminUser, clearAuth, isAdminSessionValid, ADMIN_SESSION_EXPIRED_EVENT } from "@/lib/api";
import { toast } from "sonner";
import {
  LayoutDashboard, ListTodo, CalendarOff, Users2, Settings, Zap, FileText,
  MessageCircle, Crown, Clock, ChevronLeft, ChevronRight, LogOut, Shield, Megaphone, Palette,
  Menu, X, KeyRound, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { TasksPage } from "@/components/admin/TasksPage";
import { AbsencesPage } from "@/components/admin/AbsencesPage";
import { AnnouncementsPage } from "@/components/admin/AnnouncementsPage";
import { UsersTab } from "@/components/admin/UsersTab";
import { PositionsTab } from "@/components/admin/PositionsTab";
import { ApplicationsTab } from "@/components/admin/ApplicationsTab";
import { DiscordTab } from "@/components/admin/DiscordTab";
import { RolesTab } from "@/components/admin/RolesTab";
import { SiteSettingsTab } from "@/components/admin/SiteSettingsTab";
import { ThemeTab } from "@/components/admin/ThemeTab";
import { ActivityTab } from "@/components/admin/ActivityTab";
import { OwnerPanel } from "@/components/admin/OwnerPanel";
import { AuthTab } from "@/components/admin/AuthTab";
import { ProfileTab } from "@/components/admin/ProfileTab";
import pichuLogo from "@/assets/PichuMC_logo.png";

const staffItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tasks", label: "Mijn Taken", icon: ListTodo },
  { key: "absences", label: "Afmeldingen", icon: CalendarOff },
  { key: "announcements", label: "Mededelingen", icon: Megaphone },
];

const adminItems = [
  { key: "team", label: "Team", icon: Users2 },
  { key: "profile", label: "Profiel", icon: User },
  { key: "applications", label: "Sollicitaties", icon: FileText },
  { key: "positions", label: "Posities", icon: Zap },
  { key: "discord", label: "Discord", icon: MessageCircle },
  { key: "auth", label: "Auth", icon: KeyRound },
  { key: "roles", label: "Rollen", icon: Crown },
  { key: "activity", label: "Activiteit", icon: Clock },
  { key: "site-settings", label: "Teksten", icon: Settings },
  { key: "theme", label: "Thema & Kleuren", icon: Palette },
  { key: "owner", label: "Owner Panel", icon: Crown },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getAdminUser();
  const isOwner = user?.role === "eigenaar";
  const hasPerm = (perm: string) => isOwner || user?.permissions?.[perm] === true;

  useEffect(() => {
    if (!getToken() || !isAdminSessionValid()) {
      clearAuth();
      navigate("/admin/login");
      return;
    }

    const onNav = (e: any) => setActivePage(e.detail);
    const onSessionExpired = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      toast.error(detail || "Je sessie is verlopen");
      navigate("/admin/login");
    };

    window.addEventListener("admin:navigate", onNav);
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    return () => {
      window.removeEventListener("admin:navigate", onNav);
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => { clearAuth(); navigate("/admin/login"); };

  const roleName = user?.role || "Staff";

  const permMap: Record<string, string> = {
    team: "users_view", profile: "", applications: "applications_view", positions: "positions_view",
    discord: "discord_view", auth: "auth_view", roles: "roles_view", activity: "activity_view",
    "site-settings": "content_view", theme: "content_manage", announcements: "announcements_manage",
    owner: "owner_panel",
  };

  const visibleAdminItems = adminItems.filter((item) => hasPerm(permMap[item.key] || ""));

  const currentLabel =
    [...staffItems, ...adminItems].find((i) => i.key === activePage)?.label || "Dashboard";

  const NavButton = ({ item, isAdmin }: { item: { key: string; label: string; icon: React.ElementType }; isAdmin?: boolean }) => {
    const Icon = item.icon;
    const isActive = activePage === item.key;
    return (
      <button
        onClick={() => { setActivePage(item.key); setMobileOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-all duration-150",
          isActive && isAdmin
            ? "bg-destructive/15 text-destructive font-medium border border-destructive/20"
            : isActive
            ? "bg-primary text-primary-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img src={pichuLogo} alt="PichuMC" className="w-8 h-8 rounded-lg object-contain shrink-0" />
        {!collapsed && <span className="font-bold text-foreground text-sm">PichuMC Staff</span>}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Sluit menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Staff Section */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Staff</span>
        </div>
      )}
      <nav className="px-2 py-1 space-y-0.5">
        {staffItems.map((item) => (
          <NavButton key={item.key} item={item} />
        ))}
      </nav>

      {/* Admin Section */}
      {visibleAdminItems.length > 0 && (
        <>
          {!collapsed && (
            <div className="px-4 pt-5 pb-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-destructive" />
                <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Admin</span>
              </div>
            </div>
          )}
          {collapsed && <div className="my-2 mx-2 border-t border-destructive/30" />}
          <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
            {visibleAdminItems.map((item) => (
              <NavButton key={item.key} item={item} isAdmin />
            ))}
          </nav>
        </>
      )}

      {/* User info */}
      <div className="border-t border-border p-3 mt-auto">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-[10px] text-primary">{roleName}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary mx-auto">
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mt-3 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Uitloggen</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex border-t border-border p-2 text-muted-foreground hover:text-foreground items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border bg-card/95 backdrop-blur">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-foreground hover:bg-secondary"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={pichuLogo} alt="" className="w-7 h-7 rounded-md object-contain" />
        <span className="font-semibold text-sm text-foreground truncate">{currentLabel}</span>
        <div className="ml-auto w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop static, mobile drawer */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-200",
          // Desktop
          "hidden md:flex",
          collapsed ? "md:w-16" : "md:w-56",
          // Mobile drawer
          mobileOpen && "!flex fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:static animate-in slide-in-from-left"
        )}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          {activePage === "dashboard" && <AdminDashboard />}
          {activePage === "tasks" && <TasksPage />}
          {activePage === "absences" && <AbsencesPage />}
          {activePage === "announcements" && <AnnouncementsPage />}
          {activePage === "team" && <UsersTab />}
          {activePage === "profile" && <ProfileTab />}
          {activePage === "applications" && <ApplicationsTab />}
          {activePage === "positions" && <PositionsTab onRefresh={() => {}} />}
          {activePage === "discord" && <DiscordTab />}
          {activePage === "auth" && <AuthTab />}
          {activePage === "roles" && <RolesTab />}
          {activePage === "activity" && <ActivityTab />}
          {activePage === "site-settings" && <SiteSettingsTab />}
          {activePage === "theme" && <ThemeTab />}
          {activePage === "owner" && <OwnerPanel />}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
