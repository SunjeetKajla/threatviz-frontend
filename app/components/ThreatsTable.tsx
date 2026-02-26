"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, Filter } from "lucide-react";
import type { Threat } from "../lib/api";
import ThreatDetailDrawer from "./ThreatDetailDrawer";

interface Props {
  threats: Threat[];
  onStatusChange: (id: number, status: string) => void;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/40",
  high:     "bg-orange-500/20 text-orange-400 border border-orange-500/40",
  medium:   "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  low:      "bg-green-500/20 text-green-400 border border-green-500/40",
};

const STATUS_BADGE: Record<string, string> = {
  open:          "bg-red-900/40 text-red-300",
  investigating: "bg-yellow-900/40 text-yellow-300",
  resolved:      "bg-green-900/40 text-green-300",
};

const FILTERS = ["all", "critical", "high", "medium", "low"] as const;
type Filter = (typeof FILTERS)[number];

export default function ThreatsTable({ threats, onStatusChange }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered =
    filter === "all" ? threats : threats.filter((t) => t.severity === filter);

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-700/60">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Recent Threats
        </h3>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/40">
              {["ID", "Type", "Severity", "Source IP", "Country", "Status", "Detected", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No threats found
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3 text-gray-300 font-medium">
                    {t.threat_type?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        SEVERITY_BADGE[t.severity] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">
                    {t.source_ip}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {t.source_country ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      current={t.status}
                      onChange={(s) => onStatusChange(t.id, s)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(t.detected_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="View details"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selectedId !== null && (
        <ThreatDetailDrawer
          threatId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

// ─── Inline status dropdown ───────────────────────────────────────────────────
function StatusDropdown({
  current,
  onChange,
}: {
  current: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            STATUS_BADGE[current] ?? "bg-gray-700 text-gray-300"
          }`}
        >
          {current}
        </span>
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          <option value="open">open</option>
          <option value="investigating">investigating</option>
          <option value="resolved">resolved</option>
        </select>
        <ChevronDown size={10} className="text-gray-500" />
      </div>
    </div>
  );
}
