"use client";

import { useRepos, useConnectRepo, useDisconnectRepo } from "@/lib/hooks/useRepos";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef } from "react";
import { RepoCard } from "./components/RepoCard";
import { useAlert } from "@/lib/providers/alert-provider";

export function ReposView() {
  const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
  const { showAlert, showConfirm } = useAlert();

  const connectedParentRef = useRef<HTMLDivElement>(null);
  const availableParentRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useRepos();
  const connectMutation = useConnectRepo();
  const disconnectMutation = useDisconnectRepo();

  const repos = data?.repos || [];
  const connected = repos.filter((r) => r.connected);
  const available = repos.filter((r) => !r.connected);

  const connectedVirtualizer = useVirtualizer({
    count: connected.length,
    getScrollElement: () => connectedParentRef.current,
    estimateSize: () => 82,
    overscan: 5,
  });

  const availableVirtualizer = useVirtualizer({
    count: available.length,
    getScrollElement: () => availableParentRef.current,
    estimateSize: () => 82,
    overscan: 5,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 backdrop-blur-md">
          <p className="font-medium">Failed to load repositories</p>
          <p className="text-sm mt-1 opacity-80">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const connectedItems = connectedVirtualizer.getVirtualItems();
  const availableItems = availableVirtualizer.getVirtualItems();

  async function handleConnect(fullName: string) {
    setLoadingRepo(fullName);
    try {
      await connectMutation.mutateAsync(fullName);
    } catch (err: any) {
      showAlert(err.message || "Failed to connect repository", "Error");
    } finally {
      setLoadingRepo(null);
    }
  }

  async function handleDisconnect(fullName: string) {
    const confirmed = await showConfirm(
      `Disconnect ${fullName}? This will remove the webhook and all associated data.`,
      "Disconnect Repository"
    );
    if (!confirmed) return;
    setLoadingRepo(fullName);
    try {
      await disconnectMutation.mutateAsync(fullName);
    } catch (err: any) {
      showAlert(err.message || "Failed to disconnect repository", "Error");
    } finally {
      setLoadingRepo(null);
    }
  }

  return (
    <div className="p-8 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
          Repositories
        </h1>
        <p className="text-sm text-muted mt-1 font-medium">
          Connect your GitHub repositories to enable webhook automation
        </p>
      </div>

      {/* Connected repos */}
      <div>
        <h2 className="text-xs font-semibold text-muted/70 uppercase tracking-widest mb-4">
          Connected Repositories ({connected.length})
        </h2>
        {connected.length === 0 ? (
          <div className="p-10 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm text-center">
            <p className="text-sm text-muted/80">No repositories connected yet</p>
          </div>
        ) : (
          <div
            ref={connectedParentRef}
            className="overflow-y-auto max-h-[350px] relative border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm p-2 shadow-inner"
          >
            <div
              style={{
                height: `${connectedVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {connectedItems.map((virtualRow) => {
                const repo = connected[virtualRow.index];
                if (!repo) return null;
                return (
                  <div
                    key={repo.fullName}
                    data-index={virtualRow.index}
                    ref={connectedVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      padding: "8px",
                    }}
                  >
                    <RepoCard
                      repo={repo}
                      loadingRepo={loadingRepo}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Available repos */}
      <div>
        <h2 className="text-xs font-semibold text-muted/70 uppercase tracking-widest mb-4">
          Available Repositories ({available.length})
        </h2>
        {available.length === 0 ? (
          <div className="p-10 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm text-center">
            <p className="text-sm text-muted/80">No available repositories found</p>
          </div>
        ) : (
          <div
            ref={availableParentRef}
            className="overflow-y-auto max-h-[400px] relative border border-white/5 rounded-2xl bg-zinc-900/20 backdrop-blur-sm p-2 shadow-inner"
          >
            <div
              style={{
                height: `${availableVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {availableItems.map((virtualRow) => {
                const repo = available[virtualRow.index];
                if (!repo) return null;
                return (
                  <div
                    key={repo.fullName}
                    data-index={virtualRow.index}
                    ref={availableVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      padding: "8px",
                    }}
                  >
                    <RepoCard
                      repo={repo}
                      loadingRepo={loadingRepo}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
