"use client";

import { GlassCard } from "@/components/glass";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <GlassCard hoverable className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{value}</span>
      </div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
    </GlassCard>
  );
}
