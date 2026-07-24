import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Trophy, Star, Award, Shield, Search, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { LeaderboardPositionBadge } from "@/components/CommunityUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/community/leaderboard")({
  head: () => ({ meta: [{ title: "Cohort Leaderboard Rankings — APEX AI" }] }),
  component: SuperAdminLeaderboard,
});

// Seed mock rankings data
const MOCK_RANKINGS = [
  { rank: 1, name: "Bhavna Patel", college: "BITS Pilani", problemStatement: "AI Vector Sync", attendance: 100, activities: 98, lms: 100, score: 99.3, badge: "Gold" },
  { rank: 2, name: "Ananya Iyer", college: "IIT Delhi", problemStatement: "LLM Finetuning Engine", attendance: 98, activities: 96, lms: 95, score: 96.3, badge: "Silver" },
  { rank: 3, name: "Amar Singh", college: "IIT Bombay", problemStatement: "LLM Finetuning Engine", attendance: 98, activities: 94, lms: 92, score: 94.7, badge: "Bronze" },
  { rank: 4, name: "Baldev Singh", college: "IIT Kharagpur", problemStatement: "AI Vector Sync", attendance: 95, activities: 90, lms: 92, score: 92.3, badge: "Fast Learner" }
];

function SuperAdminLeaderboard() {
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRankings = useMemo(() => {
    return rankings.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.problemStatement.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rankings, searchQuery]);

  const handleRefresh = () => {
    toast.success("Recalculating cohort leaderboard positions...");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Leaderboard" 
        description="View rankings based on combined progress indicators: attendance logs, activity completions, and quiz grades."
        path="/super-admin/community/leaderboard"
      />

      <div className="space-y-6">
        {/* Top Cards Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Top Performer</span>
            <span className="text-base font-black text-gray-900 truncate block">Bhavna Patel</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Avg. Cohort Score</span>
            <span className="text-xl font-black text-[#FF7A00]">92.8 / 100</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Participants</span>
            <span className="text-xl font-black text-gray-900">{rankings.length} Interns</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">System Action</span>
              <button 
                onClick={handleRefresh}
                className="text-[10px] font-black text-[#FF7A00] flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="size-3" /> Refresh Rankings
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar Search Filters */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full max-w-md w-full">
            <Search className="size-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by student name, college, problem statement..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none placeholder-gray-450 text-gray-800 font-semibold"
            />
          </div>
        </div>

        <ContentContainer>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-20">Rank</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Problem Statement</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Activities Score</th>
                  <th className="py-3 px-4 text-center">LMS Progress</th>
                  <th className="py-3 px-4 text-center">Overall Score</th>
                  <th className="py-3 px-4 text-right">Cohort Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRankings.map((r) => (
                  <tr key={r.rank} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <LeaderboardPositionBadge rank={r.rank} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-gray-900">{r.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{r.college}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-755">{r.problemStatement}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">{r.attendance}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">{r.activities}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">{r.lms}%</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-[#FF7A00]">{r.score}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 bg-orange-50 text-[#FF7A00] border border-orange-100 rounded-lg font-bold text-[9px]">
                        {r.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentContainer>
      </div>
    </AdminLayout>
  );
}
