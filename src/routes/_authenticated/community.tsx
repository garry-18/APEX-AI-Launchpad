import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Heart, MessageCircle, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Community — APEX AI" },
      { name: "description", content: "Discuss, ask, and collaborate with community members." },
    ],
  }),
  component: Community,
});

type Tag = "Discussion" | "Issue" | "Question";
type Comment = { id: string; user_id: string; text: string; created_at: string; author?: string };
type Post = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tag: Tag;
  created_at: string;
  author?: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
};

function initialsOf(name?: string | null) {
  return (name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Community() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"All" | Tag>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [npTitle, setNpTitle] = useState("");
  const [npBody, setNpBody] = useState("");
  const [npTag, setNpTag] = useState<Tag>("Discussion");

  const me = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const postsQ = useQuery({
    queryKey: ["community-posts"],
    queryFn: async (): Promise<Post[]> => {
      const [{ data: posts }, { data: likes }] = await Promise.all([
        supabase
          .from("community_posts" as any)
          .select(
            "*, author_profile:profiles(full_name), comments:community_comments(*, comment_author_profile:profiles(full_name))",
          )
          .order("created_at", { ascending: false }),
        supabase.from("community_post_likes").select("post_id, user_id"),
      ]);

      const myId = (await supabase.auth.getUser()).data.user?.id;
      const likesByPost = new Map<string, { count: number; liked: boolean }>();
      (likes ?? []).forEach((l: any) => {
        const cur = likesByPost.get(l.post_id) ?? { count: 0, liked: false };
        cur.count++;
        if (l.user_id === myId) cur.liked = true;
        likesByPost.set(l.post_id, cur);
      });

      return (posts ?? []).map((p: any) => {
        const mappedComments: Comment[] = (p.comments ?? [])
          .map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            text: c.text,
            created_at: c.created_at,
            author: c.comment_author_profile?.full_name ?? "Member",
          }))
          .sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

        return {
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          body: p.body,
          tag: p.tag as Tag,
          created_at: p.created_at,
          author: p.author_profile?.full_name ?? "Member",
          likes: likesByPost.get(p.id)?.count ?? 0,
          liked: likesByPost.get(p.id)?.liked ?? false,
          comments: mappedComments,
        };
      }) as Post[];
    },
  });

  const posts = postsQ.data ?? [];

  const visible = useMemo(
    () =>
      posts
        .filter((p) => tab === "All" || p.tag === tab)
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q.toLowerCase()) ||
            p.body.toLowerCase().includes(q.toLowerCase()),
        ),
    [posts, tab, q],
  );

  const createPostM = useMutation({
    mutationFn: async () => {
      const title = npTitle.trim();
      const body = npBody.trim();
      if (!title || !body) throw new Error("Title and content are required.");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("community_posts")
        .insert({ user_id: u.user.id, title, body, tag: npTag });
      if (error) throw error;
      // award community points via server-side function (service role)
      const { awardCommunityPointsForCurrentUser } = await import("@/lib/community.functions");
      await awardCommunityPointsForCurrentUser();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setNpTitle("");
      setNpBody("");
      setNpTag("Discussion");
      setOpen(false);
      toast.success("Post published to community.");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to publish"),
  });

  const toggleLikeM = useMutation({
    mutationFn: async (p: Post) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (p.liked) {
        await supabase
          .from("community_post_likes")
          .delete()
          .eq("post_id", p.id)
          .eq("user_id", u.user.id);
      } else {
        await supabase.from("community_post_likes").insert({ post_id: p.id, user_id: u.user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-posts"] }),
  });

  const commentM = useMutation({
    mutationFn: async (postId: string) => {
      const text = (commentDrafts[postId] || "").trim();
      if (!text) throw new Error("Comment can't be empty.");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("community_comments")
        .insert({ post_id: postId, user_id: u.user.id, text });
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      setCommentDrafts((s) => ({ ...s, [postId]: "" }));
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Comment added.");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="size-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search community…"
              className="w-full h-11 rounded-full bg-surface-2/40 border border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-surface-2/40 border border-border p-1">
            {(["All", "Discussion", "Issue", "Question"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 h-9 text-sm rounded-full transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-full text-sm font-medium bg-brand-orange-gradient text-white shadow-[0_8px_24px_-8px_var(--primary)]"
          >
            <Plus className="size-[18px]" /> New Post
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          {posts.length} posts total · {visible.length} showing
        </div>

        {postsQ.isLoading ? (
          <div className="card-surface p-12 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="card-surface p-12 text-center text-sm text-muted-foreground">
            No posts yet — be the first to start a discussion.
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((p) => {
              const expanded = !!openComments[p.id];
              const isMe = p.user_id === me.data;
              return (
                <li key={p.id} className="card-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-full bg-brand-orange-gradient grid place-items-center text-xs font-semibold text-white">
                        {initialsOf(p.author)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {p.author}
                          {isMe && <span className="text-primary text-xs ml-1">(you)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <TagChip tag={p.tag} />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {p.body}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLikeM.mutate(p)}
                      className={`inline-flex items-center gap-1.5 transition ${p.liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Heart className={`size-[18px] ${p.liked ? "fill-current" : ""}`} /> {p.likes}
                    </button>
                    <button
                      onClick={() => setOpenComments((s) => ({ ...s, [p.id]: !expanded }))}
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition"
                    >
                      <MessageCircle className={`size-[18px]`} /> {p.comments.length}{" "}
                      {p.comments.length === 1 ? "reply" : "replies"}
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {p.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <div className="size-8 rounded-full bg-brand-orange-gradient grid place-items-center text-[10px] font-semibold text-white shrink-0">
                            {initialsOf(c.author)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium">{c.author}</span>
                              <span className="text-muted-foreground">
                                {new Date(c.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          value={commentDrafts[p.id] || ""}
                          onChange={(e) =>
                            setCommentDrafts((s) => ({ ...s, [p.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commentM.mutate(p.id);
                          }}
                          placeholder="Write a comment…"
                          className="flex-1 h-10 rounded-full bg-surface-2/40 border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                          onClick={() => commentM.mutate(p.id)}
                          disabled={commentM.isPending}
                          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium bg-primary text-primary-foreground disabled:opacity-60"
                        >
                          {commentM.isPending ? (
                            <Loader2 className="size-[18px] animate-spin" />
                          ) : (
                            <Send className="size-[18px]" />
                          )}
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !createPostM.isPending && setOpen(false)}
        >
          <div className="card-surface w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Create new post</h3>
              <button
                onClick={() => !createPostM.isPending && setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-[18px]" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <input
                  value={npTitle}
                  onChange={(e) => setNpTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className="mt-1.5 w-full h-10 rounded-lg bg-surface-2/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Content</label>
                <textarea
                  value={npBody}
                  onChange={(e) => setNpBody(e.target.value)}
                  placeholder="Share more details…"
                  className="mt-1.5 w-full h-28 rounded-lg bg-surface-2/40 border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tag</label>
                <div className="mt-1.5 flex gap-2">
                  {(["Discussion", "Issue", "Question"] as Tag[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNpTag(t)}
                      className={`px-3 h-8 rounded-full text-xs border transition ${npTag === t ? "bg-primary text-primary-foreground border-transparent" : "bg-surface-2/40 border-border text-muted-foreground"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={createPostM.isPending}
                  className="px-4 h-10 rounded-full text-sm border border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createPostM.mutate()}
                  disabled={createPostM.isPending}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full text-sm font-medium bg-brand-orange-gradient text-white shadow-[0_8px_24px_-8px_var(--primary)] disabled:opacity-70"
                >
                  {createPostM.isPending ? (
                    <Loader2 className="size-[18px] animate-spin" />
                  ) : (
                    <Plus className="size-[18px]" />
                  )}
                  {createPostM.isPending ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function TagChip({ tag }: { tag: Tag }) {
  const map: Record<Tag, string> = {
    Discussion: "bg-[#F7F7F7] text-[#0D0D0D] border-[#EDEDED]",
    Issue: "bg-[#E8F5E9] text-[#2E7D32] border-[#E8F5E9]",
    Question: "bg-brand-orange-gradient-soft text-[#E24200] border-transparent",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-md border ${map[tag]}`}>{tag}</span>;
}
