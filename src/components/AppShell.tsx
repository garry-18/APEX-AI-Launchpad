import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  CalendarCheck,
  Send,
  CheckSquare,
  Trophy,
  MessageSquare,
  User,
  Settings,
  Search,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Briefcase,
  MessageSquarePlus,
  Users,
  ShieldCheck,
  Building2,
  Activity,
  Clock,
  FileSpreadsheet,
  CalendarOff,
  PieChart,
  Bell,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useMyProfile } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationsProvider, useNotifications } from "@/hooks/use-notifications";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApexLogo } from "@/components/ApexLogo";
import { fetchUserRole, Role } from "@/lib/roles";

const STORAGE_KEY = "apex.sidebar.collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <NotificationsProvider>
      <AppShellInner>{children}</AppShellInner>
    </NotificationsProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<Role>("intern");
  const [hash, setHash] = useState(typeof window !== "undefined" ? window.location.hash : "");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        fetchUserRole(data.user.id).then((r) => setRole(r || "intern"));
      }
    });

    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        {
          to: "/admin/dashboard#dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          title: "Admin Dashboard",
        },
        {
          to: "/admin/dashboard#interns",
          label: "Assigned Students",
          icon: Users,
          title: "Assigned Students",
        },
        {
          to: "/admin/dashboard#questionnaire",
          label: "Questionnaire Responses",
          icon: HelpCircle,
          title: "Questionnaire Responses",
        },
        {
          to: "/admin/dashboard#lms",
          label: "LMS Progress",
          icon: BookOpen,
          title: "LMS Progress",
        },
        {
          to: "/admin/dashboard#activities",
          label: "Onboarding Activities",
          icon: Sparkles,
          title: "Onboarding Activities",
        },
        {
          to: "/admin/dashboard#interview",
          label: "1-to-1 Interviews",
          icon: Calendar,
          title: "1-to-1 Interviews",
        },
        {
          to: "/admin/dashboard#internship",
          label: "Internship Management",
          icon: Briefcase,
          title: "Internship Management",
        },
        {
          to: "/admin/dashboard#announcements",
          label: "Announcements",
          icon: Send,
          title: "Announcements",
        },
        {
          to: "/admin/dashboard#notifications",
          label: "Notifications",
          icon: Bell,
          title: "Notifications",
        },
        {
          to: "/admin/dashboard#profile",
          label: "Admin Profile",
          icon: User,
          title: "Admin Profile",
        },
        { to: "/admin/dashboard#settings", label: "Settings", icon: Settings, title: "Settings" },
        { to: "/support", label: "Help & Support", icon: HelpCircle, title: "Help & Support" },
      ];
    }
    if (role === "super_admin") {
      return [
        {
          to: "/super-admin/dashboard#dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          title: "Super Admin Dashboard",
        },
        {
          to: "/super-admin/dashboard#interns",
          label: "Students",
          icon: Users,
          title: "Student Management",
        },
        {
          to: "/super-admin/dashboard#admins",
          label: "Admins",
          icon: ShieldCheck,
          title: "Admin Management",
        },
        {
          to: "/super-admin/dashboard#problems",
          label: "Problem Statements",
          icon: Briefcase,
          title: "Problem Statements",
        },
        {
          to: "/super-admin/dashboard#questionnaire",
          label: "Questionnaire",
          icon: HelpCircle,
          title: "Questionnaire Management",
        },
        {
          to: "/super-admin/dashboard#lms",
          label: "LMS Monitoring",
          icon: BookOpen,
          title: "LMS Monitoring",
        },
        {
          to: "/super-admin/dashboard#activities",
          label: "Activities",
          icon: Sparkles,
          title: "Onboarding Activities",
        },
        {
          to: "/super-admin/dashboard#interview",
          label: "Interview",
          icon: Calendar,
          title: "1-to-1 Interviews",
        },
        {
          to: "/super-admin/dashboard#internships",
          label: "Internships",
          icon: Building2,
          title: "Internship Management",
        },
        {
          to: "/super-admin/dashboard#announcements",
          label: "Announcements",
          icon: Send,
          title: "Announcements",
        },
        {
          to: "/super-admin/dashboard#analytics",
          label: "Analytics",
          icon: PieChart,
          title: "Analytics & Reports",
        },
        {
          to: "/super-admin/dashboard#notifications",
          label: "Notifications",
          icon: Bell,
          title: "Notifications",
        },
        {
          to: "/super-admin/dashboard#profile",
          label: "Profile",
          icon: User,
          title: "Super Admin Profile",
        },
        { to: "/super-admin/dashboard#settings", label: "Settings", icon: Settings, title: "Settings" },
        { to: "/support", label: "Help & Support", icon: HelpCircle, title: "Help & Support" },
      ];
    }
    return [
      { to: "/", label: "Dashboard", icon: LayoutGrid, title: "Dashboard" },
      { to: "/student/attendance", label: "Attendance", icon: CalendarCheck, title: "Attendance" },
      { to: "/social", label: "Social Posting", icon: Send, title: "Social Posting" },
      { to: "/todo", label: "Todo List", icon: CheckSquare, title: "Todo List" },
      { to: "/student/leaderboard", label: "Leaderboard", icon: Trophy, title: "Leaderboard" },
      { to: "/student/announcements", label: "Announcements", icon: MessageSquare, title: "Announcements" },
      { to: "/diary", label: "Daily Diary", icon: BookOpen, title: "Daily Diary" },
      { to: "/pending-work", label: "Pending Work", icon: Briefcase, title: "Pending Work" },
      {
        to: "/feedback-suggestions",
        label: "Feedback & Suggestions",
        icon: MessageSquarePlus,
        title: "Feedback & Suggestions",
      },
      { to: "/profile", label: "Profile", icon: User, title: "Profile" },
      { to: "/settings", label: "Settings", icon: Settings, title: "Settings" },
      { to: "/support", label: "Help & Support", icon: HelpCircle, title: "Help & Support" },
    ];
  }, [role]);

  const current = useMemo(() => {
    return (
      navItems.find((n) => {
        if (n.to.includes("#")) {
          return n.to === pathname + hash || (hash === "" && n.to.endsWith("#dashboard"));
        }
        return n.to === pathname;
      }) ?? navItems[0]
    );
  }, [navItems, pathname, hash]);
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { unreadCount } = useNotifications();
  const showDashDot = unreadCount > 0 && pathname !== "/";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const initials = (profile?.full_name ?? profile?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-64";
  const mainOffset = collapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in-0 duration-200"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 border-r border-border bg-white flex flex-col
            w-64 ${sidebarWidth}
            transition-[width,transform] duration-300 ease-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div
            className={`px-6 pt-7 pb-6 flex items-center justify-between ${collapsed ? "lg:px-3 lg:justify-center" : ""}`}
          >
            <ApexLogo size="sm" showText={!collapsed} />
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto size-8 grid place-items-center rounded-lg hover:bg-surface-2 lg:hidden"
              aria-label="Close menu"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <nav
            className={`px-4 flex-1 space-y-1.5 overflow-y-auto relative ${collapsed ? "lg:px-2" : ""}`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.to.includes("#")
                ? item.to === pathname + hash || (hash === "" && item.to.endsWith("#dashboard"))
                : pathname === item.to;
              const isHash = item.to.includes("#");
              const link = isHash ? (
                <a
                  key={item.to}
                  href={item.to}
                  className={`group relative flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 z-10 ${
                    collapsed ? "lg:justify-center lg:px-0 lg:py-2.5 lg:w-10 lg:h-10 lg:mx-auto" : ""
                  } ${
                    active
                      ? "bg-[#FFF0E6] text-[#FF7A00] font-semibold"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <span className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`size-[18px] transition-colors duration-200 ${active ? "text-[#FF7A00]" : "text-[#6B7280] group-hover:text-[#111827]"}`}
                    />
                    {item.to === "/" && showDashDot && (
                      <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#FF7A00] ring-2 ring-white animate-pulse" />
                    )}
                  </span>
                  <span className={`flex-1 truncate ${collapsed ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 z-10 ${
                    collapsed ? "lg:justify-center lg:px-0 lg:py-2.5 lg:w-10 lg:h-10 lg:mx-auto" : ""
                  } ${
                    active
                      ? "bg-[#FFF0E6] text-[#FF7A00] font-semibold"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <span className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`size-[18px] transition-colors duration-200 ${active ? "text-[#FF7A00]" : "text-[#6B7280] group-hover:text-[#111827]"}`}
                    />
                    {item.to === "/" && showDashDot && (
                      <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#FF7A00] ring-2 ring-white animate-pulse" />
                    )}
                  </span>
                  <span className={`flex-1 truncate ${collapsed ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
              return collapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="hidden lg:block">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

          <div
            className={`m-4 p-3 rounded-xl bg-surface-2/60 border border-border flex items-center gap-3 ${collapsed ? "lg:flex-col lg:p-2 lg:m-2" : ""}`}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-9 shrink-0 rounded-full bg-[#FFF0E6] grid place-items-center text-xs font-semibold text-[#FF7A00] border border-[#FF7A00]/10">
                {initials}
              </div>
            )}
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <div className="text-sm font-semibold leading-tight truncate text-[#111827]">
                {profile?.full_name ?? "Member"}
              </div>
              <div className="text-xs text-[#6B7280] truncate">{profile?.email ?? ""}</div>
            </div>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    aria-label="Sign out"
                    className="size-8 grid place-items-center rounded-lg hover:bg-hover text-[#6B7280] hover:text-[#111827] transition"
                  >
                    <LogOut className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">
                  Sign out
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={signOut}
                title="Sign out"
                className="size-8 grid place-items-center rounded-lg hover:bg-hover text-[#6B7280] hover:text-[#111827] transition"
              >
                <LogOut className="size-[18px]" />
              </button>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:grid absolute -right-3 top-20 size-6 place-items-center rounded-full bg-white border border-border text-[#6B7280] hover:text-[#111827] hover:bg-hover shadow-sm transition"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </aside>

        {/* Main */}
        <div
          className={`flex-1 min-w-0 w-full ${mainOffset} transition-[margin] duration-300 ease-out`}
        >
          <header className="sticky top-0 z-30 h-[72px] px-6 sm:px-8 lg:px-10 flex items-center justify-between gap-4 border-b border-border bg-white/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="size-10 grid place-items-center rounded-full bg-surface-2/60 border border-border hover:bg-surface-2 hover:text-foreground text-muted-foreground transition lg:hidden"
              >
                <Menu className="size-[18px]" />
              </button>
              <div className="flex items-center gap-3">
                <ApexLogo size="sm" />
                <div className="h-5 w-px bg-border hidden sm:block" />
                <h1 className="text-base font-bold tracking-tight text-[#111827] hidden sm:block">
                  {current.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-80 hidden md:block">
                <Search className="size-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  placeholder="Search..."
                  className="w-full h-[38px] rounded-lg bg-[#FAFAFA] border border-border pl-9.5 pr-4 text-sm placeholder:text-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all duration-200"
                />
              </div>
              <button
                aria-label="Search"
                className="size-10 grid place-items-center rounded-full bg-surface-2/60 border border-border hover:bg-surface-2 hover:text-foreground text-muted-foreground transition md:hidden"
              >
                <Search className="size-[18px]" />
              </button>
              <NotificationBell />
            </div>
          </header>
          <main className="p-6 sm:p-8 lg:p-10 max-w-full overflow-x-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
