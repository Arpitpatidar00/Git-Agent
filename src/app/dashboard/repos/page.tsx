"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

interface GitHubRepo {
  fullName: string;
  description: string | null;
  private: boolean;
  connected: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReposPage() {
  const { data, error, isLoading } = useSWR<{ repos: GitHubRepo[] }>(
    "/api/repos/connect",
    fetcher
  );
  const [loading, setLoading] = useState<string | null>(null);

  async function connectRepo(fullName: string) {
    setLoading(fullName);
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to connect repo");
        return;
      }
      if (data.warning) {
        alert(data.warning);
      }
      mutate("/api/repos/connect");
    } catch {
      alert("Failed to connect repo");
    } finally {
      setLoading(null);
    }
  }

  async function disconnectRepo(fullName: string) {
    if (!confirm(`Disconnect ${fullName}? This will remove the webhook and all associated data.`)) {
      return;
    }
    setLoading(fullName);
    try {
      const res = await fetch("/api/repos/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to disconnect repo");
        return;
      }
      mutate("/api/repos/connect");
    } catch {
      alert("Failed to disconnect repo");
    } finally {
      setLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-surface rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400">
          <p className="font-medium">Failed to load repositories</p>
          <p className="text-sm mt-1 opacity-80">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const repos = data?.repos || [];
  const connected = repos.filter((r) => r.connected);
  const available = repos.filter((r) => !r.connected);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Repositories</h1>
        <p className="text-sm text-muted mt-1">
          Connect your GitHub repositories to enable webhook automation
        </p>
      </div>

      {/* Connected repos */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Connected ({connected.length})
        </h2>
        {connected.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center">
            <p className="text-sm text-muted">No repos connected yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {connected.map((repo) => (
              <div
                key={repo.fullName}
                className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{repo.fullName}</p>
                    {repo.description && (
                      <p className="text-xs text-muted truncate max-w-md">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  {repo.private && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">
                      Private
                    </span>
                  )}
                </div>
                <button
                  onClick={() => disconnectRepo(repo.fullName)}
                  disabled={loading === repo.fullName}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading === repo.fullName ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available repos */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Available ({available.length})
        </h2>
        <div className="space-y-2">
          {available.map((repo) => (
            <div
              key={repo.fullName}
              className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">{repo.fullName}</p>
                  {repo.description && (
                    <p className="text-xs text-muted truncate max-w-md">
                      {repo.description}
                    </p>
                  )}
                </div>
                {repo.private && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">
                    Private
                  </span>
                )}
              </div>
              <button
                onClick={() => connectRepo(repo.fullName)}
                disabled={loading === repo.fullName}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading === repo.fullName ? "Connecting…" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
