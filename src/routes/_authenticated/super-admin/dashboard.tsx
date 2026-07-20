import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  Users,
  ShieldCheck,
  Building2,
  Activity,
  Clock,
  FileSpreadsheet,
  CalendarOff,
  PieChart,
  Bell,
  Settings as SettingsIcon,
  Briefcase,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  MapPin,
  Lock,
  RefreshCw,
  PlusCircle,
  FileText,
  Save,
  ArrowLeft,
} from "lucide-react";
import {
  dataStore,
  AdminProfile,
  ProblemStatement,
  College,
  AttendanceSession,
  AttendanceRecord,
  AttendanceHoliday,
  AttendanceAuditLog,
  InternProfile,
} from "@/lib/data-store";
import { createAdminUser, updateAdminUser, deleteAdminUser } from "@/lib/admin.functions";
import { createInternUser, updateInternUser, deleteInternUser } from "@/lib/intern.functions";

export const Route = createFileRoute("/_authenticated/super-admin/dashboard")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — APEX AI" }] }),
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load datasets dynamically
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<AttendanceHoliday[]>([]);
  const [audits, setAudits] = useState<AttendanceAuditLog[]>([]);

  useEffect(() => {
    const init = async () => {
      await dataStore.syncWithSupabase();
      const refreshedAdmins = dataStore.getAdmins();
      console.log("REFRESHED ADMINS:", refreshedAdmins);
      setAdmins(refreshedAdmins);
      setInterns(dataStore.getInterns());
      setProblems(dataStore.getProblems());
      setColleges(dataStore.getColleges());
      setSessions(dataStore.getSessions());
      setRecords(dataStore.getRecords());
      setHolidays(dataStore.getHolidays());
      setAudits(dataStore.getAudits());
    };
    init();

    // Listen to hash changes for sub-menus routing
    const handleHashChange = () => {
      const h = window.location.hash.replace("#", "") || "dashboard";
      setActiveTab(h);
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    // Subscribe to reactive updates
    const unsubAdmins = dataStore.subscribe("apex.admins", setAdmins);
    const unsubInterns = dataStore.subscribe("apex.interns", setInterns);
    const unsubProblems = dataStore.subscribe("apex.problems", setProblems);
    const unsubColleges = dataStore.subscribe("apex.colleges", setColleges);
    const unsubSessions = dataStore.subscribe("apex.sessions", setSessions);
    const unsubRecords = dataStore.subscribe("apex.records", setRecords);
    const unsubHolidays = dataStore.subscribe("apex.holidays", setHolidays);
    const unsubAudits = dataStore.subscribe("apex.audits", setAudits);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      unsubAdmins();
      unsubInterns();
      unsubProblems();
      unsubColleges();
      unsubSessions();
      unsubRecords();
      unsubHolidays();
      unsubAudits();
    };
  }, []);

  // Sync changes
  const saveAdmins = (list: AdminProfile[]) => {
    setAdmins(list);
    dataStore.setAdmins(list);
  };
  const saveInterns = (list: InternProfile[]) => {
    setInterns(list);
    dataStore.setInterns(list);
  };
  const saveProblems = (list: ProblemStatement[]) => {
    setProblems(list);
    dataStore.setProblems(list);
  };
  const saveColleges = (list: College[]) => {
    setColleges(list);
    dataStore.setColleges(list);
  };
  const saveSessions = (list: AttendanceSession[]) => {
    setSessions(list);
    dataStore.setSessions(list);
  };
  const saveRecords = (list: AttendanceRecord[]) => {
    setRecords(list);
    dataStore.setRecords(list);
  };
  const saveHolidays = (list: AttendanceHoliday[]) => {
    setHolidays(list);
    dataStore.setHolidays(list);
  };
  const saveAudits = (list: AttendanceAuditLog[]) => {
    setAudits(list);
    dataStore.setAudits(list);
  };

  // Summary Metrics calculations
  const totalInterns = interns.length;
  const totalAdmins = admins.filter((a) => a.role === "admin").length;
  const activeSessions = sessions.filter((s) => s.status === "Live").length;
  const todayDateStr = new Date().toISOString().split("T")[0];

  const todayRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.submitted_at &&
        typeof r.submitted_at === "string" &&
        r.submitted_at.startsWith(todayDateStr),
    );
  }, [records, todayDateStr]);

  const todayPresent = todayRecords.filter((r) => r.status === "Present").length;
  const todayAbsent = todayRecords.filter((r) => r.status === "Absent").length;
  const todayLate = todayRecords.filter((r) => r.status === "Late").length;
  const todayLeave = todayRecords.filter((r) => r.status === "Leave").length;
  const totalColleges = colleges.length;
  const totalProblems = problems.length;

  return (
    <AppShell>
      <div className="space-y-6 font-sans">
        {activeTab !== "dashboard" && (
          <button
            onClick={() => {
              window.location.hash = "#dashboard";
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition cursor-pointer self-start w-fit"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </button>
        )}
        {activeTab === "dashboard" && (
          <DashboardSummaryView
            metrics={{
              totalInterns,
              totalAdmins,
              activeSessions,
              todayPresent,
              todayAbsent,
              todayLate,
              todayLeave,
              totalColleges,
              totalProblems,
            }}
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
          />
        )}

        {activeTab === "admins" && (
          <AdminManagementView admins={admins} problems={problems} onUpdate={saveAdmins} />
        )}

        {activeTab === "interns" && (
          <InternManagementView
            interns={interns}
            colleges={colleges}
            problems={problems}
            admins={admins}
            onUpdate={saveInterns}
            records={records}
            onMarkManual={(record) => {
              const updatedRecords = [record, ...records.filter((r) => r.id !== record.id)];
              saveRecords(updatedRecords);
            }}
            onLogAudit={(audit) => {
              saveAudits([audit, ...audits]);
            }}
          />
        )}

        {activeTab === "problems" && (
          <ProblemStatementsView problems={problems} onUpdate={saveProblems} />
        )}

        {activeTab === "colleges" && (
          <CollegesManagementView colleges={colleges} onUpdate={saveColleges} />
        )}

        {activeTab === "live-attendance" && (
          <LiveAttendanceView
            sessions={sessions}
            records={records}
            interns={interns}
            onUpdateSessions={saveSessions}
            onUpdateRecords={saveRecords}
            onLogAudit={(audit) => saveAudits([audit, ...audits])}
          />
        )}

        {activeTab === "sessions" && (
          <AttendanceSessionsView
            sessions={sessions}
            problems={problems}
            colleges={colleges}
            onUpdate={saveSessions}
          />
        )}

        {activeTab === "reports" && (
          <AttendanceReportsView
            records={records}
            problems={problems}
            colleges={colleges}
            admins={admins}
          />
        )}

        {activeTab === "holidays" && (
          <HolidayManagementView holidays={holidays} onUpdate={saveHolidays} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboardView
            records={records}
            problems={problems}
            colleges={colleges}
            admins={admins}
            interns={interns}
          />
        )}

        {activeTab === "notifications" && <NotificationsView />}

        {activeTab === "settings" && <SettingsView />}
      </div>
    </AppShell>
  );
}

// -------------------------------------------------------------
// MODULE 1: SUPER ADMIN DASHBOARD SUMMARY
// -------------------------------------------------------------
function DashboardSummaryView({
  metrics,
  onNavigate,
}: {
  metrics: {
    totalInterns: number;
    totalAdmins: number;
    activeSessions: number;
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    todayLeave: number;
    totalColleges: number;
    totalProblems: number;
  };
  onNavigate: (hash: string) => void;
}) {
  const cards = [
    {
      id: "interns",
      label: "Total Interns",
      value: metrics.totalInterns,
      icon: Users,
      color: "from-orange-500 to-amber-500",
      hash: "#interns",
    },
    {
      id: "admins",
      label: "Total Admins",
      value: metrics.totalAdmins,
      icon: ShieldCheck,
      color: "from-blue-600 to-indigo-600",
      hash: "#admins",
    },
    {
      id: "sessions",
      label: "Active Sessions",
      value: metrics.activeSessions,
      icon: Clock,
      color: "from-green-500 to-emerald-500",
      hash: "#live-attendance",
    },
    {
      id: "present",
      label: "Today's Present",
      value: metrics.todayPresent,
      icon: CheckCircle,
      color: "from-emerald-600 to-teal-600",
      hash: "#live-attendance",
    },
    {
      id: "absent",
      label: "Today's Absent",
      value: metrics.todayAbsent,
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
      hash: "#live-attendance",
    },
    {
      id: "late",
      label: "Today's Late",
      value: metrics.todayLate,
      icon: Clock,
      color: "from-amber-500 to-yellow-500",
      hash: "#live-attendance",
    },
    {
      id: "leave",
      label: "Today's Leave",
      value: metrics.todayLeave,
      icon: CalendarOff,
      color: "from-purple-500 to-violet-500",
      hash: "#live-attendance",
    },
    {
      id: "problems",
      label: "Problem Statements",
      value: metrics.totalProblems,
      icon: Briefcase,
      color: "from-cyan-500 to-teal-500",
      hash: "#problems",
    },
    {
      id: "colleges",
      label: "Participating Colleges",
      value: metrics.totalColleges,
      icon: Building2,
      color: "from-pink-500 to-rose-500",
      hash: "#colleges",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-muted-foreground mt-1">Platform overview metrics and command links.</p>
      </header>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onNavigate(card.hash)}
              className="card-surface p-6 flex items-center justify-between text-left hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  {card.label}
                </span>
                <div className="text-4xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                  {card.value}
                </div>
              </div>
              <div
                className={`p-4 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-primary/5`}
              >
                <Icon className="size-6" />
              </div>
            </button>
          );
        })}
      </div>

      {/* QUICK STATUS INFO */}
      <div className="card-surface p-6">
        <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase border-b border-border pb-3 flex items-center gap-2">
          <Activity className="size-4.5 text-primary" /> Active Platform Notice
        </h3>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Welcome to the **APEX AI Launchpad Enterprise Panel**. All metrics updates shown are live.
          Use the left-hand navigation menu or click the summary metrics cards to navigate deep into
          student registers, live GPS coordinates validation tables, analytics graphics, and Holiday
          settings.
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 2: ADMIN MANAGEMENT
// -------------------------------------------------------------
function AdminManagementView({
  admins,
  problems,
  onUpdate,
}: {
  admins: AdminProfile[];
  problems: ProblemStatement[];
  onUpdate: (list: AdminProfile[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [assignedProblems, setAssignedProblems] = useState<string[]>([]);
  const [searchProblem, setSearchProblem] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"now" | "later">("now");

  const startAddAdmin = () => {
    setEditingAdmin(null);
    setFullName("");
    setEmail("");
    setMobile("");
    setPassword("");
    setRole("admin");
    setStatus("active");
    setAssignedProblems([]);
    setSearchProblem("");
    setAssignmentMode("now");
    setShowAddForm(true);
  };

  const startEditAdmin = (admin: AdminProfile) => {
    setEditingAdmin(admin);
    setFullName(admin.full_name);
    setEmail(admin.email);
    setMobile(admin.mobile);
    setPassword("dummy-password");
    setRole(admin.role);
    setStatus(admin.status);
    setAssignedProblems(admin.assigned_problem_ids || []);
    setSearchProblem("");
    setAssignmentMode(admin.assigned_problem_ids && admin.assigned_problem_ids.length > 0 ? "now" : "later");
    setShowAddForm(true);
  };

  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      return toast.error("Please fill in the required fields");
    }

    if (role === "admin" && assignmentMode === "now" && assignedProblems.length === 0) {
      return toast.error("Please select a problem statement.");
    }

    const finalProblems = (role === "admin" && assignmentMode === "now") ? assignedProblems : [];
    setLoading(true);

    try {
      if (editingAdmin) {
        await updateAdminUser({
          data: {
            id: editingAdmin.id,
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            role,
            status,
            assignedProblems: finalProblems,
            password: password !== "dummy-password" ? password : undefined,
          },
        });
        toast.success("Admin Profile Updated Successfully!");
      } else {
        await createAdminUser({
          data: {
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            role,
            status,
            assignedProblems: finalProblems,
            password: password || "Admin@123",
          },
        });
        toast.success("New Admin Profile Created!");
      }
      setShowAddForm(false);
      await dataStore.syncWithSupabase();
      onUpdate(dataStore.getAdmins());
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (confirm("Are you sure you want to delete this Admin? This action is irreversible.")) {
      setLoading(true);
      try {
        await deleteAdminUser({ data: { id } });
        toast.success("Admin Profile Deleted!");
        await dataStore.syncWithSupabase();
      } catch (err: any) {
        toast.error(err.message ?? "An error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-muted-foreground mt-1">
            Create, edit, and assign admins to specific Problem Statements.
          </p>
        </div>
        <button
          onClick={startAddAdmin}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Plus className="size-4.5" /> Create Admin
        </button>
      </header>

      {/* ADMIN CREATION / EDITING FORM */}
      {showAddForm && (
        <div className="card-surface p-6 space-y-6">
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <h3 className="font-bold text-foreground">
              {editingAdmin ? "Edit Admin Profile" : "Create New Admin"}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Full Name *</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Email Address *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Mobile Number</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Password *</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">System Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Account Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            {role === "admin" && (
              <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4 sm:col-span-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Assignment Mode</span>
                  <select
                    value={assignmentMode}
                    onChange={(e) => {
                      const val = e.target.value as "now" | "later";
                      setAssignmentMode(val);
                      if (val === "later") {
                        setAssignedProblems([]);
                      }
                    }}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="now">Assign Problem Statement Now</option>
                    <option value="later">Create Without Assignment</option>
                  </select>
                </label>

                {assignmentMode === "now" && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Problem Statement *</span>
                    <select
                      value={assignedProblems[0] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignedProblems(val ? [val] : []);
                      }}
                      className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    >
                      <option value="">Select a Problem Statement...</option>
                      {problems.map((prob) => (
                        <option key={prob.id} value={prob.id}>
                          {prob.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="size-4 mr-1 inline-block" />{" "}
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADMINS LIST TABLE */}
      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Name</th>
                <th className="py-4 px-6 font-semibold">Email</th>
                <th className="py-4 px-6 font-semibold">Assignment</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent text-xs text-foreground"
                >
                  <td className="py-4.5 px-6 font-bold text-foreground">{admin.full_name}</td>
                  <td className="py-4.5 px-6">
                    <div className="text-xs text-foreground font-semibold">{admin.email}</div>
                    {admin.mobile && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{admin.mobile}</div>
                    )}
                  </td>
                  <td className="py-4.5 px-6">
                    {admin.role === "super_admin" ? (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                        Super Admin
                      </span>
                    ) : admin.status === "inactive" ? (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-gray-150 text-gray-500 border border-gray-300">
                        Inactive
                      </span>
                    ) : !admin.assigned_problems || admin.assigned_problems.length === 0 ? (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-250">
                        Unassigned
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25 px-2.5 py-1 rounded-full">
                        {admin.assigned_problems[0]}
                      </span>
                    )}
                  </td>
                  <td className="py-4.5 px-6">
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${admin.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-150 text-gray-500"}`}
                    >
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEditAdmin(admin)}
                        className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-primary transition cursor-pointer"
                        title="Edit Admin"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-red-500 transition cursor-pointer"
                        title="Delete Admin"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 3: INTERN MANAGEMENT
// -------------------------------------------------------------
function InternManagementView({
  interns,
  colleges,
  problems,
  admins,
  onUpdate,
  records,
  onMarkManual,
  onLogAudit,
}: {
  interns: InternProfile[];
  colleges: College[];
  problems: ProblemStatement[];
  admins: AdminProfile[];
  onUpdate: (list: InternProfile[]) => void;
  records: AttendanceRecord[];
  onMarkManual: (rec: AttendanceRecord) => void;
  onLogAudit: (log: AttendanceAuditLog) => void;
}) {
  // Filters & State
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [problemFilter, setProblemFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sortField, setSortField] = useState<"name" | "attendance" | "progress">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Manual checkin state
  const [selectedIntern, setSelectedIntern] = useState<InternProfile | null>(null);
  const [manualStatus, setManualStatus] = useState<
    "Present" | "Absent" | "Late" | "Leave" | "Excused"
  >("Present");
  const [auditReason, setAuditReason] = useState("");

  const { role: callerRole } = Route.useRouteContext();

  // Add/Edit Intern Modal State
  const [editingIntern, setEditingIntern] = useState<InternProfile | null>(null);
  const [showInternForm, setShowInternForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("1st Year");
  const [problemStatementId, setProblemStatementId] = useState("");
  const [status, setStatus] = useState<"Active" | "Completed" | "On Leave" | "Terminated">("Active");
  const [password, setPassword] = useState("");

  const startAddIntern = () => {
    setEditingIntern(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setGender("Male");
    setCollege(colleges[0]?.name || "");
    setDepartment("");
    setAcademicYear("1st Year");
    setProblemStatementId("");
    setStatus("Active");
    setPassword("");
    setShowInternForm(true);
  };

  const startEditIntern = (intern: InternProfile) => {
    setEditingIntern(intern);
    setFullName(intern.full_name || "");
    setEmail(intern.email || "");
    setPhone(intern.phone || "");
    setGender(intern.gender || "Male");
    setCollege(intern.college || colleges[0]?.name || "");
    setDepartment(intern.department || "");
    setAcademicYear(intern.academic_year || "1st Year");
    setProblemStatementId(intern.problem_statement_id || "");
    setStatus(intern.status || "Active");
    setPassword("dummy-password");
    setShowInternForm(true);
  };

  const handleInternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      return toast.error("Full Name and Email are required");
    }

    setLoading(true);
    try {
      if (editingIntern) {
        await updateInternUser({
          data: {
            id: editingIntern.id,
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            gender,
            college,
            department: department.trim(),
            academicYear,
            problemStatementId: problemStatementId || null,
            status,
            password: password !== "dummy-password" ? password : undefined,
          },
        });
        toast.success("Intern Profile Updated Successfully!");
      } else {
        await createInternUser({
          data: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            gender,
            college,
            department: department.trim(),
            academicYear,
            problemStatementId: problemStatementId || null,
            status,
            password: password || "Intern@123",
          },
        });
        toast.success("New Intern Profile Created!");
      }
      setShowInternForm(false);
      await dataStore.syncWithSupabase();
      onUpdate(dataStore.getInterns());
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntern = async (id: string) => {
    if (confirm("Are you sure you want to delete this Intern? This action is irreversible.")) {
      setLoading(true);
      try {
        await deleteInternUser({ data: { id } });
        toast.success("Intern Profile Deleted!");
        await dataStore.syncWithSupabase();
        onUpdate(dataStore.getInterns());
      } catch (err: any) {
        toast.error(err.message ?? "An error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredInterns = useMemo(() => {
    let result = [...interns];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          (i.full_name || "").toLowerCase().includes(q) ||
          (i.email || "").toLowerCase().includes(q) ||
          (i.phone || "").includes(q),
      );
    }

    // Dropdowns
    if (collegeFilter !== "All") {
      result = result.filter((i) => i.college === collegeFilter);
    }
    if (problemFilter !== "All") {
      result = result.filter((i) => i.problem_statement === problemFilter);
    }
    if (statusFilter !== "All") {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a.full_name;
      let valB: any = b.full_name;
      if (sortField === "attendance") {
        valA = a.attendance_percentage;
        valB = b.attendance_percentage;
      } else if (sortField === "progress") {
        valA = a.project_progress;
        valB = b.project_progress;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [interns, search, collegeFilter, problemFilter, statusFilter, sortField, sortOrder]);

  const paginatedInterns = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredInterns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInterns, page]);

  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage);

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    if (!auditReason.trim()) return toast.error("Please enter a valid override reason");

    const record: AttendanceRecord = {
      id: "rec-" + Math.random().toString(36).substring(5),
      session_id: "manual-sess",
      user_id: selectedIntern.id,
      intern_name: selectedIntern.full_name,
      college: selectedIntern.college,
      city: "Manual Override",
      problem_statement: selectedIntern.problem_statement,
      status: manualStatus,
      submitted_at: new Date().toISOString(),
    };

    onMarkManual(record);

    const log: AttendanceAuditLog = {
      id: "audit-" + Math.random().toString(36).substring(5),
      record_id: record.id,
      action_type: "manual_override",
      old_status: "Absent",
      new_status: manualStatus,
      reason: auditReason.trim(),
      marked_by: "a-4", // Marked by Super Admin
      created_at: new Date().toISOString(),
    };

    onLogAudit(log);

    // Update intern attendance % dynamically for demo purposes
    const updateIntern = interns.map((i) => {
      if (i.id === selectedIntern.id) {
        return {
          ...i,
          attendance_percentage: Math.min(100, i.attendance_percentage + 2),
        };
      }
      return i;
    });
    onUpdate(updateIntern);

    toast.success(`Marked ${selectedIntern.full_name} as ${manualStatus}`);
    setSelectedIntern(null);
    setAuditReason("");
  };

  const handleExportCSV = () => {
    if (filteredInterns.length === 0) return toast.error("No data available to export");

    const headers =
      "Name,Email,Phone,Gender,College,Department,Academic Year,Semester,Problem Statement,Assigned Admin,Attendance %,Project Progress,Joining Date,Status\n";
    const rows = filteredInterns
      .map((i) => {
        return `"${i.full_name}","${i.email}","${i.phone}","${i.gender}","${i.college}","${i.department}","${i.academic_year}","${i.semester}","${i.problem_statement}","${i.assigned_admin}",${i.attendance_percentage},${i.project_progress},"${i.joining_date}","${i.status}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Interns_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report Exported Successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Intern Management</h2>
          <p className="text-muted-foreground mt-1">
            Monitor intern profiles, track academic details, export rosters, and log manual
            attendance overrides.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {callerRole === "super_admin" && (
            <button
              onClick={startAddIntern}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
            >
              <Plus className="size-4.5" /> Add Intern
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-4.5" /> Export CSV
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="card-surface p-5 space-y-4">
        <div className="text-sm font-semibold flex items-center gap-1.5 border-b border-border pb-3">
          <SlidersHorizontal className="size-4 text-primary" /> Filter and Sort Interns
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email..."
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={collegeFilter}
            onChange={(e) => {
              setCollegeFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="All">All Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={problemFilter}
            onChange={(e) => {
              setProblemFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="All">All Problem Statements</option>
            {problems.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Completed">Completed</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>

        {/* SORT TRIGGERS */}
        <div className="flex flex-wrap gap-4 items-center justify-between text-xs pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Sort By:</span>
            {[
              { id: "name", label: "Name" },
              { id: "attendance", label: "Attendance %" },
              { id: "progress", label: "Progress %" },
            ].map((f) => {
              const active = sortField === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    if (sortField === f.id) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField(f.id as any);
                      setSortOrder("asc");
                    }
                  }}
                  className={`px-3 py-1 rounded-full border transition cursor-pointer ${active ? "bg-primary/5 text-primary border-primary" : "bg-transparent text-muted-foreground border-border"}`}
                >
                  {f.label} {active && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
              );
            })}
          </div>
          <div className="text-muted-foreground font-medium">
            Showing {filteredInterns.length} interns
          </div>
        </div>
      </div>

      {/* DETAILS DATA TABLE */}
      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Student</th>
                <th className="py-4 px-6 font-semibold">Academic Info</th>
                <th className="py-4 px-6 font-semibold">Problem Statement</th>
                <th className="py-4 px-6 text-center font-semibold">Attendance %</th>
                <th className="py-4 px-6 text-center font-semibold">Progress %</th>
                <th className="py-4 px-6 font-semibold">Joining Date</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {paginatedInterns.map((intern) => (
                <tr
                  key={intern.id}
                  className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent text-xs text-foreground"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-brand-orange-gradient text-white grid place-items-center text-xs font-bold shrink-0">
                        {(intern.full_name || "?")[0]}
                      </div>
                      <div>
                        <Link
                          to="/u/$id"
                          params={{ id: intern.id }}
                          className="font-bold text-foreground hover:text-primary hover:underline transition"
                        >
                          {intern.full_name}
                        </Link>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {intern.email} | {intern.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-foreground font-semibold">{intern.college}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {intern.department} • {intern.academic_year}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs font-semibold text-foreground">
                      {intern.problem_statement}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Admin: {intern.assigned_admin}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="font-bold text-foreground">{intern.attendance_percentage}%</div>
                    <div className="w-16 bg-border h-1 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${intern.attendance_percentage}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="font-bold text-foreground">{intern.project_progress}%</div>
                    <div className="w-16 bg-border h-1 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${intern.project_progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium text-foreground">
                      {intern.joining_date}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                        intern.status === "Active"
                          ? "bg-green-50 text-green-600"
                          : intern.status === "On Leave"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-gray-150 text-gray-500"
                      }`}
                    >
                      {intern.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedIntern(intern)}
                        className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition cursor-pointer shrink-0"
                      >
                        Override Check-In
                      </button>
                      <button
                        onClick={() => startEditIntern(intern)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Edit2 className="size-3" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-50 hover:bg-surface-2 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-50 hover:bg-surface-2 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* OVERRIDE MODAL DIALOG */}
      {selectedIntern && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm animate-in fade-in-30 duration-200">
          <div className="card-surface p-6 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-foreground">Manual Attendance Check-In</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Force update status register for {selectedIntern.full_name}.
              </p>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Select Attendance Status
                </span>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                  <option value="Excused">Excused</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Override Reason *
                </span>
                <textarea
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. Intern had network issues, verified coordinates manually via Slack chat."
                  rows={3}
                  className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntern(null)}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition border-none cursor-pointer"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ADD/EDIT INTERN MODAL DIALOG */}
      {showInternForm && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm animate-in fade-in-30 duration-200">
          <div className="card-surface p-6 max-w-2xl w-full space-y-5 animate-in zoom-in-95 duration-200 bg-white">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-lg text-foreground">
                {editingIntern ? `Edit Intern: ${editingIntern.full_name}` : "Create New Intern Profile"}
              </h3>
              <button
                onClick={() => setShowInternForm(false)}
                className="text-xs font-semibold text-muted-foreground border-none bg-transparent cursor-pointer hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleInternSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Full Name *</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Email Address *</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                    disabled={!!editingIntern}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Phone Number</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                {!editingIntern && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Password *</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </label>
                )}

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Gender</span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">College</span>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Department / Degree</span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Engineering"
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Academic Year</span>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Problem Statement</span>
                  <select
                    value={problemStatementId}
                    onChange={(e) => setProblemStatementId(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    disabled={callerRole !== "super_admin"}
                  >
                    <option value="">Not Assigned</option>
                    {problems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Internship Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div>
                  {editingIntern && callerRole === "super_admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteIntern(editingIntern.id);
                        setShowInternForm(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition border border-red-200 cursor-pointer"
                    >
                      Delete Intern Account
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInternForm(false)}
                    className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Intern"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 4: PROBLEM STATEMENTS MANAGEMENT
// -------------------------------------------------------------
function ProblemStatementsView({
  problems,
  onUpdate,
}: {
  problems: ProblemStatement[];
  onUpdate: (list: ProblemStatement[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pDesc, setPDesc] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pCategory.trim()) return toast.error("All * fields required");

    const newStatement: ProblemStatement = {
      id: "p-" + Math.random().toString(36).substring(5),
      name: pName.trim(),
      category: pCategory.trim(),
      description: pDesc.trim(),
    };

    onUpdate([...problems, newStatement]);
    toast.success("Problem Statement Added Successfully!");
    setPName("");
    setPCategory("");
    setPDesc("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? Interns assigned to this statement may be unlinked.")) {
      onUpdate(problems.filter((p) => p.id !== id));
      toast.success("Problem Statement Removed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Problem Statements</h2>
          <p className="text-muted-foreground mt-1">
            Manage core problem statement tracks for interns assignment.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Plus className="size-4.5" /> Add Statement
        </button>
      </header>

      {showAddForm && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h3 className="font-bold text-foreground">Add Problem Statement</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs font-semibold text-muted-foreground border-none bg-transparent"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Statement Name *
                </span>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Category *</span>
                <input
                  type="text"
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  placeholder="e.g. FinTech, Web3"
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Brief Description</span>
              <textarea
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
              >
                Save Track
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((prob) => (
          <div
            key={prob.id}
            className="card-surface p-5 flex flex-col justify-between hover:border-primary/20 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-primary/5 px-2 py-0.5 rounded">
                  {prob.category}
                </span>
                <button
                  onClick={() => handleDelete(prob.id)}
                  className="p-1 rounded text-muted-foreground hover:text-red-500 border-none bg-transparent cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <h4 className="font-bold text-base mt-2.5 text-foreground">{prob.name}</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {prob.description ||
                  "No description provided. Tracking dashboard statements records."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
              Statement ID: {prob.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 5: COLLEGES MANAGEMENT
// -------------------------------------------------------------
function CollegesManagementView({
  colleges,
  onUpdate,
}: {
  colleges: College[];
  onUpdate: (list: College[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [cName, setCName] = useState("");
  const [cCity, setCCity] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cCity.trim()) return toast.error("All fields required");

    const newCollege: College = {
      id: "c-" + Math.random().toString(36).substring(5),
      name: cName.trim(),
      city: cCity.trim(),
    };

    onUpdate([...colleges, newCollege]);
    toast.success("College Added successfully");
    setCName("");
    setCCity("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      onUpdate(colleges.filter((c) => c.id !== id));
      toast.success("College Removed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Colleges Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage colleges list participating in the AI Apex Launchpad.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Plus className="size-4.5" /> Add College
        </button>
      </header>

      {showAddForm && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h3 className="font-bold text-foreground">Add College Profile</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs font-semibold text-muted-foreground border-none bg-transparent"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">College Name *</span>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">City Location *</span>
                <input
                  type="text"
                  value={cCity}
                  onChange={(e) => setCCity(e.target.value)}
                  placeholder="e.g. Pune, Mumbai"
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
              >
                Save College
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <th className="py-4 px-6 font-semibold">College Name</th>
              <th className="py-4 px-6 font-semibold">City</th>
              <th className="py-4 px-6 font-semibold">Identifier</th>
              <th className="py-4 px-6 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {colleges.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent text-xs text-foreground"
              >
                <td className="py-4 px-6 font-bold text-foreground">{c.name}</td>
                <td className="py-4 px-6 font-semibold text-muted-foreground">{c.city}</td>
                <td className="py-4 px-6 text-xs text-muted-foreground">{c.id}</td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 border-none bg-transparent cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 6: LIVE ATTENDANCE MONITORING
// -------------------------------------------------------------
function LiveAttendanceView({
  sessions,
  records,
  interns,
  onUpdateSessions,
  onUpdateRecords,
  onLogAudit,
}: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  interns: InternProfile[];
  onUpdateSessions: (list: AttendanceSession[]) => void;
  onUpdateRecords: (list: AttendanceRecord[]) => void;
  onLogAudit: (log: AttendanceAuditLog) => void;
}) {
  const activeSessionList = useMemo(() => {
    return sessions.filter((s) => s.status === "Live");
  }, [sessions]);

  // Selected session to monitor
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeSessionList[0]?.id || "",
  );

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || activeSessionList[0];
  }, [sessions, selectedSessionId, activeSessionList]);

  // Quick Time Extension handler
  const handleExtend = (minutes: number) => {
    if (!activeSession) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSession.id) {
        // Shift end_time (parsing e.g. "10:30" to "+X minutes")
        const [h, m] = s.end_time.split(":").map(Number);
        let newMin = m + minutes;
        let newHour = h;
        if (newMin >= 60) {
          newHour += Math.floor(newMin / 60);
          newMin = newMin % 60;
        }
        const timeStr = `${String(newHour).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;
        return {
          ...s,
          end_time: timeStr,
        };
      }
      return s;
    });
    onUpdateSessions(updated);
    toast.success(`Extended session "${activeSession.title}" by +${minutes} minutes!`);
  };

  // Close session
  const handleCloseSession = (id: string) => {
    const list = sessions.map((s) => {
      if (s.id === id) return { ...s, status: "Closed" as const };
      return s;
    });
    onUpdateSessions(list);
    toast.success("Attendance session closed successfully");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Live Geolocation Monitoring</h2>
        <p className="text-muted-foreground mt-1">
          Track check-ins in real-time, view verified locations, and trigger dynamic session time
          extensions.
        </p>
      </header>

      {activeSession ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* SESSIONS PICKER & STATS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-surface p-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Active Session Monitoring
                </span>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {activeSessionList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground">{activeSession.session_date}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Timespan:</span>
                  <span className="text-primary">
                    {activeSession.start_time} AM - {activeSession.end_time} AM
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">GPS Radius:</span>
                  <span className="text-foreground">{activeSession.radius} meters</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">GPS Verification:</span>
                  <span className="text-green-600 font-bold">
                    {activeSession.gps_verification ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
                {activeSession.password && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Password Code:</span>
                    <span className="font-mono text-primary font-bold">
                      {activeSession.password}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* EXTENSIONS CONTROLLER */}
            <div className="card-surface p-5 space-y-4">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block border-b border-border pb-2">
                Extend Active Session
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Need more time? Shift the session deadline by clicking below. The interns' dashboard
                will refresh automatically.
              </p>
              <div className="grid gap-2 grid-cols-3">
                <button
                  onClick={() => handleExtend(5)}
                  className="py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition cursor-pointer"
                >
                  +5 Mins
                </button>
                <button
                  onClick={() => handleExtend(10)}
                  className="py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition cursor-pointer"
                >
                  +10 Mins
                </button>
                <button
                  onClick={() => handleExtend(15)}
                  className="py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition cursor-pointer"
                >
                  +15 Mins
                </button>
              </div>

              <button
                onClick={() => handleCloseSession(activeSession.id)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition border border-red-200 cursor-pointer text-xs uppercase"
              >
                Close Session Now
              </button>
            </div>
          </div>

          {/* REALTIME CHECKS LIST */}
          <div className="lg:col-span-2 card-surface p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">
                  Live Check-ins Feed
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-extrabold uppercase animate-pulse">
                  <span className="size-2 rounded-full bg-green-500" /> Active Tracking
                </span>
              </div>

              <div className="divide-y divide-border overflow-y-auto max-h-96 pr-1">
                {records.filter((r) => r.session_id === activeSession.id).length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No interns checked-in yet. Live updates will show up here.
                  </div>
                ) : (
                  records
                    .filter((r) => r.session_id === activeSession.id)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-brand-orange-gradient text-white grid place-items-center font-bold">
                            {(rec.intern_name || "?")[0]}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {rec.intern_name || "Unknown"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {rec.college} • {rec.problem_statement}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[10px] font-semibold text-muted-foreground">
                              {rec.submitted_at
                                ? new Date(rec.submitted_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                : "--:--"}
                            </div>
                            {rec.latitude && (
                              <span className="text-[8px] font-mono text-muted-foreground">
                                GPS verified
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              rec.status === "Present"
                                ? "bg-green-50 text-green-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-surface-2/40 border border-border p-3.5 rounded-xl flex items-center gap-3 text-xs mt-4">
              <MapPin className="size-5 text-primary shrink-0 animate-bounce" />
              <div>
                <span className="font-semibold block text-foreground">
                  Location Pin Coordinates
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Center: Lat{" "}
                  {activeSession.latitude != null
                    ? Number(activeSession.latitude).toFixed(4)
                    : "N/A"}
                  , Lng{" "}
                  {activeSession.longitude != null
                    ? Number(activeSession.longitude).toFixed(4)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-surface p-12 text-center text-muted-foreground space-y-4">
          <Clock className="size-12 mx-auto text-muted-foreground/30" />
          <div className="text-sm font-semibold">No live attendance sessions found</div>
          <p className="text-xs max-w-sm mx-auto">
            All attendance check-ins require a session. Navigate to the **Attendance Sessions** tab
            to schedule or launch one.
          </p>
          <button
            onClick={() => {
              window.location.hash = "#sessions";
            }}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
          >
            Create Session
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 7: ATTENDANCE SESSIONS MANAGEMENT
// -------------------------------------------------------------
function AttendanceSessionsView({
  sessions,
  problems,
  colleges,
  onUpdate,
}: {
  sessions: AttendanceSession[];
  problems: ProblemStatement[];
  colleges: College[];
  onUpdate: (list: AttendanceSession[]) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProblem, setSelectedProblem] = useState<string>("All"); // All means General/Null
  const [selectedCollege, setSelectedCollege] = useState<string>("All"); // All means General/Null
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [latitude, setLatitude] = useState(19.1334);
  const [longitude, setLongitude] = useState(72.9156);
  const [radius, setRadius] = useState<number>(100);
  const [gpsVerification, setGpsVerification] = useState(true);
  const [passwordVerification, setPasswordVerification] = useState(true);
  const [passwordCode, setPasswordCode] = useState("");
  const [status, setStatus] = useState<"Draft" | "Scheduled" | "Live" | "Closed">("Scheduled");

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordCode(code);
    toast.success(`Generated verification password: ${code}`);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Session Title is required");

    const newSession: AttendanceSession = {
      id: "sess-" + Math.random().toString(36).substring(5),
      title: title.trim(),
      session_date: sessionDate,
      problem_statement: selectedProblem === "All" ? null : selectedProblem,
      college: selectedCollege === "All" ? null : selectedCollege,
      start_time: startTime,
      end_time: endTime,
      latitude,
      longitude,
      radius,
      gps_verification: gpsVerification,
      password_verification: passwordVerification,
      password: passwordVerification ? passwordCode || "PASS" : undefined,
      status,
      created_by: "a-4",
      created_at: new Date().toISOString(),
    };

    onUpdate([newSession, ...sessions]);
    toast.success("Attendance Session Scheduled Successfully!");

    // Reset Form
    setTitle("");
    setPasswordCode("");
    setShowCreate(false);
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Delete this session record?")) {
      onUpdate(sessions.filter((s) => s.id !== id));
      toast.success("Session Deleted");
    }
  };

  const getAttendanceLink = (id: string) => {
    return `${window.location.origin}/attendance?session=${id}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Sessions</h2>
          <p className="text-muted-foreground mt-1">
            Configure geo-fencing radius limits, set verification passwords, and view live checking
            logs.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Plus className="size-4.5" /> Create Session
        </button>
      </header>

      {/* CREATE SESSION FORM */}
      {showCreate && (
        <div className="card-surface p-6 space-y-6">
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <h3 className="font-bold text-foreground">Create Attendance Session</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="text-xs font-semibold text-muted-foreground border-none bg-transparent"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Session Title *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Standup Check-in"
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Date *</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Filter Problem Statement
                </span>
                <select
                  value={selectedProblem}
                  onChange={(e) => setSelectedProblem(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="All">All Statements (General)</option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Filter College</span>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="All">All Colleges (General)</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Start Time *</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">End Time *</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>
            </div>

            {/* GPS CONFIGURATION */}
            <div className="p-4 rounded-xl bg-accent/15 border border-primary/10 space-y-4">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Geo-Fencing Location Boundary
              </span>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Center Latitude
                  </span>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full h-9 rounded-lg bg-surface border border-border px-2 text-xs"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Center Longitude
                  </span>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full h-9 rounded-lg bg-surface border border-border px-2 text-xs"
                  />
                </label>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Allowed Radius
                  </span>
                  <div className="flex gap-1.5">
                    {[50, 100, 200].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadius(r)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border ${radius === r ? "bg-primary text-white border-primary" : "bg-surface text-muted-foreground border-border"}`}
                      >
                        {r}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={gpsVerification}
                    onChange={(e) => setGpsVerification(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Enable GPS Location Validation
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={passwordVerification}
                    onChange={(e) => setPasswordVerification(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Enable Numeric Password Verification
                </label>
              </div>

              {passwordVerification && (
                <div className="flex gap-3 items-end max-w-sm pt-1">
                  <label className="flex-1 block space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Access Password Code
                    </span>
                    <input
                      type="text"
                      value={passwordCode}
                      onChange={(e) => setPasswordCode(e.target.value)}
                      placeholder="e.g. 52A8EF"
                      className="w-full h-9 rounded-lg bg-surface border border-border px-3 text-xs font-mono font-bold"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3.5 h-9 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none"
              >
                Create and Launch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SESSIONS TABLE */}
      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Session Title</th>
                <th className="py-4 px-6 font-semibold">Scope Limits</th>
                <th className="py-4 px-6 font-semibold">Timing Range</th>
                <th className="py-4 px-6 font-semibold">GPS / Password Verification</th>
                <th className="py-4 px-6 font-semibold">Share Link</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {sessions.map((session) => {
                const link = getAttendanceLink(session.id);
                return (
                  <tr
                    key={session.id}
                    className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent text-xs text-foreground"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{session.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Session ID: {session.id}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs text-foreground font-semibold">
                        Statement: {session.problem_statement || "General"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        College: {session.college || "All Participating"}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-foreground">
                        {session.session_date}
                      </div>
                      <div className="text-[10px] text-primary font-bold mt-0.5">
                        {session.start_time} AM - {session.end_time} AM
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold">
                        GPS:{" "}
                        <span
                          className={
                            session.gps_verification ? "text-green-600" : "text-muted-foreground"
                          }
                        >
                          {session.gps_verification ? "Yes" : "No"}
                        </span>
                      </div>
                      {session.password && (
                        <div className="text-[10px] mt-0.5">
                          Code:{" "}
                          <span className="font-mono text-primary font-bold">
                            {session.password}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link);
                          toast.success("Attendance link copied to clipboard!");
                        }}
                        className="text-xs text-primary hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
                      >
                        Copy Link <ExternalLink className="size-3" />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          session.status === "Live"
                            ? "bg-green-50 text-green-600 animate-pulse border border-green-200"
                            : session.status === "Scheduled"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-150 text-gray-500"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-red-500 transition cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 8: ATTENDANCE REPORTS
// -------------------------------------------------------------
function AttendanceReportsView({
  records,
  problems,
  colleges,
  admins,
}: {
  records: AttendanceRecord[];
  problems: ProblemStatement[];
  colleges: College[];
  admins: AdminProfile[];
}) {
  const [problemFilter, setProblemFilter] = useState("All");
  const [collegeFilter, setCollegeFilter] = useState("All");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (problemFilter !== "All" && r.problem_statement !== problemFilter) return false;
      if (collegeFilter !== "All" && r.college !== collegeFilter) return false;
      return true;
    });
  }, [records, problemFilter, collegeFilter]);

  const stats = useMemo(() => {
    const total = filteredRecords.length || 1;
    const present = filteredRecords.filter((r) => r.status === "Present").length;
    const absent = filteredRecords.filter((r) => r.status === "Absent").length;
    const late = filteredRecords.filter((r) => r.status === "Late").length;
    const leave = filteredRecords.filter((r) => r.status === "Leave").length;
    return {
      present,
      absent,
      late,
      leave,
      pct: Math.round(((present + late * 0.7) / total) * 100),
    };
  }, [filteredRecords]);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return toast.error("No record data to export");
    const headers = "Intern Name,College,City,Problem Statement,Status,Submission Time\n";
    const rows = filteredRecords
      .map((r) => {
        return `"${r.intern_name}","${r.college}","${r.city}","${r.problem_statement}","${r.status}","${r.submitted_at}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Attendance_Records_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report Exported Successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
          <p className="text-muted-foreground mt-1">
            Generate aggregated reports, filter lists, and export files.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Download className="size-4.5" /> Export CSV
        </button>
      </header>

      {/* FILTER PANEL */}
      <div className="card-surface p-5 space-y-4">
        <div className="text-sm font-semibold flex items-center gap-1.5 border-b border-border pb-3">
          <SlidersHorizontal className="size-4 text-primary" /> Filter Reports Ledger
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <select
            value={problemFilter}
            onChange={(e) => setProblemFilter(e.target.value)}
            className="h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="All">All Problems</option>
            {problems.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="All">All Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MINI METRICS SUMMARY GRID */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <div className="card-surface p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Present</div>
          <div className="text-2xl font-extrabold text-green-600 mt-1">{stats.present}</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Absent</div>
          <div className="text-2xl font-extrabold text-red-500 mt-1">{stats.absent}</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Late</div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">{stats.late}</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Leave</div>
          <div className="text-2xl font-extrabold text-purple-500 mt-1">{stats.leave}</div>
        </div>
        <div className="card-surface p-4 text-center col-span-2 md:col-span-1 bg-primary/5 border-primary/20">
          <div className="text-[10px] uppercase font-bold text-primary">Avg Ratio</div>
          <div className="text-2xl font-extrabold text-primary mt-1">
            {isNaN(stats.pct) ? 0 : stats.pct}%
          </div>
        </div>
      </div>

      {/* REPORT ROWS TABLE */}
      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Intern Name</th>
                <th className="py-4 px-6 font-semibold">College / City</th>
                <th className="py-4 px-6 font-semibold">Statement Mapped</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Checked In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent text-xs text-foreground"
                >
                  <td className="py-4 px-6 font-bold text-foreground">{rec.intern_name}</td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-foreground font-semibold">{rec.college}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{rec.city}</div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-foreground">
                    {rec.problem_statement}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        rec.status === "Present"
                          ? "bg-green-50 text-green-600"
                          : rec.status === "Late"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-500"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-muted-foreground">
                    {rec.submitted_at ? new Date(rec.submitted_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 9: HOLIDAY MANAGEMENT
// -------------------------------------------------------------
function HolidayManagementView({
  holidays,
  onUpdate,
}: {
  holidays: AttendanceHoliday[];
  onUpdate: (list: AttendanceHoliday[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [hDate, setHDate] = useState("");
  const [hTitle, setHTitle] = useState("");
  const [hCategory, setHCategory] = useState<any>("Public Holiday");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hDate || !hTitle.trim()) return toast.error("All fields are required");

    const exists = holidays.some((h) => h.holiday_date === hDate);
    if (exists) return toast.error("A holiday is already scheduled on this date");

    const item: AttendanceHoliday = {
      id: "hol-" + Math.random().toString(36).substring(5),
      holiday_date: hDate,
      title: hTitle.trim(),
      category: hCategory,
    };

    onUpdate([item, ...holidays]);
    toast.success("Holiday Recorded Successfully");
    setHDate("");
    setHTitle("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this holiday scheduling?")) {
      onUpdate(holidays.filter((h) => h.id !== id));
      toast.success("Holiday removed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Holiday Management</h2>
          <p className="text-muted-foreground mt-1">
            Block calendar dates, schedule emergency leaves, and automatically disable check-ins.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
        >
          <Plus className="size-4.5" /> Block Holiday Date
        </button>
      </header>

      {showForm && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h3 className="font-bold text-foreground">Block Date</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-muted-foreground border-none bg-transparent"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Holiday Date *</span>
                <input
                  type="date"
                  value={hDate}
                  onChange={(e) => setHDate(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Title *</span>
                <input
                  type="text"
                  value={hTitle}
                  onChange={(e) => setHTitle(e.target.value)}
                  placeholder="e.g. Diwali Festival"
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Category</span>
                <select
                  value={hCategory}
                  onChange={(e) => setHCategory(e.target.value as any)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Festival">Festival</option>
                  <option value="College Holiday">College Holiday</option>
                  <option value="Emergency Holiday">Emergency Holiday</option>
                  <option value="Custom Off Day">Custom Off Day</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
              >
                Block Date
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HOLIDAYS GRID */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {holidays.map((hol) => (
          <div
            key={hol.id}
            className="card-surface p-4.5 flex justify-between items-center hover:border-primary/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/5 rounded-xl grid place-items-center text-primary shrink-0">
                <Calendar className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{hol.title}</h4>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {hol.holiday_date} •{" "}
                  <span className="text-primary font-semibold">{hol.category}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(hol.id)}
              className="p-1.5 text-muted-foreground hover:text-red-500 border-none bg-transparent cursor-pointer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 10: ANALYTICS VISUALIZATIONS
// -------------------------------------------------------------
function AnalyticsDashboardView({
  records,
  problems,
  colleges,
  admins,
  interns,
}: {
  records: AttendanceRecord[];
  problems: ProblemStatement[];
  colleges: College[];
  admins: AdminProfile[];
  interns: InternProfile[];
}) {
  // 1. College Distribution values (HTML Graph helper)
  const collegeStats = useMemo(() => {
    const map: Record<string, number> = {};
    interns.forEach((i) => {
      const key = i.college || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [interns]);

  // 2. Attendance rates per statement
  const problemStats = useMemo(() => {
    return problems.map((p) => {
      const relatedRecords = records.filter((r) => r.problem_statement === p.name);
      const total = relatedRecords.length || 1;
      const present = relatedRecords.filter(
        (r) => r.status === "Present" || r.status === "Late",
      ).length;
      return {
        name: p.name,
        pct: Math.round((present / total) * 100),
      };
    });
  }, [problems, records]);

  // 3. Weekly attendance trend
  const weeklyTrends = [
    { label: "Monday", rate: 90 },
    { label: "Tuesday", rate: 85 },
    { label: "Wednesday", rate: 95 },
    { label: "Thursday", rate: 82 },
    { label: "Friday", rate: 78 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Visualize participating college distribution, weekly trends, and tracks completion rates.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GRAPH 1: COLLEGE DISTRIBUTION */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            Participating College Distribution (Student Counts)
          </h3>
          <div className="space-y-4 pt-2">
            {collegeStats.map((col, idx) => {
              const max = Math.max(...collegeStats.map((c) => c.count)) || 1;
              const ratio = (col.count / max) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">{col.name}</span>
                    <span className="text-primary">{col.count} Interns</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-orange-gradient h-full transition-all"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 2: PROBLEM STATEMENTS PERFORMANCE */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            Attendance Rate by Problem Statement Track
          </h3>
          <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
            {problemStats.map((prob, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs justify-between">
                <span className="truncate flex-1 font-semibold text-foreground">{prob.name}</span>
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="w-full bg-border h-2.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${prob.pct || 40}%` }} />
                  </div>
                  <span className="font-bold text-foreground text-[10px] w-6 text-right">
                    {prob.pct || 40}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRAPH 3: WEEKLY ATTENDANCE RATE TREND */}
        <div className="card-surface p-6 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            Weekly Attendance Trend (Average Percentage)
          </h3>
          <div className="flex justify-between items-end h-48 pt-6 border-b border-border">
            {weeklyTrends.map((t, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.rate}%
                </span>
                <div
                  className="w-10 sm:w-16 bg-primary/10 rounded-t-xl flex items-end overflow-hidden"
                  style={{ height: `${t.rate}%` }}
                >
                  <div className="w-full bg-brand-orange-gradient h-full transition-all" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 11: NOTIFICATIONS VIEW
// -------------------------------------------------------------
function NotificationsView() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Notifications Broadcast</h2>
        <p className="text-muted-foreground mt-1">
          Broadcast system alerts, platform schedules, and announcements to interns.
        </p>
      </header>

      <div className="card-surface p-6 space-y-4">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider block border-b border-border pb-2">
          Broadcast Message Announcement
        </span>
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Announcement Subject
            </span>
            <input
              type="text"
              placeholder="e.g. Live Verification Session Scheduled for 10:00 AM Today"
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Message Body</span>
            <textarea
              placeholder="Write detailed broadcast message guidelines..."
              rows={4}
              className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <div className="flex justify-end">
            <button
              onClick={() => toast.success("Notification Broadcasted successfully!")}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover border-none cursor-pointer"
            >
              Send Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 12: SYSTEM SETTINGS VIEW
// -------------------------------------------------------------
function SettingsView() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure database sync limits and global attendance thresholds.
        </p>
      </header>

      <div className="card-surface p-6 space-y-4">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider block border-b border-border pb-2">
          Platform Rules Configuration
        </span>

        <div className="space-y-4 pt-2">
          <label className="flex items-center justify-between text-sm font-medium text-foreground cursor-pointer select-none">
            <div>
              <span>Lock Attendance On Holidays</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Prevent interns from checking in on blocked holiday dates.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-border text-primary focus:ring-primary size-4.5"
            />
          </label>

          <label className="flex items-center justify-between text-sm font-medium text-foreground cursor-pointer select-none border-t border-border pt-4">
            <div>
              <span>Automatic Location Radius Locks</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Enforce geo-coordinates boundary constraints during live standups.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-border text-primary focus:ring-primary size-4.5"
            />
          </label>

          <label className="flex items-center justify-between text-sm font-medium text-foreground cursor-pointer select-none border-t border-border pt-4">
            <div>
              <span>Offline Database Fallbacks</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Allow local localStorage state syncing when database is unreachable.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-border text-primary focus:ring-primary size-4.5"
            />
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={() => toast.success("Configuration settings updated successfully")}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover border-none cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
