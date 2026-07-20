import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "pink"
  | "orange"
  | "green"
  | "blue"
  | "gold"
  | "purple"
  | "red"
  | "cyan";

const toneStyles: Record<Tone, { bg: string; text: string; border: string }> = {
  primary: { bg: "bg-[#FF7A00]/8", text: "text-[#FF7A00]", border: "border-[#FF7A00]/15" },
  success: { bg: "bg-[#22C55E]/8", text: "text-[#22C55E]", border: "border-[#22C55E]/15" },
  warning: { bg: "bg-[#F59E0B]/8", text: "text-[#F59E0B]", border: "border-[#F59E0B]/15" },
  info: { bg: "bg-[#3B82F6]/8", text: "text-[#3B82F6]", border: "border-[#3B82F6]/15" },
  pink: { bg: "bg-[#FF7A00]/8", text: "text-[#FF7A00]", border: "border-[#FF7A00]/15" },
  orange: { bg: "bg-[#FF7A00]/8", text: "text-[#FF7A00]", border: "border-[#FF7A00]/15" },
  green: { bg: "bg-[#22C55E]/8", text: "text-[#22C55E]", border: "border-[#22C55E]/15" },
  blue: { bg: "bg-[#3B82F6]/8", text: "text-[#3B82F6]", border: "border-[#3B82F6]/15" },
  gold: { bg: "bg-[#F59E0B]/8", text: "text-[#F59E0B]", border: "border-[#F59E0B]/15" },
  purple: { bg: "bg-[#8B5CF6]/8", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/15" },
  red: { bg: "bg-[#EF4444]/8", text: "text-[#EF4444]", border: "border-[#EF4444]/15" },
  cyan: { bg: "bg-[#06B6D4]/8", text: "text-[#06B6D4]", border: "border-[#06B6D4]/15" },
};

export function IconBadge({
  icon: Icon,
  tone = "primary",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const s = toneStyles[tone];
  const sz = size === "lg" ? "size-12" : size === "sm" ? "size-9" : "size-10";
  const iz = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  return (
    <div className={`${sz} grid place-items-center rounded-xl ${s.bg} border ${s.border}`}>
      <Icon className={`${iz} ${s.text}`} />
    </div>
  );
}

export function StatCard({
  icon,
  tone,
  value,
  label,
  delta,
  deltaTone = "success",
}: {
  icon: LucideIcon;
  tone: Tone;
  value: ReactNode;
  label: string;
  delta?: string;
  deltaTone?: "success" | "muted" | "warning";
}) {
  const deltaClass =
    deltaTone === "success"
      ? "text-[#22C55E] bg-[#22C55E]/6 border-[#22C55E]/15"
      : deltaTone === "warning"
        ? "text-[#F59E0B] bg-[#F59E0B]/6 border-[#F59E0B]/15"
        : "text-[#6B7280] bg-[#FAFAFA] border-[#EAEAEA]";
  return (
    <div
      className={`card-surface p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:border-primary/25 hover:shadow-md group`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/[0.01] pointer-events-none" />
      <div className="flex justify-between items-start">
        <IconBadge icon={icon} tone={tone} />
        {delta && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${deltaClass}`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-1">
        <div className="text-3xl font-extrabold tracking-tight text-[#111827]">{value}</div>
        <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mt-1.5">{label}</div>
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-4 tracking-wider text-[#FF7A00] font-bold">{children}</div>;
}
