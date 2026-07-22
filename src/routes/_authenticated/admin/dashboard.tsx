import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Activity,
  Clock,
  FileSpreadsheet,
  Bell,
  Settings as SettingsIcon,
  Briefcase,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  MapPin,
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

import { updateInternUser } from "@/lib/intern.functions";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — APEX AI" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = Route.useRouteContext();
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

  // Active Admin Head switcher - defaults to the authenticated user's ID
  const [activeAdminId, setActiveAdminId] = useState(user.id);

  useEffect(() => {
    // Sync with Supabase on dashboard mount
    dataStore.syncWithSupabase();

    setAdmins(dataStore.getAdmins());
    setInterns(dataStore.getInterns());
    setProblems(dataStore.getProblems());
    setColleges(dataStore.getColleges());
    setSessions(dataStore.getSessions());
    setRecords(dataStore.getRecords());
    setHolidays(dataStore.getHolidays());
    setAudits(dataStore.getAudits());

    // Listen to hash changes for sub-menus routing
    const handleHashChange = () => {
      const h = window.location.hash.replace("#", "") || "dashboard";
      setActiveTab(h);
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

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

  const saveSessions = (list: AttendanceSession[]) => {
    setSessions(list);
    dataStore.setSessions(list);
  };
  const saveRecords = (list: AttendanceRecord[]) => {
    setRecords(list);
    dataStore.setRecords(list);
  };
  const saveAudits = (list: AttendanceAuditLog[]) => {
    setAudits(list);
    dataStore.setAudits(list);
  };
  const saveInterns = (list: InternProfile[]) => {
    setInterns(list);
    dataStore.setInterns(list);
  };

  // Currently evaluated Admin profile info
  const currentAdmin = useMemo(() => {
    return (
      admins.find((a) => a.id === activeAdminId) ||
      admins.find((a) => a.id === user.id) ||
      admins[0]
    );
  }, [admins, activeAdminId, user.id]);

  // Assigned problems list (e.g. ["Career Intelligence Platform"])
  const assignedProblems = useMemo(() => {
    return currentAdmin?.assigned_problems || [];
  }, [currentAdmin]);

  // Filter datasets restricted to active Admin's assigned problem statements
  const assignedInterns = useMemo(() => {
    return interns.filter(
      (i) => i.problem_statement && assignedProblems.includes(i.problem_statement),
    );
  }, [interns, assignedProblems]);

  const assignedSessions = useMemo(() => {
    return sessions.filter(
      (s) => !s.problem_statement || assignedProblems.includes(s.problem_statement),
    );
  }, [sessions, assignedProblems]);

  const assignedRecords = useMemo(() => {
    return records.filter(
      (r) => r.problem_statement && assignedProblems.includes(r.problem_statement),
    );
  }, [records, assignedProblems]);

  // Calculations for summary card
  const todayDateStr = new Date().toISOString().split("T")[0];
  const activeSessionsCount = assignedSessions.filter((s) => s.status === "Live").length;
  const presentToday = assignedRecords.filter(
    (r) => r.submitted_at && r.submitted_at.startsWith(todayDateStr) && r.status === "Present",
  ).length;
  const absentToday = assignedRecords.filter(
    (r) => r.submitted_at && r.submitted_at.startsWith(todayDateStr) && r.status === "Absent",
  ).length;

  return (
    <AppShell>
      <div className="space-y-6 font-sans">
        {activeTab !== "dashboard" && assignedProblems.length > 0 && (
          <button
            onClick={() => {
              window.location.hash = "#dashboard";
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition cursor-pointer self-start w-fit"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </button>
        )}

        {/* PROFILE SWITCHER HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Admin Portal</h2>
            <p className="text-muted-foreground mt-1">
              Manage only your assigned problem statements and intern cohorts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold bg-surface-2 border border-border px-3.5 py-2 rounded-xl">
              <span className="text-muted-foreground">Active Admin:</span>
              <select
                value={activeAdminId}
                onChange={(e) => setActiveAdminId(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-primary focus:ring-0 cursor-pointer"
              >
                {admins
                  .filter((a) => a.id === user.id)
                  .map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name}
                    </option>
                  ))}
                {admins.filter((a) => a.id === user.id).length === 0 && (
                  <option value={user.id}>
                    {currentAdmin?.full_name || user.email?.split("@")[0]}
                  </option>
                )}
              </select>
            </label>
            <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-accent text-accent-foreground border border-primary/20">
              Assigned Statement Mappings: {assignedProblems.length}
            </span>
          </div>
        </header>

        {assignedProblems.length === 0 ? (
          <div className="card-surface p-12 text-center max-w-2xl mx-auto my-12 space-y-4 animate-in fade-in-50 duration-300">
            <h3 className="text-xl font-bold text-foreground">No Problem Statement Assigned</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Please contact the Super Admin. Problem-specific access will become available after an assignment is made.
            </p>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <AdminDashboardSummaryView
                admin={currentAdmin}
                stats={{
                  totalInterns: assignedInterns.length,
                  activeSessions: activeSessionsCount,
                  presentToday,
                  absentToday,
                }}
              />
            )}

            {activeTab === "interns" && (
              <AdminInternRegisterView
                interns={assignedInterns}
                records={records}
                onUpdate={saveInterns}
                onMarkManual={(record) => {
                  const updated = [record, ...records.filter((r) => r.id !== record.id)];
                  saveRecords(updated);
                }}
                onLogAudit={(audit) => {
                  saveAudits([audit, ...audits]);
                }}
                currentAdmin={currentAdmin}
              />
            )}

            {activeTab === "live-attendance" && (
              <AdminLiveAttendanceView
                sessions={assignedSessions}
                records={records}
                onUpdateSessions={saveSessions}
              />
            )}

            {activeTab === "sessions" && (
              <AdminAttendanceSessionsView
                sessions={assignedSessions}
                problems={problems.filter((p) => assignedProblems.includes(p.name))}
                colleges={colleges}
                onUpdate={saveSessions}
                currentAdmin={currentAdmin}
              />
            )}

            {activeTab === "reports" && (
              <AdminReportsView records={assignedRecords} colleges={colleges} />
            )}

            {activeTab === "problems" && (
              <AdminProblemsView
                problems={problems.filter((p) => assignedProblems.includes(p.name))}
              />
            )}

            {activeTab === "questionnaire" && (
              <AdminQuestionnaireView interns={assignedInterns} />
            )}

            {activeTab === "lms" && (
              <AdminLmsView interns={assignedInterns} />
            )}

            {activeTab === "activities" && (
              <AdminActivitiesView interns={assignedInterns} onUpdate={saveInterns} />
            )}

            {activeTab === "interview" && (
              <AdminInterviewView interns={assignedInterns} currentAdmin={currentAdmin} onUpdate={saveInterns} />
            )}

            {activeTab === "internship" && (
              <AdminInternshipView interns={assignedInterns} problems={assignedProblems} />
            )}

            {activeTab === "announcements" && (
              <AdminAnnouncementsView interns={assignedInterns} />
            )}

            {activeTab === "profile" && (
              <AdminProfileView currentAdmin={currentAdmin} problems={assignedProblems} />
            )}

            {activeTab === "notifications" && <AdminNotificationsView />}

            {activeTab === "settings" && <AdminSettingsView />}
          </>
        )}
      </div>
    </AppShell>
  );
}

// -------------------------------------------------------------
// MODULE 1: SUMMARY DASHBOARD
// -------------------------------------------------------------
function AdminDashboardSummaryView({
  admin,
  stats,
}: {
  admin: AdminProfile;
  stats: {
    totalInterns: number;
    activeSessions: number;
    presentToday: number;
    absentToday: number;
  };
}) {
  const cards = [
    {
      label: "Assigned Interns",
      value: stats.totalInterns,
      icon: Users,
      color: "bg-blue-500",
      hash: "#interns",
    },
    {
      label: "Live Sessions",
      value: stats.activeSessions,
      icon: Clock,
      color: "bg-green-500",
      hash: "#live-attendance",
    },
    {
      label: "Present Today",
      value: stats.presentToday,
      icon: CheckCircle,
      color: "bg-emerald-500",
      hash: "#live-attendance",
    },
    {
      label: "Absent Today",
      value: stats.absentToday,
      icon: AlertTriangle,
      color: "bg-red-500",
      hash: "#live-attendance",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              onClick={() => {
                window.location.hash = c.hash;
              }}
              className="card-surface p-6 flex items-center justify-between text-left hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {c.label}
                </span>
                <div className="text-3xl font-extrabold text-foreground">{c.value}</div>
              </div>
              <div className={`p-3 rounded-xl ${c.color} text-white shadow-sm`}>
                <Icon className="size-5.5" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="card-surface p-6">
        <h3 className="text-sm font-bold tracking-tight text-foreground uppercase border-b border-border pb-2">
          Assigned Area Control
        </h3>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Hello **{admin?.full_name}**. You are currently managing standard check-ins and session
          settings. The lists displayed throughout this portal are locked to your assigned Problem
          Statement tracks: **{admin?.assigned_problems?.join(", ") || "General Admin"}**.
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 2: ASSIGNED INTERN REGISTER
// -------------------------------------------------------------
function AdminInternRegisterView({
  interns,
  records,
  onUpdate,
  onMarkManual,
  onLogAudit,
  currentAdmin,
}: {
  interns: InternProfile[];
  records: AttendanceRecord[];
  onUpdate: (list: InternProfile[]) => void;
  onMarkManual: (rec: AttendanceRecord) => void;
  onLogAudit: (log: AttendanceAuditLog) => void;
  currentAdmin: AdminProfile;
}) {
  const [search, setSearch] = useState("");
  const [selectedIntern, setSelectedIntern] = useState<InternProfile | null>(null);
  const [manualStatus, setManualStatus] = useState<
    "Present" | "Absent" | "Late" | "Leave" | "Excused"
  >("Present");
  const [overrideReason, setOverrideReason] = useState("");

  // Edit Intern Modal State
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
  const [status, setStatus] = useState<"Active" | "Completed" | "On Leave" | "Terminated">("Active");

  const startEditIntern = (intern: InternProfile) => {
    setEditingIntern(intern);
    setFullName(intern.full_name || "");
    setEmail(intern.email || "");
    setPhone(intern.phone || "");
    setGender(intern.gender || "Male");
    setCollege(intern.college || "");
    setDepartment(intern.department || "");
    setAcademicYear(intern.academic_year || "1st Year");
    setStatus(intern.status || "Active");
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
            problemStatementId: editingIntern.problem_statement_id,
            status,
          },
        });
        toast.success("Intern Profile Updated Successfully!");
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

  const filtered = useMemo(() => {
    if (!search.trim()) return interns;
    return interns.filter((i) => (i.full_name || "").toLowerCase().includes(search.toLowerCase()));
  }, [interns, search]);

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    if (!overrideReason.trim()) return toast.error("Override reason required");

    const record: AttendanceRecord = {
      id: "rec-" + Math.random().toString(36).substring(5),
      session_id: "manual-sess-admin",
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
      reason: overrideReason.trim(),
      marked_by: currentAdmin.id,
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
    setOverrideReason("");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Intern Directory</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Manage attendance adjustments for students assigned to your tracks.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Intern Name..."
            className="w-full h-9 rounded-xl bg-surface-2/60 border border-border pl-9 pr-4 text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <th className="py-4 px-6 font-semibold">Name</th>
              <th className="py-4 px-6 font-semibold">College / Program</th>
              <th className="py-4 px-6 text-center font-semibold">Attendance %</th>
              <th className="py-4 px-6 text-center font-semibold">Progress %</th>
              <th className="py-4 px-6 font-semibold">Track Status</th>
              <th className="py-4 px-6 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filtered.map((intern) => (
              <tr
                key={intern.id}
                className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent"
              >
                <td className="py-4 px-6">
                  <Link
                    to="/u/$id"
                    params={{ id: intern.id }}
                    className="font-bold text-foreground hover:text-primary hover:underline transition"
                  >
                    {intern.full_name}
                  </Link>
                  <div className="text-[10px] text-[#9A9A9A] mt-0.5">{intern.email}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold text-foreground">{intern.college}</div>
                  <div className="text-[10px] text-[#9A9A9A] mt-0.5">
                    {intern.problem_statement}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="font-bold text-foreground">{intern.attendance_percentage}%</div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="font-bold text-foreground">{intern.project_progress}%</div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-success-bg text-success-text border border-success-text/20">
                    {intern.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedIntern(intern)}
                      className="px-3 py-1.5 rounded-lg border border-orange bg-black2 text-white text-xs font-semibold hover:bg-black2/90 transition cursor-pointer shrink-0"
                    >
                      Force Check-In
                    </button>
                    <button
                      onClick={() => startEditIntern(intern)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIntern && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Override Attendance Registration
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Force checkin for {selectedIntern.full_name}.
              </p>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Override Status</span>
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
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Intern was present but GPS simulation errored out."
                  rows={3}
                  className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntern(null)}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition border-none cursor-pointer"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT INTERN MODAL DIALOG */}
      {showInternForm && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm animate-in fade-in-30 duration-200">
          <div className="card-surface p-6 max-w-2xl w-full space-y-5 animate-in zoom-in-95 duration-200 bg-white">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-lg text-foreground">
                Edit Intern: {editingIntern?.full_name}
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
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none opacity-50"
                    required
                    disabled
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
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
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
                  <input
                    type="text"
                    value={editingIntern?.problem_statement || "Not Assigned"}
                    className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none opacity-50"
                    disabled
                  />
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

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 3: LIVE ATTENDANCE MONITORING
// -------------------------------------------------------------
function AdminLiveAttendanceView({
  sessions,
  records,
  onUpdateSessions,
}: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  onUpdateSessions: (list: AttendanceSession[]) => void;
}) {
  const activeSess = useMemo(() => {
    return sessions.find((s) => s.status === "Live") || sessions[0];
  }, [sessions]);

  const handleExtend = (minutes: number) => {
    if (!activeSess) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSess.id) {
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
    toast.success(`Extended session "${activeSess.title}" by +${minutes} minutes!`);
  };

  const handleClose = (id: string) => {
    const list = sessions.map((s) => {
      if (s.id === id) return { ...s, status: "Closed" as const };
      return s;
    });
    onUpdateSessions(list);
    toast.success("Attendance session closed.");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h3 className="text-xl font-bold tracking-tight">Active Live Attendance</h3>
        <p className="text-muted-foreground text-xs mt-1">
          Review live check-in logs and adjust deadlines.
        </p>
      </header>

      {activeSess ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-surface p-5 space-y-4">
            <h4 className="font-bold text-sm text-foreground">{activeSess.title}</h4>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <div>Date: {activeSess.session_date}</div>
              <div>
                Duration: {activeSess.start_time} - {activeSess.end_time}
              </div>
              {activeSess.password && (
                <div>
                  Password:{" "}
                  <span className="font-mono text-primary font-bold">{activeSess.password}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">Extend Duration:</span>
              <div className="grid gap-2 grid-cols-3">
                <button
                  onClick={() => handleExtend(5)}
                  className="py-2 bg-primary/5 text-primary text-xs font-bold border border-primary/20 rounded hover:bg-primary/10 transition cursor-pointer"
                >
                  +5m
                </button>
                <button
                  onClick={() => handleExtend(10)}
                  className="py-2 bg-primary/5 text-primary text-xs font-bold border border-primary/20 rounded hover:bg-primary/10 transition cursor-pointer"
                >
                  +10m
                </button>
                <button
                  onClick={() => handleExtend(15)}
                  className="py-2 bg-primary/5 text-primary text-xs font-bold border border-primary/20 rounded hover:bg-primary/10 transition cursor-pointer"
                >
                  +15m
                </button>
              </div>
              <button
                onClick={() => handleClose(activeSess.id)}
                className="w-full py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl mt-2 cursor-pointer"
              >
                Close Session
              </button>
            </div>
          </div>

          <div className="md:col-span-2 card-surface p-5">
            <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5 mb-3">
              Check-ins List
            </h4>
            <div className="divide-y divide-border overflow-y-auto max-h-64 text-xs pr-1">
              {records
                .filter((r) => r.session_id === activeSess.id)
                .map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">{r.intern_name}</span>
                      <span className="text-[10px] text-muted-foreground">{r.college}</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {r.status}
                    </span>
                  </div>
                ))}
              {records.filter((r) => r.session_id === activeSess.id).length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Waiting for checkins...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-surface p-10 text-center text-muted-foreground text-xs">
          No live session currently active. Go to **Attendance Sessions** to schedule.
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 4: ATTENDANCE SESSIONS MANAGEMENT
// -------------------------------------------------------------
function AdminAttendanceSessionsView({
  sessions,
  problems,
  colleges,
  onUpdate,
  currentAdmin,
}: {
  sessions: AttendanceSession[];
  problems: ProblemStatement[];
  colleges: College[];
  onUpdate: (list: AttendanceSession[]) => void;
  currentAdmin: AdminProfile;
}) {
  const [showCreate, setShowCreate] = useState(false);

  // Fields
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [problemSelect, setProblemSelect] = useState(problems[0]?.name || "General");
  const [collegeSelect, setCollegeSelect] = useState("All");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [gps, setGps] = useState(true);
  const [pwd, setPwd] = useState(true);
  const [pwdCode, setPwdCode] = useState("");

  useEffect(() => {
    if (
      problems.length > 0 &&
      (problemSelect === "General" || !problems.some((p) => p.name === problemSelect))
    ) {
      setProblemSelect(problems[0].name);
    }
  }, [problems]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Session Title is required");

    const newSess: AttendanceSession = {
      id: "sess-" + Math.random().toString(36).substring(5),
      title: title.trim(),
      session_date: sessionDate,
      problem_statement: problemSelect === "General" ? null : problemSelect,
      college: collegeSelect === "All" ? null : collegeSelect,
      start_time: startTime,
      end_time: endTime,
      latitude: 19.1334,
      longitude: 72.9156,
      radius: 100,
      gps_verification: gps,
      password_verification: pwd,
      password: pwd ? pwdCode || "1234" : undefined,
      status: "Scheduled",
      created_by: currentAdmin.id,
      created_at: new Date().toISOString(),
    };

    onUpdate([newSess, ...sessions]);
    toast.success("Attendance Session Created!");
    setTitle("");
    setPwdCode("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Sessions Register</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Configure geo-fenced coordinates boundary sessions.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover border-none cursor-pointer"
        >
          Create Session
        </button>
      </header>

      {showCreate && (
        <form onSubmit={handleCreate} className="card-surface p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground">Session Title *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 rounded-lg bg-surface-2 border border-border px-2 text-xs"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground">Date *</span>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full h-9 rounded-lg bg-surface-2 border border-border px-2 text-xs"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground">
                Problem Track Scope
              </span>
              <select
                value={problemSelect}
                onChange={(e) => setProblemSelect(e.target.value)}
                className="w-full h-9 rounded-lg bg-surface-2 border border-border px-2 text-xs"
              >
                {problems.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground">College Scope</span>
              <select
                value={collegeSelect}
                onChange={(e) => setCollegeSelect(e.target.value)}
                className="w-full h-9 rounded-lg bg-surface-2 border border-border px-2 text-xs"
              >
                <option value="All">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={gps}
                onChange={(e) => setGps(e.target.checked)}
                className="rounded border-border text-primary"
              />
              GPS Validation
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={pwd}
                onChange={(e) => setPwd(e.target.checked)}
                className="rounded border-border text-primary"
              />
              Password Check
            </label>
          </div>

          {pwd && (
            <label className="block space-y-1 max-w-xs">
              <span className="text-[10px] font-bold text-muted-foreground">Password Code</span>
              <input
                type="text"
                value={pwdCode}
                onChange={(e) => setPwdCode(e.target.value)}
                placeholder="e.g. CodeX"
                className="w-full h-8 rounded-lg bg-surface-2 border border-border px-2 text-xs"
              />
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold border-none cursor-pointer"
            >
              Launch
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <th className="py-4 px-6 font-semibold">Session</th>
              <th className="py-4 px-6 font-semibold">Scope Mapped</th>
              <th className="py-4 px-6 font-semibold">Timings Range</th>
              <th className="py-4 px-6 font-semibold">Verification</th>
              <th className="py-4 px-6 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent"
              >
                <td className="py-4 px-6 font-bold text-foreground">{s.title}</td>
                <td className="py-4 px-6 text-[#0D0D0D]">{s.problem_statement || "General"}</td>
                <td className="py-4 px-6 text-[#9A9A9A]">
                  {s.session_date} @ {s.start_time} - {s.end_time}
                </td>
                <td className="py-4 px-6">
                  {s.password ? (
                    <span className="font-mono font-bold text-orange">{s.password}</span>
                  ) : (
                    "None"
                  )}
                </td>
                <td className="py-4 px-6">
                  <span className="text-[9px] font-bold text-success-text bg-success-bg px-2 py-0.5 rounded-full border border-success-text/20">
                    {s.status}
                  </span>
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
// MODULE 5: ATTENDANCE REPORTS
// -------------------------------------------------------------
function AdminReportsView({
  records,
  colleges,
}: {
  records: AttendanceRecord[];
  colleges: College[];
}) {
  const [collegeFilter, setCollegeFilter] = useState("All");

  const filtered = useMemo(() => {
    if (collegeFilter === "All") return records;
    return records.filter((r) => r.college === collegeFilter);
  }, [records, collegeFilter]);

  const handleExport = () => {
    const headers = "Name,College,Statement,Status,Time\n";
    const rows = filtered
      .map(
        (r) =>
          `"${r.intern_name}","${r.college}","${r.problem_statement}","${r.status}","${r.submitted_at}"`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Admin_Attendance_Report.csv";
    link.click();
    toast.success("CSV spreadsheet exported successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Reports Ledger</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Review checkins summaries for your program statements.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 border border-border rounded-xl text-xs font-semibold flex items-center gap-1 bg-surface hover:bg-surface-2 cursor-pointer"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </header>

      <div className="card-surface p-4 flex gap-4">
        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          className="h-9 rounded-xl bg-surface-2 border border-border px-3 text-xs focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Colleges</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-1 border-b border-border text-xs font-bold text-foreground uppercase tracking-wider">
              <th className="py-4 px-6 font-semibold">Student Name</th>
              <th className="py-4 px-6 font-semibold">College</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border transition-colors hover:bg-hover even:bg-gray-1/30 odd:bg-transparent"
              >
                <td className="py-4 px-6 font-bold text-foreground">{r.intern_name}</td>
                <td className="py-4 px-6 text-[#0D0D0D]">{r.college}</td>
                <td className="py-4 px-6">
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${r.status === "Present" ? "bg-success-bg text-success-text border border-success-text/20" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25"}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-[#9A9A9A]">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
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
// MODULE 6: PROBLEMS VIEW
// -------------------------------------------------------------
function AdminProblemsView({ problems }: { problems: ProblemStatement[] }) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h3 className="text-xl font-bold tracking-tight">Assigned Problem Statement Tracks</h3>
        <p className="text-muted-foreground text-xs mt-1">
          Review the descriptions of the tracks assigned to you.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {problems.map((p) => (
          <div key={p.id} className="card-surface p-5 space-y-2">
            <span className="text-[9px] font-extrabold uppercase text-primary bg-primary/5 px-2 py-0.5 rounded tracking-wider">
              {p.category}
            </span>
            <h4 className="font-bold text-base text-foreground mt-1.5">{p.name}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 7: ANNOUNCEMENT BROADCASTS
// -------------------------------------------------------------
function AdminNotificationsView() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    if (!subject.trim()) return toast.error("Subject is required");
    toast.success("Broadcast Announcement Sent to assigned interns!");
    setSubject("");
    setBody("");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h3 className="text-xl font-bold tracking-tight">Cohort Announcements</h3>
        <p className="text-muted-foreground text-xs mt-1">
          Send custom notifications or deadline updates directly to your interns' feed.
        </p>
      </header>

      <div className="card-surface p-6 space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Announcement Title *</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Session Extension Announcement"
            className="w-full h-9 rounded-lg bg-surface border border-border px-2 text-xs"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Notification Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write announcement details..."
            className="w-full rounded-lg bg-surface border border-border px-2 py-1.5 text-xs"
          />
        </label>
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSend}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover border-none cursor-pointer"
          >
            Broadcast Alert
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 8: SETTINGS
// -------------------------------------------------------------
function AdminSettingsView() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header>
        <h3 className="text-xl font-bold tracking-tight">Admin Rules Settings</h3>
        <p className="text-muted-foreground text-xs mt-1">
          Manage checkin constraints for your assigned statement routes.
        </p>
      </header>

      <div className="card-surface p-6 space-y-4">
        <label className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer select-none">
          <div>
            <span className="font-bold">Require GPS Verification</span>
            <span className="text-[9px] text-muted-foreground block mt-0.5">
              Always validate intern geolocations before allowing checkins.
            </span>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="rounded border-border text-primary focus:ring-primary size-4"
          />
        </label>
      </div>
    </div>
  );
}
