"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  DashboardStats,
  GeoThreat,
  LogEntry,
  Recommendation,
  Threat,
  TimelinePoint,
} from "../lib/api";
import { useSSE } from "../hooks/useSSE";
import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import { ThreatTimeline, SeverityChart, ThreatTypeChart } from "../components/Charts";
import ThreatsTable from "../components/ThreatsTable";
import RecentLogs from "../components/RecentLogs";
import Recommendations from "../components/Recommendations";

// Leaflet accesses window — must be client-only
const ThreatMap = dynamic(() => import("../components/ThreatMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900/60 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading map…</span>
      </div>
    </div>
  ),
});

// ─── Default empty state ──────────────────────────────────────────────────────
const EMPTY_STATS: DashboardStats = {
  total_threats: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  open: 0,
  investigating: 0,
  resolved: 0,
  logs_today: 0,
  type_distribution: [],
  severity_distribution: [],
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Threats", "Logs", "Recommendations"] as const;
type Tab = (typeof TABS)[number];

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]               = useState<Tab>("Overview");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Polled data
  const [stats, setStats]                     = useState<DashboardStats>(EMPTY_STATS);
  const [timeline, setTimeline]               = useState<TimelinePoint[]>([]);
  const [threats, setThreats]                 = useState<Threat[]>([]);
  const [logs, setLogs]                       = useState<LogEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [geoThreats, setGeoThreats]           = useState<GeoThreat[]>([]);

  // SSE live stream
  const sseUrl = useMemo(
    () => (typeof window !== "undefined" ? api.streamUrl() : ""),
    []
  );

  const {
    items:    liveThreats,
    newCount: liveNewCount,
    connected: sseConnected,
    resetCount,
  } = useSSE<GeoThreat>(sseUrl);

  // Merge live threats into geo list so the map reflects real-time events
  const allMapThreats = useMemo<GeoThreat[]>(() => {
    const existingIds = new Set(geoThreats.map((t) => t.id));
    const freshLive = liveThreats.filter(
      (t) => t.source_lat && t.source_lng && !existingIds.has(t.id)
    );
    return [...freshLive, ...geoThreats];
  }, [geoThreats, liveThreats]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const [statsRes, timelineRes, threatsRes, logsRes, recsRes, geoRes] =
        await Promise.allSettled([
          api.getStats(),
          api.getTimeline(14),
          api.getThreats({ limit: 100 }),
          api.getLogs(100),
          api.getRecommendations(20),
          api.getGeo(),
        ]);

      if (statsRes.status    === "fulfilled") setStats(statsRes.value);
      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value);
      if (threatsRes.status  === "fulfilled") setThreats(threatsRes.value.data);
      if (logsRes.status     === "fulfilled") setLogs(logsRes.value.data);
      if (recsRes.status     === "fulfilled") setRecommendations(recsRes.value.data);
      if (geoRes.status      === "fulfilled") setGeoThreats(geoRes.value.data);

      setLastUpdated(new Date());
    } catch (e) {
      setError(`Failed to fetch dashboard data: ${e}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset live badge when user views Overview
  useEffect(() => {
    if (tab === "Overview") resetCount();
  }, [tab, resetCount]);

  const handleStatusChange = async (id: number, status: string) => {
    await api.updateThreatStatus(id, status);
    setThreats((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar
        onRefresh={() => fetchAll(true)}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 bg-gray-950/80 sticky top-14 z-30 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
                {t === "Overview" && liveNewCount > 0 && tab !== "Overview" && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                                   bg-red-500 text-white font-bold">
                    {liveNewCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* ── Overview ──────────────────────────────────────────────────── */}
            {tab === "Overview" && (
              <div className="flex flex-col gap-6">
                <StatsCards stats={stats} />

                {/* ── Global Threat Map ── */}
                <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/60">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Global Threat Map
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500 font-mono">
                        {allMapThreats.filter((t) => t.source_lat).length} origins tracked
                      </span>
                      {liveNewCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20
                                         text-red-400 border border-red-500/30 font-mono">
                          +{liveNewCount} live
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-105 relative">
                    <ThreatMap
                      threats={allMapThreats}
                      liveCount={liveNewCount}
                      connected={sseConnected}
                    />
                  </div>
                </div>

                {/* ── Charts row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-3">
                    <ThreatTimeline data={timeline} />
                  </div>
                  <SeverityChart data={stats.severity_distribution} />
                  <ThreatTypeChart data={stats.type_distribution} />

                  {/* Status overview */}
                  <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                      Status Overview
                    </h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Open",         value: stats.open,         color: "bg-red-500"    },
                        { label: "Investigating", value: stats.investigating, color: "bg-yellow-500" },
                        { label: "Resolved",      value: stats.resolved,      color: "bg-green-500"  },
                      ].map(({ label, value, color }) => {
                        const pct = stats.total_threats
                          ? Math.round((value / stats.total_threats) * 100)
                          : 0;
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{label}</span>
                              <span>{value} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${color} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Recent threats preview ── */}
                <ThreatsTable
                  threats={threats.slice(0, 10)}
                  onStatusChange={handleStatusChange}
                />
              </div>
            )}

            {/* ── Threats ───────────────────────────────────────────────────── */}
            {tab === "Threats" && (
              <ThreatsTable threats={threats} onStatusChange={handleStatusChange} />
            )}

            {/* ── Logs ──────────────────────────────────────────────────────── */}
            {tab === "Logs" && <RecentLogs logs={logs} />}

            {/* ── Recommendations ───────────────────────────────────────────── */}
            {tab === "Recommendations" && (
              <Recommendations recommendations={recommendations} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-800/60" />
        ))}
      </div>
      <div className="h-105 rounded-xl bg-gray-800/60" />
      <div className="h-56 rounded-xl bg-gray-800/60" />
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-gray-800/60" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-gray-800/60" />
    </div>
  );
}
