import { Siren, Map, FileBarChart } from 'lucide-react'

const CARDS = [
  { icon: Siren, title: 'Targeted patrols', desc: 'Send enforcement to the zones with the highest measured congestion impact, not the loudest complaints.' },
  { icon: Map, title: 'Live hotspot map', desc: 'A continuously updated view of where illegal parking is forming, before it spills into gridlock.' },
  { icon: FileBarChart, title: 'Reporting for policy', desc: 'Exportable impact scores that justify no-parking zones, signage and infrastructure changes.' },
]

export default function EnterpriseSection() {
  return (
    <section className="bg-white py-16 sm:py-24 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-4">
            For Enforcement Teams
          </p>
          <h2 className="font-impact text-[28px] sm:text-[42px] leading-[1.05] text-[var(--ink)]">
            BUILT FOR TRAFFIC POLICE
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CARDS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-3xl bg-[var(--grey-bg)] p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[var(--red)]" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-semibold text-[var(--ink)]">{title}</h3>
              <p className="mt-3 text-[15px] text-[var(--ink-soft)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
