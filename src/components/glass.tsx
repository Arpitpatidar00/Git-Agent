"use client";

import React from "react";

// ─── GlassCard ───────────────────────────────────────────────────
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function GlassCard({ children, className = "", hoverable = false, ...props }: GlassCardProps) {
  return (
    <div
      className={`relative rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] transition-all duration-300 ${
        hoverable ? "hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-bg-hover)] hover:-translate-y-0.5 hover:shadow-lg" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── GlassButton ─────────────────────────────────────────────────
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export function GlassButton({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "px-3.5 py-2 text-xs rounded-xl",
    md: "px-4.5 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3.5 text-base rounded-2xl",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20 hover:shadow-primary/30 border border-primary/25 hover:border-primary/45",
    secondary:
      "bg-white/5 hover:bg-white/10 text-foreground border border-white/5 hover:border-white/15",
    danger:
      "bg-red-400/10 hover:bg-red-400/15 text-red-400 border border-red-500/15 hover:border-red-500/25",
    success:
      "bg-emerald-400/10 hover:bg-emerald-400/15 text-emerald-400 border border-emerald-500/15 hover:border-emerald-500/25",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── GlassInput ──────────────────────────────────────────────────
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function GlassInput({ label, className = "", ...props }: GlassInputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-muted/80 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border border-white/5 bg-zinc-950/45 px-3.5 py-2.5 text-sm placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 backdrop-blur-sm transition-all text-foreground ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── GlassSelect ─────────────────────────────────────────────────
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function GlassSelect({ label, children, className = "", ...props }: GlassSelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-muted/80 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-xl border border-white/5 bg-zinc-950/45 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 backdrop-blur-sm transition-all text-foreground ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ─── GlassModal ──────────────────────────────────────────────────
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function GlassModal({ isOpen, onClose, title, children }: GlassModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-lg mx-4 p-6 border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
}
