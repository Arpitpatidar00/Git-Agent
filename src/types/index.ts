export interface ActionLog {
  id: string;
  type: string;
  status: string;
  detail: string | null;
  createdAt: string;
}

export interface Event {
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
  payload?: any;
}

export interface Stat {
  status: string;
  _count: number;
}

export interface Repo {
  id: string;
  fullName: string;
}

export interface DashboardData {
  events: Event[];
  stats: Stat[];
  repos: Repo[];
  nextPage: number | null;
}

export interface GitHubRepo {
  fullName: string;
  description: string | null;
  private: boolean;
  connected: boolean;
}

export interface ReposData {
  repos: GitHubRepo[];
}

export interface Rule {
  id: string;
  repoId: string;
  eventType: string;
  matchField: string;
  matchOperator: string;
  matchValue: string;
  actionType: string;
  actionValue: string;
  enabled: boolean;
  createdAt: string;
}
