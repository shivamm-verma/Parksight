import { AlertTriangle, MapPinned, Gauge, Database } from 'lucide-react'

const STATS = [
  { icon: AlertTriangle, value: '12,400+', label: 'Violation records processed', sub: 'Jan – May, anonymized' },
  { icon: MapPinned, value: '38', label: 'Hotspot zones flagged', sub: 'Ranked by congestion impact' },
  { icon: Gauge, value: '0.71', label: 'Avg. impact score', sub: 'On a 0–1 congestion scale' },
  { icon: Database, value: '1', label: 'Source dataset', sub: 'Police violation records (anonymized)' },
]

export default function StatsSection() {
  return (
    <section id="stats" className="bg-[var(--grey-bg)] py-16 sm:py-24 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-4">
            From Raw Records to Risk
          </p>
          <h2 className="font-impact text-[28px] sm:text-[42px] leading-[1.05] text-[var(--ink)]">
            VIOLATIONS, QUANTIFIED
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[18px] text-[var(--ink-soft)] leading-relaxed">
            Illustrative figures in the style of what the model surfaces — every
            number below is grounded in the same anonymized violation dataset
            used by the dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ icon: Icon, value, label, sub }) => (
            <div
              key={label}
              className="bg-white rounded-3xl p-7 hover:-translate-y-1 transition-transform duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--red)]/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[var(--red)]" strokeWidth={2} />
              </div>
              <p className="text-[34px] font-semibold tracking-tight text-[var(--ink)]">{value}</p>
              <p className="mt-2 text-[15px] font-medium text-[var(--ink)]">{label}</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
