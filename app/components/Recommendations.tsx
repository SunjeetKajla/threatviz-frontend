"use client";

import { BookOpen, AlertTriangle } from "lucide-react";
import type { Recommendation } from "../lib/api";

interface Props {
  recommendations: Recommendation[];
}

const RISK_STYLE: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high:     "border-l-orange-500 bg-orange-500/5",
  medium:   "border-l-yellow-500 bg-yellow-500/5",
  low:      "border-l-green-500 bg-green-500/5",
};

const RISK_TEXT: Record<string, string> = {
  critical: "text-red-400",
  high:     "text-orange-400",
  medium:   "text-yellow-400",
  low:      "text-green-400",
};

export default function Recommendations({ recommendations }: Props) {
  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 p-5 border-b border-gray-700/60">
        <BookOpen size={14} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          AI Recommendations
        </h3>
      </div>

      <div className="flex flex-col divide-y divide-gray-800/60">
        {recommendations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No recommendations available yet
          </div>
        ) : (
          recommendations.map((rec) => {
            let steps: string[] = [];
            try {
              steps = JSON.parse(rec.action_steps ?? "[]");
            } catch {
              steps = rec.action_steps ? [rec.action_steps] : [];
            }

            return (
              <div
                key={rec.id}
                className={`p-5 border-l-4 ${RISK_STYLE[rec.risk_level] ?? "border-l-gray-500"}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={14}
                      className={`mt-0.5 shrink-0 ${RISK_TEXT[rec.risk_level] ?? "text-gray-400"}`}
                    />
                    <p className="text-sm font-medium text-gray-200">{rec.summary}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      RISK_TEXT[rec.risk_level] ?? "text-gray-400"
                    } bg-gray-800`}
                  >
                    {rec.risk_level}
                  </span>
                </div>

                {rec.threats && (
                  <div className="text-xs text-gray-500 mb-3 font-mono">
                    Threat #{rec.threat_id} · {rec.threats.threat_type?.replace(/_/g, " ")} ·{" "}
                    {rec.threats.source_ip}
                  </div>
                )}

                {rec.business_impact && (
                  <p className="text-xs text-gray-400 mb-3">{rec.business_impact}</p>
                )}

                {steps.length > 0 && (
                  <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1">
                    {steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}

                <div className="mt-3 text-xs text-gray-600">
                  Generated {new Date(rec.generated_at).toLocaleString()} · {rec.llm_model}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
