import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="bg-[var(--grey-bg)] py-28 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-impact text-[40px] sm:text-[56px] leading-[1.0] text-[var(--ink)]">
          SEE THE HOTSPOTS, LIVE
        </h2>
        <p className="mt-5 text-[18px] text-[var(--ink-soft)] leading-relaxed">
          Open the dashboard to see hotspot and congestion-impact data render the
          moment the model is connected.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-9 bg-[var(--red)] text-white text-[16px] font-medium px-8 py-3.5 rounded-full hover:bg-[var(--red-dark)] transition-colors shadow-sm inline-flex items-center gap-2"
        >
          See working <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}
