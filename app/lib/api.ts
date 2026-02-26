// In dev, Next.js rewrites /api/* → http://localhost:8000/api/* (see next.config.ts)
// In production set NEXT_PUBLIC_API_URL to the backend origin.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_threats: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  investigating: number;
  resolved: number;
  logs_today: number;
  type_distribution: { type: string; count: number }[];
  severity_distribution: { severity: string; count: number }[];
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface Threat {
  id: number;
  detected_at: string;
  log_id: number | null;
  threat_type: string;
  severity: string;
  anomaly_score: number | null;
  source_ip: string;
  source_country: string | null;
  source_lat: number | null;
  source_lng: number | null;
  raw_log_data: string | null;
  status: string;
  resolved_at: string | null;
}

export interface Recommendation {
  id: number;
  threat_id: number;
  generated_at: string;
  summary: string;
  risk_level: string;
  business_impact: string;
  action_steps: string; // JSON string
  technical_detail: string;
  llm_model: string;
  threats?: {
    id: number;
    threat_type: string;
    severity: string;
    source_ip: string;
    source_country: string | null;
    status: string;
  };
}

export interface LogEntry {
  id: number;
  timestamp: string;
  source_ip: string;
  dest_ip: string | null;
  endpoint: string | null;
  method: string | null;
  status_code: number | null;
  bytes_sent: number | null;
  bytes_recv: number | null;
  country: string | null;
  user_agent: string | null;
  event_type: string | null;
}

export interface ThreatDetail {
  threat: Threat;
  recommendation: Recommendation | null;
}

export interface GeoThreat {
  id: number;
  threat_type: string;
  severity: string;
  source_ip: string;
  source_country: string | null;
  source_lat: number | null;
  source_lng: number | null;
  status: string;
  detected_at: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const api = {
  getStats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),

  getTimeline: (days = 14) =>
    apiFetch<TimelinePoint[]>(`/api/dashboard/threats/timeline?days=${days}`),

  getThreats: (params?: {
    limit?: number;
    offset?: number;
    severity?: string;
    status?: string;
    threat_type?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.limit)       qs.set("limit",       String(params.limit));
    if (params?.offset)      qs.set("offset",      String(params.offset));
    if (params?.severity)    qs.set("severity",    params.severity);
    if (params?.status)      qs.set("status",      params.status);
    if (params?.threat_type) qs.set("threat_type", params.threat_type);
    return apiFetch<{ data: Threat[]; count: number }>(
      `/api/dashboard/threats?${qs.toString()}`
    );
  },

  getThreat: (id: number) =>
    apiFetch<ThreatDetail>(`/api/dashboard/threats/${id}`),

  updateThreatStatus: (id: number, status: string) =>
    fetch(`${API_BASE}/api/dashboard/threats/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => r.json()),

  getLogs: (limit = 100) =>
    apiFetch<{ data: LogEntry[] }>(`/api/dashboard/logs?limit=${limit}`),

  getRecommendations: (limit = 20) =>
    apiFetch<{ data: Recommendation[] }>(
      `/api/dashboard/recommendations?limit=${limit}`
    ),

  getGeo: () =>
    apiFetch<{ data: GeoThreat[] }>("/api/dashboard/geo"),

  /** SSE stream URL — pass directly to useSSE() */
  streamUrl: (): string =>
    `${API_BASE || window.location.origin}/api/dashboard/stream`,
};
