import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Database,
  ExternalLink,
  AlertTriangle,
  MapPinned,
  Gauge,
  ListOrdered,
  BarChart3,
} from 'lucide-react'

// Point this at your FastAPI server, e.g. http://127.0.0.1:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Fixed input — the model always reads from this dataset
const DATASET_URL = import.meta.env.VITE_INPUT_DATA
const DATASET_LABEL = 'jan to may police violation_anonymized.csv'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace '/predict' with your real FastAPI route once it's ready
        const res = await fetch(`${API_BASE_URL}/predict`)
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        const json = await res.json()
        if (active) setData(json)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--grey-bg)]">
      {/* top bar */}
      <header className="bg-white border-b border-black/[0.06] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
          <Link to="/" className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-[15px] font-semibold tracking-tight">Dashboard</span>
          <span
            className={`text-[12px] font-medium px-3 py-1 rounded-full ${
              error
                ? 'bg-red-50 text-[var(--red)]'
                : loading
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {error ? 'Not connected' : loading ? 'Connecting…' : 'Connected'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* input dataset card — fixed source for the model */}
        <div className="bg-white rounded-3xl p-7 mb-5 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--red)]/10 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-[var(--red)]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold tracking-[0.1em] text-[var(--red)] uppercase">Input dataset · fixed</p>
            <p className="mt-1 text-[15px] font-medium text-[var(--ink)] truncate">{DATASET_LABEL}</p>
            <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">Police violation records, Jan – May, anonymized</p>
          </div>
          <a
            href={DATASET_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-semibold text-[var(--red)] flex items-center gap-1.5 shrink-0 hover:underline"
          >
            View CSV <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* status / empty-state banner */}
        {error && (
          <div className="bg-white rounded-3xl p-7 mb-5 border border-black/[0.06]">
            <p className="text-[15px] font-semibold text-[var(--ink)]">No model output yet</p>
            <p className="mt-1.5 text-[14px] text-[var(--ink-soft)] leading-relaxed">
              Couldn't reach <code className="bg-[var(--grey-bg)] px-1.5 py-0.5 rounded text-[13px]">{API_BASE_URL}/predict</code>.
              Start your FastAPI server and this dashboard will populate automatically — it
              will keep reading from the dataset above, no input needed here.
            </p>
          </div>
        )}

        {/* stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          {[
            { label: 'Hotspots flagged', icon: MapPinned },
            { label: 'Avg congestion impact', icon: Gauge },
            { label: 'Violations processed', icon: AlertTriangle },
            { label: 'Top-priority zones', icon: ListOrdered },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="bg-white rounded-3xl p-7 border border-black/[0.06]">
              <div className="w-9 h-9 rounded-full bg-[var(--grey-bg)] flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-[var(--red)]" strokeWidth={2} />
              </div>
              <p className="text-[13px] font-medium text-[var(--ink-soft)]">{label}</p>
              <p className="mt-1 text-[28px] font-semibold tracking-tight text-[var(--ink)]">—</p>
              <p className="mt-1 text-[12px] text-[var(--ink-soft)]">Waiting for model output</p>
            </div>
          ))}
        </div>

        {/* main content: chart + raw response */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-black/[0.06] min-h-[320px] flex flex-col">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[var(--red)]" strokeWidth={2} />
              <p className="text-[15px] font-semibold text-[var(--ink)]">Hotspots & congestion impact</p>
            </div>
            <p className="text-[13px] text-[var(--ink-soft)] mt-1">Renders once your FastAPI route returns data.</p>
            <div className="flex-1 flex items-center justify-center mt-6 rounded-2xl bg-[var(--grey-bg)]">
              <p className="text-[13px] text-[var(--ink-soft)]">Chart placeholder</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-black/[0.06] min-h-[320px]">
            <p className="text-[15px] font-semibold text-[var(--ink)]">Raw response</p>
            <p className="text-[13px] text-[var(--ink-soft)] mt-1">From <code className="text-[12px]">/predict</code></p>
            <pre className="mt-5 text-[12px] leading-relaxed bg-[#1d1d1f] text-[#e5e5e7] rounded-2xl p-5 overflow-auto max-h-[220px]">
              {data ? JSON.stringify(data, null, 2) : '// no data yet'}
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}
