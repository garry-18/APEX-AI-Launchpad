import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export type NotificationItem = {
  un_id: string;
  notification_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type Ctx = {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markRead: (un_id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  latestIncoming: NotificationItem | null;
  dismissIncoming: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const uid = user?.id ?? null;
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [latestIncoming, setLatestIncoming] = useState<NotificationItem | null>(null);

  const query = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select(
          "id, is_read, read_at, created_at, notification:notifications(id, title, message, link, created_at)",
        )
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const items: NotificationItem[] = (data ?? []).map((row: any) => ({
        un_id: row.id,
        notification_id: row.notification?.id,
        title: row.notification?.title ?? "",
        message: row.notification?.message ?? "",
        link: row.notification?.link ?? null,
        is_read: row.is_read,
        read_at: row.read_at,
        created_at: row.notification?.created_at ?? row.created_at,
      }));
      return items;
    },
  });

  // Seed seen set with initial fetch so existing unread don't pop up as new
  useEffect(() => {
    if (!query.data || initializedRef.current) return;
    query.data.forEach((i) => seenIdsRef.current.add(i.un_id));
    initializedRef.current = true;
  }, [query.data]);

  // Realtime subscription
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`user-notifications:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${uid}`,
        },
        async (payload: any) => {
          const unId = payload.new.id as string;
          const notifId = payload.new.notification_id as string;
          if (seenIdsRef.current.has(unId)) return;
          // Fetch the notification content
          const { data: n } = await supabase
            .from("notifications")
            .select("id, title, message, link, created_at")
            .eq("id", notifId)
            .maybeSingle();
          if (!n) return;
          const item: NotificationItem = {
            un_id: unId,
            notification_id: n.id,
            title: n.title,
            message: n.message,
            link: n.link,
            is_read: false,
            read_at: null,
            created_at: n.created_at,
          };
          seenIdsRef.current.add(unId);
          qc.setQueryData<NotificationItem[]>(["notifications", uid], (prev) => [
            item,
            ...(prev ?? []),
          ]);
          if (initializedRef.current) setLatestIncoming(item);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${uid}`,
        },
        (payload: any) => {
          qc.setQueryData<NotificationItem[]>(["notifications", uid], (prev) =>
            (prev ?? []).map((i) =>
              i.un_id === payload.new.id
                ? { ...i, is_read: payload.new.is_read, read_at: payload.new.read_at }
                : i,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  const items = query.data ?? [];
  const unreadCount = items.filter((i) => !i.is_read).length;

  async function markRead(un_id: string) {
    qc.setQueryData<NotificationItem[]>(["notifications", uid], (prev) =>
      (prev ?? []).map((i) =>
        i.un_id === un_id ? { ...i, is_read: true, read_at: new Date().toISOString() } : i,
      ),
    );
    await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", un_id);
  }

  async function markAllRead() {
    qc.setQueryData<NotificationItem[]>(["notifications", uid], (prev) =>
      (prev ?? []).map((i) => ({
        ...i,
        is_read: true,
        read_at: i.read_at ?? new Date().toISOString(),
      })),
    );
    await supabase.rpc("mark_all_notifications_read");
  }

  const value = useMemo<Ctx>(
    () => ({
      items,
      unreadCount,
      loading: query.isLoading,
      markRead,
      markAllRead,
      latestIncoming,
      dismissIncoming: () => setLatestIncoming(null),
    }),
    [items, unreadCount, query.isLoading, latestIncoming],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
