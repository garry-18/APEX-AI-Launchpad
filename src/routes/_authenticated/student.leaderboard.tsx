import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Trophy, Star, Award, Shield, Search
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LeaderboardPositionBadge } from "@/components/CommunityUI";

export const Route = createFileRoute("/_authenticated/student/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard Rankings — APEX AI" }] }),
  component: StudentLeaderboardView,
});

const MOCK_RANKINGS = [
  { rank: 1, name: "Bhavna Patel", college: "BITS Pilani", problemStatement: "AI Vector Sync", attendance: 100, score: 99.3, badge: "Gold" },
  { rank: 2, name: "Ananya Iyer", college: "IIT Delhi", problemStatement: "LLM Finetuning Engine", attendance: 98, score: 96.3, badge: "Silver" },
  { rank: 3, name: "Amar Singh", college: "IIT Bombay", problemStatement: "LLM Finetuning Engine", attendance: 98, score: 94.7, badge: "Bronze" },
  { rank: 4, name: "Baldev Singh", college: "IIT Kharagpur", problemStatement: "AI Vector Sync", attendance: 95, score: 92.3, badge: "Fast Learner" }
];

function StudentLeaderboardView() {
  const [rankings] = useState(MOCK_RANKINGS);
  const currentStudentName = "Amar Singh"; // Simulate self highlighting

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900">Cohort Rankings Leaderboard</h2>
          <p className="text-xs text-gray-500">Track and view performance ranks across active cohort students.</p>
        </div>

        {/* Highlight Own Score Card */}
        <div className="bg-gradient-to-r from-orange-500 to-[#FF7A00] p-6 rounded-3xl text-white shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Your Current Standing</span>
            <div className="text-xl font-black mt-1">Amar Singh (Rank 3)</div>
            <p className="text-[10px] opacity-90 mt-1">Excellent consistency on attendance & LMS milestones completion.</p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Aggregate Score</span>
            <div className="text-lg font-black mt-0.5">94.7 / 100</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-20">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Problem Statement</th>
                  <th className="py-3 px-4 text-center">Attendance Rate</th>
                  <th className="py-3 px-4 text-right">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rankings.map((r) => (
                  <tr 
                    key={r.rank} 
                    className={`transition-colors ${
                      r.name === currentStudentName ? "bg-orange-50/60 hover:bg-orange-50" : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <LeaderboardPositionBadge rank={r.rank} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-gray-900">{r.name}</div>
                      <div className="text-[10px] text-gray-450 font-semibold">{r.college}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-750">{r.problemStatement}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">{r.attendance}%</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#FF7A00]">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
