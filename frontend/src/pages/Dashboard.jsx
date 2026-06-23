import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Database,
  ExternalLink,
  AlertTriangle,
  MapPinned,
  Gauge,
  ListOrdered,
  BarChart3,
  ShieldAlert,
  Clock,
  Image as ImageIcon,
  Map as MapIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// BACKUP MODE
// Your live FastAPI model isn't responding yet, so this dashboard renders
// hardcoded data + images/maps served directly from SAMPLE_OUTPUTS instead.
//
// To switch back to the live model later:
//   1. Set USE_SAMPLE_DATA = false
//   2. Make sure VITE_API_BASE_URL points at your running FastAPI server
// Nothing else needs to change — the fetch + rendering code below is the
// same shape either way.
// ---------------------------------------------------------------------------
const USE_SAMPLE_DATA = true;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const DATASET_URL = import.meta.env.VITE_INPUT_DATA;
const DATASET_LABEL = "jan to may police violation_anonymized.csv";

// The Vite dev server serves these files directly from SAMPLE_OUTPUTS at
// /sample-outputs/*, so the dashboard can reference them without copying.
const ZONE_IMAGES = [
  { zone: "All zones", file: "/sample-outputs/heatmap_all.png" },
  { zone: "Arterial", file: "/sample-outputs/heatmap_arterial.png" },
  { zone: "Commercial", file: "/sample-outputs/heatmap_commercial.png" },
  { zone: "Metro", file: "/sample-outputs/heatmap_metro.png" },
  { zone: "Residential", file: "/sample-outputs/heatmap_residential.png" },
  {
    zone: "School / Hospital",
    file: "/sample-outputs/heatmap_school_hospital.png",
  },
];

const TREND_IMAGES = [
  { title: "Daily violation trend", file: "/sample-outputs/daily_trend.png" },
  {
    title: "Violations by vehicle & hour",
    file: "/sample-outputs/vehicle_hour.png",
  },
];

const INTERACTIVE_MAPS = [
  {
    title: "Hotspot map (DBSCAN clusters)",
    file: "/sample-outputs/hotspot_map_dbscan.html",
  },
  {
    title: "Congestion heatmap (satellite)",
    file: "/sample-outputs/congestion_heatmap_satellite.html",
  },
];

const SAMPLE_COVERAGE = [
  { label: "Ranked hotspots", detail: "Top cluster list and junction overlap" },
  { label: "Priority windows", detail: "Zone · day · hour enforcement table" },
  { label: "Heatmaps", detail: "All zones plus 5 road / area types" },
  { label: "Trend charts", detail: "Daily trend and vehicle-hour mix" },
  { label: "Interactive maps", detail: "DBSCAN map and satellite heatmap" },
  { label: "Raw response", detail: "Debug payload for live /predict" },
];

// Top rows lifted directly from ranked_hotspots.csv (sorted by rank)
const SAMPLE_HOTSPOTS = [
  {
    rank: 1,
    cluster_id: 1,
    violation_count: 59579,
    matched_junction: "BTP082 - KR Market Junction",
    top_violation_types: {
      "WRONG PARKING": 36896,
      "NO PARKING": 23127,
      "PARKING IN A MAIN ROAD": 1913,
    },
    police_stations: [
      "Chamarajpet",
      "City Market",
      "Halasuru Gate",
      "High ground",
      "No Police Station",
      "Sheshadripuram",
      "Upparpet",
      "V.V.Puram (C.Pet)",
    ],
  },
  {
    rank: 2,
    cluster_id: 17,
    violation_count: 25073,
    matched_junction: "BTP051 - Safina Plaza Junction",
    top_violation_types: {
      "WRONG PARKING": 15439,
      "NO PARKING": 9674,
      "DEFECTIVE NUMBER PLATE": 1044,
    },
    police_stations: [
      "Cubbon Park",
      "Halasur",
      "Pulikeshinagar(F.Town)",
      "Shivajinagar",
    ],
  },
  {
    rank: 3,
    cluster_id: 26,
    violation_count: 10275,
    matched_junction: "BTP001 - 10th Cross, Dr. Rajkumar Road",
    top_violation_types: {
      "WRONG PARKING": 6495,
      "NO PARKING": 3821,
      "DEFECTIVE NUMBER PLATE": 186,
    },
    police_stations: ["Malleshwaram", "No Police Station", "Rajajinagar"],
  },
  {
    rank: 4,
    cluster_id: 2,
    violation_count: 10149,
    matched_junction: "BTP027 - Modi Bridge Junction",
    top_violation_types: {
      "WRONG PARKING": 7288,
      "NO PARKING": 2868,
      "PARKING IN A MAIN ROAD": 188,
    },
    police_stations: [
      "Malleshwaram",
      "Rajajinagar",
      "Sheshadripuram",
      "Vijayanagara",
    ],
  },
  {
    rank: 5,
    cluster_id: 125,
    violation_count: 9790,
    matched_junction: "UNCATALOGUED (no official junction tag)",
    top_violation_types: {
      "NO PARKING": 6143,
      "WRONG PARKING": 4489,
      "PARKING IN A MAIN ROAD": 2194,
    },
    police_stations: ["HAL Old Airport"],
  },
  {
    rank: 6,
    cluster_id: 19,
    violation_count: 9592,
    matched_junction: "BTP054 - Shivananda Circle",
    top_violation_types: {
      "WRONG PARKING": 5089,
      "NO PARKING": 4520,
      "DEFECTIVE NUMBER PLATE": 82,
    },
    police_stations: ["Malleshwaram", "Sadashivanagar", "Sheshadripuram"],
  },
  {
    rank: 7,
    cluster_id: 53,
    violation_count: 8366,
    matched_junction: "BTP020 - Hosahalli Metro Station",
    top_violation_types: {
      "NO PARKING": 4910,
      "WRONG PARKING": 3498,
      "DEFECTIVE NUMBER PLATE": 228,
    },
    police_stations: ["Magadi Road", "No Police Station", "Vijayanagara"],
  },
  {
    rank: 8,
    cluster_id: 25,
    violation_count: 5779,
    matched_junction: "UNCATALOGUED (no official junction tag)",
    top_violation_types: {
      "WRONG PARKING": 4130,
      "NO PARKING": 1656,
      "DEFECTIVE NUMBER PLATE": 227,
    },
    police_stations: ["Hebbala", "Kodigehalli", "Yelahanka"],
  },
  {
    rank: 9,
    cluster_id: 23,
    violation_count: 4967,
    matched_junction: "BTP011 - RR Kalyana Mantapa, Dr. Rajkumar Road",
    top_violation_types: {
      "WRONG PARKING": 3619,
      "NO PARKING": 1357,
      "PARKING IN A MAIN ROAD": 219,
    },
    police_stations: ["Magadi Road", "Rajajinagar", "Vijayanagara"],
  },
  {
    rank: 10,
    cluster_id: 5,
    violation_count: 4741,
    matched_junction: "BTP016 - 5th Main Road, RPC Layout",
    top_violation_types: {
      "WRONG PARKING": 3337,
      "NO PARKING": 1429,
      "DEFECTIVE NUMBER PLATE": 96,
    },
    police_stations: ["No Police Station", "Vijayanagara"],
  },
];

// Top 3 rows per zone from enforcement_windows.csv (sorted by priority_score)
// — picked per-zone so the sample shows variety across arterial / commercial /
// metro / residential / school_hospital rather than only the single busiest zone.
const SAMPLE_WINDOWS = [
  {
    zone: "residential",
    day: "Sun",
    peak_hour: "10am",
    violations: 3854,
    priority_score: 9578,
  },
  {
    zone: "residential",
    day: "Sun",
    peak_hour: "11am",
    violations: 3460,
    priority_score: 8255,
  },
  {
    zone: "residential",
    day: "Sat",
    peak_hour: "11am",
    violations: 2893,
    priority_score: 7182,
  },
  {
    zone: "arterial",
    day: "Thu",
    peak_hour: "8am",
    violations: 1171,
    priority_score: 4418,
  },
  {
    zone: "arterial",
    day: "Tue",
    peak_hour: "8am",
    violations: 1176,
    priority_score: 3846,
  },
  {
    zone: "arterial",
    day: "Wed",
    peak_hour: "4am",
    violations: 1114,
    priority_score: 3637,
  },
  {
    zone: "commercial",
    day: "Sun",
    peak_hour: "9am",
    violations: 785,
    priority_score: 2088,
  },
  {
    zone: "commercial",
    day: "Sun",
    peak_hour: "10am",
    violations: 873,
    priority_score: 2032,
  },
  {
    zone: "school_hospital",
    day: "Tue",
    peak_hour: "4am",
    violations: 328,
    priority_score: 1919,
  },
  {
    zone: "commercial",
    day: "Sun",
    peak_hour: "11am",
    violations: 740,
    priority_score: 1867,
  },
  {
    zone: "school_hospital",
    day: "Fri",
    peak_hour: "6am",
    violations: 327,
    priority_score: 1783,
  },
  {
    zone: "school_hospital",
    day: "Fri",
    peak_hour: "5am",
    violations: 529,
    priority_score: 1723,
  },
  {
    zone: "metro",
    day: "Thu",
    peak_hour: "6am",
    violations: 206,
    priority_score: 661,
  },
  {
    zone: "metro",
    day: "Tue",
    peak_hour: "5am",
    violations: 279,
    priority_score: 602,
  },
  {
    zone: "metro",
    day: "Sun",
    peak_hour: "2pm",
    violations: 145,
    priority_score: 569,
  },
];

const SAMPLE_DATA = {
  ranked_hotspots: SAMPLE_HOTSPOTS,
  enforcement_windows: SAMPLE_WINDOWS,
};

// ---------- helpers ----------

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString();
}

// Accept a few likely live-API response shapes so this still works once
// USE_SAMPLE_DATA is flipped back to false.
function normalize(json) {
  if (!json) return { hotspots: [], windows: [] };
  if (Array.isArray(json)) return { hotspots: json, windows: [] };
  return {
    hotspots: json.ranked_hotspots || json.hotspots || [],
    windows: json.enforcement_windows || json.windows || [],
  };
}

function MapLinkCard({ title, file }) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapIcon
            className="w-4.5 h-4.5 text-[var(--red)] shrink-0"
            strokeWidth={2}
          />
          <p className="text-[14px] font-semibold text-[var(--ink)] truncate">
            {title}
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          HTML map
        </span>
      </div>

      <p className="mt-3 text-[13px] text-[var(--ink-soft)] leading-relaxed">
        This map is stored as a large HTML file. Open it in a new tab to view
        the full interactive output without loading it into the dashboard.
      </p>

      <a
        href={file}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--red)] hover:underline"
      >
        Open map in new tab <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(() =>
    USE_SAMPLE_DATA ? SAMPLE_DATA : null,
  );
  const [loading, setLoading] = useState(!USE_SAMPLE_DATA);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (USE_SAMPLE_DATA) {
      return;
    }

    let active = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // TODO: replace '/predict' with your real FastAPI route once it's ready
        const res = await fetch(`${API_BASE_URL}/predict`);
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const { hotspots, windows } = normalize(data);

  const topHotspots = [...hotspots]
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .slice(0, 10);
  const topWindows = [...windows]
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, 10);

  const totalViolations = hotspots.reduce(
    (sum, h) => sum + (Number(h.violation_count) || 0),
    0,
  );
  const topHotspot = topHotspots[0];
  const topWindow = topWindows[0];

  return (
    <div className="min-h-screen bg-[var(--grey-bg)]">
      {/* top bar */}
      <header className="bg-white border-b border-black/[0.06] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-10 py-4 sm:h-16 sm:py-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-[15px] font-semibold tracking-tight">
            Dashboard
          </span>
          <span
            className={`text-[12px] font-medium px-3 py-1 rounded-full ${
              USE_SAMPLE_DATA
                ? "bg-yellow-50 text-yellow-700"
                : error
                  ? "bg-red-50 text-[var(--red)]"
                  : loading
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700"
            }`}
          >
            {USE_SAMPLE_DATA
              ? "Dataset.csv"
              : error
                ? "Not connected"
                : loading
                  ? "Connecting…"
                  : "Connected"}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        {/* sample-mode banner */}
        {/* {USE_SAMPLE_DATA && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 mb-5 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
            <p className="text-[13px] text-[var(--ink-soft)]">
              Showing hardcoded sample output from{" "}
              <code className="text-[12px]">SAMPLE_OUTPUTS</code> — the live
              FastAPI model isn't connected yet. Set{" "}
              <code className="text-[12px]">USE_SAMPLE_DATA = false</code> in
              this file once it's running.
            </p>
          </div>
        )} */}

        {/* sample coverage strip */}
        {USE_SAMPLE_DATA && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
            {SAMPLE_COVERAGE.map(({ label, detail }) => (
              <div
                key={label}
                className="bg-white rounded-3xl p-5 border border-black/[0.06]"
              >
                <p className="text-[12px] font-semibold tracking-[0.12em] text-[var(--red)] uppercase">
                  {label}
                </p>
                <p className="mt-2 text-[14px] text-[var(--ink-soft)] leading-relaxed">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* input dataset card — fixed source for the model */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 mb-5 border border-black/[0.06] flex flex-col md:flex-row md:items-center gap-5 sm:gap-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--red)]/10 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-[var(--red)]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold tracking-[0.1em] text-[var(--red)] uppercase">
              Input dataset · static
            </p>
            <p className="mt-1 text-[15px] font-medium text-[var(--ink)] truncate">
              {DATASET_LABEL}
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">
              Police violation records, Jan – May, anonymized
            </p>
          </div>
          <a
            href={DATASET_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-semibold text-[var(--red)] flex items-center gap-1.5 shrink-0 hover:underline md:self-auto self-start"
          >
            View CSV <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* status / empty-state banner, only relevant in live mode */}
        {!USE_SAMPLE_DATA && error && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 mb-5 border border-black/[0.06]">
            <p className="text-[15px] font-semibold text-[var(--ink)]">
              No model output yet
            </p>
            <p className="mt-1.5 text-[14px] text-[var(--ink-soft)] leading-relaxed">
              Couldn't reach{" "}
              <code className="bg-[var(--grey-bg)] px-1.5 py-0.5 rounded text-[13px]">
                {API_BASE_URL}/predict
              </code>
              . Start your FastAPI server and this dashboard will populate
              automatically.
            </p>
          </div>
        )}

        {/* stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-5">
          {[
            {
              label: "Hotspots flagged",
              icon: MapPinned,
              value: hotspots.length ? fmt(hotspots.length) : "—",
            },
            {
              label: "Violations processed",
              icon: AlertTriangle,
              value: hotspots.length ? fmt(totalViolations) : "—",
            },
            {
              label: "Top hotspot",
              icon: Gauge,
              value: topHotspot
                ? topHotspot.matched_junction &&
                  !String(topHotspot.matched_junction).startsWith(
                    "UNCATALOGUED",
                  )
                  ? topHotspot.matched_junction
                  : `Cluster ${topHotspot.cluster_id ?? topHotspot.rank}`
                : "—",
              small: true,
            },
            {
              label: "Peak enforcement window",
              icon: ListOrdered,
              value: topWindow
                ? `${topWindow.zone} · ${topWindow.day} ${topWindow.peak_hour}`
                : "—",
              small: true,
            },
          ].map(({ label, icon: Icon, value, small }) => (
            <div
              key={label}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.06]"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--grey-bg)] flex items-center justify-center mb-4">
                <Icon
                  className="w-4.5 h-4.5 text-[var(--red)]"
                  strokeWidth={2}
                />
              </div>
              <p className="text-[13px] font-medium text-[var(--ink-soft)]">
                {label}
              </p>
              <p
                className={`mt-1 font-semibold tracking-tight text-[var(--ink)] ${small ? "text-[16px] leading-snug" : "text-[28px]"}`}
              >
                {value}
              </p>
              {!hotspots.length && !windows.length && (
                <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
                  Waiting for model output
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ranked hotspots + enforcement windows */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] min-h-[320px] flex flex-col">
            <div className="flex items-center gap-2">
              <BarChart3
                className="w-4.5 h-4.5 text-[var(--red)]"
                strokeWidth={2}
              />
              <p className="text-[15px] font-semibold text-[var(--ink)]">
                Ranked hotspots
              </p>
            </div>
            <p className="text-[13px] text-[var(--ink-soft)] mt-1">
              By violation cluster, highest impact first.
            </p>

            {topHotspots.length === 0 ? (
              <div className="flex-1 flex items-center justify-center mt-6 rounded-2xl bg-[var(--grey-bg)]">
                <p className="text-[13px] text-[var(--ink-soft)]">
                  No hotspot data yet
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 overflow-y-auto max-h-[360px] sm:max-h-[420px] pr-1">
                {topHotspots.map((h, i) => {
                  const types = Object.entries(
                    h.top_violation_types || {},
                  ).sort((a, b) => b[1] - a[1]);
                  const stations = h.police_stations || [];
                  const junction =
                    h.matched_junction &&
                    !String(h.matched_junction).startsWith("UNCATALOGUED")
                      ? h.matched_junction
                      : `Cluster ${h.cluster_id ?? i + 1} (uncatalogued)`;

                  return (
                    <div
                      key={h.cluster_id ?? i}
                      className="rounded-2xl bg-[var(--grey-bg)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[var(--red)]">
                            #{h.rank ?? i + 1}
                          </p>
                          <p className="text-[14px] font-medium text-[var(--ink)] truncate">
                            {junction}
                          </p>
                        </div>
                        <p className="text-[16px] font-semibold text-[var(--ink)] shrink-0">
                          {fmt(h.violation_count)}
                        </p>
                      </div>

                      {types.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {types.slice(0, 2).map(([type, count]) => (
                            <span
                              key={type}
                              className="text-[11px] font-medium bg-white text-[var(--ink-soft)] px-2.5 py-1 rounded-full"
                            >
                              {type} · {fmt(count)}
                            </span>
                          ))}
                        </div>
                      )}

                      {stations.length > 0 && (
                        <p className="mt-2 text-[12px] text-[var(--ink-soft)] truncate">
                          {stations.slice(0, 2).join(", ")}
                          {stations.length > 2
                            ? ` +${stations.length - 2} more`
                            : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] min-h-[320px] flex flex-col">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className="w-4.5 h-4.5 text-[var(--red)]"
                strokeWidth={2}
              />
              <p className="text-[15px] font-semibold text-[var(--ink)]">
                Enforcement priority windows
              </p>
            </div>
            <p className="text-[13px] text-[var(--ink-soft)] mt-1">
              Zone · day · hour, ranked by priority score.
            </p>

            {topWindows.length === 0 ? (
              <div className="flex-1 flex items-center justify-center mt-6 rounded-2xl bg-[var(--grey-bg)]">
                <p className="text-[13px] text-[var(--ink-soft)]">
                  No enforcement window data yet
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-y-auto max-h-[360px] sm:max-h-[420px] pr-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                      <th className="font-semibold pb-2">Zone</th>
                      <th className="font-semibold pb-2">When</th>
                      <th className="font-semibold pb-2 text-right">
                        Violations
                      </th>
                      <th className="font-semibold pb-2 text-right">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWindows.map((w, i) => (
                      <tr key={i} className="border-t border-black/[0.04]">
                        <td className="py-2.5 text-[13px] font-medium text-[var(--ink)] capitalize align-top">
                          {w.zone}
                        </td>
                        <td className="py-2.5 text-[13px] text-[var(--ink-soft)] flex items-center gap-1.5 align-top">
                          <Clock className="w-3.5 h-3.5" /> {w.day}{" "}
                          {w.peak_hour}
                        </td>
                        <td className="py-2.5 text-[13px] text-right text-[var(--ink)]">
                          {fmt(w.violations)}
                        </td>
                        <td className="py-2.5 text-[13px] text-right font-semibold text-[var(--red)]">
                          {fmt(w.priority_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* violation heatmaps by zone */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] mb-5">
          <div className="flex items-center gap-2">
            <ImageIcon
              className="w-4.5 h-4.5 text-[var(--red)]"
              strokeWidth={2}
            />
            <p className="text-[15px] font-semibold text-[var(--ink)]">
              Violation heatmaps by zone
            </p>
          </div>
          <p className="text-[13px] text-[var(--ink-soft)] mt-1">
            Static renders from the model, grouped by road/area type.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {ZONE_IMAGES.map(({ zone, file }) => (
              <div
                key={zone}
                className="rounded-2xl bg-[var(--grey-bg)] overflow-hidden"
              >
                <img
                  src={file}
                  alt={`${zone} heatmap`}
                  className="w-full h-48 object-cover"
                />
                <p className="px-4 py-3 text-[13px] font-medium text-[var(--ink)]">
                  {zone}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* trend charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          {TREND_IMAGES.map(({ title, file }) => (
            <div
              key={title}
              className="bg-white rounded-3xl p-6 sm:p-6 border border-black/[0.06]"
            >
              <p className="text-[14px] font-semibold text-[var(--ink)] mb-4">
                {title}
              </p>
              <div className="rounded-2xl bg-[var(--grey-bg)] overflow-hidden">
                <img src={file} alt={title} className="w-full h-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* interactive maps */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          {INTERACTIVE_MAPS.map((m) => (
            <MapLinkCard key={m.title} title={m.title} file={m.file} />
          ))}
        </div>

        {/* raw response, kept for debugging */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06]">
          <p className="text-[15px] font-semibold text-[var(--ink)]">
            Raw response
          </p>
          <p className="text-[13px] text-[var(--ink-soft)] mt-1">
            {USE_SAMPLE_DATA ? (
              "Hardcoded sample, not from /predict"
            ) : (
              <>
                From <code className="text-[12px]">/predict</code>
              </>
            )}
          </p>
          <pre className="mt-5 text-[12px] leading-relaxed bg-[#1d1d1f] text-[#e5e5e7] rounded-2xl p-5 overflow-auto max-h-[260px]">
            {data ? JSON.stringify(data, null, 2) : "// no data yet"}
          </pre>
        </div>
      </main>
    </div>
  );
}
