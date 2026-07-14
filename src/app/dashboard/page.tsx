"use client";

import useSWR from "swr";

interface ActionLog {
  id: string;
  type: string;
  status: string;
  detail: string | null;
  createdAt: string;
}

interface Event {
  id: string;
  eventType: string;
  action: string | null;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  githubDeliveryId: string;
  repo: { fullName: string };
  actions: ActionLog[];
}

interface Stat {
  status: string;
  _count: number;
}

interface DashboardData {
  events: Event[];
  stats: Stat[];
  repos: { id: string; fullName: string }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dotColor: string }
> = {
  received: {
    label: "Received",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    dotColor: "bg-blue-400",
  },
  processing: {
    label: "Processing",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dotColor: "bg-amber-400 animate-pulse-glow",
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dotColor: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10",
    dotColor: "bg-red-400",
  },
  dead: {
    label: "Dead",
    color: "text-zinc-400",
    bg: "bg-zinc-400/10",
    dotColor: "bg-zinc-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.received;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-surface border border-border hover:border-primary/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function TimeAgo({ date }: { date: string }) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return <span>{seconds}s ago</span>;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return <span>{minutes}m ago</span>;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return <span>{hours}h ago</span>;
  const days = Math.floor(hours / 24);
  return <span>{days}d ago</span>;
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardData>(
    "/api/dashboard/events",
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds for "live" feel
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-surface rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400">
          <p className="font-medium">Failed to load dashboard data</p>
          <p className="text-sm mt-1 opacity-80">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || [];
  const events = data?.events || [];

  const getStatCount = (status: string) =>
    stats.find((s) => s.status === status)?._count || 0;

  const totalEvents = stats.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Real-time overview of webhook events and automation actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Events"
          value={totalEvents}
          color="bg-primary/10"
          icon={
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={getStatCount("done")}
          color="bg-emerald-400/10"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Failed"
          value={getStatCount("failed") + getStatCount("dead")}
          color="bg-red-400/10"
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={getStatCount("received") + getStatCount("processing")}
          color="bg-amber-400/10"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Recent Events</h2>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            Live — refreshing every 5s
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <p className="font-medium text-muted">No events yet</p>
            <p className="text-xs text-muted mt-1">
              Connect a repo and trigger some GitHub events to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="px-6 py-4 hover:bg-card-hover transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {event.eventType}
                        {event.action && `.${event.action}`}
                      </span>
                      <StatusBadge status={event.status} />
                      {event.attempts > 1 && (
                        <span className="text-xs text-muted">
                          attempt {event.attempts}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      <span className="font-medium text-foreground">
                        {event.repo.fullName}
                      </span>
                      <span className="mx-2 text-border">•</span>
                      <TimeAgo date={event.createdAt} />
                    </p>

                    {/* Action Logs */}
                    {event.actions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {event.actions.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                log.status === "success"
                                  ? "bg-emerald-400"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-muted">{log.type}</span>
                            {log.detail && (
                              <span className="text-muted truncate max-w-md">
                                — {log.detail}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error */}
                    {event.lastError && (
                      <p className="mt-2 text-xs text-red-400 bg-red-400/5 px-2 py-1 rounded">
                        {event.lastError}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-muted font-mono shrink-0">
                    {event.githubDeliveryId.slice(0, 8)}…
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
