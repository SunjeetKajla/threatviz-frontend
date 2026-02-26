"use client";

import { Shield, RefreshCw } from "lucide-react";

interface Props {
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
}

export default function Navbar({ onRefresh, refreshing, lastUpdated }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">ThreatViz</span>
          <span className="hidden sm:inline text-xs text-gray-500 font-mono ml-2 border border-gray-700 rounded px-1.5 py-0.5">
            SOC Dashboard
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="hidden sm:inline text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
