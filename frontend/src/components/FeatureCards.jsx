import { ScanSearch, ChartSpline, ShieldAlert } from 'lucide-react'

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Hotspot Detection',
    desc: 'Clusters illegal and spillover parking incidents from raw violation records into geographic hotspots.',
    tag: '01',
  },
  {
    icon: ChartSpline,
    title: 'Congestion Impact Scoring',
    desc: 'Scores each hotspot by how much it actually slows surrounding traffic, not just incident count.',
    tag: '02',
  },
  {
    icon: ShieldAlert,
    title: 'Enforcement Prioritization',
    desc: 'Ranks zones so patrols go to the highest-impact locations first, instead of reactive sweeps.',
    tag: '03',
  },
]

export default function FeatureCards() {
  return (
    <section className="bg-white py-16 sm:py-24 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-4">
            Platform
          </p>
          <h2 className="text-[28px] sm:text-[44px] font-semibold tracking-tight leading-[1.05] text-[var(--ink)]">
            From patrol-based guessing<br className="hidden sm:block" /> to targeted enforcement.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
            <div
              key={title}
              className="group rounded-3xl border border-black/[0.06] p-6 sm:p-8 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[var(--grey-bg)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--red)]" strokeWidth={2} />
                </div>
                <span className="text-[13px] font-semibold text-[var(--red)]">{tag}</span>
              </div>
              <h3 className="mt-5 text-[22px] font-semibold text-[var(--ink)]">{title}</h3>
              <p className="mt-3 text-[15px] text-[var(--ink-soft)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
