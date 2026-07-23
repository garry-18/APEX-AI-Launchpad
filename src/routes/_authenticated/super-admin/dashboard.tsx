import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { 
  Users, UserPlus, ShieldAlert, ShieldCheck, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings
} from "lucide-react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { 
  WelcomeCard, DashboardCard, QuickActionCard, PendingCard, RecentActivity, CalendarCard, DashboardChart, SystemOverviewCard
} from "@/components/DashboardUI";
import { dataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/super-admin/dashboard")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — APEX AI" }] }),
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<any>(null);
  
  // Realtime datasets
  const [interns, setInterns] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);

  useEffect(() => {
    // Load local data store content
    setInterns(dataStore.getInterns());
    setAdmins(dataStore.getAdmins());
    setColleges(dataStore.getColleges());
    setProblems(dataStore.getProblems());

    // Subscribe to updates
    const unsubInterns = dataStore.subscribe("apex.interns", setInterns);
    const unsubAdmins = dataStore.subscribe("apex.admins", setAdmins);
    const unsubColleges = dataStore.subscribe("apex.colleges", setColleges);
    const unsubProblems = dataStore.subscribe("apex.problems", setProblems);

    // Fetch user profile info
    const fetchProfile = async () => {
      const profileInfo = dataStore.getAdmins().find((a) => a.id === user.id);
      if (profileInfo) {
        setProfile(profileInfo);
      }
    };
    fetchProfile();

    return () => {
      unsubInterns();
      unsubAdmins();
      unsubColleges();
      unsubProblems();
    };
  }, [user.id]);

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Control Board" 
        description="Enterprise oversight control board managing system microservices, problem statements assignment, colleges databases, and global metrics."
        path="/super-admin/dashboard"
      />

      <div className="space-y-6">
        {/* Welcome Section */}
        <WelcomeCard 
          name={profile?.full_name || "Super Admin"} 
          role="super_admin" 
          totalCount={interns.length} 
        />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Total Interns" value={interns.length} icon={Users} trend="+12% growth" />
          <DashboardCard title="New Registrations" value={interns.filter(i => i.status === "Onboarding").length} icon={UserPlus} trend="Stable" />
          <DashboardCard title="Active Interns" value={interns.filter(i => i.status === "Active").length} icon={ShieldCheck} trend="+8% growth" color="text-emerald-600" />
          <DashboardCard title="Pending Reviews" value={14} icon={Sparkles} trend="Requires Attention" color="text-red-500" />
        </div>

        {/* Super Admin Management Overview Card */}
        <SystemOverviewCard 
          totalAdmins={admins.length} 
          totalColleges={colleges.length} 
          totalProblems={problems.length} 
        />

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Operations</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard title="Admin Accounts Management" description="Modify curriculum problem statement assignments and settings." icon={ShieldAlert} to="/super-admin/admin-management" />
            <QuickActionCard title="Manage Problem Statements" description="Update curriculum project categories for cohort interns." icon={BookOpen} to="/super-admin/problem-statements" />
            <QuickActionCard title="Pending Verifications Queue" description="Verify outstanding submissions and schedule interviews." icon={Clock} to="/super-admin/pending-work" />
          </div>
        </div>

        {/* Secondary Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Display */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardChart title="Onboarding Weekly Progress Tracker" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CalendarCard />
              {/* Local Notification Panel */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Platform Notifications</span>
                  <div className="space-y-2">
                    <RecentActivity avatarInitials="AS" name="Amar Singh" action="Submitted Activity 7 Deliverables Dossier" time="Just now" />
                    <RecentActivity avatarInitials="SY" name="System Audit" action="Supabase Realtime Sync completed successfully" time="15m ago" />
                  </div>
                </div>
                <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-colors">
                  View All Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Pending Work Summary Column */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Queue Summaries</span>
            <PendingCard title="Activity Verifications" count={14} priority="High" to="/super-admin/activities" />
            <PendingCard title="Interview Coordination" count={3} priority="Medium" to="/super-admin/dashboard" />
            <PendingCard title="Diary Remarks Verification" count={18} priority="Low" to="/super-admin/daily-diary" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
