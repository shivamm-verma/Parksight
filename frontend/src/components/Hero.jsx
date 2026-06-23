import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative bg-white pt-32 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-6 overflow-hidden">
      {/* subtle map-grid backdrop */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1d1d1f 1px, transparent 1px), linear-gradient(to bottom, #1d1d1f 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />

      <div className="max-w-5xl mx-auto text-center">
        <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.18em] text-[var(--red)] uppercase mb-5 sm:mb-6">
          AI-Driven Parking Intelligence
        </p>

        <h1 className="font-impact text-balance text-[36px] sm:text-[72px] lg:text-[92px] leading-[0.95] text-[var(--ink)]">
          SEE WHAT'S BLOCKING THE ROAD
        </h1>

        <p className="mt-6 sm:mt-7 text-[16px] sm:text-[22px] text-[var(--ink-soft)] max-w-2xl mx-auto leading-relaxed">
          Illegal and spillover parking quietly chokes carriageways near markets,
          metro stations and event venues. ParkSight turns raw violation records
          into hotspots, ranked by their real impact on traffic flow — so
          enforcement can go where it matters first.
        </p>

        <div className="mt-9 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-[var(--red)] text-white text-[16px] font-medium px-7 py-3.5 rounded-full hover:bg-[var(--red-dark)] transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            See working <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#stats"
            className="w-full sm:w-auto text-[16px] font-medium text-[var(--ink)] px-7 py-3.5 rounded-full border border-black/10 hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Explore the platform
          </a>
        </div>
      </div>

      {/* hero visual: stylised hotspot map, no real map tiles */}
      <div className="max-w-5xl mx-auto mt-14 sm:mt-20">
        <div className="rounded-[24px] sm:rounded-[28px] bg-[var(--grey-bg)] aspect-[4/3] sm:aspect-[16/8] flex items-center justify-center relative overflow-hidden">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            {/* faint road network */}
            <path d="M0,200 H800 M0,120 H800 M0,280 H800 M150,0 V400 M420,0 V400 M650,0 V400"
              stroke="#d8d8db" strokeWidth="2" />
            {/* hotspot clusters */}
            <circle cx="150" cy="120" r="34" fill="var(--red)" opacity="0.12" />
            <circle cx="150" cy="120" r="10" fill="var(--red)" />
            <circle cx="420" cy="200" r="48" fill="var(--red)" opacity="0.12" />
            <circle cx="420" cy="200" r="13" fill="var(--red)" />
            <circle cx="650" cy="280" r="28" fill="var(--red)" opacity="0.12" />
            <circle cx="650" cy="280" r="8" fill="var(--red)" />
          </svg>
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white rounded-2xl shadow-lg px-4 sm:px-5 py-2.5 sm:py-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[var(--ink-soft)] font-semibold">Top hotspot</p>
            <p className="text-[16px] sm:text-[20px] font-semibold text-[var(--ink)]">Congestion impact: High</p>
          </div>
        </div>
      </div>
    </section>
  )
}
