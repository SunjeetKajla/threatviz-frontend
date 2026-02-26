"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { api, ThreatDetail } from "../lib/api";

interface Props {
  threatId: number;
  onClose: () => void;
}

export default function ThreatDetailDrawer({ threatId, onClose }: Props) {
  const [detail, setDetail] = useState<ThreatDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getThreat(threatId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [threatId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-gray-950 border-l border-gray-700/60 overflow-y-auto shadow-2xl z-10 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Threat Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && detail && (
          <>
            {/* Threat overview */}
            <Section title="Overview">
              <InfoRow label="ID" value={`#${detail.threat.id}`} mono />
              <InfoRow label="Type" value={detail.threat.threat_type?.replace(/_/g, " ") ?? "—"} />
              <InfoRow label="Severity" value={<SeverityBadge s={detail.threat.severity} />} />
              <InfoRow label="Status" value={<StatusBadge s={detail.threat.status} />} />
              <InfoRow label="Source IP" value={detail.threat.source_ip} mono />
              <InfoRow label="Country" value={detail.threat.source_country ?? "Unknown"} />
              <InfoRow
                label="Anomaly Score"
                value={detail.threat.anomaly_score?.toFixed(4) ?? "—"}
                mono
              />
              <InfoRow
                label="Detected"
                value={new Date(detail.threat.detected_at).toLocaleString()}
              />
            </Section>

            {/* AI Recommendation */}
            {detail.recommendation ? (
              <Section title="AI Recommendation">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-gray-300 text-sm">{detail.recommendation.summary}</p>
                </div>

                {detail.recommendation.business_impact && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Business Impact
                    </span>
                    <p className="text-gray-400 text-sm mt-1">
                      {detail.recommendation.business_impact}
                    </p>
                  </div>
                )}

                {detail.recommendation.action_steps && (
                  <ActionSteps raw={detail.recommendation.action_steps} />
                )}

                {detail.recommendation.technical_detail && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Technical Detail
                    </span>
                    <p className="text-gray-400 text-sm mt-1 font-mono text-xs bg-gray-900 p-2 rounded-lg">
                      {detail.recommendation.technical_detail}
                    </p>
                  </div>
                )}
              </Section>
            ) : (
              <Section title="AI Recommendation">
                <p className="text-gray-500 text-sm">No recommendation generated yet.</p>
              </Section>
            )}

            {/* Raw log */}
            {detail.threat.raw_log_data && (
              <Section title="Raw Log Data">
                <pre className="text-xs text-gray-400 bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(detail.threat.raw_log_data!), null, 2);
                    } catch {
                      return detail.threat.raw_log_data;
                    }
                  })()}
                </pre>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-800 pb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-gray-300 text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    high:     "bg-orange-500/20 text-orange-400",
    medium:   "bg-yellow-500/20 text-yellow-400",
    low:      "bg-green-500/20 text-green-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[s] ?? "bg-gray-700 text-gray-300"}`}>
      {s}
    </span>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { color: string; Icon: React.ElementType }> = {
    open:          { color: "text-red-400",    Icon: AlertTriangle },
    investigating: { color: "text-yellow-400", Icon: Clock },
    resolved:      { color: "text-green-400",  Icon: CheckCircle },
  };
  const { color, Icon } = map[s] ?? { color: "text-gray-400", Icon: AlertTriangle };
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {s}
    </span>
  );
}

function ActionSteps({ raw }: { raw: string }) {
  let steps: string[] = [];
  try {
    steps = JSON.parse(raw);
  } catch {
    steps = [raw];
  }
  return (
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Action Steps
      </span>
      <ol className="mt-2 flex flex-col gap-1.5 list-decimal list-inside">
        {steps.map((step, i) => (
          <li key={i} className="text-sm text-gray-300">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
