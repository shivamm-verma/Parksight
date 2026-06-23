import { Network, Activity, Database } from 'lucide-react'

const DATASET_URL =
  'https://uc.hackerearth.com/he-public-ap-south-1/jan%20to%20may%20police%20violation_anonymized791b166.csv'

const POINTS = [
  { icon: Network, text: 'REST API, one endpoint for hotspot + impact data' },
  { icon: Activity, text: 'Congestion impact recalculated per zone' },
  { icon: Database, text: 'Fixed input: Jan–May anonymized violation dataset' },
]

export default function DevSection() {
  return (
    <section className="bg-[var(--grey-bg)] py-16 sm:py-24 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-4">
            Developers
          </p>
          <h2 className="text-[28px] sm:text-[44px] font-semibold tracking-tight leading-[1.05] text-[var(--ink)]">
            Built to drop into your stack.
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[18px] text-[var(--ink-soft)] leading-relaxed max-w-md">
            The model reads from one fixed source — the anonymized police violation
            dataset below — and a FastAPI route serves hotspot + impact results to
            this dashboard.
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-[var(--ink)]">
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--red)]" strokeWidth={2.2} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <a
            href={DATASET_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block text-[13px] font-medium text-[var(--red)] underline underline-offset-2 break-all"
          >
            View input dataset (CSV) →
          </a>
        </div>

        <div className="bg-[#1d1d1f] rounded-3xl p-7 shadow-xl">
          <div className="flex gap-1.5 mb-5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <pre className="text-[13px] leading-relaxed text-[#e5e5e7] overflow-x-auto">
            <code>{`GET /predict

{
  "source": "jan_to_may_police_violation.csv",
  "hotspots": [
    {
      "zone": "Sector 18 Market",
      "lat": 28.4711,
      "lng": 77.0429,
      "violationCount": 214,
      "congestionImpact": 0.81
    }
  ],
  "updatedAt": "2026-06-20T09:15:00Z"
}`}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
