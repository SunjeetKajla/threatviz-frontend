"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import type { DashboardStats, TimelinePoint } from "../lib/api";

// ─── Palette ──────────────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
};

const TYPE_COLORS = ["#6366f1", "#0ea5e9", "#14b8a6", "#f43f5e", "#a855f7"];

// ─── Subcomponents ────────────────────────────────────────────────────────────
interface TimelineProps {
  data: TimelinePoint[];
}

export function ThreatTimeline({ data }: TimelineProps) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    count: d.count,
  }));

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Threats Over Time (14 days)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#e5e7eb" }}
            itemStyle={{ color: "#a5b4fc" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#threatGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SeverityChartProps {
  data: DashboardStats["severity_distribution"];
}

export function SeverityChart({ data }: SeverityChartProps) {
  const ordered = ["critical", "high", "medium", "low"];
  const sorted = ordered
    .map((s) => data.find((d) => d.severity === s) ?? { severity: s, count: 0 })
    .filter((d) => d.count > 0);

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Severity Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sorted} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis dataKey="severity" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={60} />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={entry.severity}
                fill={SEVERITY_COLORS[entry.severity] ?? "#6b7280"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TypeChartProps {
  data: DashboardStats["type_distribution"];
}

export function ThreatTypeChart({ data }: TypeChartProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5 backdrop-blur-sm flex items-center justify-center h-52">
        <span className="text-gray-500 text-sm">No threat type data</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Threat Types
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={40}
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={entry.type} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Legend
            formatter={(v) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
