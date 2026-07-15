"use client";

import { useDashboardEvents } from "@/lib/hooks/useDashboard";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";
import { StatusBadge } from "./components/StatusBadge";
import { StatCard } from "./components/StatCard";
import { TimeAgo } from "./components/TimeAgo";
import { GlassCard } from "@/components/glass";

export function DashboardView() {
  const parentRef = useRef<HTMLDivElement>(null);


  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useDashboardEvents();

  const events = data ? data.pages.flatMap((page) => page.events) : [];
  const latestPage = data?.pages[data.pages.length - 1];
  const stats = latestPage?.stats || [];

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= events.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    events.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 backdrop-blur-md">
          <p className="font-medium">Failed to load dashboard data</p>
          <p className="text-sm mt-1 opacity-80">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const getStatCount = (status: string) =>
    stats.find((s) => s.status === status)?._count || 0;

  const totalEvents = stats.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-8 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
          Event Dashboard
        </h1>
        <p className="text-sm text-muted mt-1 font-medium">
          Real-time overview of webhook events and automation actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={totalEvents}
          color="bg-primary/10 border border-primary/20 text-primary"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={getStatCount("done")}
          color="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Failed"
          value={getStatCount("failed") + getStatCount("dead")}
          color="bg-red-400/10 border border-red-400/20 text-red-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={getStatCount("received") + getStatCount("processing")}
          color="bg-amber-400/10 border border-amber-400/20 text-amber-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Events Table */}
      <GlassCard className="overflow-hidden flex flex-col h-[600px]">
        <div className="px-6 py-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-white/[0.02] shrink-0">
          <h2 className="font-semibold text-lg tracking-tight">Recent Events</h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            {isFetchingNextPage && <span className="animate-pulse">Loading more...</span>}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              Live
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 shadow-xl">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <p className="font-semibold text-muted text-base">No events yet</p>
            <p className="text-xs text-muted/65 mt-1 max-w-sm mx-auto">
              Connect a repo and trigger some GitHub events to see them here
            </p>
          </div>
        ) : (
          <div ref={parentRef} className="flex-1 overflow-y-auto relative min-h-0">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const event = events[virtualRow.index];
                if (!event) return null;
                return (
                  <div
                    key={event.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="px-6 py-5 hover:bg-white/[0.02] border-b border-white/5 last:border-b-0 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                            {event.eventType}
                            {event.action && `.${event.action}`}
                          </span>
                          <StatusBadge status={event.status} />
                          {event.attempts > 1 && (
                            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                              attempt {event.attempts}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted">
                          <span className="font-semibold text-foreground">
                            {event.repo.fullName}
                          </span>
                          <span className="mx-2 text-white/10">•</span>
                          <span className="text-xs text-muted/80">
                            <TimeAgo date={event.createdAt} />
                          </span>
                        </p>

                        {/* Action Logs */}
                        {event.actions.length > 0 && (
                          <div className="mt-3 space-y-1.5 pl-3 border-l border-white/10">
                            {event.actions.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${log.status === "success"
                                      ? "bg-emerald-400 shadow-[0_0_4px_#34d399]"
                                      : "bg-red-400 shadow-[0_0_4px_#f87171]"
                                    }`}
                                />
                                <span className="text-muted/80 font-medium">{log.type}</span>
                                {log.detail && (
                                  <span className="text-muted/60 truncate max-w-md italic">
                                    — {log.detail}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Error */}
                        {event.lastError && (
                          <p className="mt-3 text-xs text-red-400 bg-red-950/20 border border-red-500/25 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            {event.lastError}
                          </p>
                        )}
                      </div>

                      <div className="text-[10px] text-muted/50 font-mono shrink-0 select-all hover:text-muted transition-colors">
                        {event.githubDeliveryId}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
