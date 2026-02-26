"use client";

import { Activity } from "lucide-react";
import type { LogEntry } from "../lib/api";

interface Props {
  logs: LogEntry[];
}

const STATUS_COLOR: Record<number, string> = {
  200: "text-green-400",
  201: "text-green-400",
  204: "text-green-400",
  301: "text-blue-400",
  302: "text-blue-400",
  400: "text-yellow-400",
  401: "text-yellow-400",
  403: "text-orange-400",
  404: "text-orange-400",
  429: "text-orange-400",
  500: "text-red-400",
  502: "text-red-400",
  503: "text-red-400",
};

function statusColor(code: number | null) {
  if (!code) return "text-gray-500";
  return STATUS_COLOR[code] ?? (code >= 500 ? "text-red-400" : code >= 400 ? "text-orange-400" : "text-gray-400");
}

export default function RecentLogs({ logs }: Props) {
  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 p-5 border-b border-gray-700/60">
        <Activity size={14} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Recent Log Events
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["Timestamp", "Source IP", "Method", "Endpoint", "Status", "Country", "Type"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No log events found
                </td>
              </tr>
            ) : (
              logs.slice(0, 50).map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">
                    {log.source_ip}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono text-indigo-400">{log.method ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-400 text-xs max-w-xs truncate">
                    {log.endpoint ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold font-mono ${statusColor(log.status_code)}`}>
                      {log.status_code ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{log.country ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{log.event_type ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
