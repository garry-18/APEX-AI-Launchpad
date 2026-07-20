import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Send,
  Copy,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { IconBadge } from "@/components/Tile";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({
    meta: [
      { title: "Social Posting — APEX AI" },
      {
        name: "description",
        content: "AI-powered post generator for LinkedIn, Twitter, Instagram, and Facebook.",
      },
    ],
  }),
  component: Social,
});

type Platform = "LinkedIn" | "Twitter" | "Instagram" | "Facebook";
type Generated = {
  id: number;
  caption: string;
  imagePrompt: string;
  hashtags: string[];
  style: string;
};
type Published = { id: number; caption: string; platform: Platform };

const HASHTAG_POOLS: Record<Platform, string[]> = {
  LinkedIn: [
    "leadership",
    "careergrowth",
    "businessstrategy",
    "innovation",
    "productivity",
    "entrepreneurship",
    "personaldevelopment",
    "futureofwork",
    "networking",
    "mentorship",
    "founders",
    "saas",
    "b2b",
    "growthmindset",
    "thoughtleadership",
    "remotework",
    "teambuilding",
    "execution",
  ],
  Twitter: [
    "buildinpublic",
    "indiehackers",
    "startup",
    "tech",
    "ai",
    "viral",
    "thread",
    "growth",
    "shipfast",
    "devlife",
    "saas",
    "creator",
    "marketing",
    "trending",
    "todayilearned",
    "hottake",
  ],
  Instagram: [
    "instadaily",
    "reels",
    "explore",
    "lifestyle",
    "inspiration",
    "behindthescenes",
    "mood",
    "vibes",
    "contentcreator",
    "aesthetic",
    "dailypost",
    "community",
    "smallbiz",
    "creativelife",
    "storytelling",
    "motivation",
    "growthjourney",
  ],
  Facebook: [
    "community",
    "smallbusiness",
    "familytime",
    "weekendvibes",
    "localbusiness",
    "supportlocal",
    "friendsandfamily",
    "shareyourstory",
    "memories",
    "inspiration",
    "events",
    "groupchat",
    "neighborhood",
    "discussion",
    "tipsandtricks",
  ],
};

const STYLES = ["Storytelling", "Listicle", "Bold hook", "Question-led", "Contrarian"] as const;

function pickHashtags(platform: Platform, seed: number): string[] {
  const pool = [...HASHTAG_POOLS[platform]];
  // deterministic shuffle by seed
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (seed * 9301 + i * 49297) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = 10 + (seed % 6); // 10–15
  return pool.slice(0, count).map((h) => `#${h}`);
}

function buildCaption(platform: Platform, topic: string, style: string, idx: number): string {
  const t = topic.trim();
  const tl = t.toLowerCase();
  switch (platform) {
    case "LinkedIn":
      switch (style) {
        case "Storytelling":
          return `Three years ago, I almost gave up on ${tl}.\n\nThe turning point? A small shift in how I approached the work — consistency over intensity.\n\nHere's what changed everything:\n• Daily reps beat heroic sprints\n• Feedback loops > perfect plans\n• Compounding only rewards the patient\n\nIf you're early on your ${tl} journey, keep going. The first 90 days are the hardest.\n\n👉 What's the one lesson you'd share with someone starting today?`;
        case "Listicle":
          return `5 things I wish I knew about ${tl} before starting:\n\n1. Strategy without execution is a hobby\n2. The market rewards clarity, not cleverness\n3. Your network compounds faster than your skills\n4. Most "overnight success" took 7 years\n5. Done > perfect — every single time\n\nWhich one resonates with you?`;
        case "Bold hook":
          return `Most professionals get ${tl} completely wrong.\n\nThey optimize for activity, not outcomes.\n\nAfter coaching 200+ leaders, the pattern is clear: the top 1% protect their attention like capital.\n\nThree shifts to make this quarter:\n→ Audit your calendar, not your to-do list\n→ Say no by default\n→ Measure leverage, not hours\n\n💬 What's one boundary you've set that changed everything?`;
        case "Question-led":
          return `What if everything you've been told about ${tl} is outdated?\n\nThe playbook from 2015 doesn't ship in 2026. The leaders winning today are operating with a different stack:\n\n• AI as a co-pilot, not a threat\n• Async-first communication\n• Small teams, big leverage\n\nCurious to hear: how has your approach to ${tl} evolved this year?`;
        default:
          return `Unpopular opinion: ${t} is overrated — and underexecuted.\n\nWe talk about it constantly. Few actually ship.\n\nThe gap between knowing and doing is where careers are made.\n\nThis week, pick one thing. Ship it. Iterate.\n\nThe market doesn't reward your reading list. It rewards your output.`;
      }
      break;
    case "Twitter":
      switch (style) {
        case "Storytelling":
          return `i spent 6 months on ${tl}.\n\nresult: one customer.\n\nspent the next 6 weeks rewriting the pitch.\n\nresult: 40 customers.\n\nthe product wasn't broken. the story was. 🧵`;
        case "Listicle":
          return `${t} in 5 bullets 👇\n\n• ship daily\n• cut the fluff\n• talk to users\n• raise the bar\n• repeat\n\nthat's it. that's the post. 🔥`;
        case "Bold hook":
          return `hot take: ${tl} is the most underrated skill in 2026 🚀\n\nlearn it now. thank yourself in 12 months.\n\nrt if you agree 👇`;
        case "Question-led":
          return `quick poll for builders 👀\n\nwhat's the #1 thing holding you back on ${tl}?\n\na) time\nb) money\nc) clarity\nd) fear\n\ndrop your answer below ⬇️`;
        default:
          return `nobody talks about this but:\n\n${t} compounds faster when you do it in public.\n\n90 days. 1 post a day. watch what happens. 📈`;
      }
      break;
    case "Instagram":
      switch (style) {
        case "Storytelling":
          return `✨ a year ago, ${tl} was just a wish in my notes app.\n\ntoday it's a real, breathing thing. 🌱\n\nthe secret? showing up — even on the days nobody was watching. 💫\n\nif you're building something quietly right now: i see you. keep going. 🤍\n\n📍 save this for the days you need a reminder.`;
        case "Listicle":
          return `5 little rituals that made ${tl} click for me 🌿\n\n1. morning pages ✍️\n2. one focused hour, phone away 📵\n3. a walk before deciding 🚶‍♀️\n4. weekly reflection 🌙\n5. celebrate tiny wins 🎉\n\nwhich one are you trying first? 💬`;
        case "Bold hook":
          return `stop scrolling. 🛑\n\n${t} doesn't need to be perfect — it needs to be YOURS. 💖\n\nthe world has enough copies. show up as the original. ✨\n\n💬 drop a "🙋‍♀️" if you needed this today.`;
        case "Question-led":
          return `okay real talk — what does ${tl} look like in your everyday life? 👀💭\n\nfor me it's slow mornings, big dreams, and a lot of iced coffee. ☕🤍\n\ntell me yours in the comments — i love hearing this. 💬✨`;
        default:
          return `pov: you finally stopped overthinking ${tl} and just started. 🌸\n\nthe vibe shifts immediately. ✨\n\nsave this. share with the friend who needs the push. 🤝💛`;
      }
      break;
    case "Facebook":
      switch (style) {
        case "Storytelling":
          return `Hey friends 👋 wanted to share a little story about ${tl}.\n\nA while back I was completely stuck — going in circles, second-guessing every move. Then a friend said something simple: "Just take the next step. That's all."\n\nIt sounds basic, but it changed everything. One small step turned into momentum, and momentum turned into real progress.\n\nIf any of you are in that stuck place right now, this is your nudge. ❤️ Drop a comment and tell me what step you're taking this week — I'd love to cheer you on.`;
        case "Listicle":
          return `A few things I've learned about ${tl} that I wish someone had told me sooner 👇\n\n1. Done is better than perfect.\n2. Community matters more than tactics.\n3. The boring stuff is usually the important stuff.\n4. Rest is part of the work.\n5. You're further along than you think.\n\nWhich one hits hardest for you? Let me know in the comments — would love to hear your take. 💬`;
        case "Bold hook":
          return `Real talk for a second 👇\n\nWe spend so much time waiting for the "right moment" to start ${tl}. Spoiler: it doesn't exist.\n\nThe people moving forward aren't more talented — they just decided to begin.\n\nIf this resonates, share it with someone who needs to hear it today. 🙌`;
        case "Question-led":
          return `Quick question for the group 💭\n\nWhen it comes to ${tl}, what's the one thing that's actually made the biggest difference for you?\n\nI'm collecting ideas for a little community thread and would LOVE to feature your answers. Drop them below 👇❤️`;
        default:
          return `Friendly reminder ❤️\n\n${t} isn't a race. It's a practice.\n\nSome weeks you'll feel like a rocket, other weeks you'll feel like you're crawling. Both count.\n\nTag a friend who needs this today. 🌻`;
      }
      break;
  }
  return `${t} — variation ${idx + 1}`;
}

function buildImagePrompt(platform: Platform, topic: string, idx: number): string {
  const aspect =
    platform === "Instagram"
      ? "1:1 square"
      : platform === "Twitter"
        ? "16:9 landscape"
        : platform === "Facebook"
          ? "1.91:1 landscape"
          : "1.91:1 landscape";
  const moods = [
    "cinematic golden hour lighting, shallow depth of field, photorealistic",
    "minimal editorial composition, soft pastel palette, clean negative space",
    "bold high-contrast studio lighting, vibrant accent color, modern poster style",
    "warm documentary photography, candid moment, natural window light",
    "futuristic 3D render, glassmorphism, gradient backdrop, premium product aesthetic",
  ];
  const mood = moods[idx % moods.length];
  return `A ${aspect} hero image representing "${topic}" for ${platform}. ${mood}. Subject: a strong visual metaphor for the topic with clear focal point, balanced composition, and brand-safe colors. Tack-sharp focus, high dynamic range, professional retouching, no text overlays, no watermarks. Render at 4K, suitable for social media thumbnail.`;
}

function Social() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [items, setItems] = useState<Generated[]>([]);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<Published[]>([]);

  const platforms: { id: Platform; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "LinkedIn", icon: Linkedin },
    { id: "Twitter", icon: Twitter },
    { id: "Instagram", icon: Instagram },
    { id: "Facebook", icon: Facebook },
  ];

  async function generate() {
    if (!topic.trim()) {
      toast.error("Please enter a topic first.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const seedBase = Date.now();
      const next: Generated[] = STYLES.map((style, i) => ({
        id: seedBase + i,
        style,
        caption: buildCaption(platform, topic, style, i),
        imagePrompt: buildImagePrompt(platform, topic, i),
        hashtags: pickHashtags(platform, seedBase + i),
      }));
      // ensure unique captions
      const seen = new Set<string>();
      next.forEach((n, i) => {
        if (seen.has(n.caption)) n.caption = `${n.caption}\n\n(v${i + 1})`;
        seen.add(n.caption);
      });
      setItems(next);
      toast.success(`Generated 5 ${platform} posts.`);
    } catch {
      toast.error("Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Copy failed.");
    }
  }

  function publish(g: Generated) {
    setPublished((x) => [{ id: g.id, caption: g.caption, platform }, ...x]);
    toast.success("Published.");
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex items-start gap-4">
              <IconBadge icon={Sparkles} tone="info" size="lg" />
              <div>
                <h2 className="text-xl font-bold">AI Post Generator</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generates 5 platform-tuned captions, image prompts, and hashtag sets.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-xs text-muted-foreground">Topic / prompt</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.slice(0, 280))}
                  placeholder="e.g. shipping side projects while working full time"
                  className="mt-2 w-full h-28 rounded-xl bg-surface-2/40 border border-border p-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {topic.length}/280
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Platform</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {platforms.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPlatform(p.id);
                          setItems([]);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                          active
                            ? "bg-brand-orange-gradient border-transparent text-white shadow-sm"
                            : "bg-surface-2/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-[18px]" />
                        {p.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-brand-orange-gradient text-white shadow-[0_8px_24px_-8px_var(--primary)] hover:opacity-95 transition disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="size-[18px] animate-spin" />
                  ) : (
                    <Sparkles className="size-[18px]" />
                  )}
                  {loading ? "Generating…" : "Generate Posts"}
                </button>
                {items.length > 0 && (
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    <RefreshCw className={`size-[18px] ${loading ? "animate-spin" : ""}`} />{" "}
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-4">
              <div className="eyebrow">
                {items.length} Generated for {platform}
              </div>
              {items.map((g, i) => (
                <div key={g.id} className="card-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                        #{i + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {g.style} · {platform}
                      </span>
                    </div>
                    <button
                      onClick={() => publish(g)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-success/30 bg-success/10 text-success hover:bg-success/15"
                    >
                      <Send className="size-[18px]" /> Publish
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-surface-2/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="eyebrow">Caption</div>
                      <button
                        onClick={() => copy(g.caption, "Caption")}
                        className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-[18px]" /> Copy
                      </button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{g.caption}</div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border bg-surface-2/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="eyebrow inline-flex items-center gap-1.5">
                        <ImageIcon className="size-[18px]" /> Image prompt
                      </div>
                      <button
                        onClick={() => copy(g.imagePrompt, "Image prompt")}
                        className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-[18px]" /> Copy
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">{g.imagePrompt}</div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border bg-surface-2/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="eyebrow inline-flex items-center gap-1.5">
                        <Hash className="size-[18px]" /> {g.hashtags.length} Hashtags
                      </div>
                      <button
                        onClick={() => copy(g.hashtags.join(" "), "Hashtags")}
                        className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-[18px]" /> Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.hashtags.map((h) => (
                        <span
                          key={h}
                          className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="card-surface p-5 h-fit">
          <h3 className="font-semibold mb-4">Published Posts</h3>
          {published.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posts yet. Generate and publish your first.
            </p>
          ) : (
            <ul className="space-y-3">
              {published.map((p) => (
                <li key={p.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
                  <div className="text-xs text-primary mb-1">{p.platform}</div>
                  <div className="text-sm whitespace-pre-wrap line-clamp-4">{p.caption}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
