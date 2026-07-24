import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Plus, Trash2, ArrowRight, Share2, Sparkles, Copy, FileText, Check
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { generateMockPost } from "@/components/CommunityUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/community/post-generator")({
  head: () => ({ meta: [{ title: "AI Post Generator — APEX AI" }] }),
  component: SuperAdminPostGenerator,
});

function SuperAdminPostGenerator() {
  const [platform, setPlatform] = useState("LinkedIn");
  const [category, setCategory] = useState("Intern Achievement");
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("AI, Internship, EdTech");
  
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const post = generateMockPost(platform, category, title, keywords);
      setGeneratedPost(post);
      setLoading(false);
      toast.success("AI Post copy generated successfully!");
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${generatedPost.headline}\n\n${generatedPost.caption}\n\n${generatedPost.cta}\n\n${generatedPost.hashtags}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin AI Post Generator" 
        description="Author professional AI-generated social copy announcements targeting LinkedIn, X, and newsletters."
        path="/super-admin/community/post-generator"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Configurations Column */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 space-y-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">AI Generation Parameters</span>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Platform</label>
              <select 
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter">Twitter (X)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Achievement Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="Intern Achievement">Intern Achievement</option>
                <option value="Success Story">Success Story</option>
                <option value="Recruitment">Recruitment Drive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Post Context Title</label>
            <input 
              type="text" 
              placeholder="E.g. milestone 7 approved for Amar Singh"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hashtags / Keywords</label>
            <input 
              type="text" 
              placeholder="python, deepmind, pytorch"
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="size-4" /> {loading ? "Generating Post Copy..." : "Generate AI Copy"}
          </button>
        </div>

        {/* Outputs Preview Column */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Generated Social Output</span>
          
          {generatedPost ? (
            <div className="bg-white border border-gray-150 rounded-3xl p-6 space-y-6 text-xs text-gray-700">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{platform} Format Preview</span>
                <button onClick={handleCopy} className="p-2 hover:bg-gray-100 rounded-xl text-gray-655 flex items-center gap-1.5 font-bold">
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} Copy Copy
                </button>
              </div>

              <div className="space-y-3 font-semibold">
                <div className="text-gray-900 font-extrabold">{generatedPost.headline}</div>
                <p className="whitespace-pre-line text-gray-600 leading-relaxed">{generatedPost.caption}</p>
                <div className="text-gray-900 font-extrabold">{generatedPost.cta}</div>
                <div className="text-[#FF7A00]">{generatedPost.hashtags}</div>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Generated Image Prompt Suggestion</span>
                <p className="text-[10px] text-gray-500 leading-normal">{generatedPost.imagePrompt}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-250 rounded-3xl p-12 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
              No Post generated yet.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
