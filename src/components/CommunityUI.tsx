import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star, Copy, RefreshCw
} from "lucide-react";

// Mock AI post service generator (Simulated OpenAI/Gemini helper response)
export function generateMockPost(platform: string, category: string, title: string, keywords: string) {
  const hashtagClean = keywords.split(",").map(k => `#${k.trim().replace(/\s+/g, "")}`).join(" ");
  
  return {
    headline: `🚀 Exciting News! APEX AI Launchpad Presents: ${title || "Our Latest Cohort Highlights"}`,
    caption: `We are thrilled to highlight our work under the category of ${category}! \n\nOur interns have been busy developing state-of-the-art architectures using deep learning pipelines. Check out the project repos and stay tuned for more cohort updates!\n\nRead more details inside our weekly newsletter.`,
    hashtags: `${hashtagClean} #ApexAI #MachineLearning #DeepLearning #Internship`,
    cta: `👉 Visit our website or check our GitHub repos to view the code!`,
    imagePrompt: `A futuristic orange glowing concept art representing global distributed cloud nodes processing large neural networks with Apex logo, dark high contrast studio background.`
  };
}

// Leaderboard Position Badge Helper Component
export function LeaderboardPositionBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full font-black text-[9px] uppercase">Gold</span>;
  if (rank === 2) return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full font-black text-[9px] uppercase">Silver</span>;
  if (rank === 3) return <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full font-black text-[9px] uppercase">Bronze</span>;
  return <span className="px-2.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full font-bold text-[9px]">Rank {rank}</span>;
}

// Announcement Creation Dialog Modal
export function AnnouncementModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void; 
  onCreate: (announceData: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      desc,
      category,
      priority,
      date: new Date().toISOString().split("T")[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Broadcast New Announcement</h4>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-955">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Announcement Title</label>
            <input 
              type="text" 
              placeholder="E.g. Technical Interviews Schedule Published"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details / Description</label>
            <textarea 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide exact details for all cohort students..."
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white h-20 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="General">General</option>
                <option value="Interview">Interview</option>
                <option value="LMS">LMS</option>
                <option value="Activities">Activities</option>
                <option value="Events">Events</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority Level</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-255 hover:border-gray-900 rounded-xl text-xs font-black text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            Publish Announcement
          </button>
        </div>
      </form>
    </div>
  );
}
