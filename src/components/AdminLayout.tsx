import React, { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutGrid, Users, HelpCircle, BookOpen, Sparkles, Calendar, Briefcase, 
  Send, Bell, User, Settings, ShieldCheck, Search, LogOut, Menu, X, ChevronDown, ChevronRight,
  Clock, FileText, Activity, CheckSquare, ListTodo, AlertCircle
} from "lucide-react";
import { ApexLogo } from "./ApexLogo";
import { toast } from "sonner";

// Menu configuration type
export interface MenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: MenuItem[];
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// Sidebars menu configuration matching rules
const getSidebarMenu = (role: string): MenuGroup[] => {
  const isSuperAdmin = role === "super_admin";

  const menu: MenuGroup[] = [
    {
      title: "Dashboard",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutGrid
        }
      ]
    },
    {
      title: "Interns",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/interns/onboarding" : "/admin/interns/onboarding",
          label: "Onboarding",
          icon: ShieldCheck
        },
        {
          to: isSuperAdmin ? "/super-admin/interns/active" : "/admin/interns/active",
          label: "Active Interns",
          icon: Users
        }
      ]
    },
    {
      title: "Learning",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/questionnaires" : "/admin/questionnaires",
          label: "Questionnaire",
          icon: HelpCircle
        },
        {
          to: isSuperAdmin ? "/super-admin/lms" : "/admin/lms",
          label: "LMS",
          icon: BookOpen
        },
        {
          to: isSuperAdmin ? "/super-admin/activities" : "/admin/activities",
          label: "Activities",
          icon: Sparkles
        }
      ]
    },
    {
      title: "Operations",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/operations/attendance" : "/admin/operations/attendance",
          label: "Attendance",
          icon: Calendar
        },
        {
          to: isSuperAdmin ? "/super-admin/daily-diary" : "/admin/daily-diary",
          label: "Daily Diary",
          icon: Clock
        },
        {
          to: isSuperAdmin ? "/super-admin/operations/interactions" : "/admin/operations/interactions",
          label: "1-to-1 Interactions",
          icon: Users
        }
      ]
    },
    {
      title: "Community",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/community/post-generator" : "/admin/community/post-generator",
          label: "AI Post Generator",
          icon: Activity
        },
        {
          to: isSuperAdmin ? "/super-admin/community/leaderboard" : "/admin/community/leaderboard",
          label: "Leaderboard",
          icon: Trophy
        },
        {
          to: isSuperAdmin ? "/super-admin/community/announcements" : "/admin/community/announcements",
          label: "Announcements",
          icon: Send
        }
      ]
    },
    {
      title: "Productivity",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/todo" : "/admin/todo",
          label: "Todo",
          icon: ListTodo
        },
        {
          to: isSuperAdmin ? "/super-admin/pending-work" : "/admin/pending-work",
          label: "Pending Work",
          icon: CheckSquare
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          to: isSuperAdmin ? "/super-admin/settings" : "/admin/settings",
          label: "Settings",
          icon: Settings
        }
      ]
    }
  ];

  if (isSuperAdmin) {
    menu.push({
      title: "Management",
      items: [
        {
          to: "/super-admin/problem-statements",
          label: "Problem Statements",
          icon: Briefcase
        },
        {
          to: "/super-admin/admin-management",
          label: "Admin Management",
          icon: ShieldCheck
        }
      ]
    });
  }

  return menu;
};

// Sidebar Group Component
export function SidebarGroup({ group, activePath, onNav }: { group: MenuGroup, activePath: string, onNav?: () => void }) {
  return (
    <div className="space-y-1.5 py-2">
      <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {group.title}
      </div>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.to} item={item} activePath={activePath} onNav={onNav} />
        ))}
      </div>
    </div>
  );
}

// Sidebar Item Component
export function SidebarItem({ item, activePath, onNav }: { item: MenuItem, activePath: string, onNav?: () => void }) {
  const [expanded, setExpanded] = useState(() => {
    // Keep parent node expanded if children match path
    if (item.children) {
      return item.children.some(c => activePath.startsWith(c.to));
    }
    return false;
  });

  const isActive = activePath.startsWith(item.to);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
            isActive 
              ? "bg-orange-50 text-[#FF7A00]" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </div>
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        {expanded && (
          <div className="pl-6 border-l border-gray-100 ml-5 space-y-0.5 py-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
            {item.children!.map((child) => (
              <SidebarItem key={child.to} item={child} activePath={activePath} onNav={onNav} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNav}
      className={`relative flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
        isActive 
          ? "bg-orange-50 text-[#FF7A00]" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 shrink-0" />
        <span>{item.label}</span>
      </div>
      {isActive && (
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
      )}
    </Link>
  );
}

// Global Breadcrumbs Component
export function Breadcrumb({ path }: { path: string }) {
  const segments = path.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      <Link to="/" className="hover:text-gray-600">Home</Link>
      {segments.map((seg, idx) => {
        const route = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        return (
          <React.Fragment key={route}>
            <span className="text-gray-300">/</span>
            {isLast ? (
              <span className="text-[#FF7A00] font-black">{seg.replace("-", " ")}</span>
            ) : (
              <Link to={route as any} className="hover:text-gray-600">{seg.replace("-", " ")}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// User Profile Menu Dropdown Component
export function UserMenu({ profile, onLogout }: { profile: any, onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "A";

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none hover:opacity-90 transition-opacity"
      >
        <div className="size-8 rounded-full bg-orange-100 text-[#FF7A00] border border-orange-200 flex items-center justify-center font-bold text-xs">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-black text-gray-900 leading-tight">
            {profile?.full_name || "Apex Administrator"}
          </div>
          <div className="text-[9px] font-black uppercase tracking-wider text-[#FF7A00]">
            {profile?.role?.replace("_", " ")}
          </div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-48 bg-white border border-gray-150 rounded-2xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-[9px] font-medium text-gray-400 truncate">{profile?.email}</p>
          </div>
          <Link 
            to={profile?.role === "super_admin" ? "/super-admin/settings" : "/admin/settings"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <User className="size-4 text-gray-400" />
            My Profile
          </Link>
          <Link 
            to={profile?.role === "super_admin" ? "/super-admin/settings" : "/admin/settings"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="size-4 text-gray-400" />
            Settings
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// Notification Dropdown Component
export function NotificationMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setOpen(!open)}
        className="size-8 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 relative transition-colors"
      >
        <Bell className="size-4.5" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FF7A00]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-150 rounded-2xl shadow-lg py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">Notifications</span>
            <button className="text-[9px] font-bold text-[#FF7A00] hover:underline">Mark all read</button>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            <div className="px-4 py-2 hover:bg-gray-50 flex gap-2.5 items-start">
              <div className="size-2 rounded-full bg-[#FF7A00] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">New activities submitted by Intern Amar.</p>
                <span className="text-[9px] font-medium text-gray-400">Just now</span>
              </div>
            </div>
            <div className="px-4 py-2 hover:bg-gray-50 flex gap-2.5 items-start">
              <div className="size-2 rounded-full bg-[#FF7A00] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">System Sync completed successfully.</p>
                <span className="text-[9px] font-medium text-gray-400">5 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Page Header Layout
export function PageHeader({ title, description, path }: { title: string, description: string, path: string }) {
  return (
    <div className="space-y-1.5 pb-4 border-b border-gray-100">
      <Breadcrumb path={path} />
      <h1 className="text-2xl font-black text-gray-900 leading-tight">{title}</h1>
      <p className="text-xs text-gray-500 leading-normal max-w-2xl">{description}</p>
    </div>
  );
}

// Reusable Content Container
export function ContentContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
}

// Unified Layout shell wrapper for Admin and Super Admin
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("apex.admin.collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", data.user.id)
          .maybeSingle();
        setProfile(prof);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully logged out");
    navigate({ to: "/auth", replace: true });
  };

  const handleCollapseToggle = () => {
    const nextVal = !collapsed;
    setCollapsed(nextVal);
    localStorage.setItem("apex.admin.collapsed", String(nextVal));
  };

  const menuGroups = getSidebarMenu(profile?.role || "admin");

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#FF7A00]/10 selection:text-[#FF7A00]">
      {/* Permanent Left Sidebar (Desktop) */}
      <aside 
        className={`bg-white border-r border-gray-150 hidden lg:flex flex-col shrink-0 transition-all duration-300 relative ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between gap-2.5">
          {!collapsed && <ApexLogo size="md" />}
          {collapsed && <div className="size-8 rounded-full bg-[#FF7A00] flex items-center justify-center font-black text-white text-sm">A</div>}
          <button 
            onClick={handleCollapseToggle}
            className="size-7 rounded-lg hover:bg-gray-50 flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="className" /> : <ChevronLeft className="className" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-none">
          {menuGroups.map((group) => {
            if (collapsed) {
              return (
                <div key={group.title} className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <Link 
                        key={item.to} 
                        to={item.to}
                        className={`size-12 rounded-xl flex items-center justify-center relative group transition-all ${
                          isActive ? "bg-orange-50 text-[#FF7A00]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="size-5" />
                        <span className="absolute left-16 bg-gray-900 text-white font-semibold text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-md">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            }
            return <SidebarGroup key={group.title} group={group} activePath={pathname} />;
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="size-4.5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 lg:hidden animate-in fade-in duration-300">
          <div className="w-64 h-full bg-white flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
              <ApexLogo size="md" />
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="size-8 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-none">
              {menuGroups.map((group) => (
                <SidebarGroup 
                  key={group.title} 
                  group={group} 
                  activePath={pathname} 
                  onNav={() => setIsMobileOpen(false)} 
                />
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="size-4.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-150 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="size-8 rounded-xl hover:bg-gray-50 flex lg:hidden items-center justify-center text-gray-500 hover:text-gray-900"
            >
              <Menu className="size-5" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full w-60 focus-within:ring-2 focus-within:ring-[#FF7A00]/20 focus-within:border-[#FF7A00] transition-all">
              <Search className="size-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global admin search..." 
                className="bg-transparent text-xs w-full focus:outline-none placeholder-gray-400 text-gray-800 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationMenu />
            <div className="h-4 w-px bg-gray-200" />
            <UserMenu profile={profile} onLogout={handleLogout} />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Backwards-compatible Left/Right chevron placeholders
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// Trophy Icon placeholder
function Trophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.75m-9 3.75v-3.75m1.042-3.75h6.916m-7.958-3h9a3 3 0 013 3v.375a3 3 0 01-3 3h-9a3 3 0 01-3-3V9a3 3 0 013-3z" />
    </svg>
  );
}
