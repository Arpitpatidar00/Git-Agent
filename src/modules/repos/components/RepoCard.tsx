"use client";

import { GitHubRepo } from "@/types";

import { GlassCard, GlassButton } from "@/components/glass";

interface RepoCardProps {
  repo: GitHubRepo;
  loadingRepo: string | null;
  onConnect: (fullName: string) => void;
  onDisconnect: (fullName: string) => void;
}

export function RepoCard({ repo, loadingRepo, onConnect, onDisconnect }: RepoCardProps) {
  const isPending = loadingRepo === repo.fullName;

  return (
    <GlassCard hoverable className="flex items-center justify-between p-4 shadow-md">
      <div className="flex items-center gap-4 min-w-0">
        {repo.connected ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.1)]">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{repo.fullName}</p>
          {repo.description && (
            <p className="text-xs text-muted/80 truncate max-w-[320px]">{repo.description}</p>
          )}
        </div>
        {repo.private && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0 uppercase tracking-wide">
            Private
          </span>
        )}
      </div>

      {repo.connected ? (
        <GlassButton
          variant="danger"
          size="sm"
          onClick={() => onDisconnect(repo.fullName)}
          disabled={isPending}
          className="shrink-0 font-bold"
        >
          {isPending ? "Disconnecting…" : "Disconnect"}
        </GlassButton>
      ) : (
        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => onConnect(repo.fullName)}
          disabled={isPending}
          className="shrink-0 font-bold"
        >
          {isPending ? "Connecting…" : "Connect"}
        </GlassButton>
      )}
    </GlassCard>
  );
}
