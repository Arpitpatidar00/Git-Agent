"use client";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dotColor: string }
> = {
  received: {
    label: "Received",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    dotColor: "bg-blue-400 shadow-[0_0_6px_#60a5fa]",
  },
  processing: {
    label: "Processing",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    dotColor: "bg-amber-400 animate-pulse-glow shadow-[0_0_6px_#fbbf24]",
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    dotColor: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    dotColor: "bg-red-400 shadow-[0_0_6px_#f87171]",
  },
  dead: {
    label: "Dead",
    color: "text-zinc-400",
    bg: "bg-zinc-400/10 border-zinc-400/20",
    dotColor: "bg-zinc-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.received;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${config.color} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
