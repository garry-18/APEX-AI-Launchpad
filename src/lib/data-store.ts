import { supabase } from "@/integrations/supabase/client";

// Interfaces for our management system
export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  role: "admin" | "super_admin";
  status: "active" | "inactive";
  assigned_problems: string[]; // List of problem statement names
  assigned_problem_ids: string[]; // List of problem statement IDs
  created_at: string;
}

export interface ProblemStatement {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface College {
  id: string;
  name: string;
  city: string;
}

export interface AttendanceSession {
  id: string;
  title: string;
  session_date: string;
  problem_statement: string | null; // Null means General
  college: string | null; // Null means General
  start_time: string;
  end_time: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters: 50, 100, 200
  gps_verification: boolean;
  password_verification: boolean;
  password?: string;
  status: "Draft" | "Scheduled" | "Live" | "Closed";
  created_by: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  intern_name: string | null;
  college: string | null;
  city: string | null;
  problem_statement: string | null;
  status: "Present" | "Absent" | "Late" | "Leave" | "Excused";
  latitude?: number;
  longitude?: number;
  submitted_at: string | null;
}

export interface AttendanceExtension {
  id: string;
  session_id: string;
  minutes: number;
  extended_by: string;
  extended_at: string;
}

export interface AttendanceHoliday {
  id: string;
  holiday_date: string;
  title: string;
  category:
    | "Public Holiday"
    | "Sunday"
    | "Festival"
    | "College Holiday"
    | "Emergency Holiday"
    | "Custom Off Day";
}

export interface AttendanceAuditLog {
  id: string;
  record_id: string;
  action_type: string;
  old_status: string;
  new_status: string;
  reason: string;
  marked_by: string;
  created_at: string;
}

export interface InternProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  college: string | null;
  department: string | null;
  academic_year: string | null;
  semester: string | null;
  problem_statement: string | null;
  problem_statement_id: string | null;
  assigned_admin: string | null;
  attendance_percentage: number;
  project_progress: number;
  joining_date: string;
  status: "Active" | "Completed" | "On Leave" | "Terminated";
  profile_photo?: string;
}

// -------------------------------------------------------------
// DUMMY SEED DATA (Used only as fallback or local storage defaults)
// -------------------------------------------------------------
const DEFAULT_PROBLEMS: ProblemStatement[] = [
  {
    id: "p-1",
    name: "ASG Ecosystem",
    category: "Web3 & Logistics",
    description: "Decentralized ecosystem logic for ASG networks.",
  },
  {
    id: "p-2",
    name: "Career Intelligence Platform",
    category: "EdTech & AI",
    description: "Next-gen career recommendation matrices.",
  },
  {
    id: "p-3",
    name: "Digital Economy",
    category: "FinTech",
    description: "Frameworks for localized micro-transaction tracking.",
  },
  {
    id: "p-4",
    name: "Energy as Distribution",
    category: "CleanTech",
    description: "Distributed solar grids sharing protocols.",
  },
  {
    id: "p-5",
    name: "Events Industry",
    category: "Entertainment",
    description: "Decentralized ticket validation systems.",
  },
  {
    id: "p-6",
    name: "Gaming",
    category: "Metaverse",
    description: "Integration of in-game assets securely.",
  },
  {
    id: "p-7",
    name: "HoReCa",
    category: "Hospitality",
    description: "SaaS automation for small kitchens.",
  },
  {
    id: "p-8",
    name: "Kids Sector",
    category: "EdTech",
    description: "Interactive game mechanics for children.",
  },
  {
    id: "p-9",
    name: "Mobility",
    category: "Logistics",
    description: "EV routing protocols optimization.",
  },
  {
    id: "p-10",
    name: "Social Work and Sustainability",
    category: "EcoTech",
    description: "Carbon credits offsetting ledger.",
  },
  {
    id: "p-11",
    name: "Sports and Fitness",
    category: "HealthTech",
    description: "Gamified workout logging dashboards.",
  },
  {
    id: "p-12",
    name: "Temple Economy",
    category: "CultureTech",
    description: "Digital booking logs for places of worship.",
  },
];

const DEFAULT_COLLEGES: College[] = [
  { id: "c-1", name: "IIT Bombay", city: "Mumbai" },
  { id: "c-2", name: "COEP Pune", city: "Pune" },
  { id: "c-3", name: "Nirma University", city: "Ahmedabad" },
  { id: "c-4", name: "IIT Madras", city: "Chennai" },
  { id: "c-5", name: "DTU Delhi", city: "Delhi" },
];

const DEFAULT_ADMINS: AdminProfile[] = [
  {
    id: "a-1",
    full_name: "Bhavna Patel",
    email: "bhavna@gmail.com",
    mobile: "9876543210",
    role: "admin",
    status: "active",
    assigned_problems: ["Career Intelligence Platform"],
    assigned_problem_ids: ["p-2"],
    created_at: new Date().toISOString(),
  },
  {
    id: "a-2",
    full_name: "Jayesh Joshi",
    email: "jayesh@gmail.com",
    mobile: "9876543211",
    role: "admin",
    status: "active",
    assigned_problems: ["Digital Economy", "ASG Ecosystem"],
    assigned_problem_ids: ["p-3", "p-1"],
    created_at: new Date().toISOString(),
  },
  {
    id: "a-3",
    full_name: "Aarav Singhal",
    email: "aarav@gmail.com",
    mobile: "9876543212",
    role: "admin",
    status: "active",
    assigned_problems: ["ASG Ecosystem"],
    assigned_problem_ids: ["p-1"],
    created_at: new Date().toISOString(),
  },
  {
    id: "a-4",
    full_name: "Dev Patel",
    email: "super@gmail.com",
    mobile: "9999999999",
    role: "super_admin",
    status: "active",
    assigned_problems: [],
    assigned_problem_ids: [],
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_INTERNS: InternProfile[] = [
  {
    id: "int-1",
    full_name: "Rohan Sharma",
    email: "rohan@gmail.com",
    phone: "9123456780",
    gender: "Male",
    college: "IIT Bombay",
    department: "Computer Science",
    academic_year: "4th Year",
    semester: "8th Semester",
    problem_statement: "ASG Ecosystem",
    assigned_admin: "Aarav Singhal",
    attendance_percentage: 88,
    project_progress: 75,
    joining_date: "2026-06-01",
    status: "Active",
  },
  {
    id: "int-2",
    full_name: "Aditya Verma",
    email: "aditya@gmail.com",
    phone: "9123456781",
    gender: "Male",
    college: "IIT Bombay",
    department: "Information Technology",
    academic_year: "3rd Year",
    semester: "6th Semester",
    problem_statement: "Career Intelligence Platform",
    assigned_admin: "Bhavna Patel",
    attendance_percentage: 92,
    project_progress: 80,
    joining_date: "2026-06-01",
    status: "Active",
  },
  {
    id: "int-3",
    full_name: "Karan Johar",
    email: "karan@gmail.com",
    phone: "9123456782",
    gender: "Male",
    college: "COEP Pune",
    department: "Data Science",
    academic_year: "4th Year",
    semester: "7th Semester",
    problem_statement: "Gaming",
    assigned_admin: "Bhavna Patel",
    attendance_percentage: 78,
    project_progress: 50,
    joining_date: "2026-06-15",
    status: "Active",
  },
  {
    id: "int-4",
    full_name: "Sneha Patel",
    email: "sneha@gmail.com",
    phone: "9123456783",
    gender: "Female",
    college: "Nirma University",
    department: "Computer Engineering",
    academic_year: "3rd Year",
    semester: "5th Semester",
    problem_statement: "Digital Economy",
    assigned_admin: "Jayesh Joshi",
    attendance_percentage: 95,
    project_progress: 90,
    joining_date: "2026-06-01",
    status: "Active",
  },
  {
    id: "int-5",
    full_name: "Pooja Hegde",
    email: "pooja@gmail.com",
    phone: "9123456784",
    gender: "Female",
    college: "IIT Madras",
    department: "Electrical Engineering",
    academic_year: "4th Year",
    semester: "8th Semester",
    problem_statement: "Energy as Distribution",
    assigned_admin: "Jayesh Joshi",
    attendance_percentage: 84,
    project_progress: 60,
    joining_date: "2026-06-01",
    status: "Active",
  },
  {
    id: "int-6",
    full_name: "Aarti Singh",
    email: "aarti@gmail.com",
    phone: "9123456785",
    gender: "Female",
    college: "DTU Delhi",
    department: "Software Engineering",
    academic_year: "2nd Year",
    semester: "4th Semester",
    problem_statement: "Events Industry",
    assigned_admin: "Jayesh Joshi",
    attendance_percentage: 70,
    project_progress: 40,
    joining_date: "2026-06-20",
    status: "On Leave",
  },
];

const DEFAULT_SESSIONS: AttendanceSession[] = [
  {
    id: "sess-1",
    title: "Morning Verification Session",
    session_date: new Date().toISOString().split("T")[0],
    problem_statement: "ASG Ecosystem",
    college: "IIT Bombay",
    start_time: "10:00",
    end_time: "10:30",
    latitude: 19.1334,
    longitude: 72.9156,
    radius: 100,
    gps_verification: true,
    password_verification: true,
    password: "PASS_A",
    status: "Live",
    created_by: "a-4",
    created_at: new Date().toISOString(),
  },
  {
    id: "sess-2",
    title: "CIP AI Standup",
    session_date: new Date().toISOString().split("T")[0],
    problem_statement: "Career Intelligence Platform",
    college: "IIT Bombay",
    start_time: "10:00",
    end_time: "10:30",
    latitude: 19.1334,
    longitude: 72.9156,
    radius: 100,
    gps_verification: true,
    password_verification: true,
    password: "PASS_B",
    status: "Live",
    created_by: "a-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "sess-3",
    title: "COEP Gaming Review",
    session_date: new Date().toISOString().split("T")[0],
    problem_statement: "Gaming",
    college: "COEP Pune",
    start_time: "11:00",
    end_time: "11:30",
    latitude: 18.5204,
    longitude: 73.8567,
    radius: 200,
    gps_verification: true,
    password_verification: false,
    status: "Scheduled",
    created_by: "a-1",
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_RECORDS: AttendanceRecord[] = [
  {
    id: "rec-1",
    session_id: "sess-1",
    user_id: "int-1",
    intern_name: "Rohan Sharma",
    college: "IIT Bombay",
    city: "Mumbai",
    problem_statement: "ASG Ecosystem",
    status: "Present",
    latitude: 19.1335,
    longitude: 72.9155,
    submitted_at: new Date().toISOString(),
  },
  {
    id: "rec-2",
    session_id: "sess-2",
    user_id: "int-2",
    intern_name: "Aditya Verma",
    college: "IIT Bombay",
    city: "Mumbai",
    problem_statement: "Career Intelligence Platform",
    status: "Late",
    latitude: 19.1338,
    longitude: 72.9152,
    submitted_at: new Date().toISOString(),
  },
];

const DEFAULT_HOLIDAYS: AttendanceHoliday[] = [
  {
    id: "hol-1",
    holiday_date: "2026-08-15",
    title: "Independence Day",
    category: "Public Holiday",
  },
  { id: "hol-2", holiday_date: "2026-10-02", title: "Gandhi Jayanti", category: "Public Holiday" },
  { id: "hol-3", holiday_date: "2026-12-25", title: "Christmas Day", category: "Public Holiday" },
];

const DEFAULT_AUDITS: AttendanceAuditLog[] = [];

// Helper functions for LocalStorage persistence
const getOrInit = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultValue;
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
};

const setStore = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`store-update-${key}`, { detail: value }));
};

let isRealtimeSubscribed = false;

// -------------------------------------------------------------
// PERSISTENT DATA ACCESS OBJECTS WITH SUPABASE INTEGRATION
// -------------------------------------------------------------
export const dataStore = {
  getProblems: (): ProblemStatement[] => getOrInit("apex.problems", DEFAULT_PROBLEMS),
  setProblems: async (list: ProblemStatement[]) => {
    setStore("apex.problems", list);
    try {
      const local = getOrInit("apex.problems", DEFAULT_PROBLEMS);
      const deleted = local.filter((l) => !list.some((item) => item.id === l.id));
      for (const d of deleted) {
        if (!d.id.startsWith("p-")) {
          await supabase.from("problem_statements").delete().eq("id", d.id);
        }
      }
      for (const item of list) {
        const payload = {
          title: item.name,
          name: item.name,
          category: item.category,
          description: item.description,
          status: "active",
        };
        if (item.id.startsWith("p-")) {
          await supabase.from("problem_statements").insert(payload);
        } else {
          await supabase.from("problem_statements").update(payload).eq("id", item.id);
        }
      }
      await dataStore.syncWithSupabase();
    } catch (err) {
      console.error("Error saving problems:", err);
    }
  },

  getColleges: (): College[] => getOrInit("apex.colleges", DEFAULT_COLLEGES),
  setColleges: async (list: College[]) => {
    setStore("apex.colleges", list);
    try {
      const local = getOrInit("apex.colleges", DEFAULT_COLLEGES);
      const deleted = local.filter((l) => !list.some((item) => item.id === l.id));
      for (const d of deleted) {
        if (!d.id.startsWith("c-")) {
          await supabase
            .from("colleges" as any)
            .delete()
            .eq("id", d.id);
        }
      }
      for (const item of list) {
        const payload = {
          name: item.name,
          city: item.city || "General",
        };
        if (item.id.startsWith("c-")) {
          await supabase.from("colleges" as any).insert(payload);
        } else {
          await supabase
            .from("colleges" as any)
            .update(payload)
            .eq("id", item.id);
        }
      }
      await dataStore.syncWithSupabase();
    } catch (err) {
      console.error("Error saving colleges:", err);
    }
  },

  getAdmins: (): AdminProfile[] => getOrInit("apex.admins", DEFAULT_ADMINS),
  setAdmins: (list: AdminProfile[]) => {
    // Note: Admin additions, updates and deletions are now directly called via server functions in super-admin dashboard component.
    // We just update the local store for reactiveness.
    setStore("apex.admins", list);
  },

  getInterns: (): InternProfile[] => getOrInit("apex.interns", DEFAULT_INTERNS),
  setInterns: async (list: InternProfile[]) => {
    setStore("apex.interns", list);
    try {
      for (const item of list) {
        const payload = {
          full_name: item.full_name,
          email: item.email,
          phone: item.phone,
          gender: item.gender,
          college: item.college,
          degree: item.department,
          year_of_study: item.academic_year,
          problem_statement: item.problem_statement,
          problem_statement_id: item.problem_statement_id,
          status: item.status,
        };
        if (!item.id.startsWith("int-")) {
          await supabase.from("profiles").update(payload).eq("id", item.id);
        }
      }
      await dataStore.syncWithSupabase();
    } catch (err) {
      console.error("Error saving interns:", err);
    }
  },

  getSessions: (): AttendanceSession[] => getOrInit("apex.sessions", DEFAULT_SESSIONS),
  setSessions: async (list: AttendanceSession[]) => {
    setStore("apex.sessions", list);
    try {
      const local = getOrInit("apex.sessions", DEFAULT_SESSIONS);
      const deleted = local.filter((l) => !list.some((item) => item.id === l.id));
      for (const d of deleted) {
        if (!d.id.startsWith("sess-")) {
          await supabase.from("attendance_sessions").delete().eq("id", d.id);
        }
      }
      for (const item of list) {
        const payload = {
          title: item.title,
          session_date: item.session_date,
          problem_statement: item.problem_statement,
          college: item.college,
          start_time: item.start_time.length === 5 ? item.start_time + ":00" : item.start_time,
          end_time: item.end_time.length === 5 ? item.end_time + ":00" : item.end_time,
          latitude: item.latitude,
          longitude: item.longitude,
          radius: item.radius,
          gps_verification: item.gps_verification,
          password_verification: item.password_verification,
          password: item.password,
          status: item.status,
        };
        if (item.id.startsWith("sess-")) {
          await supabase.from("attendance_sessions").insert(payload);
        } else {
          await supabase.from("attendance_sessions").update(payload).eq("id", item.id);
        }
      }
      await dataStore.syncWithSupabase();
    } catch (err) {
      console.error("Error saving sessions:", err);
    }
  },

  getRecords: (): AttendanceRecord[] => getOrInit("apex.records", DEFAULT_RECORDS),
  setRecords: async (list: AttendanceRecord[]) => {
    setStore("apex.records", list);
    try {
      const local = getOrInit("apex.records", DEFAULT_RECORDS);
      const deleted = local.filter((l) => !list.some((item) => item.id === l.id));
      for (const d of deleted) {
        if (!d.id.startsWith("rec-")) {
          await supabase.from("attendance_records").delete().eq("id", d.id);
        }
      }
      for (const item of list) {
        const payload = {
          session_id: item.session_id.startsWith("manual-") ? null : item.session_id,
          user_id: item.user_id,
          intern_name: item.intern_name,
          college: item.college,
          city: item.city,
          problem_statement: item.problem_statement,
          status: item.status,
          latitude: item.latitude,
          longitude: item.longitude,
          submitted_at: item.submitted_at,
        };
        if (item.id.startsWith("rec-")) {
          await supabase.from("attendance_records").insert(payload);
        } else {
          await supabase.from("attendance_records").update(payload).eq("id", item.id);
        }
      }
      await dataStore.syncWithSupabase();
    } catch (err) {
      console.error("Error saving records:", err);
    }
  },

  getHolidays: (): AttendanceHoliday[] => getOrInit("apex.holidays", DEFAULT_HOLIDAYS),
  setHolidays: async (list: AttendanceHoliday[]) => {
    setStore("apex.holidays", list);
    // Suppressed: attendance_holidays table no longer exists in Supabase database
  },

  getAudits: (): AttendanceAuditLog[] => getOrInit("apex.audits", DEFAULT_AUDITS),
  setAudits: async (list: AttendanceAuditLog[]) => {
    setStore("apex.audits", list);
    // Suppressed: attendance_audit_logs table no longer exists in Supabase database
  },

  // Subscription helper for reactiveness across components
  subscribe: (key: string, callback: (data: any) => void) => {
    const handler = (e: Event) => {
      callback((e as CustomEvent).detail);
    };
    window.addEventListener(`store-update-${key}`, handler);
    return () => window.removeEventListener(`store-update-${key}`, handler);
  },

  // New sync function that loads all data from Supabase (respecting RLS) and populates the local stores
  syncWithSupabase: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (!isRealtimeSubscribed) {
        isRealtimeSubscribed = true;
        supabase
          .channel("realtime-app-sync")
          .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
            console.log("[REALTIME] Profiles table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "admin_problem_statements" }, () => {
            console.log("[REALTIME] admin_problem_statements table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "problem_statements" }, () => {
            console.log("[REALTIME] problem_statements table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "colleges" }, () => {
            console.log("[REALTIME] colleges table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "attendance_sessions" }, () => {
            console.log("[REALTIME] attendance_sessions table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, () => {
            console.log("[REALTIME] attendance_records table changed. Triggering syncWithSupabase...");
            dataStore.syncWithSupabase();
          })
          .subscribe();
      }

      // Fetch user role and admin assignment info
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = profile?.role || "intern";

      let assignedNames: string[] = [];
      let assignedIds: string[] = [];
      if (userRole === "admin") {
        const { data: adminAssigns } = await supabase
          .from("admin_problem_statements" as any)
          .select("problem_statement_id, problem_statements(name)")
          .eq("admin_id", user.id)
          .eq("is_active", true);

        if (adminAssigns) {
          assignedIds = adminAssigns.map((a: any) => a.problem_statement_id).filter(Boolean);
          assignedNames = adminAssigns
            .map((a: any) => a.problem_statements?.name || "")
            .filter(Boolean);
        }
      }

      let psQuery = supabase.from("problem_statements").select("id, name").order("name");
      if (userRole === "admin") {
        if (assignedIds.length > 0) {
          psQuery = psQuery.in("id", assignedIds);
        } else {
          psQuery = psQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }
      const { data: ps, error: psErr, status: psStat, statusText: psText } = await psQuery;

      if (psErr) {
        console.error("Fetch problem statements error:", {
          status: psStat,
          statusText: psText,
          error: {
            code: psErr.code,
            message: psErr.message,
            details: psErr.details,
            hint: psErr.hint,
          },
        });
      }
      const mappedProblems: ProblemStatement[] = (ps || []).map((p: any) => ({
        id: p.id,
        name: p.name || "",
        category: "General",
        description: "",
      }));
      setStore("apex.problems", mappedProblems);

      // 2. Fetch Colleges
      const {
        data: cols,
        error: colsErr,
        status: colsStat,
        statusText: colsText,
      } = await supabase.from("colleges" as any).select("*");
      if (colsErr) {
        console.error("Fetch colleges error:", {
          status: colsStat,
          statusText: colsText,
          error: {
            code: colsErr.code,
            message: colsErr.message,
            details: colsErr.details,
            hint: colsErr.hint,
          },
        });
      }
      const mappedColleges: College[] = (cols || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        city: c.city || "General",
      }));
      setStore("apex.colleges", mappedColleges);

      // 3. Fetch base Admin list from profiles
      const { data: adminProfiles, error: adminProfilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile:phone, role, status, created_at")
        .in("role", ["admin", "super_admin"])
        .order("full_name");

      if (adminProfilesError) throw adminProfilesError;

      // Fetch active Admin assignments separately
      const { data: assignments, error: assignmentsError } = await (supabase
        .from("admin_problem_statements" as any)
        .select(`
          admin_id,
          problem_statement_id,
          is_active
        `)
        .eq("is_active", true) as any);

      if (assignmentsError) throw assignmentsError;

      // Fetch problem statements separately
      const { data: problemStatements, error: problemStatementsError } = await supabase
        .from("problem_statements")
        .select("id, name");

      if (problemStatementsError) throw problemStatementsError;

      console.log("ADMIN PROFILES:", adminProfiles);
      console.log("ACTIVE ASSIGNMENTS:", assignments);
      console.log("PROBLEM STATEMENTS:", problemStatements);

      const mappedAdmins: AdminProfile[] = (adminProfiles ?? []).map((profile) => {
        const assignment = (assignments ?? []).find(
          (item: any) => item.admin_id === profile.id
        );

        const problem = assignment
          ? (problemStatements ?? []).find(
              (item: any) => item.id === assignment.problem_statement_id
            )
          : null;

        return {
          id: profile.id,
          full_name: profile.full_name ?? "",
          email: profile.email ?? "",
          mobile: profile.mobile ?? "",
          role: profile.role === "super_admin" ? "super_admin" : "admin",
          status: profile.status === "inactive" ? "inactive" : "active",

          assigned_problem_ids:
            assignment?.problem_statement_id
              ? [assignment.problem_statement_id]
              : [],

          assigned_problems:
            problem?.name
              ? [problem.name]
              : [],
          created_at: profile.created_at || new Date().toISOString(),
        };
      });

      console.log("MAPPED ADMINS:", mappedAdmins);
      console.log(
        "ASSIGNMENT CHECK:",
        mappedAdmins.map((admin) => ({
          name: admin.full_name,
          ids: admin.assigned_problem_ids,
          names: admin.assigned_problems,
        }))
      );

      setStore("apex.admins", mappedAdmins);

      // 4. Fetch Interns directly from profiles where role = 'intern'
      let internQuery = supabase
        .from("profiles")
        .select("*")
        .eq("role", "intern");

      if (userRole === "admin") {
        // Find admin's active problem statement assignment (UUIDs)
        const { data: adminAssigns } = await supabase
          .from("admin_problem_statements" as any)
          .select("problem_statement_id")
          .eq("admin_id", user.id)
          .eq("is_active", true);

        const assignedIds = (adminAssigns || []).map((a: any) => a.problem_statement_id).filter(Boolean);

        if (assignedIds.length > 0) {
          internQuery = internQuery.in("problem_statement_id", assignedIds);
        } else {
          // Unassigned admin has no access to interns
          internQuery = internQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      const {
        data: internProfiles,
        error: internErr,
      } = await internQuery;

      if (internErr) {
        console.error("Fetch interns query error:", internErr);
      }

      const mappedInterns: InternProfile[] = (internProfiles || []).map((ip: any) => {
        const problem = ip.problem_statement_id
          ? (problemStatements ?? []).find((p) => p.id === ip.problem_statement_id)
          : null;

        return {
          id: ip.id,
          full_name: ip.full_name || null,
          email: ip.email || null,
          phone: ip.phone || null,
          gender: ip.gender || null,
          college: ip.college || null,
          department: ip.degree || null,
          academic_year: ip.year_of_study || null,
          semester: null,
          problem_statement: problem ? problem.name : (ip.problem_statement || null),
          problem_statement_id: ip.problem_statement_id || null,
          assigned_admin: null,
          attendance_percentage: 90,
          project_progress: 75,
          joining_date: ip.created_at ? ip.created_at.split("T")[0] : "",
          status: ip.status || "Active",
          profile_photo: ip.avatar_url || undefined,
        };
      });
      setStore("apex.interns", mappedInterns);

      // 5. Fetch Sessions
      let sessQuery = supabase.from("attendance_sessions").select("*");
      if (userRole === "admin") {
        if (assignedNames.length > 0) {
          sessQuery = sessQuery.or(
            `problem_statement.is.null,problem_statement.in.(${assignedNames.map((n) => `"${n}"`).join(",")})`,
          );
        } else {
          sessQuery = sessQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }
      const {
        data: sess,
        error: sessErr,
        status: sessStat,
        statusText: sessText,
      } = await sessQuery;

      if (sessErr) {
        console.error("Fetch sessions error:", {
          status: sessStat,
          statusText: sessText,
          error: {
            code: sessErr.code,
            message: sessErr.message,
            details: sessErr.details,
            hint: sessErr.hint,
          },
        });
      }
      const mappedSessions: AttendanceSession[] = (sess || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        session_date: s.session_date,
        problem_statement: s.problem_statement,
        college: s.college,
        start_time: s.start_time ? s.start_time.substring(0, 5) : "10:00",
        end_time: s.end_time ? s.end_time.substring(0, 5) : "10:30",
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        radius: Number(s.radius || 100),
        gps_verification: s.gps_verification,
        password_verification: s.password_verification,
        password: s.password,
        status: s.status as any,
        created_by: s.created_by,
        created_at: s.created_at,
      }));
      setStore("apex.sessions", mappedSessions);

      // 6. Fetch Records
      let recsQuery = supabase.from("attendance_records").select("*");
      if (userRole === "admin") {
        if (assignedNames.length > 0) {
          recsQuery = recsQuery.or(
            `problem_statement.is.null,problem_statement.in.(${assignedNames.map((n) => `"${n}"`).join(",")})`,
          );
        } else {
          recsQuery = recsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }
      const {
        data: recs,
        error: recsErr,
        status: recsStat,
        statusText: recsText,
      } = await recsQuery;

      // 7. Fetch Holidays (Suppressed: Table no longer exists in DB)
      setStore("apex.holidays", DEFAULT_HOLIDAYS);

      // 8. Fetch Audits (Suppressed: Table no longer exists in DB)
      setStore("apex.audits", DEFAULT_AUDITS);
    } catch (err) {
      console.error("Error syncing with Supabase:", err);
    }
  },
};
