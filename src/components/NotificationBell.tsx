import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, X, Inbox, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, relativeTime, type NotificationItem } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NotificationBell() {
  const { unreadCount, items, markRead, markAllRead, latestIncoming, dismissIncoming } =
    useNotifications();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboard = pathname === "/";
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<NotificationItem | null>(null);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse, setPulse] = useState(false);

  // Trigger popup only on dashboard
  useEffect(() => {
    if (!latestIncoming) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 1500);
    if (isDashboard && !open) {
      setPopup(latestIncoming);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPopup(null);
        dismissIncoming();
      }, 7000);
    } else {
      dismissIncoming();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [latestIncoming, isDashboard, open]);

  function closePopup() {
    setPopup(null);
    dismissIncoming();
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.is_read) await markRead(item.un_id);
    setOpen(false);
    if (item.link) navigate({ to: item.link as any }).catch(() => {});
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Notifications"
            className={`relative size-10 grid place-items-center rounded-full bg-surface-2/60 border border-border hover:bg-surface-2 transition ${pulse ? "animate-[wiggle_0.6s_ease-in-out_2]" : ""}`}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink text-[10px] font-bold text-white grid place-items-center shadow-md animate-in zoom-in-50 duration-200">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={10}
          className="w-[360px] max-w-[calc(100vw-1rem)] p-0 bg-surface border-border"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-primary" />
              <div className="font-semibold text-sm">Notifications</div>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">({unreadCount} new)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <SendTestButton />
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-2"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3.5" /> Mark all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                <Inbox className="size-8 mx-auto mb-2 opacity-50" />
                You're all caught up.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.un_id}>
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-2/60 transition ${
                        !item.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${!item.is_read ? "bg-primary animate-pulse" : "bg-transparent"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm truncate ${!item.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {item.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.message}
                        </div>
                        <div className="text-[11px] text-muted-foreground/70 mt-1">
                          {relativeTime(item.created_at)}
                        </div>
                      </div>
                      {!item.is_read && (
                        <span
                          role="button"
                          aria-label="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(item.un_id);
                          }}
                          className="self-start size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
                        >
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Popup card under bell, dashboard only */}
      {popup && isDashboard && (
        <div
          className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-surface shadow-2xl p-4 animate-in slide-in-from-top-2 fade-in-0 duration-300"
          role="alert"
        >
          <button
            aria-label="Close"
            onClick={closePopup}
            className="absolute top-2 right-2 size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
          >
            <X className="size-3.5" />
          </button>
          <button
            onClick={() => {
              handleItemClick(popup);
              closePopup();
            }}
            className="text-left w-full pr-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-pink animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                New
              </span>
            </div>
            <div className="font-semibold text-sm">{popup.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{popup.message}</div>
            <div className="text-[11px] text-muted-foreground/70 mt-2">
              {relativeTime(popup.created_at)}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function SendTestButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          const { error } = await supabase.rpc("send_self_notification", {
            _title: "Hello from Apex AI",
            _message: "This is a sample real-time notification — try it from any page.",
            _link: "/",
          });
          if (error) throw error;
        } catch (e: any) {
          toast.error(e.message ?? "Failed to send");
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      title="Send a test notification to yourself"
      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-2"
    >
      <Send className="size-3.5" /> Test
    </button>
  );
}
