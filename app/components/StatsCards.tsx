"use client";

import { ShieldAlert, ShieldCheck, Activity, FileText } from "lucide-react";
import type { DashboardStats } from "../lib/api";

interface Props {
  stats: DashboardStats;
}

const cards = [
  {
    key: "total_threats" as const,
    label: "Total Threats",
    icon: ShieldAlert,
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  {
    key: "critical" as const,
    label: "Critical",
    icon: ShieldAlert,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
  },
  {
    key: "open" as const,
    label: "Open",
    icon: Activity,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
  },
  {
    key: "resolved" as const,
    label: "Resolved",
    icon: ShieldCheck,
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
  },
  {
    key: "logs_today" as const,
    label: "Log Events Today",
    icon: FileText,
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
];

export default function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map(({ key, label, icon: Icon, color, border, bg }) => (
        <div
          key={key}
          className={`rounded-xl border ${border} ${bg} p-4 flex flex-col gap-2 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {label}
            </span>
            <Icon size={16} className={color} />
          </div>
          <span className={`text-3xl font-bold ${color}`}>
            {stats[key].toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
