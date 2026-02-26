"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, Layer } from "leaflet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapThreat {
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

interface Props {
  threats: MapThreat[];
  liveCount: number;
  connected: boolean;
}

// ─── Matrix / Hacker colour palette ──────────────────────────────────────────

const MATRIX_GREEN = "#00ff41";
const CYBER_GREEN  = "#00ff9f";
const DIM_GREEN    = "#00cc35";
const TARGET_COLOR = "#00ff41";

const SEV_COLOR: Record<string, string> = {
  critical: "#ff0040",
  high:     "#ffcc00",
  medium:   "#00ff9f",
  low:      "#00ff41",
};

const SEV_GLOW: Record<string, string> = {
  critical: "rgba(255,0,64,0.6)",
  high:     "rgba(255,204,0,0.6)",
  medium:   "rgba(0,255,159,0.6)",
  low:      "rgba(0,255,65,0.6)",
};

// "Your Network" anchor — New York
const TARGET: [number, number] = [40.7128, -74.006];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dominantSeverity(threats: MapThreat[]): string {
  for (const sev of ["critical", "high", "medium", "low"]) {
    if (threats.some((t) => t.severity === sev)) return sev;
  }
  return "low";
}

function buildArc(
  src: [number, number],
  dst: [number, number],
  steps = 64
): [number, number][] {
  const pts: [number, number][] = [];
  const dist = Math.sqrt((dst[0] - src[0]) ** 2 + (dst[1] - src[1]) ** 2);
  const height = Math.min(38, dist * 0.25 + 6);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([
      src[0] + (dst[0] - src[0]) * t + height * Math.sin(Math.PI * t),
      src[1] + (dst[1] - src[1]) * t,
    ]);
  }
  return pts;
}

// ─── Marker HTML ──────────────────────────────────────────────────────────────

/**
 * Returns HTML for a cluster bubble marker.
 * The outer container is always 72×72 px (iconSize) so Leaflet anchors it correctly.
 * The visible bubble is sized proportionally to `count`.
 */
function clusterMarkerHtml(
  color: string,
  glow: string,
  count: number,
  delay = 0
): string {
  // Bubble radius: sqrt-scaled so a single threat is small, large clusters are big
  const size    = Math.min(52, 18 + Math.sqrt(count) * 5.5);
  const coreR   = Math.max(6, size * 0.36);
  const coreOff = (size - coreR) / 2;
  const showN   = count > 1;

  return `
    <div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;">
      <div style="position:relative;width:${size}px;height:${size}px;">

        <!-- Outer pulse glow -->
        <div style="
          position:absolute;inset:-8px;border-radius:50%;
          background:${glow};
          animation:tvPulse 2.2s ease-out ${delay}s infinite;
        "></div>

        <!-- Secondary ring -->
        <div style="
          position:absolute;inset:-3px;border-radius:50%;
          border:1px solid ${color}33;
          animation:tvPulse 2.8s ease-out ${delay + 0.7}s infinite;
        "></div>

        <!-- Circle body -->
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color}18;
          border:1.5px solid ${color}66;
        "></div>

        <!-- Bright core -->
        <div style="
          position:absolute;
          top:${coreOff}px;left:${coreOff}px;
          width:${coreR}px;height:${coreR}px;
          border-radius:50%;
          background:${color};
          box-shadow:0 0 10px ${color},0 0 22px ${glow},0 0 40px ${glow}44;
        "></div>

        ${showN ? `
        <!-- Attack count -->
        <div style="
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          color:#000;font-family:monospace;
          font-size:${size > 36 ? 11 : 9}px;font-weight:900;
          letter-spacing:-0.02em;
          text-shadow:none;
        ">${count > 99 ? "99+" : count}</div>` : ""}

      </div>
    </div>`;
}

function targetMarkerHtml(): string {
  return `
    <div style="position:relative;width:40px;height:40px;">
      <!-- Outer pulse rings -->
      <div style="
        position:absolute;inset:-8px;border-radius:50%;
        background:rgba(0,255,65,0.10);
        animation:tvPulse 1.5s ease-out 0s infinite;
      "></div>
      <div style="
        position:absolute;inset:-2px;border-radius:50%;
        background:rgba(0,255,65,0.07);
        animation:tvPulse 1.5s ease-out 0.5s infinite;
      "></div>

      <!-- Circle border -->
      <div style="
        position:absolute;inset:0;border-radius:50%;
        border:1.5px solid ${TARGET_COLOR}55;
      "></div>

      <!-- Crosshair H -->
      <div style="
        position:absolute;top:50%;left:4px;right:4px;
        height:1px;background:${TARGET_COLOR}50;transform:translateY(-50%);
      "></div>
      <!-- Crosshair V -->
      <div style="
        position:absolute;left:50%;top:4px;bottom:4px;
        width:1px;background:${TARGET_COLOR}50;transform:translateX(-50%);
      "></div>

      <!-- Core dot -->
      <div style="
        position:absolute;inset:15px;border-radius:50%;
        background:${TARGET_COLOR};
        box-shadow:0 0 14px rgba(0,255,65,0.95),0 0 30px rgba(0,255,65,0.5);
      "></div>
    </div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThreatMap({ threats, liveCount, connected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const layersRef    = useRef<Layer[]>([]);

  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    threats.forEach((t) => {
      if (t.source_country)
        counts[t.source_country] = (counts[t.source_country] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [threats]);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    Promise.all([
      import("leaflet"),
      
    ]).then(([{ default: L }]) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        center: [25, 5],
        zoom: 2,
        minZoom: 1,
        maxZoom: 5,
        zoomControl: false,
        attributionControl: false,
        // preferCanvas MUST be false so polylines render as SVG and support CSS animation
        preferCanvas: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Green phosphor filter — tiles only, not markers/arcs
      const tilePaneEl = map.getPanes().tilePane as HTMLElement;
      tilePaneEl.style.filter =
        "sepia(1) hue-rotate(85deg) saturate(9) brightness(0.6)";

      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Draw threats ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Clear previous layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      // ── Target marker ──────────────────────────────────────────────────────
      const targetIcon = L.divIcon({
        className: "",
        html: targetMarkerHtml(),
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
      });
      const targetMarker = L.marker(TARGET, {
        icon: targetIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindTooltip(
          `<div style="
            background:#000;border:1px solid ${MATRIX_GREEN}88;padding:5px 10px;
            border-radius:4px;color:${MATRIX_GREEN};font-size:11px;font-family:monospace;
            letter-spacing:0.05em;font-weight:700;text-shadow:0 0 6px ${MATRIX_GREEN};">
            ▶ YOUR NETWORK
          </div>`,
          { direction: "top", className: "tv-tooltip" }
        );
      layersRef.current.push(targetMarker);

      // ── Cluster threats by ~1° grid (~111 km) ─────────────────────────────
      const clusters = new Map<
        string,
        { lat: number; lng: number; threats: MapThreat[] }
      >();

      threats.forEach((threat) => {
        if (!threat.source_lat || !threat.source_lng) return;
        const key = `${threat.source_lat.toFixed(1)},${threat.source_lng.toFixed(1)}`;
        if (!clusters.has(key)) {
          clusters.set(key, {
            lat: threat.source_lat,
            lng: threat.source_lng,
            threats: [],
          });
        }
        clusters.get(key)!.threats.push(threat);
      });

      // ── Draw one bubble marker + animated arc per cluster ─────────────────
      let idx = 0;
      clusters.forEach(({ lat, lng, threats: clusterThreats }) => {
        const count  = clusterThreats.length;
        const sev    = dominantSeverity(clusterThreats);
        const color  = SEV_COLOR[sev] ?? MATRIX_GREEN;
        const glow   = SEV_GLOW[sev]  ?? "rgba(0,255,65,0.6)";
        const src: [number, number] = [lat, lng];
        const delay  = (idx % 14) * 0.15;
        idx++;

        // Bubble marker
        const icon = L.divIcon({
          className: "",
          html:       clusterMarkerHtml(color, glow, count, delay),
          iconSize:   [72, 72],
          iconAnchor: [36, 36],
        });

        const sample = clusterThreats[0];
        const marker = L.marker(src, { icon })
          .addTo(map)
          .bindTooltip(
            `<div style="
              background:#000e00;border:1px solid ${color}55;padding:6px 10px;
              border-radius:4px;color:#e0ffe0;font-size:11px;min-width:165px;
              font-family:monospace;">
              <div style="
                font-weight:700;color:${color};margin-bottom:3px;
                letter-spacing:0.08em;text-shadow:0 0 6px ${color};">
                ⚠ ${count} ATTACK${count > 1 ? "S" : ""}
              </div>
              <div style="color:#4ade80;font-size:10px;">
                ${sample.source_country ?? "UNKNOWN"}
              </div>
              <div style="color:#166534;font-size:10px;margin-top:2px;">
                ${count > 1 ? `${count} source IPs` : sample.source_ip}
              </div>
              <div style="
                margin-top:4px;font-size:10px;color:${color};
                text-shadow:0 0 4px ${color};">
                [${sev.toUpperCase()}]
              </div>
            </div>`,
            { direction: "top", className: "tv-tooltip" }
          );
        layersRef.current.push(marker);

        // Animated attack arc
        const arcPts = buildArc(src, TARGET);
        const arc = L.polyline(arcPts, {
          color,
          weight:  count > 5 ? 2.2 : 1.6,
          opacity: 0.8,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).addTo(map);
        layersRef.current.push(arc);

        // Apply flowing dash animation to the underlying SVG element.
        // preferCanvas:false ensures this is an SVG <polyline>, not canvas.
        const arcEl = arc.getElement();
        if (arcEl) {
          const el = arcEl as SVGPolylineElement;
          el.style.strokeDasharray  = "11 6";
          el.style.strokeDashoffset = "0";
          el.style.animation        = `tvFlowLine 1.1s linear ${delay}s infinite`;
        }
      });
    });
  }, [threats]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* ── Leaflet map ── */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Vignette — dark edges ── */}
      <div
        className="absolute inset-0 z-400 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(20,0,0,0.65) 100%)",
        }}
      />

      {/* ── Scanline overlay ── */}
      <div
        className="absolute inset-0 z-401 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(0,255,65,0.025) 0px,rgba(0,255,65,0.025) 1px,transparent 1px,transparent 3px)",
        }}
      />

      {/* ── LIVE badge (top-left) ── */}
      <div
        className="absolute top-3 left-3 z-500 flex items-center gap-2 px-3 py-1.5
                   rounded-md backdrop-blur-sm text-xs font-mono"
        style={{
          background: "rgba(0,10,0,0.85)",
          border: `1px solid ${connected ? MATRIX_GREEN + "55" : "#ff004055"}`,
          color: connected ? MATRIX_GREEN : "#ff0040",
          textShadow: connected
            ? `0 0 6px ${MATRIX_GREEN}`
            : "0 0 6px #ff0040",
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: connected ? MATRIX_GREEN : "#ff0040",
            boxShadow: connected
              ? `0 0 6px ${MATRIX_GREEN}`
              : "0 0 6px #ff0040",
            animation: connected ? "tvBlink 1.2s ease-in-out infinite" : "none",
          }}
        />
        {connected ? "LIVE" : "OFFLINE"}
        {liveCount > 0 && (
          <span style={{ color: CYBER_GREEN, marginLeft: 4 }}>
            +{liveCount}
          </span>
        )}
      </div>

      {/* ── Legend (bottom-left) ── */}
      <div
        className="absolute bottom-4 left-3 z-500 p-3 rounded-md backdrop-blur-sm text-xs space-y-1.5"
        style={{
          background: "rgba(0,8,0,0.88)",
          border: `1px solid ${MATRIX_GREEN}33`,
        }}
      >
        <div
          className="uppercase tracking-widest text-[9px] font-bold mb-2"
          style={{ color: DIM_GREEN, letterSpacing: "0.15em" }}
        >
          // LEGEND
        </div>
        {[
          { color: TARGET_COLOR, label: "YOUR NETWORK" },
          { color: "#ff0040",    label: "CRITICAL" },
          { color: "#ffcc00",    label: "HIGH" },
          { color: "#00ff9f",    label: "MEDIUM" },
          { color: "#00ff41",    label: "LOW" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: color, boxShadow: `0 0 5px ${color}` }}
            />
            <span
              style={{
                color: "#4ade80",
                fontFamily: "monospace",
                fontSize: 10,
              }}
            >
              {label}
            </span>
          </div>
        ))}
        <div
          className="flex items-center gap-2 pt-1"
          style={{ borderTop: "1px solid #00ff4122" }}
        >
          <div
            className="w-7"
            style={{ borderTop: "1px dashed #00ff4155" }}
          />
          <span
            style={{
              color: "#166534",
              fontFamily: "monospace",
              fontSize: 10,
            }}
          >
            ATTACK ARC
          </span>
        </div>
      </div>

      {/* ── Top Attack Origins (top-right) ── */}
      {topCountries.length > 0 && (
        <div
          className="absolute top-3 right-3 z-500 w-44 p-3 rounded-md backdrop-blur-sm"
          style={{
            background: "rgba(0,8,0,0.88)",
            border: `1px solid ${MATRIX_GREEN}33`,
          }}
        >
          <div
            className="text-[9px] uppercase tracking-widest font-bold mb-2"
            style={{ color: DIM_GREEN, letterSpacing: "0.15em" }}
          >
            // TOP ORIGINS
          </div>
          <div className="space-y-2">
            {topCountries.map(([country, count], i) => {
              const maxCount = topCountries[0][1];
              const pct = Math.round((count / maxCount) * 100);
              const barColor =
                i === 0 ? "#ff0040" : i === 1 ? "#ffcc00" : MATRIX_GREEN;
              return (
                <div key={country}>
                  <div
                    className="flex justify-between mb-0.5"
                    style={{ fontFamily: "monospace" }}
                  >
                    <span
                      className="truncate max-w-24 text-[11px]"
                      style={{ color: "#86efac" }}
                    >
                      {country}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: barColor }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "#001a00" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: barColor,
                        boxShadow: `0 0 4px ${barColor}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="mt-3 pt-2 flex justify-between text-[11px]"
            style={{
              borderTop: `1px solid ${MATRIX_GREEN}22`,
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: "#166534" }}>TRACKED</span>
            <span
              style={{
                color: MATRIX_GREEN,
                textShadow: `0 0 6px ${MATRIX_GREEN}`,
              }}
            >
              {threats.filter((t) => t.source_lat).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
